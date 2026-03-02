# Прогресс разработки — ГБУ АНИЦ Веб-портал

## Дата последнего обновления: 2026-03-01

---

## ✅ ВЫПОЛНЕНО

### Фаза 0 — Инфраструктура (завершена)

#### 1. База данных PostgreSQL
- БД `anic_portal` на localhost:5432 (postgres / 12345678)
- 13 таблиц через `drizzle-kit push`

#### 2. Next.js проект
- Next.js 16+ (App Router, TypeScript, Tailwind v4, Turbopack)
- Папка: `C:\Users\GK379-001\YandexDisk\claude\gbu-anic-web-portal`

#### 3. Зависимости
- drizzle-orm, next-auth@beta, @tiptap/*, zod, bcryptjs, uuid, date-fns
- shadcn/ui (19 компонентов)

#### 4. Схема БД (13 таблиц)
users, news, pages, departments, team_members, projects, publications,
knowledge_items, kb_categories, files, crosspost_log, settings, api_logs

#### 5. Утилиты
- slug.ts, api.ts, format.ts
- src/types/index.ts + src/types/next-auth.d.ts

---

### Фаза 1 — Seed + Auth + CMS (завершена)

#### 6. Seed-скрипт (scripts/seed.ts) ✅
- 2 пользователя (admin + editor)
- 3 подразделения, 4 сотрудника
- 4 проекта, 3 публикации
- 4 новости (3 опубл., 1 черновик)
- 4 страницы, 3 категории БЗ, 4 материала БЗ
- 10 настроек системы

#### 7. NextAuth v5 (src/auth.ts) ✅
- Credentials provider (email + bcrypt)
- JWT strategy, callbacks (id, role в токене)
- Страница логина: /admin/login

#### 8. Proxy/middleware (src/proxy.ts) ✅
- Защита /admin/* маршрутов
- Редирект на /admin/login для неавторизованных

#### 9. Admin Layout + Sidebar ✅
- src/app/(admin)/admin/layout.tsx — условный render
- src/components/admin/Sidebar.tsx — навигация с иконками
- src/components/admin/SessionProvider.tsx

#### 10. CMS Страницы ✅

/admin/login — форма входа
/admin — дашборд (4 карточки статистики + последние новости + быстрые действия)
/admin/news — список с пагинацией и фильтрами по статусу
/admin/news/new — создание (Tiptap WYSIWYG + категория + теги + SEO)
/admin/news/[id]/edit — редактирование

#### 11. News API Routes ✅
- GET/POST /api/news
- GET/PATCH/DELETE /api/news/[id]
- POST /api/news/[id]/publish

#### 12. Компоненты ✅
- src/components/admin/NewsForm.tsx — Tiptap форма
- src/components/admin/NewsStatusActions.tsx — публикация/удаление

---

### Шаг 2.4 — Оставшиеся CRUD-экраны ✅ ЗАВЕРШЕНО

**API Routes (13 файлов):**
- GET/POST /api/pages, GET/PATCH/DELETE /api/pages/[id]
- GET/POST /api/knowledge, GET/PATCH/DELETE /api/knowledge/[id], POST /api/knowledge/[id]/publish
- GET/POST /api/team, GET/PATCH/DELETE /api/team/[id]
- GET/POST /api/departments, GET/PATCH/DELETE /api/departments/[id]
- GET/POST /api/projects, GET/PATCH/DELETE /api/projects/[id]
- GET/POST /api/files, DELETE /api/files/[id]

**Компоненты:**
- TiptapEditor.tsx — переиспользуемый WYSIWYG редактор
- PageForm.tsx, KnowledgeForm.tsx, TeamForm.tsx, ProjectForm.tsx
- DepartmentDialog.tsx — модальное создание/редактирование
- FileUploader.tsx — drag & drop загрузчик
- DeleteButton.tsx — подтверждение удаления

**Admin Pages:**
- /admin/pages — список + /new + /[id]/edit
- /admin/knowledge — список + /new + /[id]/edit
- /admin/team — список + /new + /[id]/edit
- /admin/departments — клиентская страница с диалогом
- /admin/projects — список + /new + /[id]/edit
- /admin/files — сетка с drag & drop загрузкой

**Zod fix:** z.record(z.string(), z.any()) в knowledge routes

### Шаг 2.5 — Кросс-постинг ✅ ЗАВЕРШЕНО
- src/lib/crosspost/telegram.ts — Telegram Bot API (sendMessage HTML)
- src/lib/crosspost/vk.ts — VK wall.post API
- GET/POST /api/crosspost → crosspost_log
- NewsForm: чекбоксы Telegram/VK, кросс-пост при публикации
- /admin/crosspost — лог с платформой, статусом и ссылкой

### Шаг 2.7 — Публичный сайт ✅ ЗАВЕРШЕНО
- src/app/page.tsx — главная (hero + статистика + новости + проекты)
- src/app/(public)/layout.tsx — header + footer wrapper
- src/components/public/PublicHeader.tsx + PublicFooter.tsx
- /news — список + пагинация + фильтр по категории + поиск (NewsSearch)
- /news/[slug] — детальная с prose-рендером Tiptap JSON
- /about — о центре + подразделения + команда
- /contacts — адрес + форма обратной связи
- /research — проекты по статусам + публикации (с DOI-ссылками)
- /knowledge-base — список с боковым фильтром по категориям
- src/lib/utils/tiptap-render.ts — server-side JSON→HTML рендерер
- .prose CSS стили в globals.css

### Шаг 2.8 — Сервисные API + Настройки + Публикации ✅ ЗАВЕРШЕНО
- GET/PUT /api/settings — чтение/сохранение настроек (key-value)
- /admin/settings — группированный редактор настроек (site/contacts/social/seo)
- GET/POST /api/publications, GET/PATCH/DELETE /api/publications/[id]
- PublicationForm.tsx — форма публикации (title/authors/journal/year/doi/abstract)
- /admin/publications — список + /new + /[id]/edit
- Sidebar: добавлен пункт "Публикации" (BookMarked)
- GET /api/search?q= — полнотекстовый поиск по news + knowledge + pages
- GET /api/health — healthcheck с пингом БД и latencyMs
- src/components/public/NewsSearch.tsx — клиентский поиск с useTransition
- `pnpm tsc --noEmit` — 0 ошибок ✅

### Шаг 2.8/2.9 (по плану) — Производительность + Деплой ✅ ЗАВЕРШЕНО
- ISR revalidate: главная(60s), новости(60s), новость[slug](300s+generateStaticParams)
- ISR revalidate: о центре(3600s), исследования(300s), контакты(86400s)
- ISR revalidate: БЗ список(60s), БЗ[slug](300s+generateStaticParams), подразделение(3600s)
- next/image в about/page.tsx и research/departments/[slug]/page.tsx
- Dynamic import TiptapEditor в PageForm и KnowledgeForm (lazy bundle split)
- next.config.ts: output:"standalone", avif/webp images
- scripts/setup-vps.sh — установка Node/PG/Nginx/Meilisearch/UFW на Ubuntu 22.04
- scripts/deploy.sh — git pull → install → db:push → build → pm2 restart
- ecosystem.config.js — PM2 cluster mode, max_memory_restart 512M
- nginx.conf.example — SSL, gzip, /uploads/ статика, security headers
- .env.production.example — все переменные окружения

### Шаг 3.2 — Детальные страницы ✅ ЗАВЕРШЕНО
- /knowledge-base/[slug] — статья БЗ (prose, теги, мета, «Читайте также»)
- /research/departments/[slug] — подразделение (команда, проекты, публикации)
- Карточки подразделений в /about → кликабельны (Link)
- Карточки БЗ в /knowledge-base → кликабельны (Link)
- generateStaticParams для knowledge-base/[slug] и departments/[slug]

### Шаг 3.3 — /api/v1 Публичный REST API ✅ ЗАВЕРШЕНО
- src/lib/utils/api-key.ts — Bearer token auth + CORS headers
- GET /api/v1/stats — агрегированная статистика (revalidate 300s)
- GET /api/v1/departments — подразделения с руководителями
- GET /api/v1/knowledge — материалы БЗ (q, category, department, limit, offset)
- GET /api/v1/search — поиск по news+knowledge+pages (q, type, limit)
- POST /api/v1/ai/query — заглушка ИИ-ответчика

### Шаг 3.4 — Документация ✅ ЗАВЕРШЕНО
- docs/1-architecture.md — стек, маршруты, БД, кэширование
- docs/2-api-reference.md — все API эндпоинты v1 + внутренние
- docs/3-admin-guide.md — руководство CMS для редакторов
- docs/4-deploy-guide.md — пошаговый деплой на VPS
- docs/5-knowledge-base.md — структура и управление БЗ
- docs/6-ai-roadmap.md — RAG, pgvector, Claude API, дорожная карта ИИ

---

## ✅ ПРОЕКТ ЗАВЕРШЁН (все фазы 0–3)

`pnpm tsc --noEmit` — 0 ошибок ✅

---

## ⏳ ОПЦИОНАЛЬНЫЕ УЛУЧШЕНИЯ (post-MVP)
- Форма обратной связи (contacts) — отправка email через nodemailer
- Динамические публичные страницы из таблицы pages (/[slug] → pages table)
- OG-изображения (next/og + ImageResponse)
- Кросс-постинг Дзен/ОК/MAX (env готов в .env.example)
- Global search UI на публичном сайте (использует /api/search)
- Meilisearch индексация при публикации (scripts/reindex.ts)
- ИИ-ответчик на базе знаний (Claude API + pgvector, план в docs/6)

---

## Команды

```bash
pnpm dev           # dev server → http://localhost:3000
pnpm build         # production build
pnpm db:push       # применить schema к БД
pnpm db:seed       # заполнить БД тестовыми данными ✅
pnpm db:studio     # Drizzle Studio UI
```

## CMS доступ
- URL: http://localhost:3000/admin
- Admin: admin@anic.ru / admin123
- Editor: editor@anic.ru / editor123

## Технические заметки (важно!)
- **Next.js 16**: middleware переименован в proxy.ts
- **Zod v4**: `error.issues[0].message` вместо `error.errors`
- **auth.ts**: находится в `src/auth.ts`, импорт через `@/auth`
- **proxy.ts**: находится в `src/proxy.ts`
