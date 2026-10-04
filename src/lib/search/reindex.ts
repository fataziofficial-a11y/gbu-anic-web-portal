/**
 * Полная переиндексация поиска: все публичные разделы сайта в одном индексе.
 *
 * Данных немного (сотни записей), поэтому индекс пересобирается целиком —
 * так поиск не зависит от того, в каждом ли разделе админки при сохранении
 * вызвана индексация. Запускается по расписанию (cron → /api/cron/reindex) и
 * скриптом scripts/meili-reindex.ts. Новости и база знаний дополнительно
 * индексируются сразу при сохранении.
 */
import { MeiliSearch } from "meilisearch";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  news, knowledgeItems, pages, documents, projects, publications, procurements,
  departments, teamMembers, mediaItems, partners,
} from "@/lib/db/schema";
import { configureIndex, newsDoc, knowledgeDoc, pageDoc, type SearchDoc } from "@/lib/search/meili";

const INDEX_NAME = "site_content";
const ts = (d: Date | string | null | undefined) => (d ? Math.floor(new Date(d).getTime() / 1000) : 0);
const cut = (s: string | null | undefined, n = 500) => (s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

export async function buildAllDocs(): Promise<SearchDoc[]> {
  const [n, kb, pg, docs, prj, pubs, proc, deps, team, media, parts] = await Promise.all([
    db.query.news.findMany({
      where: eq(news.status, "published"),
      columns: { id: true, title: true, slug: true, excerpt: true, category: true, tags: true, publishedAt: true },
    }),
    db.query.knowledgeItems.findMany({
      where: eq(knowledgeItems.status, "published"),
      columns: { id: true, title: true, slug: true, tags: true, publishedAt: true },
      with: { category: { columns: { name: true } } },
    }),
    db.query.pages.findMany({ where: eq(pages.status, "published"), columns: { id: true, title: true, slug: true, updatedAt: true } }),
    db.query.documents.findMany({ where: eq(documents.status, "active"), with: { file: { columns: { url: true } } } }),
    db.query.projects.findMany(),
    db.query.publications.findMany({ with: { department: { columns: { slug: true, name: true } }, file: { columns: { url: true } } } }),
    db.query.procurements.findMany(),
    db.query.departments.findMany(),
    db.query.teamMembers.findMany({ with: { department: { columns: { slug: true, name: true } } } }),
    db.query.mediaItems.findMany({ where: eq(mediaItems.status, "published") }),
    db.query.partners.findMany(),
  ]);

  const out: SearchDoc[] = [
    ...n.map(newsDoc),
    ...kb.map(knowledgeDoc),
    ...pg.map(pageDoc),
  ];
  for (const d of docs) out.push({
    id: `document_${d.id}`, type: "document", numericId: d.id, title: d.title, slug: "",
    url: d.file?.url || d.fileUrl || "/documents", body: "", category: d.section ?? "", tags: [], publishedAt: ts(d.issuedAt ?? d.createdAt),
  });
  for (const p of prj) out.push({
    id: `project_${p.id}`, type: "project", numericId: p.id, title: p.title, slug: p.slug,
    url: `/research/${p.slug}`, body: cut([p.description, p.lead, p.partnerOrg].filter(Boolean).join(". ")), category: "Проекты", tags: [], publishedAt: ts(p.startDate ?? p.createdAt),
  });
  for (const p of pubs) out.push({
    id: `publication_${p.id}`, type: "publication", numericId: p.id, title: p.title, slug: "",
    url: p.file?.url || (p.doi ? `https://doi.org/${p.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "")}` : p.department ? `/research/departments/${p.department.slug}` : "/research"),
    body: cut([p.authors, p.journal, p.year, p.abstract].filter(Boolean).join(". ")), category: p.department?.name ?? "Публикации", tags: [], publishedAt: ts(p.year ? `${p.year}-01-01` : p.createdAt),
  });
  for (const p of proc) out.push({
    id: `procurement_${p.id}`, type: "procurement", numericId: p.id, title: p.title, slug: "",
    url: "/procurement", body: cut(p.description), category: "Закупки", tags: [], publishedAt: ts(p.publishedAt ?? p.createdAt),
  });
  for (const d of deps) out.push({
    id: `department_${d.id}`, type: "department", numericId: d.id, title: d.name, slug: d.slug,
    url: `/research/departments/${d.slug}`, body: cut(d.description), category: "Подразделения", tags: [], publishedAt: ts(d.createdAt),
  });
  for (const t of team) out.push({
    id: `team_${t.id}`, type: "team", numericId: t.id, title: t.name, slug: "",
    url: t.department ? `/research/departments/${t.department.slug}` : "/about",
    body: cut([t.position, t.department?.name, t.bio].filter(Boolean).join(". ")), category: t.department?.name ?? "Сотрудники", tags: [], publishedAt: ts(t.createdAt),
  });
  for (const m of media) out.push({
    id: `media_${m.id}`, type: "media", numericId: m.id, title: m.title, slug: "",
    url: `/media/${m.id}`, body: cut(m.description), category: m.type === "photo" ? "Фото" : "Видео", tags: [], publishedAt: ts(m.eventDate ?? m.createdAt),
  });
  for (const p of parts) out.push({
    id: `partner_${p.id}`, type: "partner", numericId: p.id, title: p.name, slug: "",
    url: "/partners", body: cut([p.description, p.services].filter(Boolean).join(". ")), category: "Партнёры", tags: [], publishedAt: ts(p.createdAt),
  });
  return out;
}

/** Пересобрать индекс: добавить/обновить всё актуальное и убрать удалённое. */
export async function reindexAll(): Promise<{ total: number; removed: number; byType: Record<string, number> }> {
  const host = process.env.MEILISEARCH_HOST;
  if (!host) throw new Error("MEILISEARCH_HOST не задан");
  const client = new MeiliSearch({ host, apiKey: process.env.MEILISEARCH_API_KEY });
  const index = client.index<SearchDoc>(INDEX_NAME);
  await configureIndex();

  const docs = await buildAllDocs();
  const task = await index.addDocuments(docs, { primaryKey: "id" });
  await client.tasks.waitForTask(task.taskUid, { timeout: 60_000 });

  const keep = new Set(docs.map((d) => d.id));
  const existing = await index.getDocuments({ fields: ["id"], limit: 100_000 });
  const stale = existing.results.map((d) => String(d.id)).filter((id) => !keep.has(id));
  if (stale.length) {
    const del = await index.deleteDocuments(stale);
    await client.tasks.waitForTask(del.taskUid, { timeout: 60_000 });
  }
  const byType: Record<string, number> = {};
  for (const d of docs) byType[d.type] = (byType[d.type] ?? 0) + 1;
  return { total: docs.length, removed: stale.length, byType };
}
