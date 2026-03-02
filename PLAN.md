# План действий v4
## Проект: Веб-портал ГБУ «АНИЦ»
## Окружение: Windows + Node.js + PostgreSQL (локальный) + Git

---

## Архитектурные принципы

1. **Skeleton First → Design Later** — сначала рабочий портал, дизайн из Figma накладываем поверх
2. **Admin for Humans** — CMS под заказчика: русский, 3 клика до публикации
3. **Cross-post Native** — кросс-постинг встроен в ядро
4. **AI-Ready API** — REST API готовый к подключению LLM
5. **No Docker для разработки** — всё нативно на Windows, Docker только на продакшене (VPS)
6. **Claude Code = основной кодер**, ты = архитектор, ревьюер, деплойер

---

## Стек

| Компонент | Технология |
|-----------|-----------|
| Фреймворк | Next.js 14+ (App Router) |
| Язык | TypeScript |
| Стилизация | Tailwind CSS + shadcn/ui |
| ORM | Drizzle ORM |
| БД | PostgreSQL 16 + pgvector |
| Поиск | Meilisearch |
| WYSIWYG | Tiptap (ProseMirror) |
| Аутентификация | NextAuth.js (credentials) |
| Очереди | In-memory для dev / BullMQ + Redis для prod |
| Загрузка файлов | Локальная папка public/uploads |
| CDN | Cloudflare (прод) |

---

## Окружение разработки (Windows)

```
Установлено: Node.js, PostgreSQL (локальный), Git
Нужно: pnpm, Meilisearch (.exe)
```

### Dev vs Production

| Компонент | Dev (Windows) | Prod (VPS Ubuntu) |
|-----------|--------------|-------------------|
| Node.js | Локальный | PM2 |
| PostgreSQL | Локальный | VPS |
| Redis | Не нужен (in-memory) | Redis server |
| Meilisearch | .exe бинарник | systemd service |
| Nginx | Не нужен | Reverse proxy + SSL |

---

## Архитектура

```
Next.js App (App Router) — одно приложение, два route group:
  (public) — публичный сайт (SSR/SSG)
  (admin)  — CMS-панель (CSR + Auth)

API Routes (/api) — CRUD + publish + crosspost + search + v1 (для ИИ)

PostgreSQL — данные
Meilisearch — полнотекстовый поиск
In-memory queue (dev) / BullMQ+Redis (prod) — кросс-постинг
```

---

## Структура проекта

