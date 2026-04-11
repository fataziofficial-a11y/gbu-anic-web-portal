"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, ImagePlus, X } from "lucide-react";

const DEFAULT_ASPECT = 16 / 9;
const DEFAULT_OUTPUT_WIDTH = 1200;
const DEFAULT_OUTPUT_HEIGHT = 675;

interface Props {
  value?: { id: number; url: string } | null;
  onChange: (file: { id: number; url: string } | null) => void;
  /** Aspect ratio (e.g. 16/9). Omit for free crop. */
  aspect?: number;
  outputWidth?: number;
  /** Required when aspect is set; when aspect is undefined, height is derived from crop. */
  outputHeight?: number;
  hint?: string;
  /** Skip crop dialog entirely — upload original file as-is. Good for logos. */
  noCrop?: boolean;
}

function centerAspectCrop(w: number, h: number, aspect: number) {
  return centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, w, h), w, h);
}

function fullImageCrop(): Crop {
  return { unit: "%", x: 0, y: 0, width: 100, height: 100 };
}

async function getCroppedBlob(
  img: HTMLImageElement,
  crop: PixelCrop,
  outputWidth: number,
  outputHeight: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d")!;

  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;

  ctx.drawImage(
    img,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 0.9);
  });
}

export function ImageCropUploader({
  value,
  onChange,
  aspect,
  outputWidth = aspect !== undefined ? DEFAULT_OUTPUT_WIDTH : 800,
  outputHeight = aspect !== undefined ? DEFAULT_OUTPUT_HEIGHT : undefined,
  hint,
  noCrop = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);

  async function uploadRawFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file, file.name);
      const res = await fetch("/api/files", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка загрузки");
      onChange({ id: json.data.id, url: json.data.url });
      toast.success("Файл загружен");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Выберите изображение (JPEG, PNG, WebP)");
      return;
    }
    if (noCrop) {
      e.target.value = "";
      uploadRawFile(file);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrcUrl(url);
    setCrop(undefined);
    e.target.value = "";
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    if (aspect !== undefined) {
      const pct = centerAspectCrop(width, height, aspect);
      setCrop(pct);
      setCompletedCrop({
        unit: "px",
        x: Math.round((pct.x / 100) * width),
        y: Math.round((pct.y / 100) * height),
        width: Math.round((pct.width / 100) * width),
        height: Math.round((pct.height / 100) * height),
      });
    } else {
      // Free crop: default to full image
      const pct = fullImageCrop();
      setCrop(pct);
      setCompletedCrop({ unit: "px", x: 0, y: 0, width, height });
    }
  }, [aspect]);

  async function handleApply() {
    if (!imgRef.current || !completedCrop) {
      toast.error("Выберите область обрезки");
      return;
    }
    setUploading(true);
    try {
      // When no fixed aspect, derive output height proportionally
      const effectiveHeight = outputHeight ??
        Math.round((completedCrop.height / completedCrop.width) * outputWidth);

      const blob = await getCroppedBlob(imgRef.current, completedCrop, outputWidth, effectiveHeight);
      const form = new FormData();
      form.append("file", blob, "image.jpg");

      const res = await fetch("/api/files", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка загрузки");

      onChange({ id: json.data.id, url: json.data.url });
      setSrcUrl(null);
      toast.success("Фото загружено");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    onChange(null);
  }

  const hasFixedAspect = aspect !== undefined && outputHeight !== undefined;
  const dialogTitle = hasFixedAspect
    ? `Обрежьте фото (${outputWidth}×${outputHeight})`
    : "Обрежьте фото (свободный выбор)";

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.url}
            alt="Изображение"
            className="w-full object-contain"
            style={
              hasFixedAspect
                ? { aspectRatio: `${outputWidth}/${outputHeight}` }
                : { maxHeight: "240px" }
            }
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              onClick={() => inputRef.current?.click()}
            >
              Заменить
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              onClick={handleRemove}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-8 text-sm text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-100"
        >
          <ImagePlus className="h-8 w-8 text-gray-300" />
          <span>Нажмите, чтобы выбрать фото</span>
          <span className="text-xs text-gray-300">
            {hint ?? (hasFixedAspect ? `Будет обрезано до ${outputWidth}×${outputHeight}` : `Макс. ширина ${outputWidth} px`)}
          </span>
        </button>
      )}

      {/* Диалог кроппера */}
      <Dialog open={!!srcUrl} onOpenChange={(v) => { if (!v) setSrcUrl(null); }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center bg-gray-900 rounded-lg overflow-hidden">
            {srcUrl && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                minWidth={100}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={srcUrl}
                  alt="Кроп"
                  onLoad={onImageLoad}
                  style={{ maxHeight: "60vh", objectFit: "contain" }}
                />
              </ReactCrop>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            {hasFixedAspect
              ? `Перетащите рамку, чтобы выбрать нужный фрагмент. Результат: ${outputWidth}×${outputHeight} px.`
              : "Выберите нужную область. Пропорции сохранятся."}
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSrcUrl(null)} disabled={uploading}>
              Отмена
            </Button>
            <Button onClick={handleApply} disabled={uploading || !completedCrop}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Применить и загрузить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
