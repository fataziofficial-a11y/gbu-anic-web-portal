import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { PageBanner } from "@/components/public/PageBanner";
import { DocumentsAccordion } from "@/components/public/DocumentsAccordion";

export const metadata: Metadata = { title: "Документы" };
export const dynamic = "force-static";

type DocItem = {
  id: string;
  title: string;
  fileUrl: string;
};

type Section = {
  name: string;
  docs: DocItem[];
};

/** Превращает имя файла в читаемый заголовок */
function fileToTitle(filename: string): string {
  return filename
    .replace(/\.[a-zA-Z]+$/, "")       // убрать расширение
    .replace(/^\d+\.\s*/, "")           // убрать "1. " в начале
    .replace(/-/g, " ")                 // дефисы → пробелы
    .replace(/\s+/g, " ")
    .trim();
}

/** Убирает "1. " префикс из названия папки */
function folderToSection(folder: string): string {
  return folder.replace(/^\d+\.\s*/, "").trim();
}

function loadSections(): Section[] {
  const docsRoot = path.join(process.cwd(), "public", "documents");

  if (!fs.existsSync(docsRoot)) return [];

  const folders = fs
    .readdirSync(docsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return folders.map((folder) => {
    const folderPath = path.join(docsRoot, folder.name);
    const files = fs
      .readdirSync(folderPath, { withFileTypes: true })
      .filter((f) => f.isFile() && !f.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));

    const docs: DocItem[] = files.map((file) => {
      const urlPath = `/documents/${encodeURIComponent(folder.name)}/${encodeURIComponent(file.name)}`;
      return {
        id: urlPath,
        title: fileToTitle(file.name),
        fileUrl: urlPath,
      };
    });

    return {
      name: folderToSection(folder.name),
      docs,
    };
  });
}

export default function DocumentsPage() {
  const sections = loadSections();

  return (
    <div>
      <PageBanner
        eyebrow="Правовая база"
        title="Документы"
        description="Регламенты, приказы и положения ГБУ АНИЦ"
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <DocumentsAccordion sections={sections} />
      </div>
    </div>
  );
}
