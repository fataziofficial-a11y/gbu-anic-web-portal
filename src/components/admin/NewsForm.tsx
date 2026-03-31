"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImageCropUploader } from "@/components/admin/ImageCropUploader";
import { CrosspostPanel } from "@/components/admin/CrosspostPanel";
import { NewsCategorySelect } from "@/components/admin/NewsCategorySelect";
import { ProjectRubricSelect } from "@/components/admin/ProjectRubricSelect";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Loader2,
  Globe,
  Save,
  X,
  Send,
  ImagePlus,
  Eye,
} from "lucide-react";
import NextLink from "next/link";

const PLATFORMS = [
  { id: "telegram", label: "Telegram" },
  { id: "vk",       label: "ВКонтакте" },
  { id: "max",      label: "MAX" },
  { id: "dzen",     label: "Яндекс.Дзен" },
  { id: "ok",       label: "Одноклассники" },
] as const;

interface NewsFormData {
  id?: number;
  title?: string;
  content?: Record<string, unknown>;
  excerpt?: string;
  category?: string;
  tags?: string[];
  projectId?: number | null;
  rubricId?: number | null;
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  coverImageId?: number | null;
  coverImage?: { id: number; url: string } | null;
}

interface Props {
  initialData?: NewsFormData;
  mode: "create" | "edit";
}

