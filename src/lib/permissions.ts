/**
 * Система разрешений CMS.
 *
 * Каждый раздел идентифицируется ключом (Section).
 * Каждой роли назначен набор разделов по умолчанию.
 * Администратор может переопределить доступ конкретного пользователя
 * через поле users.permissions (массив ключей Section).
 */

export type Section =
  | "news"
  | "knowledge"
  | "projects"
  | "team"
  | "departments"
  | "publications"
  | "media"
  | "partners"
  | "documents"
  | "procurements"
  | "files"
  | "crosspost"
  | "tickets"
  | "settings"
  | "users";

export const ALL_SECTIONS: Section[] = [
  "news",
  "knowledge",
  "projects",
  "team",
  "departments",
  "publications",
  "media",
  "partners",
  "documents",
  "procurements",
  "files",
  "crosspost",
  "tickets",
  "settings",
  "users",
];

export const SECTION_LABELS: Record<Section, string> = {
  news: "Новости",
  knowledge: "База знаний",
  projects: "Проекты",
  team: "Сотрудники",
  departments: "Подразделения",
  publications: "Публикации",
  media: "Медиа",
  partners: "Партнёры",
  documents: "Документы",
  procurements: "Закупки",
  files: "Файлы",
  crosspost: "Кросс-постинг",
  tickets: "Тикеты",
  settings: "Настройки",
  users: "Пользователи",
};

/** Разделы по умолчанию для каждой роли */
export const ROLE_DEFAULT_SECTIONS: Record<string, Section[]> = {
  admin: ALL_SECTIONS,
  news_editor: ["knowledge", "news", "media", "crosspost", "tickets"],
  researcher: ["knowledge", "projects", "publications", "tickets"],
  hr_specialist: ["knowledge", "departments", "team", "documents", "tickets", "users"],
  procurement_specialist: ["knowledge", "documents", "procurements", "tickets"],
  // Legacy
  editor: ["knowledge", "news", "media", "crosspost", "tickets"],
  author: ["news", "tickets"],
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  news_editor: "Редактор новостей",
  researcher: "Научный сотрудник",
  hr_specialist: "Специалист по кадрам",
  procurement_specialist: "Специалист по закупкам",
  editor: "Редактор",
  author: "Автор",
};

/**
 * Возвращает список разделов, доступных пользователю.
 * Если customPermissions задан (администратор переопределил доступ),
 * используются они. Иначе — дефолт роли.
 */
export function getUserSections(
  role: string,
  customPermissions?: string[] | null
): Section[] {
  if (customPermissions && customPermissions.length > 0) {
    return customPermissions.filter((s) =>
      ALL_SECTIONS.includes(s as Section)
    ) as Section[];
  }
  return ROLE_DEFAULT_SECTIONS[role] ?? ROLE_DEFAULT_SECTIONS.author;
}

export function canAccess(
  role: string,
  section: Section,
  customPermissions?: string[] | null
): boolean {
  if (role === "admin") return true;
  return getUserSections(role, customPermissions).includes(section);
}
