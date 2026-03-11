"use client";

import { useState } from "react";
import { FileText, Download, ChevronDown } from "lucide-react";

type Doc = {
  id: string;
  title: string;
  fileUrl: string | null;
};

type Section = {
  name: string;
  docs: Doc[];
};

function getFileExt(url: string | null): string {
  if (!url) return "";
  const m = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  return m ? m[1].toUpperCase() : "";
}

function ExtBadge({ ext }: { ext: string }) {
  const colors: Record<string, string> = {
    PDF: "bg-red-100 text-red-700",
    DOC: "bg-blue-100 text-blue-700",
    DOCX: "bg-blue-100 text-blue-700",
    XLS: "bg-green-100 text-green-700",
    XLSX: "bg-green-100 text-green-700",
  };
  if (!ext) return null;
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${colors[ext] ?? "bg-gray-100 text-gray-500"}`}
    >
      {ext}
    </span>
  );
}

export function DocumentsAccordion({ sections }: { sections: Section[] }) {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(sections.length > 0 ? [sections[0].name] : [])
  );

  const toggle = (name: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF4FB]">
          <FileText className="h-8 w-8 text-[#1A3A6B]" />
        </div>
        <p className="text-lg font-bold text-[#4B6075]">Документов пока нет</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => {
        const isOpen = open.has(section.name);
        return (
          <div
            key={section.name}
            className="overflow-hidden rounded-2xl border border-[#DDE8F0] bg-white transition-shadow hover:shadow-sm"
          >
            {/* Header */}
            <button
              onClick={() => toggle(section.name)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[#F7FAFD]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FB]">
                  <FileText className="h-4 w-4 text-[#1A3A6B]" />
                </div>
                <span className="text-base font-bold text-[#0D1C2E]">
                  {section.name}
                </span>
                <span className="rounded-full bg-[#EEF4FB] px-2 py-0.5 text-xs font-semibold text-[#4B6075]">
                  {section.docs.length}
                </span>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-[#8B9BAD] transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Content */}
            {isOpen && (
              <div className="divide-y divide-[#EEF4FB] border-t border-[#DDE8F0]">
                {section.docs.map((doc) => {
                  const ext = getFileExt(doc.fileUrl);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[#F7FAFD]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <ExtBadge ext={ext} />
                        </div>
                        <p className="mt-0.5 text-sm font-medium leading-snug text-[#0D1C2E]">
                          {doc.title}
                        </p>
                      </div>
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1.5 rounded-xl border border-[#DDE8F0] px-3 py-2 text-xs font-bold text-[#1A3A6B] transition-colors hover:border-[#1A3A6B] hover:bg-[#EEF4FB]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Скачать
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
