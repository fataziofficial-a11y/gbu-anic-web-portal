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

const ASPECT = 16 / 9;
const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 675; // 1200 × 9/16

interface Props {
  value?: { id: number; url: string } | null;
  onChange: (file: { id: number; url: string } | null) => void;
}

function centerAspectCrop(w: number, h: number) {
  return centerCrop(makeAspectCrop({ unit: "%", width: 90 }, ASPECT, w, h), w, h);
}

async function getCroppedBlob(
  img: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
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
    OUTPUT_WIDTH,
    OUTPUT_HEIGHT
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 0.9);
  });
}

export function ImageCropUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Выберите изображение (JPEG, PNG, WebP)");
      return;
    }
    const url = URL.createObjectURL(file);
    setSrcUrl(url);
    setCrop(undefined);
    // Reset input so the same file can be selected again
    e.target.value = "";
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  async function handleApply() {
    if (!imgRef.current || !completedCrop) {
      toast.error("Выберите область обрезки");
      return;
    }
    setUploading(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const form = new FormData();
      form.append("file", blob, "cover.jpg");

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
            alt="Обложка"
            className="w-full object-cover"
            style={{ aspectRatio: "16/9" }}
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
          <span className="text-xs text-gray-300">Будет обрезано до 1200×675 (16:9)</span>
        </button>
      )}

      {/* Диалог кроппера */}
      <Dialog open={!!srcUrl} onOpenChange={(v) => { if (!v) setSrcUrl(null); }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Обрежьте фото (16:9)</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center bg-gray-900 rounded-lg overflow-hidden">
            {srcUrl && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={ASPECT}
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
            Перетащите рамку, чтобы выбрать нужный фрагмент. Результат: 1200×675 px.
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
