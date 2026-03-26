"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Loader2, FileText, Image as ImageIcon, File } from "lucide-react";

interface UploadedFile {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

interface Props {
  onUploaded?: (file: UploadedFile) => void;
  onClose?: () => void;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="h-6 w-6 text-blue-500" />;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return <FileText className="h-6 w-6 text-red-500" />;
  return <File className="h-6 w-6 text-gray-500" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function FileUploader({ onUploaded, onClose }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [folder, setFolder] = useState<"media" | "documents" | "knowledge">("media");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/files", { method: "POST", body: formData });
        const json = await res.json();

        if (!res.ok) throw new Error(json.error ?? "Ошибка загрузки");

        const uploaded = json.data as UploadedFile;
        setUploadedFiles((prev) => [uploaded, ...prev]);
        onUploaded?.(uploaded);
        toast.success(`Файл "${file.name}" загружен`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        setIsUploading(false);
      }
    },
    [folder, onUploaded]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadFile);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach(uploadFile);
    e.target.value = "";
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
      setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success("Файл удалён");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка удаления");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select value={folder} onValueChange={(v) => setFolder(v as typeof folder)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="media">Медиа (изображения)</SelectItem>
              <SelectItem value="documents">Документы</SelectItem>
              <SelectItem value="knowledge">База знаний</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {onClose && (
          <Button variant="outline" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Зона загрузки */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Загружаю файл...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Перетащите файлы сюда или{" "}
                <label className="text-blue-600 cursor-pointer hover:underline">
                  выберите
                  <input
                    type="file"
                    className="sr-only"
                    multiple
                    onChange={handleFileInput}
                  />
                </label>
              </p>
              <p className="text-xs text-gray-400 mt-1">Максимум 50 МБ на файл</p>
            </div>
          </div>
        )}
      </div>

      {/* Список загруженных */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Загружено:</p>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white"
              >
                <FileIcon mimeType={file.mimeType} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-400">{formatBytes(file.sizeBytes)}</p>
                </div>
                {file.mimeType.startsWith("image/") && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={file.url}
                    alt="Превью"
                    className="h-10 w-10 rounded object-cover flex-shrink-0"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-500"
                  onClick={() => handleDelete(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
