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

## Окружение разработки (Windows)

```
Уже установлено:
  ✅ Node.js
  ✅ PostgreSQL (локальный)
  ✅ Git

Нужно установить:
  □ pnpm (npm install -g pnpm) — пакетный менеджер
  □ Meilisearch — скачать .exe с https://github.com/meilisearch/meilisearch/releases
  □ Redis — опционально для dev (есть Memurai для Windows, или пропускаем для dev)

Не нужно для разработки (только на проде):
  ✗ Docker
  ✗ Nginx
  ✗ Redis (заменяем in-memory для dev)
  ✗ Let's Encrypt
```

### Dev vs Production

| Компонент | Dev (Windows) | Prod (VPS Ubuntu) |
|-----------|--------------|-------------------|
| Node.js | Локальный | PM2 |
| PostgreSQL | Локальный | VPS или managed (Supabase/Neon) |
| Redis | Не нужен (in-memory queue) | Redis server |
| Meilisearch | .exe бинарник | systemd service |
| Nginx | Не нужен (Next.js dev server) | Reverse proxy + SSL |
| SSL | Не нужен | Let's Encrypt |
| Файлы | Локальная папка /uploads | Nginx static + папка /uploads |

---

## Стек

| Компонент | Технология |
|-----------|-----------|
| Фреймворк | Next.js 14+ (App Router) |
| Язык | TypeScript |
| Стилизация | Tailwind CSS + shadcn/ui |
| ORM | Drizzle ORM |
| БД | PostgreSQL 16 + pgvector |
| Кэш | Нет для dev / Redis для prod |
| Поиск | Meilisearch |
| WYSIWYG | Tiptap (ProseMirror) |
| Аутентификация | NextAuth.js (credentials) |
| Очереди | In-memory для dev / BullMQ + Redis для prod |
| Загрузка файлов | Локальная папка public/uploads |
| Web-сервер | Next.js dev server / Nginx на проде |
| CDN | Cloudflare (прод) |
| Мониторинг | UptimeRobot (прод) |
| Аналитика | Яндекс.Метрика |

---

## Структура проекта

