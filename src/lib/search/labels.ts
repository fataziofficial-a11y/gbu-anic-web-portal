// Подписи разделов и ссылки результатов поиска — без зависимостей, годится и
// для клиентского виджета в шапке.

/** Подписи разделов в результатах поиска. */
export const SEARCH_TYPE_LABEL: Record<string, string> = {
  news: "Новость",
  knowledge: "База знаний",
  page: "Страница",
  pages: "Страница",
  document: "Документ",
  project: "Проект",
  publication: "Публикация",
  procurement: "Закупка",
  department: "Подразделение",
  team: "Сотрудник",
  media: "Медиа",
  partner: "Партнёр",
};

/** Ссылка на результат: готовая из индекса, иначе — по разделу и slug. */
export function searchHref(r: { type: string; slug?: string | null; url?: string | null }): string {
  if (r.url) return r.url;
  if (!r.slug) return "/";
  if (r.type === "news") return `/news/${r.slug}`;
  if (r.type === "knowledge") return `/knowledge-base/${r.slug}`;
  return `/${r.slug}`;
}
