/**
 * Разовый скрипт: импортирует PDF-документы из public/documents/ в БД.
 * Структура: папки = разделы, файлы = документы.
 * Дедупликация по fileUrl.
 *
 * Запуск: pnpm tsx scripts/import-documents-from-fs.ts
 */

import fs from "fs";
import path from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { documents } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL не задан в .env.local");
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

/** Превращает имя файла в читаемый заголовок */
function fileToTitle(filename: string): string {
  return filename
    .replace(/\.[a-zA-Z]+$/i, "")
    .replace(/^\d+\.\s*/, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Убирает "1. " префикс из названия папки */
function folderToSection(folder: string): string {
  return folder.replace(/^\d+\.\s*/, "").trim();
}

/** Извлекает порядковый номер раздела из имени папки ("2. Госзадание" → 2) */
function folderOrder(folder: string): number {
  const m = folder.match(/^(\d+)\./);
  return m ? parseInt(m[1]) : 999;
}

/** Извлекает порядковый номер документа из имени файла ("3. Документ.pdf" → 3) */
function fileOrder(filename: string): number {
  const m = filename.match(/^(\d+)\./);
  return m ? parseInt(m[1]) : 999;
}

async function main() {
  const docsRoot = path.join(process.cwd(), "public", "documents");

  if (!fs.existsSync(docsRoot)) {
    console.error(`Папка не найдена: ${docsRoot}`);
    process.exit(1);
  }

  const folders = fs
    .readdirSync(docsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const folder of folders) {
    const sectionName = folderToSection(folder.name);
    const sectionOrd = folderOrder(folder.name);
    const folderPath = path.join(docsRoot, folder.name);

    const files = fs
      .readdirSync(folderPath, { withFileTypes: true })
      .filter((f) => f.isFile() && !f.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));

    for (const file of files) {
      const relUrl = `/documents/${encodeURIComponent(folder.name)}/${encodeURIComponent(file.name)}`;
      const title = fileToTitle(file.name);
      const sortOrd = fileOrder(file.name);

      // Дедупликация
      const existing = await db
        .select({ id: documents.id })
        .from(documents)
        .where(eq(documents.fileUrl, relUrl));

      if (existing.length > 0) {
        console.log(`  пропущен (уже есть): ${title}`);
        skipped++;
        continue;
      }

      try {
        await db.insert(documents).values({
          title,
          docType: "other",
          fileUrl: relUrl,
          status: "active",
          sortOrder: sortOrd,
          section: sectionName,
          sectionOrder: sectionOrd,
        });
        console.log(`  ✓ добавлен: [${sectionName}] ${title}`);
        added++;
      } catch (err) {
        console.error(`  ✗ ошибка: ${title}`, err);
        errors++;
      }
    }
  }

  console.log(`\nГотово: добавлено ${added}, пропущено ${skipped}, ошибок ${errors}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
