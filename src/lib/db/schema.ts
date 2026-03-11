import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  date,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==================== Пользователи CMS ====================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("author"), // admin, editor, author
  avatarUrl: varchar("avatar_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==================== Файлы ====================
export const files = pgTable(
  "files",
  {
    id: serial("id").primaryKey(),
    filename: varchar("filename", { length: 500 }).notNull(), // имя на диске (uuid.ext)
    originalName: varchar("original_name", { length: 500 }).notNull(), // оригинальное имя
    mimeType: varchar("mime_type", { length: 100 }),
    sizeBytes: integer("size_bytes"),
    url: varchar("url", { length: 1000 }).notNull(), // /uploads/uuid.ext
    thumbnailUrl: varchar("thumbnail_url", { length: 1000 }),
    altText: varchar("alt_text", { length: 500 }),
    folder: varchar("folder", { length: 50 }).default("media"), // media, documents, knowledge
    uploadedBy: integer("uploaded_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_files_folder").on(table.folder)]
);

// ==================== Новости ====================
export const news = pgTable(
  "news",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).unique().notNull(),
    content: jsonb("content"), // Tiptap JSON
    excerpt: text("excerpt"),
    coverImageId: integer("cover_image_id").references(() => files.id),
    category: varchar("category", { length: 100 }),
    tags: text("tags").array().default([]),
    authorId: integer("author_id").references(() => users.id),
    status: varchar("status", { length: 20 }).default("draft"), // draft, published, archived
    publishedAt: timestamp("published_at"),
    seoTitle: varchar("seo_title", { length: 500 }),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_news_status").on(table.status),
    index("idx_news_published").on(table.publishedAt),
    index("idx_news_slug").on(table.slug),
  ]
);

// ==================== Страницы ====================
export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).unique().notNull(),
    content: jsonb("content"),
    parentId: integer("parent_id"),
    sortOrder: integer("sort_order").default(0),
    template: varchar("template", { length: 50 }).default("default"), // default, about, contacts
    status: varchar("status", { length: 20 }).default("draft"),
    authorId: integer("author_id").references(() => users.id),
    seoTitle: varchar("seo_title", { length: 500 }),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_pages_slug").on(table.slug),
    index("idx_pages_parent").on(table.parentId),
  ]
);

// ==================== Подразделения ====================
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  description: text("description"),
  headId: integer("head_id"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== Сотрудники ====================
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }),
  departmentId: integer("department_id").references(() => departments.id),
  photoId: integer("photo_id").references(() => files.id),
  bio: text("bio"),
  email: varchar("email", { length: 255 }),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== Проекты ====================
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).unique().notNull(),
  description: text("description"),
  departmentId: integer("department_id").references(() => departments.id),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, planned
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== Публикации ====================
export const publications = pgTable("publications", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 1000 }).notNull(),
  authors: text("authors"),
  abstract: text("abstract"),
  year: integer("year"),
  journal: varchar("journal", { length: 500 }),
  doi: varchar("doi", { length: 255 }),
  fileId: integer("file_id").references(() => files.id),
  departmentId: integer("department_id").references(() => departments.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== Категории базы знаний ====================
export const kbCategories = pgTable("kb_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").default(0),
});

// ==================== Элементы базы знаний ====================
export const knowledgeItems = pgTable(
  "knowledge_items",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).unique().notNull(),
    content: jsonb("content"),
    categoryId: integer("category_id").references(() => kbCategories.id),
    tags: text("tags").array().default([]),
    departmentId: integer("department_id").references(() => departments.id),
    authorId: integer("author_id").references(() => users.id),
    status: varchar("status", { length: 20 }).default("draft"),
    publishedAt: timestamp("published_at"),
    metadata: jsonb("metadata").default({}), // source_type, language, word_count
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_knowledge_status").on(table.status),
    index("idx_knowledge_slug").on(table.slug),
    index("idx_knowledge_category").on(table.categoryId),
  ]
);

// ==================== Лог кросс-постинга ====================
export const crosspostLog = pgTable(
  "crosspost_log",
  {
    id: serial("id").primaryKey(),
    contentType: varchar("content_type", { length: 50 }).notNull(), // news, knowledge
    contentId: integer("content_id").notNull(),
    platform: varchar("platform", { length: 20 }).notNull(), // telegram, vk, dzen, ok, max
    status: varchar("status", { length: 20 }).default("queued"), // queued, sent, failed
    externalPostId: varchar("external_post_id", { length: 255 }),
    externalUrl: varchar("external_url", { length: 1000 }),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_crosspost_content").on(table.contentType, table.contentId),
    index("idx_crosspost_status").on(table.status),
  ]
);