```
anic-portal/
├── src/
│   ├── app/
│   │   ├── (public)/                ← публичный сайт
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             ← главная
│   │   │   ├── news/
│   │   │   │   ├── page.tsx         ← лента новостей
│   │   │   │   └── [slug]/page.tsx  ← отдельная новость
│   │   │   ├── about/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── research/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── departments/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [slug]/page.tsx
│   │   │   │   ├── projects/page.tsx
│   │   │   │   └── publications/page.tsx
│   │   │   ├── knowledge-base/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── search/page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   └── contacts/page.tsx
│   │   │
│   │   ├── (admin)/                 ← CMS-панель (защищена auth)
│   │   │   ├── layout.tsx           ← sidebar + auth guard
│   │   │   └── admin/
│   │   │       ├── page.tsx         ← дашборд
│   │   │       ├── news/
│   │   │       │   ├── page.tsx     ← список
│   │   │       │   ├── new/page.tsx ← создание
│   │   │       │   └── [id]/
│   │   │       │       └── edit/page.tsx
│   │   │       ├── pages/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/page.tsx
│   │   │       │   └── [id]/edit/page.tsx
│   │   │       ├── knowledge/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/page.tsx
│   │   │       │   └── [id]/edit/page.tsx
│   │   │       ├── files/
│   │   │       │   └── page.tsx     ← файловый менеджер
│   │   │       ├── team/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/page.tsx
│   │   │       │   └── [id]/edit/page.tsx
│   │   │       ├── departments/
│   │   │       ├── projects/
│   │   │       ├── crosspost/
│   │   │       │   └── page.tsx     ← лог кросс-постинга
│   │   │       └── settings/
│   │   │           └── page.tsx     ← токены соцсетей, настройки
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── news/route.ts            ← GET (список), POST (создать)
│   │       ├── news/[id]/route.ts       ← GET, PUT, DELETE
│   │       ├── news/[id]/publish/route.ts ← POST (опубликовать + кросс-пост)
│   │       ├── pages/route.ts
│   │       ├── pages/[id]/route.ts
│   │       ├── knowledge/route.ts
│   │       ├── knowledge/[id]/route.ts
│   │       ├── files/route.ts           ← POST (upload), GET (список)
│   │       ├── files/[id]/route.ts      ← DELETE
│   │       ├── team/route.ts
│   │       ├── departments/route.ts
│   │       ├── projects/route.ts
│   │       ├── crosspost/route.ts       ← GET (лог)
│   │       ├── crosspost/retry/[id]/route.ts ← POST (повторить)
│   │       ├── search/route.ts          ← GET (проксирование Meilisearch)
│   │       ├── v1/                      ← public API для ИИ
│   │       │   ├── knowledge/route.ts
│   │       │   ├── search/route.ts
│   │       │   ├── departments/route.ts
│   │       │   ├── stats/route.ts
│   │       │   └── ai/query/route.ts   ← заглушка
│   │       └── health/route.ts
│   │
│   ├── components/
│   │   ├── public/                  ← компоненты сайта
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── NewsCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── HeroSection.tsx
│   │   ├── admin/                   ← компоненты CMS
│   │   │   ├── Sidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── Editor.tsx           ← Tiptap WYSIWYG
│   │   │   ├── FileUploader.tsx     ← drag & drop
│   │   │   ├── CrosspostPanel.tsx   ← чекбоксы соцсетей
│   │   │   ├── PublishButton.tsx    ← «Опубликовать» с подтверждением
│   │   │   ├── DataTable.tsx        ← универсальная таблица
│   │   │   ├── ImagePicker.tsx      ← выбор обложки
│   │   │   └── StatusBadge.tsx      ← черновик/опубликовано
│   │   └── ui/                      ← shadcn/ui (автогенерация)
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts             ← подключение Drizzle
│   │   │   ├── schema.ts            ← все таблицы
│   │   │   └── seed.ts              ← начальные данные
│   │   ├── crosspost/
│   │   │   ├── index.ts             ← общий интерфейс + очередь
│   │   │   ├── telegram.ts
│   │   │   ├── vk.ts
│   │   │   ├── dzen.ts
│   │   │   ├── ok.ts
│   │   │   └── max.ts
│   │   ├── search/
│   │   │   ├── client.ts            ← Meilisearch клиент
│   │   │   └── indexer.ts           ← индексация контента
│   │   ├── auth/
│   │   │   └── options.ts           ← NextAuth конфигурация
│   │   └── utils/
│   │       ├── api.ts               ← fetch-обёртки
│   │       ├── format.ts            ← форматирование дат, текста
│   │       └── tiptap-to-text.ts    ← конвертация Tiptap JSON → plaintext
│   │
│   └── types/
│       └── index.ts                 ← общие TypeScript-типы
│
├── public/
│   └── uploads/                     ← загруженные файлы (dev)
│
├── scripts/
│   ├── migrate-wp.ts                ← миграция из WordPress
│   ├── seed.ts                      ← заполнение тестовыми данными
│   └── reindex.ts                   ← переиндексация Meilisearch
│
├── drizzle/
│   └── migrations/                  ← SQL-миграции (drizzle-kit)
│
├── docs/                            ← документация для заказчика
│
├── .env.local                       ← переменные окружения (dev)
├── .env.production                  ← переменные окружения (prod)
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## .env.local (разработка)

```env
# База данных
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/anic_portal

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=dev-master-key

# Загрузка файлов
UPLOAD_DIR=./public/uploads
NEXT_PUBLIC_UPLOAD_URL=/uploads

# Кросс-постинг (заполнить когда будут токены)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=
VK_ACCESS_TOKEN=
VK_GROUP_ID=
DZEN_ACCESS_TOKEN=
DZEN_PUBLISHER_ID=
OK_APP_KEY=
OK_ACCESS_TOKEN=
OK_GROUP_ID=
MAX_BOT_TOKEN=
MAX_CHAT_ID=

# Публичный API
API_SECRET_KEY=dev-api-key

