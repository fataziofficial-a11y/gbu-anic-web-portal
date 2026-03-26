"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUploader } from "@/components/admin/FileUploader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Upload, HardDrive, FileText, File, Image as ImageIcon, Loader2 } from "lucide-react";

interface FileItem {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  folder: string;
  altText: string | null;
  createdAt: string | null;
  uploader?: { name: string } | null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className={className ?? "h-5 w-5 text-blue-400"} />;
  if (mimeType.includes("pdf")) return <FileText className={className ?? "h-5 w-5 text-red-400"} />;
  return <File className={className ?? "h-5 w-5 text-gray-400"} />;
}

const FOLDER_LABELS: Record<string, string> = {
  all: "Все",
  media: "Медиа",
  documents: "Документы",
  knowledge: "База знаний",
};

export default function FilesPage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/files");
      const json = await res.json();
      setItems(json.data?.items ?? []);
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered =
    folder === "all" ? items : items.filter((f) => f.folder === folder);

  const totalSize = filtered.reduce((acc, f) => acc + (f.sizeBytes ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Файлы</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} файлов · {formatBytes(totalSize)}
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Загрузить
        </Button>
      </div>

      {/* Фильтр по папке */}
      <div className="flex items-center gap-2">
        {Object.entries(FOLDER_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFolder(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              folder === key
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <HardDrive className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Файлов нет</p>
          <Button className="mt-4" variant="outline" onClick={() => setUploadOpen(true)}>
            Загрузить файлы
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Превью */}
              <div className="aspect-square bg-gray-50 flex items-center justify-center">
                {file.mimeType.startsWith("image/") ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={file.url}
                    alt={file.altText ?? file.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileIcon mimeType={file.mimeType} className="h-12 w-12" />
                )}
              </div>

              {/* Инфо */}
              <div className="p-2">
                <p className="text-xs font-medium text-gray-800 truncate" title={file.originalName}>
                  {file.originalName}
                </p>
                <p className="text-xs text-gray-400">{formatBytes(file.sizeBytes)}</p>
              </div>

              {/* Кнопка удаления (появляется при наведении) */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <DeleteButton
                  id={file.id}
                  apiPath="/api/files"
                  label="файл"
                  onDeleted={load}
                />
              </div>

              {/* Ссылка */}
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0"
                onClick={(e) => {
                  // Не открывать ссылку при клике на кнопку удаления
                  const target = e.target as HTMLElement;
                  if (target.closest("button")) e.preventDefault();
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Диалог загрузки */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Загрузить файлы</DialogTitle>
          </DialogHeader>
          <FileUploader
            onClose={() => setUploadOpen(false)}
            onUploaded={() => load()}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