```
anic-portal/
├── src/
│   ├── app/
│   │   ├── (public)/              ← публичный сайт
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           ← главная
│   │   │   ├── news/
│   │   │   ├── about/
│   │   │   ├── research/
│   │   │   ├── knowledge-base/
│   │   │   └── contacts/
│   │   ├── (admin)/               ← CMS-панель
│   │   │   ├── layout.tsx
│   │   │   └── admin/
│   │   │       ├── page.tsx       ← дашборд
│   │   │       ├── news/
│   │   │       ├── pages/
│   │   │       ├── knowledge/
│   │   │       ├── files/
│   │   │       ├── team/
│   │   │       ├── departments/
│   │   │       ├── projects/
│   │   │       ├── crosspost/
│   │   │       └── settings/
│   │   └── api/
│   │       ├── auth/
│   │       ├── news/
│   │       ├── pages/
│   │       ├── knowledge/
│   │       ├── files/
│   │       ├── crosspost/
│   │       ├── search/
│   │       ├── v1/               ← public API для ИИ
│   │       └── health/
│   ├── components/
│   │   ├── public/
│   │   ├── admin/
│   │   └── ui/                   ← shadcn/ui
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   ├── schema.ts
│   │   │   └── seed.ts
│   │   ├── crosspost/
│   │   ├── search/
│   │   ├── auth/
│   │   └── utils/
│   └── types/
├── public/uploads/
├── scripts/
├── drizzle/migrations/
├── docs/
├── .env.local
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## База данных (PostgreSQL)

### Таблицы:
- users (id, email, name, password_hash, role, avatar_url, timestamps)
- news (id, title, slug, content JSONB, excerpt, cover_image_id, category, tags[], author_id, status, published_at, seo_*, timestamps)
- pages (id, title, slug, content JSONB, parent_id, sort_order, template, status, author_id, seo_*, timestamps)
- departments (id, name, slug, description, head_id, sort_order)
- team_members (id, name, position, department_id, photo_id, bio, email, sort_order)
- projects (id, title, slug, description, department_id, status, start_date, end_date)
- publications (id, title, authors, abstract, year, journal, doi, file_id, department_id)
- knowledge_items (id, title, slug, content JSONB, category_id, tags[], department_id, author_id, status, published_at, metadata JSONB, timestamps)
- kb_categories (id, name, slug, description, parent_id, sort_order)
- files (id, filename, original_name, mime_type, size_bytes, url, thumbnail_url, alt_text, folder, uploaded_by, created_at)
- crosspost_log (id, content_type, content_id, platform, status, external_post_id, external_url, error_message, sent_at, created_at)
- settings (id, key, value, updated_at)
- api_logs (id, timestamp, method, path, query_params, status_code, response_time_ms, ip_address, user_agent)

---

## CMS-панель: принцип «3 клика до публикации»

```
Клик 1: Выбрать раздел (Новости / Документы / База знаний / Файлы)
Клик 2: Нажать «+ Добавить»
Клик 3: Написать текст → выбрать соцсети → нажать «Опубликовать»
```

### Интерфейс:
- Русский язык полностью
- Sidebar с иконками: Новости, Страницы, База знаний, Файлы, Проекты, Сотрудники, Кросс-постинг, Настройки
- WYSIWYG редактор (Tiptap): жирный, курсив, заголовки, списки, ссылки, изображения, файлы
- Drag & drop загрузка файлов
- Чекбоксы кросс-постинга: Telegram, VK, Дзен, ОК, MAX
- Предпросмотр перед публикацией

---

## Кросс-постинг в соцсети

Платформы: Telegram, ВКонтакте, Яндекс Дзен, Одноклассники, MAX

При публикации → очередь → асинхронная отправка → лог со статусами (✅/❌/⏳)
Повторная отправка при ошибке из лога.

---

## ПОШАГОВЫЙ ПЛАН

### ФАЗА 0 — Подготовка (День 0)
- Шаг 0.1: pnpm, Meilisearch, создать БД anic_portal
- Шаг 0.2: Инициализация Next.js, зависимости, Drizzle schema, .env.local, seed

### ФАЗА 1 — Аудит и проектирование (Дни 1–10)
- Шаг 1.1 (Дни 1–2): Бэкап WP, технический аудит
- Шаг 1.2 (Дни 3–4): Экспорт контента из WP → JSON
- Шаг 1.3 (Дни 5–7): Проектирование архитектуры, диаграммы
- Шаг 1.4 (Дни 8–10): Документация, согласование, ✅ Акт Этапа 1

### ФАЗА 2 — Разработка портала (Дни 11–22)
- Шаг 2.1 (Дни 11–12): API Routes CRUD + NextAuth
- Шаг 2.2 (День 13): CMS каркас: layout, sidebar, дашборд, DataTable
- Шаг 2.3 (День 14): WYSIWYG (Tiptap) + формы создания контента
- Шаг 2.4 (День 15): Все CRUD-экраны + файловый менеджер
- Шаг 2.5 (День 16): Кросс-постинг (5 платформ) + лог + настройки
- Шаг 2.6 (День 17): Миграция контента из WP
- Шаг 2.7 (Дни 17–18): Публичный сайт — все страницы
- Шаг 2.8 (Дни 19–20): Производительность (Lighthouse ≥90, ≤3 сек)
- Шаг 2.9 (Дни 21–22): Деплой VPS + ✅ Акт Этапа 2

### ФАЗА 3 — База знаний + Поиск + API (Дни 23–30)
- Шаг 3.1 (Дни 23–24): Meilisearch + instant search UI
- Шаг 3.2 (Дни 25–26): База знаний UI + наполнение
- Шаг 3.3 (Дни 27–28): REST API v1 (для ИИ) + логирование
- Шаг 3.4 (Дни 29–30): Документация + ✅ Акт Этапа 3

### ФАЗА 4 — Дизайн (параллельный трек, Дни 11–22)
- Дни 11–13: Референсы, цвета, типографика
- Дни 14–18: Макет в Figma
- Дни 19–22: Наложение дизайна на скелет

---

## Контрольные точки

| День | Событие |
|------|---------|
| 5 | Промежуточные результаты аудита |
| 10 | Акт Этапа 1 |
| 15 | CMS + скелет сайта (staging) |
| 18 | Макет Figma |
| 22 | Акт Этапа 2 (production) |
| 25 | База знаний + поиск |
| 30 | Акт Этапа 3 (финал) |