export function NewsForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [floatingPos, setFloatingPos] = useState<{ top: number; show: boolean }>({ top: 0, show: false });
  const editorWrapRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [projectId, setProjectId] = useState<number | null>(initialData?.projectId ?? null);
  const [rubricId, setRubricId] = useState<number | null>(initialData?.rubricId ?? null);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState(initialData?.status ?? "draft");
  const [coverImage, setCoverImage] = useState<{ id: number; url: string } | null>(
    initialData?.coverImage ?? null
  );
  const [crosspostPlatforms, setCrosspostPlatforms] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialData?.seoDescription ?? ""
  );

  const uploadAndInsertImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "media");
      const res = await fetch("/api/files", { method: "POST", body: form });
      const json = await res.json();
      if (res.ok && json.data?.url) {
        // editor доступен через замыкание после mount
        editorRef.current?.chain().focus().setImage({ src: json.data.url }).run();
      } else {
        toast.error("Ошибка загрузки изображения");
      }
    } catch {
      toast.error("Ошибка загрузки изображения");
    } finally {
      setUploadingImage(false);
    }
  }, []);

  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Начните писать текст новости...",
      }),
      Link.configure({ openOnClick: false }),
      TiptapImage.configure({ inline: false, allowBase64: false }),
    ],
    content: initialData?.content ?? "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3",
      },
      handleDrop(_view, event) {
        const file = event.dataTransfer?.files?.[0];
        if (!file?.type.startsWith("image/")) return false;
        event.preventDefault();
        uploadAndInsertImage(file);
        return true;
      },
      handlePaste(_view, event) {
        const file = event.clipboardData?.files?.[0];
        if (!file?.type.startsWith("image/")) return false;
        event.preventDefault();
        uploadAndInsertImage(file);
        return true;
      },
    },
  });

  // Синхронизируем ref с editor для uploadAndInsertImage
  if (editor && editorRef.current !== editor) {
    (editorRef as React.MutableRefObject<typeof editor>).current = editor;
  }

  // Floating "+" кнопка на пустых строках
  useEffect(() => {
    if (!editor) return;
    function updateFloating() {
      if (!editor || !editorWrapRef.current) return;
      const { state, view } = editor;
      const { selection } = state;
      const { empty, $anchor } = selection;
      const isEmptyParagraph =
        empty &&
        $anchor.parent.textContent === "" &&
        $anchor.parent.type.name === "paragraph";

      if (!isEmptyParagraph) {
        setFloatingPos((p) => ({ ...p, show: false }));
        return;
      }

      const domPos = view.coordsAtPos($anchor.pos);
      const wrapRect = editorWrapRef.current.getBoundingClientRect();
      const top = domPos.top - wrapRect.top + editorWrapRef.current.scrollTop;
      setFloatingPos({ top, show: true });
    }

    editor.on("selectionUpdate", updateFloating);
    editor.on("update", updateFloating);
    return () => {
      editor.off("selectionUpdate", updateFloating);
      editor.off("update", updateFloating);
    };
  }, [editor]);

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSave(publishNow?: boolean) {
    if (!title.trim()) {
      toast.error("Заголовок обязателен");
      return;
    }

    const payload = {
      title: title.trim(),
      content: editor?.getJSON(),
      excerpt: excerpt || undefined,
      category: category || undefined,
      tags,
      projectId: projectId ?? null,
      rubricId: rubricId ?? null,
      status: publishNow ? "published" : status,
      coverImageId: coverImage?.id ?? null,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
    };

    startTransition(async () => {
      try {
        const url =
          mode === "edit" ? `/api/news/${initialData!.id}` : "/api/news";
        const method = mode === "edit" ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");

        toast.success(
          mode === "edit" ? "Новость обновлена" : "Новость создана"
        );

        // Кросс-постинг при публикации
        if (publishNow && crosspostPlatforms.length > 0 && json.data?.id) {
          const cpRes = await fetch("/api/crosspost", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contentType: "news",
              contentId: json.data.id,
              platforms: crosspostPlatforms,
            }),
          });
          const cpJson = await cpRes.json();
          if (cpRes.ok) {
            const results: { platform: string; ok: boolean }[] = cpJson.data?.results ?? [];
            results.forEach((r) => {
              if (r.ok) toast.success(`Опубликовано в ${r.platform}`);
              else toast.error(`Ошибка кросс-поста в ${r.platform}`);
            });
          }
        }

        router.push("/admin/news");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  const toolbarBtn =
    "h-8 w-8 rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 transition-colors";
  const activeBtnClass = "bg-gray-200 text-gray-900";

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок страницы */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "edit" ? "Редактировать новость" : "Новая новость"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {status === "published" ? "Опубликовано" : "Черновик"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/news")}
            disabled={isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Отмена
          </Button>
          {mode === "edit" && initialData?.id && (
            <Button variant="outline" asChild>
              <NextLink href={`/admin/news/${initialData.id}/preview`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Предпросмотр
              </NextLink>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Сохранить
          </Button>
          {status !== "published" && (
            <Button onClick={() => handleSave(true)} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Globe className="mr-2 h-4 w-4" />
              )}
              Опубликовать
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Основной контент */}
        <div className="lg:col-span-2 space-y-4">
          {/* Заголовок */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Заголовок *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите заголовок новости"
              className="text-lg font-medium"
            />
          </div>

          {/* WYSIWYG редактор */}
          <div className="space-y-1.5">
            <Label>Текст новости</Label>
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              {/* Тулбар */}
              <div className="flex items-center gap-0.5 border-b border-gray-200 px-2 py-1.5 bg-gray-50 flex-wrap">
                <button
                  type="button"
                  className={`${toolbarBtn} ${editor?.isActive("bold") ? activeBtnClass : ""}`}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  title="Жирный (Ctrl+B)"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`${toolbarBtn} ${editor?.isActive("italic") ? activeBtnClass : ""}`}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  title="Курсив (Ctrl+I)"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`${toolbarBtn} ${editor?.isActive("strike") ? activeBtnClass : ""}`}
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  title="Зачёркнутый"
                >
                  <Strikethrough className="h-4 w-4" />
                </button>

                <div className="mx-1 h-5 w-px bg-gray-200" />

                <button
                  type="button"
                  className={`${toolbarBtn} ${editor?.isActive("heading", { level: 2 }) ? activeBtnClass : ""}`}
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  title="Заголовок H2"
                >
                  <Heading2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`${toolbarBtn} ${editor?.isActive("heading", { level: 3 }) ? activeBtnClass : ""}`}
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  title="Заголовок H3"
                >
                  <Heading3 className="h-4 w-4" />
                </button>

                <div className="mx-1 h-5 w-px bg-gray-200" />

                <button
                  type="button"
                  className={`${toolbarBtn} ${editor?.isActive("bulletList") ? activeBtnClass : ""}`}
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  title="Маркированный список"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`${toolbarBtn} ${editor?.isActive("orderedList") ? activeBtnClass : ""}`}
                  onClick={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                  title="Нумерованный список"
                >
                  <ListOrdered className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`${toolbarBtn} ${editor?.isActive("blockquote") ? activeBtnClass : ""}`}
                  onClick={() =>
                    editor?.chain().focus().toggleBlockquote().run()
                  }
                  title="Цитата"
                >
                  <Quote className="h-4 w-4" />
                </button>

                <div className="mx-1 h-5 w-px bg-gray-200" />

                <button
                  type="button"
                  className={toolbarBtn}
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  title="Отменить (Ctrl+Z)"
                >
                  <Undo className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={toolbarBtn}
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  title="Повторить (Ctrl+Y)"
                >
                  <Redo className="h-4 w-4" />
                </button>

                <div className="mx-1 h-5 w-px bg-gray-200" />

                <button
                  type="button"
                  className={toolbarBtn}
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  title="Вставить изображение"
                >
                  {uploadingImage
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <ImagePlus className="h-4 w-4" />}
                </button>
              </div>

              {/* Область редактирования */}
              <div className="relative" ref={editorWrapRef}>
                <EditorContent editor={editor} />
                {floatingPos.show && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      imageInputRef.current?.click();
                    }}
                    className="absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm hover:border-[#1A3A6B] hover:text-[#1A3A6B] transition-colors"
                    style={{ top: floatingPos.top + 2 }}
                    title="Добавить изображение"
                  >
                    <ImagePlus className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                )}
              </div>
              {/* Скрытый input для загрузки изображений */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAndInsertImage(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {/* Анонс */}
          <div className="space-y-1.5">
            <Label htmlFor="excerpt">Анонс</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Краткое описание новости для списка и соцсетей (до 500 символов)"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-400">{excerpt.length}/500</p>
          </div>

          {/* SEO */}
          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">SEO</p>
            <div className="space-y-1.5">
              <Label htmlFor="seoTitle" className="text-xs">
                SEO-заголовок
              </Label>
              <Input
                id="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Заголовок для поисковиков (если отличается)"
                maxLength={500}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seoDescription" className="text-xs">
                SEO-описание
              </Label>
              <Textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Meta description (160–200 символов)"
                rows={2}
                maxLength={300}
              />
            </div>
          </div>
        </div>

        {/* Боковая панель */}
        <div className="space-y-4">
          {/* Обложка */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Обложка</p>
            <ImageCropUploader value={coverImage} onChange={setCoverImage} />
          </div>

          {/* Статус */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Статус</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Черновик</SelectItem>
                <SelectItem value="published">Опубликовано</SelectItem>
                <SelectItem value="archived">Архив</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Категория */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Категория</p>
            <NewsCategorySelect value={category} onChange={setCategory} />
          </div>

          {/* Проект и рубрика */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Проект / Рубрика</p>
            <ProjectRubricSelect
              projectId={projectId}
              rubricId={rubricId}
              onProjectChange={(pid) => { setProjectId(pid); setRubricId(null); }}
              onRubricChange={setRubricId}
            />
          </div>

          {/* Кросс-постинг при создании/черновике */}
          {status !== "published" && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">Кросс-постинг</p>
              </div>
              <p className="text-xs text-gray-400">Опубликовать одновременно в:</p>
              <div className="space-y-2">
                {PLATFORMS.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      checked={crosspostPlatforms.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) setCrosspostPlatforms([...crosspostPlatforms, p.id]);
                        else setCrosspostPlatforms(crosspostPlatforms.filter((x) => x !== p.id));
                      }}
                    />
                    <span className="text-sm text-gray-700">{p.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400">Применяется только при нажатии «Опубликовать»</p>
            </div>
          )}

          {/* Статусы кросс-постинга (только в режиме редактирования) */}
          {mode === "edit" && initialData?.id && (
            <CrosspostPanel
              newsId={initialData.id}
              isPublished={status === "published"}
            />
          )}

          {/* Теги */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Теги</p>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Введите тег и нажмите Enter"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100 hover:text-red-700 text-xs"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">
              Нажмите Enter или запятую для добавления
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
