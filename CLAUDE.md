# CLAUDE.md — Инструкции для Claude Code

## Проект
Веб-портал ГБУ «Арктический научно-исследовательский центр Республики Саха (Якутия)»

## Контекст
Прочитай файл PLAN.md в корне проекта — это полный план разработки с архитектурой, структурой БД, описанием всех шагов и технологий.

## Стек
- **Next.js 14+** (App Router, TypeScript)
- **Tailwind CSS + shadcn/ui**
- **Drizzle ORM + PostgreSQL** (локальный)
- **Meilisearch** (полнотекстовый поиск)
- **Tiptap** (WYSIWYG редактор)
- **NextAuth.js** (аутентификация)
- **BullMQ / in-memory queue** (кросс-постинг)

## Архитектура
Одно Next.js приложение с двумя route groups:
- `(public)` — публичный сайт (SSR/SSG)
- `(admin)` — CMS-панель (русский интерфейс, для нетехнических пользователей)

## Правила кодирования

### Общие
- TypeScript strict mode
- Весь интерфейс CMS-панели на **русском языке**
- Используй `pnpm` как пакетный менеджер
- Не используй Docker — всё нативно на Windows
- БД: PostgreSQL локальный, подключение через DATABASE_URL из .env.local
- Файлы загружаются в `public/uploads/`

### Компоненты
- Используй shadcn/ui для UI-компонентов
- Используй Tailwind CSS для стилизации (никакого CSS-in-JS)
- Компоненты публичного сайта → `src/components/public/`
- Компоненты админки → `src/components/admin/`
- Общие UI-компоненты → `src/components/ui/` (shadcn)

### API
- Все API routes в `src/app/api/`
- Валидация через zod
- Ответы в формате `{ data: ..., error: ... }`
- Публичный API для ИИ: `/api/v1/*`
- Внутренний API для CMS: `/api/news`, `/api/pages`, etc.

### БД
- ORM: Drizzle
- Schema: `src/lib/db/schema.ts`
- Миграции: `drizzle/migrations/`
- Контент (Tiptap) хранится как JSONB
- Slug генерируется автоматически из заголовка (транслитерация кириллицы)

### CMS-панель
- Принцип: «3 клика до публикации»
- Sidebar с русскими названиями разделов
- WYSIWYG: Tiptap с базовыми инструментами
- Кросс-постинг: чекбоксы Telegram, VK, Дзен, ОК, MAX
- Файловый менеджер: drag & drop загрузка

### Кросс-постинг
- Модули в `src/lib/crosspost/`
- Каждая платформа — отдельный файл (telegram.ts, vk.ts, etc.)
- In-memory очередь для dev, BullMQ + Redis для prod
- Логирование в таблицу crosspost_log

## Переменные окружения
Все в `.env.local`. Не коммить в git. Шаблон в `.env.example`.

## Команды
```bash
pnpm dev              # запуск dev server
pnpm build            # production build
pnpm db:generate      # генерация миграций Drizzle
pnpm db:migrate       # применение миграций
pnpm db:seed          # заполнение тестовыми данными
pnpm search:reindex   # переиндексация Meilisearch
```

## Текущий шаг
Смотри PLAN.md → находи текущий шаг → выполняй по описанию.