// ==================== Настройки ====================
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).unique().notNull(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==================== Лог API-запросов ====================
export const apiLogs = pgTable(
  "api_logs",
  {
    id: serial("id").primaryKey(),
    timestamp: timestamp("timestamp").defaultNow(),
    method: varchar("method", { length: 10 }),
    path: varchar("path", { length: 500 }),
    queryParams: text("query_params"),
    statusCode: integer("status_code"),
    responseTimeMs: integer("response_time_ms"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 500 }),
  },
  (table) => [index("idx_api_logs_timestamp").on(table.timestamp)]
);

// ==================== Медиа (видео + фото мероприятий) ====================
export const mediaItems = pgTable("media_items", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull().default("video"), // "video" | "photo"
  videoUrl: varchar("video_url", { length: 1000 }),
  thumbnailId: integer("thumbnail_id").references(() => files.id),
  eventDate: date("event_date"),
  sortOrder: integer("sort_order").default(0),
  status: varchar("status", { length: 20 }).default("published"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== Партнёры ====================
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  logoId: integer("logo_id").references(() => files.id),
  description: text("description"),
  services: text("services"),
  websiteUrl: varchar("website_url", { length: 1000 }),
  projectIds: jsonb("project_ids").$type<number[]>().default([]),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== Нормативные документы ====================
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 1000 }).notNull(),
  section: varchar("section", { length: 255 }).default("Прочее"), // название раздела-группы
  docType: varchar("doc_type", { length: 50 }).default("normative"),
  // "normative" | "order" | "regulation" | "other"
  fileId: integer("file_id").references(() => files.id),
  fileUrl: varchar("file_url", { length: 1000 }),
  issuedAt: date("issued_at"),
  status: varchar("status", { length: 20 }).default("active"), // "active" | "archived"
  sortOrder: integer("sort_order").default(0),
  sectionOrder: integer("section_order").default(0), // порядок раздела
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== Закупки ====================
export const procurements = pgTable("procurements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 1000 }).notNull(),
  description: text("description"),
  eisUrl: varchar("eis_url", { length: 1000 }),
  publishedAt: date("published_at"),
  deadline: date("deadline"),
  amount: varchar("amount", { length: 255 }),
  status: varchar("status", { length: 20 }).default("open"),
  // "open" | "closed" | "cancelled"
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== Relations ====================
export const usersRelations = relations(users, ({ many }) => ({
  news: many(news),
  pages: many(pages),
  knowledgeItems: many(knowledgeItems),
  files: many(files),
}));

export const newsRelations = relations(news, ({ one }) => ({
  author: one(users, {
    fields: [news.authorId],
    references: [users.id],
  }),
  coverImage: one(files, {
    fields: [news.coverImageId],
    references: [files.id],
  }),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  author: one(users, {
    fields: [pages.authorId],
    references: [users.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ many, one }) => ({
  teamMembers: many(teamMembers),
  projects: many(projects),
  publications: many(publications),
  knowledgeItems: many(knowledgeItems),
  head: one(teamMembers, {
    fields: [departments.headId],
    references: [teamMembers.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  department: one(departments, {
    fields: [teamMembers.departmentId],
    references: [departments.id],
  }),
  photo: one(files, {
    fields: [teamMembers.photoId],
    references: [files.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  department: one(departments, {
    fields: [projects.departmentId],
    references: [departments.id],
  }),
}));

export const publicationsRelations = relations(publications, ({ one }) => ({
  file: one(files, {
    fields: [publications.fileId],
    references: [files.id],
  }),
  department: one(departments, {
    fields: [publications.departmentId],
    references: [departments.id],
  }),
}));

export const kbCategoriesRelations = relations(kbCategories, ({ many }) => ({
  items: many(knowledgeItems),
}));

export const knowledgeItemsRelations = relations(knowledgeItems, ({ one }) => ({
  category: one(kbCategories, {
    fields: [knowledgeItems.categoryId],
    references: [kbCategories.id],
  }),
  department: one(departments, {
    fields: [knowledgeItems.departmentId],
    references: [departments.id],
  }),
  author: one(users, {
    fields: [knowledgeItems.authorId],
    references: [users.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  uploader: one(users, {
    fields: [files.uploadedBy],
    references: [users.id],
  }),
}));

export const mediaItemsRelations = relations(mediaItems, ({ one }) => ({
  thumbnail: one(files, {
    fields: [mediaItems.thumbnailId],
    references: [files.id],
  }),
}));

export const partnersRelations = relations(partners, ({ one }) => ({
  logo: one(files, {
    fields: [partners.logoId],
    references: [files.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  file: one(files, {
    fields: [documents.fileId],
    references: [files.id],
  }),
}));