# Режим очереди (memory для dev, redis для prod)
QUEUE_MODE=memory
REDIS_URL=
```

---

## Схема базы данных

```sql
-- Пользователи CMS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'author', -- admin, editor, author
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Новости
CREATE TABLE news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content JSONB, -- Tiptap JSON
  excerpt TEXT,
  cover_image_id INTEGER REFERENCES files(id),
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  author_id INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  published_at TIMESTAMP,
  seo_title VARCHAR(500),
  seo_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Страницы
CREATE TABLE pages (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content JSONB,
  parent_id INTEGER REFERENCES pages(id),
  sort_order INTEGER DEFAULT 0,
  template VARCHAR(50) DEFAULT 'default', -- default, about, contacts
  status VARCHAR(20) DEFAULT 'draft',
  author_id INTEGER REFERENCES users(id),
  seo_title VARCHAR(500),
  seo_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Подразделения
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  head_id INTEGER REFERENCES team_members(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Сотрудники
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  department_id INTEGER REFERENCES departments(id),
  photo_id INTEGER REFERENCES files(id),
  bio TEXT,
  email VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Проекты
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  department_id INTEGER REFERENCES departments(id),
  status VARCHAR(20) DEFAULT 'active', -- active, completed, planned
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Публикации
CREATE TABLE publications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(1000) NOT NULL,
  authors TEXT,
  abstract TEXT,
  year INTEGER,
  journal VARCHAR(500),
  doi VARCHAR(255),
  file_id INTEGER REFERENCES files(id),
  department_id INTEGER REFERENCES departments(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Элементы базы знаний
CREATE TABLE knowledge_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content JSONB,
  category_id INTEGER REFERENCES kb_categories(id),
  tags TEXT[] DEFAULT '{}',
  department_id INTEGER REFERENCES departments(id),
  author_id INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMP,
  metadata JSONB DEFAULT '{}', -- source_type, language, word_count
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Категории базы знаний
CREATE TABLE kb_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES kb_categories(id),
  sort_order INTEGER DEFAULT 0
);

-- Файлы
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(500) NOT NULL,        -- имя на диске (uuid.ext)
  original_name VARCHAR(500) NOT NULL,   -- оригинальное имя
  mime_type VARCHAR(100),
  size_bytes INTEGER,
  url VARCHAR(1000) NOT NULL,            -- /uploads/uuid.ext
  thumbnail_url VARCHAR(1000),
  alt_text VARCHAR(500),
  folder VARCHAR(50) DEFAULT 'media',    -- media, documents, knowledge
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Лог кросс-постинга
CREATE TABLE crosspost_log (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL,     -- news, knowledge
  content_id INTEGER NOT NULL,
  platform VARCHAR(20) NOT NULL,         -- telegram, vk, dzen, ok, max
  status VARCHAR(20) DEFAULT 'queued',   -- queued, sent, failed
  external_post_id VARCHAR(255),
  external_url VARCHAR(1000),
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Настройки
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Лог API-запросов
CREATE TABLE api_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  method VARCHAR(10),
  path VARCHAR(500),
  query_params TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500)
);

-- Индексы
CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_published ON news(published_at DESC);
CREATE INDEX idx_news_slug ON news(slug);
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_parent ON pages(parent_id);
CREATE INDEX idx_knowledge_status ON knowledge_items(status);
CREATE INDEX idx_knowledge_slug ON knowledge_items(slug);
CREATE INDEX idx_knowledge_category ON knowledge_items(category_id);
CREATE INDEX idx_crosspost_content ON crosspost_log(content_type, content_id);
CREATE INDEX idx_crosspost_status ON crosspost_log(status);
CREATE INDEX idx_api_logs_timestamp ON api_logs(timestamp);
CREATE INDEX idx_files_folder ON files(folder);
```

---

## ПОШАГОВЫЙ ПЛАН ДЕЙСТВИЙ

---

## ФАЗА 0 — Подготовка (День 0)

### Шаг 0.1 — Установка инструментов
```
□ pnpm:
  npm install -g pnpm

□ Meilisearch (Windows):
  1. Скачать .exe: https://github.com/meilisearch/meilisearch/releases
  2. Положить в C:\tools\meilisearch\
  3. Запуск: meilisearch.exe --master-key="dev-master-key"
  4. Проверка: http://localhost:7700

□ Создать БД PostgreSQL:
  psql -U postgres
  CREATE DATABASE anic_portal;
```

### Шаг 0.2 — Инициализация проекта
```
Claude Code:
  □ pnpm create next-app anic-portal --typescript --tailwind --app --src-dir
  □ Установка зависимостей:
    pnpm add drizzle-orm postgres @neondatabase/serverless
    pnpm add -D drizzle-kit
    pnpm add next-auth @auth/drizzle-adapter
    pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-image
    pnpm add @tiptap/extension-link @tiptap/extension-placeholder
    pnpm add meilisearch
    pnpm add zod
    pnpm add bcryptjs
    pnpm add uuid
    pnpm add date-fns
    pnpm add -D @types/bcryptjs @types/uuid
  □ shadcn/ui init + базовые компоненты
  □ Структура папок (как в схеме выше)
  □ drizzle.config.ts
  □ src/lib/db/schema.ts (Drizzle ORM schema)
  □ src/lib/db/index.ts (подключение)
  □ .env.local
  □ Первая миграция: pnpm drizzle-kit generate → pnpm drizzle-kit migrate
  □ scripts/seed.ts (admin-пользователь + тестовые данные)

Ты:
  □ Проверяешь: pnpm dev → http://localhost:3000 работает
  □ Проверяешь: БД создана, таблицы есть
  □ Первый коммит в Git
```
**Время: ~4-5 часов**
**Выход:** рабочий пустой проект с БД

---

## ФАЗА 1 — Аудит и проектирование (Дни 1–10)

### Шаг 1.1 — Бэкап и аудит текущего сайта (Дни 1–2)
```
Claude Code:
  □ Node.js скрипт для аудита WP через SSH (или вручную):
    - Версии WP, PHP, MySQL
    - Список плагинов
    - Кол-во страниц, записей, медиа
    - Размер БД, uploads
  □ Скрипт запуска Lighthouse (npx lighthouse)

Ты:
  □ SSH к серверу заказчика
  □ mysqldump для бэкапа
  □ Скачиваешь wp-content/uploads
  □ Скриншоты всех страниц
  □ Ручные заметки по UX-проблемам
```
**Выход:** данные аудита, бэкап

### Шаг 1.2 — Экспорт контента из WordPress (Дни 3–4)
```
Claude Code:
  □ Скрипт scripts/migrate-wp.ts:
    - Парсинг WP XML export (или прямой SQL к дампу)
    - Экспорт → JSON файлы:
      pages.json, posts.json, media.json, menus.json
    - Анализ: пустые страницы, дубли, битые ссылки → report.json

Ты:
  □ WP Admin → Инструменты → Экспорт → All content → XML
  □ Запускаешь скрипт анализа
  □ Составляешь карту: что переносим / что удаляем
  □ Обсуждаешь с заказчиком
```
**Выход:** JSON-экспорт, карта контента

### Шаг 1.3 — Проектирование (Дни 5–7)
```
Claude Code:
  □ Mermaid-диаграммы → .md файлы:
    - ER-диаграмма БД
    - Sitemap
    - Архитектура системы
    - User flow для CMS (3 клика до публикации)
  □ OpenAPI spec (openapi.yaml)
  □ Простые HTML-wireframes админки (для показа заказчику)

Ты:
  □ Ревью архитектуры
  □ ★ Контрольная точка День 5: демонстрация заказчику
  □ Сбор обратной связи
```
**Выход:** утверждённая архитектура

### Шаг 1.4 — Документация Этапа 1 (Дни 8–10)
```
Claude Code:
  □ Markdown → PDF:
    1. Отчёт об аудите
    2. Архитектурная схема
    3. Структура сайта (Sitemap)
    4. Концепция развития + ИИ-модуль

Ты:
  □ Финализация
  □ Презентация заказчику
  □ ✅ Акт Этапа 1
```

---

## ФАЗА 2 — Разработка портала (Дни 11–22)

### Шаг 2.1 — API и бизнес-логика (Дни 11–12)
```
Claude Code — День 11:
  □ API Routes — CRUD:
    /api/news          — GET (список + пагинация + фильтры), POST
    /api/news/[id]     — GET, PUT, DELETE
    /api/pages         — GET, POST
    /api/pages/[id]    — GET, PUT, DELETE
    /api/knowledge     — GET, POST
    /api/knowledge/[id]— GET, PUT, DELETE
    /api/files         — POST (upload), GET (список)
    /api/files/[id]    — GET, DELETE
    /api/team          — GET, POST
    /api/team/[id]     — GET, PUT, DELETE
    /api/departments   — GET, POST
    /api/departments/[id] — GET, PUT, DELETE
    /api/projects      — GET, POST
    /api/projects/[id] — GET, PUT, DELETE
  □ Валидация через zod
  □ Загрузка файлов: multipart → сохранение в public/uploads/
  □ Автогенерация slug из заголовка (транслитерация кириллицы)

Claude Code — День 12:
  □ NextAuth.js:
    - Credentials provider (email + пароль)
    - Middleware: /admin/* → требует auth
    - Роли: admin (всё), editor (CRUD без настроек), author (создание черновиков)
  □ API publish:
    /api/news/[id]/publish — POST
    → status = 'published'
    → published_at = now()
    → запуск кросс-постинга
  □ Seed-скрипт: admin-пользователь + 5 тестовых новостей + 3 страницы

Ты:
  □ Тестируешь все API через Postman / Thunder Client
  □ Проверяешь авторизацию
  □ Проверяешь загрузку файлов
```
**Выход:** полный работающий API

### Шаг 2.2 — CMS-панель: каркас (День 13)
```
Claude Code:
  □ (admin)/layout.tsx:
    - Sidebar с иконками (русские названия!)
    - Header: имя пользователя, кнопка выхода
    - Auth guard (redirect если не авторизован)
  □ Страница входа /admin/login:
    - Email + пароль
    - Простая форма
  □ Дашборд /admin:
    - 4 карточки со статистикой (новости, страницы, файлы, записи БЗ)
    - Последние действия
    - Быстрые кнопки: «+ Новая новость», «+ Загрузить файл»
  □ Компонент DataTable.tsx:
    - Универсальная таблица с поиском, сортировкой, пагинацией
    - Кнопки: редактировать, удалить
    - Фильтр по статусу (черновик / опубликовано)

Ты:
  □ Проверяешь: логин работает
  □ Проверяешь: sidebar навигация логичная
  □ Проверяешь: выглядит чисто и понятно
```
**Выход:** каркас админки

### Шаг 2.3 — CMS: WYSIWYG + формы создания контента (День 14)
```
Claude Code:
  □ Компонент Editor.tsx (Tiptap):
    Панель инструментов (русские подсказки):
    - Жирный (Ctrl+B)
    - Курсив (Ctrl+I)
    - Заголовок 2, Заголовок 3
    - Маркированный список
    - Нумерованный список
    - Цитата
    - Ссылка (вставка URL)
    - Изображение (drag & drop + кнопка загрузки)
    - Вложение файла
    - Разделитель
    - Отмена / Повтор

  □ Форма создания новости (/admin/news/new):
    - Заголовок (input)
    - Текст (Tiptap Editor)
    - Обложка (ImagePicker — drag & drop или выбор из загруженных)
    - Категория (select)
    - Панель кросс-постинга (CrosspostPanel)
    - Кнопки: «Сохранить черновик» / «Предпросмотр» / «🚀 Опубликовать»

  □ Форма создания страницы (/admin/pages/new):
    - Заголовок, контент (Tiptap), родительская страница (select)

  □ Форма создания записи базы знаний (/admin/knowledge/new):
    - Заголовок, контент, категория, прикреплённые файлы, теги

  □ Предпросмотр:
    - Открывает модалку / новую вкладку с рендером как на сайте

Ты:
  □ Тестируешь: создать новость с картинкой → предпросмотр → опубликовать
  □ Проверяешь: интуитивно ли? Справится ли человек без инструкции?
```
**Выход:** полные формы создания контента

### Шаг 2.4 — CMS: все CRUD-экраны + файловый менеджер (День 15)
```
Claude Code:
  □ /admin/news — список новостей (DataTable)
  □ /admin/news/[id]/edit — редактирование (та же форма, предзаполненная)
  □ /admin/pages — список страниц (древовидный)
  □ /admin/pages/[id]/edit — редактирование
  □ /admin/knowledge — список записей БЗ
  □ /admin/knowledge/[id]/edit — редактирование
  □ /admin/team — список сотрудников
  □ /admin/team/new, /admin/team/[id]/edit
  □ /admin/departments — подразделения
  □ /admin/projects — проекты

  □ Файловый менеджер (/admin/files):
    - Drag & drop зона для загрузки (множественная)
    - Таблица файлов: иконка типа, имя, размер, дата
    - Фильтр по папкам: Все / Медиа / Документы / База знаний
    - Превью изображений (миниатюры)
    - Кнопки: скачать, удалить
    - Поиск по имени

Ты:
  □ Полный прогон: создать → редактировать → удалить для каждой сущности
  □ Загрузить 10 файлов — всё работает?
  □ ★ Контрольная точка День 15: показать staging заказчику
```
**Выход:** полная CMS-панель

### Шаг 2.5 — Кросс-постинг (День 16)
```
Claude Code:
  □ lib/crosspost/index.ts:
    - Абстрактный интерфейс CrossPoster
    - In-memory очередь для dev (setTimeout)
    - Функция publishToSocials(content, platforms[])

  □ lib/crosspost/telegram.ts:
    - Bot API: sendPhoto (если есть обложка) или sendMessage
    - Формат: заголовок + excerpt + кнопка «Читать на сайте →»

  □ lib/crosspost/vk.ts:
    - VK API: wall.post
    - Формат: текст + фото + ссылка

  □ lib/crosspost/dzen.ts:
    - Дзен Publisher API
    - Формат: полная статья (Narrative)

  □ lib/crosspost/ok.ts:
    - OK API: mediatopic.post
    - Формат: текст + медиа

  □ lib/crosspost/max.ts:
    - MAX Bot API (VK Teams)
    - Формат: текст + фото + кнопка

  □ Компонент CrosspostPanel.tsx:
    - Чекбоксы с логотипами платформ
    - Текст для соцсетей (textarea, опционально)
    - Статус: ✅ отправлено / ❌ ошибка / ⏳ отправляется

  □ /admin/crosspost — лог всех публикаций:
    - Таблица: платформа, новость, статус, время, ссылка
    - Кнопка «Повторить» для ошибочных

  □ /admin/settings — ввод токенов:
    - Telegram: bot token + channel ID
    - VK: access token + group ID
    - Дзен: access token
    - ОК: app key + token + group ID
    - MAX: bot token + chat ID
    - Кнопка «Проверить подключение» для каждой платформы

Ты:
  □ Создаёшь тестовые боты/каналы
  □ Вводишь токены в настройках
  □ Публикуешь новость → проверяешь: пришло в TG? В VK?
  □ Проверяешь: ошибка → лог → повторная отправка
```
**Выход:** кросс-постинг в 5 платформ

### Шаг 2.6 — Миграция контента из WordPress (День 17)
```
Claude Code:
  □ scripts/migrate-wp.ts:
    - Парсинг JSON из шага 1.2
    - HTML → Tiptap JSON (конвертация)
    - Очистка WP shortcodes: [gallery], [caption], etc.
    - Скачивание и загрузка медиафайлов
    - Создание записей через API
    - Маппинг URL: old → new (для редиректов)
    - Лог: migrated.json, errors.json, skipped.json

Ты:
  □ Запускаешь: npx tsx scripts/migrate-wp.ts
  □ Проверяешь контент в админке
  □ Исправляешь проблемы
```
**Выход:** контент перенесён

### Шаг 2.7 — Публичный сайт (Дни 17–18)
```
Claude Code — День 17 (вторая половина):
  □ (public)/layout.tsx: Header + Footer + Navigation
  □ Компоненты: NewsCard, Breadcrumbs, Pagination, SEO
  □ API-клиент: fetch-обёртки с типами

Claude Code — День 18:
  □ Главная (/):
    - Hero: заголовок + описание + CTA
    - Последние новости (3 карточки)
    - Направления исследований (иконки + текст)
    - Цифры (проекты, публикации, сотрудники)
  □ О центре (/about): текст + команда + документы
  □ Новости (/news): лента + фильтр по категориям + пагинация
  □ Новость (/news/[slug]): контент + дата + автор + share-кнопки
  □ Научная деятельность (/research):
    - Подразделения (карточки)
    - Страница подразделения (описание + руководитель + проекты)
    - Проекты (фильтр по статусу)
    - Публикации (фильтр по году)
  □ Контакты (/contacts): адрес + карта + форма
  □ 404 страница
  □ SEO: meta, OG, JSON-LD, robots.txt, sitemap.xml

Ты:
  □ Ревью каждой страницы
  □ Мобильное тестирование (DevTools + реальный телефон)
```
**Выход:** полный рабочий публичный сайт

### Шаг 2.8 — Производительность (Дни 19–20)
```
Claude Code:
  □ ISR (revalidate) для всех страниц
  □ next/image для всех изображений
  □ Оптимизация bundle (dynamic imports для тяжёлых компонентов)
  □ Lighthouse CI скрипт

Ты:
  □ Lighthouse: ≥ 90 Performance
  □ PageSpeed: ≤ 3 секунды
  □ Мобильный тест
```
**Выход:** KPI производительности выполнены

### Шаг 2.9 — Деплой на production (Дни 21–22)
```
Claude Code:
  □ Скрипт настройки VPS (Ubuntu):
    - Node.js 20 LTS
    - PostgreSQL 16
    - Redis
    - Meilisearch (systemd service)
    - Nginx конфигурация
    - Let's Encrypt (certbot)
    - PM2 для Node.js
    - UFW firewall
    - Бэкап скрипт (pg_dump + cron)
  □ .env.production
  □ Nginx конфигурация:
    - arctarch.com → Next.js (:3000)
    - /uploads → статика
    - SSL, gzip, security headers
    - Редиректы со старых WP URL
  □ deploy.sh (git pull → pnpm install → pnpm build → pm2 restart)

Ты:
  □ Арендуешь VPS
  □ Запускаешь скрипт настройки
  □ Деплоишь
  □ Переключаешь DNS
  □ Кроссбраузерное тестирование
  □ ✅ Акт Этапа 2
```
**Выход:** ✅ Портал на production

---

## ФАЗА 3 — База знаний + Поиск + API (Дни 23–30)

### Шаг 3.1 — Meilisearch + поиск (Дни 23–24)
```
Claude Code:
  □ lib/search/client.ts — подключение к Meilisearch
  □ lib/search/indexer.ts — индексация всех типов контента
  □ scripts/reindex.ts — полная переиндексация
  □ Авто-индексация: при публикации → обновить индекс
  □ Конфигурация:
    - Русские стоп-слова
    - Фильтруемые: category, department, type, year
    - Сортируемые: date, relevance
  □ /knowledge-base/search:
    - Instant search (debounce 300ms)
    - Фильтры: категория, отдел, тип, период
    - Подсветка найденного
    - Фасеты

Ты:
  □ Запуск: meilisearch.exe → npx tsx scripts/reindex.ts
  □ Тестируешь поиск
```
**Выход:** мгновенный поиск

### Шаг 3.2 — База знаний: UI + контент (Дни 25–26)
```
Claude Code:
  □ /knowledge-base — каталог: категории + популярное + поиск
  □ /knowledge-base/[slug] — документ + файлы + «Читайте также»
  □ Скрипт массового импорта из PDF/DOCX

Ты:
  □ Получаешь материалы от заказчика
  □ Загружаешь через админку или скрипт
  □ ★ Контрольная точка День 25
```
**Выход:** наполненная база знаний

### Шаг 3.3 — REST API + логирование (Дни 27–28)
```
Claude Code:
  □ /api/v1/knowledge — поиск и получение
  □ /api/v1/search — проксирование Meilisearch
  □ /api/v1/departments, /api/v1/stats
  □ /api/v1/ai/query — заглушка
  □ API key аутентификация
  □ Rate limiting (middleware)
  □ Логирование → api_logs
  □ /api/health — health check
  □ Swagger UI (/api/docs) — опционально

Ты:
  □ Тестируешь API
  □ Проверяешь безопасность
```
**Выход:** задокументированный REST API

### Шаг 3.4 — Документация и финал (Дни 29–30)
```
Claude Code:
  □ docs/1-architecture.md — архитектура
  □ docs/2-api-reference.md — API
  □ docs/3-admin-guide.md — руководство CMS (со скриншотами)
  □ docs/4-deploy-guide.md — деплой и обслуживание
  □ docs/5-knowledge-base.md — структура БЗ
  □ docs/6-ai-roadmap.md — рекомендации по ИИ
  □ Конвертация → PDF

Ты:
  □ Ревью
  □ Финальная демонстрация заказчику
  □ ✅ Акт Этапа 3
```
**Выход:** ✅ Проект завершён

---

## ФАЗА 4 — Дизайн (параллельный трек)

### Дни 11–13: Референсы
```
□ 5-7 референсов сайтов НИИ / научных центров
□ Цветовая палитра (2-3 варианта)
□ Типографика (кириллица)
□ Согласование с заказчиком
```

### Дни 14–18: Figma
```
□ Макеты в Figma (совместно с Claude):
  - Главная (desktop + mobile)
  - Новость
  - Лента новостей
  - База знаний + поиск
  - Подразделение
□ UI Kit
□ Согласование
```

### Дни 19–22: Наложение
```
□ Дизайн-токены → tailwind.config.ts
□ Обновление компонентов
□ Финальная полировка
```

---

## Контрольные точки

| День | Событие | Формат |
|------|---------|--------|
| 5 | Промежуточные результаты аудита | Встреча |
| 10 | Отчёт + архитектура → **Акт Этапа 1** | PDF + подписание |
| 15 | Рабочая CMS + скелет сайта (staging) | Ссылка |
| 18 | Макет Figma | Ссылка на Figma |
| 22 | Портал на production → **Акт Этапа 2** | Демо + подписание |
| 25 | База знаний + поиск | Демо |
| 30 | Всё + документация → **Акт Этапа 3** | Финальная приёмка |

---

## Что нужно от заказчика (сводный чек-лист)

### День 0–1 (БЛОКЕР!)
```
□ SSH + WP Admin + DNS + хостинг
□ Контактное лицо (телефон, Telegram)
```

### День 10
```
□ Утверждение архитектуры
□ Логотип (SVG), брендбук
```

### День 14–16
```
□ Telegram: бот + токен + ID канала
□ VK: токен группы
□ Дзен: OAuth доступ к студии
□ ОК: ключ приложения + токен группы
□ MAX: бот + токен
```

### День 23
```
□ Материалы для базы знаний (PDF, DOCX)
□ Утверждение категорий БЗ
```

---

## Запуск разработки (команды)

```bash
# Терминал 1: Next.js
cd anic-portal
pnpm dev

# Терминал 2: Meilisearch
cd C:\tools\meilisearch
meilisearch.exe --master-key="dev-master-key"

# PostgreSQL — уже запущен как сервис Windows
```

Открываешь:
- http://localhost:3000 — публичный сайт
- http://localhost:3000/admin — CMS-панель
- http://localhost:7700 — Meilisearch dashboard

---

*Версия: 4.0 — Windows, без Docker, кастомная CMS, кросс-постинг*
*Дата: 28.02.2026*
