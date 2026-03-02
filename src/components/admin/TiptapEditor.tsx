"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
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
} from "lucide-react";

interface Props {
  content?: Record<string, unknown> | string;
  onChange?: (json: Record<string, unknown>) => void;
  placeholder?: string;
  minHeight?: number;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Начните вводить текст...",
  minHeight = 300,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
    ],
    content: content ?? "",
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none px-4 py-3`,
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate({ editor }) {
      onChange?.(editor.getJSON() as Record<string, unknown>);
    },
  });

  const btn =
    "h-8 w-8 rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 transition-colors";
  const active = "bg-gray-200 text-gray-900";

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-0.5 border-b border-gray-200 px-2 py-1.5 bg-gray-50 flex-wrap">
        <button
          type="button"
          className={`${btn} ${editor?.isActive("bold") ? active : ""}`}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Жирный (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${btn} ${editor?.isActive("italic") ? active : ""}`}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Курсив (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${btn} ${editor?.isActive("strike") ? active : ""}`}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          title="Зачёркнутый"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <button
          type="button"
          className={`${btn} ${editor?.isActive("heading", { level: 2 }) ? active : ""}`}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Заголовок H2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${btn} ${editor?.isActive("heading", { level: 3 }) ? active : ""}`}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Заголовок H3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <button
          type="button"
          className={`${btn} ${editor?.isActive("bulletList") ? active : ""}`}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          title="Маркированный список"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${btn} ${editor?.isActive("orderedList") ? active : ""}`}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          title="Нумерованный список"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${btn} ${editor?.isActive("blockquote") ? active : ""}`}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          title="Цитата"
        >
          <Quote className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <button
          type="button"
          className={btn}
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          title="Отменить (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          title="Повторить (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
