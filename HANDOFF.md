# HANDOFF — ГБУ АНИЦ Веб-портал
## Итоговый документ проекта
## Дата: 2026-03-01 (обновлён)

---

## Быстрый старт (dev)

```bash
# 1. Убедиться что PostgreSQL запущен (служба Windows)
# 2. В терминале:
cd C:\Users\GK379-001\YandexDisk\claude\gbu-anic-web-portal
pnpm dev
```

- Публичный сайт:  http://localhost:3000
- CMS-панель:      http://localhost:3000/admin
- Admin логин:     admin@anic.ru / admin123
- Editor логин:    editor@anic.ru / editor123

```bash
# Полезные команды
pnpm dev               # запуск dev-сервера
pnpm build             # production сборка
pnpm tsc --noEmit      # проверка типов (сейчас: 0 ошибок)
pnpm db:push           # применить схему к БД
pnpm db:seed           # заполнить тестовыми данными
pnpm db:studio         # Drizzle Studio (GUI для БД)
pnpm meili:reindex     # полная переиндексация в Meilisearch
```

---

## Стек

| Компонент | Технология |
|-----------|-----------|
| Фреймворк | Next.js 16+ App Router + TypeScript |
| Стили | Tailwind CSS v4 + shadcn/ui (19 компонентов) |
| ORM + БД | Drizzle ORM + PostgreSQL 16 |
| Auth | NextAuth v5 (Credentials + JWT) |
| WYSIWYG | Tiptap v3 (StarterKit + Link + Placeholder) |
| Иконки | Lucide React |
| Тосты | Sonner |
| OG-изображения | `next/og` + ImageResponse (satori) |
| Поиск | Meilisearch (опционально, fallback → DB ilike) |
| ИИ | DeepSeek API (OpenAI-совместимый, нативный fetch) |
| Логирование | Кастомный JSON-логгер (`src/lib/logger.ts`) |

---

## База данных

**Строка подключения:** `postgresql://postgres:12345678@localhost:5432/anic_portal`

**13 таблиц:**
```
users           — пользователи CMS
news            — новости (status: draft/published/archived)
pages           — статические страницы (иерархия)
departments     — научные подразделения
team_members    — сотрудники
projects        — исследовательские проекты (active/planned/completed)
publications    — научные публикации (DOI)
knowledge_items — материалы базы знаний
kb_categories   — категории базы знаний
files           — загруженные файлы (/uploads/)
crosspost_log   — лог кросс-постинга
settings        — key-value настройки сайта
api_logs        — лог API-запросов
```

---

## Все страницы и маршруты

### Публичный сайт

| URL | Файл | Кэш |
|-----|------|-----|
| `/` | `app/page.tsx` | ISR 60s |
| `/news` | `(public)/news/page.tsx` | ISR 60s |
| `/news/[slug]` | `(public)/news/[slug]/page.tsx` | ISR 300s + SSG |
| `/about` | `(public)/about/page.tsx` | ISR 1h |
| `/contacts` | `(public)/contacts/page.tsx` | ISR 24h |
| `/research` | `(public)/research/page.tsx` | ISR 5m |
| `/research/departments/[slug]` | `(public)/research/departments/[slug]/page.tsx` | ISR 1h + SSG |
| `/knowledge-base` | `(public)/knowledge-base/page.tsx` | ISR 60s |
| `/knowledge-base/[slug]` | `(public)/knowledge-base/[slug]/page.tsx` | ISR 5m + SSG |
| `/[slug]` | `(public)/[slug]/page.tsx` | ISR 5m + SSG |

> `/[slug]` — динамические страницы из таблицы `pages` (status = 'published').
> Рендерит Tiptap JSON → HTML, arctic-стиль с хлебными крошками.

### OG-изображения (автоматически, 1200×630)

| Маршрут | Файл |
|---------|------|
| Сайт по умолчанию | `app/opengraph-image.tsx` |
| Новость | `(public)/news/[slug]/opengraph-image.tsx` |
| Статья БЗ | `(public)/knowledge-base/[slug]/opengraph-image.tsx` |
| Динамическая страница | `(public)/[slug]/opengraph-image.tsx` |

Используют шрифт Inter из Google Fonts с text-subsetting (поддержка кириллицы).
Разные бэджи: синий "Новость", зелёный "База знаний", серый для страниц.

### CMS-панель (`/admin/*`, требует авторизации)

| URL | Описание |
|-----|----------|
| `/admin/login` | Вход |
| `/admin` | Дашборд (статистика + быстрые действия) |
| `/admin/news` | Список новостей |
| `/admin/news/new` | Создать новость |
| `/admin/news/[id]/edit` | Редактировать новость |
| `/admin/pages` | Страницы сайта |
| `/admin/pages/new` | Создать страницу |
| `/admin/pages/[id]/edit` | Редактировать страницу |
| `/admin/knowledge` | База знаний |
| `/admin/knowledge/new` | Создать материал БЗ |
| `/admin/knowledge/[id]/edit` | Редактировать материал БЗ |
| `/admin/team` | Сотрудники |
| `/admin/team/new` | Добавить сотрудника |
| `/admin/team/[id]/edit` | Редактировать сотрудника |
| `/admin/departments` | Подразделения (inline dialog) |
| `/admin/projects` | Проекты |
| `/admin/projects/new` | Создать проект |
| `/admin/projects/[id]/edit` | Редактировать проект |
| `/admin/publications` | Научные публикации |
| `/admin/publications/new` | Добавить публикацию |
| `/admin/publications/[id]/edit` | Редактировать публикацию |
| `/admin/files` | Файловый менеджер (drag & drop) |
| `/admin/crosspost` | Лог кросс-постинга |
| `/admin/settings` | Настройки сайта |

### API (внутренний, требует сессии CMS)

| Метод | Путь | Описание |
|-------|------|----------|
| GET/POST | `/api/news` | Список / создать |
| GET/PATCH/DELETE | `/api/news/[id]` | CRUD |
| POST | `/api/news/[id]/publish` | Опубликовать |
| GET/POST | `/api/pages` | CRUD страниц |
| GET/PATCH/DELETE | `/api/pages/[id]` | — |
| GET/POST | `/api/knowledge` | CRUD БЗ |
| GET/PATCH/DELETE | `/api/knowledge/[id]` | — |
| POST | `/api/knowledge/[id]/publish` | Опубликовать |
| GET/POST | `/api/team` | CRUD команды |
| GET/PATCH/DELETE | `/api/team/[id]` | — |
| GET/POST | `/api/departments` | CRUD подразделений |
| GET/PATCH/DELETE | `/api/departments/[id]` | — |
| GET/POST | `/api/projects` | CRUD проектов |
| GET/PATCH/DELETE | `/api/projects/[id]` | — |
| GET/POST | `/api/publications` | CRUD публикаций |
| GET/PATCH/DELETE | `/api/publications/[id]` | — |
| GET/POST | `/api/files` | Список / загрузить |
| DELETE | `/api/files/[id]` | Удалить файл |
| GET/PUT | `/api/settings` | Настройки |
| GET/POST | `/api/crosspost` | Кросс-постинг |
| GET | `/api/search` | Внутренний поиск (Meilisearch → fallback DB) |
| GET | `/api/health` | Healthcheck + latencyMs |

> `api/news` и `api/knowledge` автоматически выполняют upsert/delete в Meilisearch
> при изменении статуса публикации (fire-and-forget, не блокирует ответ).

### Публичный REST API v1 (`Authorization: Bearer <API_SECRET_KEY>`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/stats` | Статистика портала |
| GET | `/api/v1/departments` | Подразделения с руководителями |
| GET | `/api/v1/knowledge` | Материалы БЗ (q, category, limit, offset) |
| GET | `/api/v1/search` | Поиск по всему сайту (q, type) |
| POST | `/api/v1/ai/query` | ИИ-вопрос (DeepSeek RAG, работает!) |

---

## Структура файлов (ключевые)

```
src/
├── app/
│   ├── page.tsx                          ← Главная
│   ├── layout.tsx                        ← Root layout (lang="ru")
│   ├── globals.css                       ← Tailwind + .prose стили
│   ├── opengraph-image.tsx               ← OG-изображение сайта по умолчанию
│   ├── (public)/
│   │   ├── layout.tsx                    ← PublicHeader + PublicFooter
│   │   ├── about/page.tsx
│   │   ├── contacts/page.tsx
│   │   ├── [slug]/
│   │   │   ├── page.tsx                  ← Динамические страницы из таблицы pages
│   │   │   └── opengraph-image.tsx
│   │   ├── knowledge-base/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       ├── page.tsx              ← Детальная статья БЗ
│   │   │       └── opengraph-image.tsx
│   │   ├── news/
│   │   │   ├── page.tsx                 ← Список + поиск + пагинация
│   │   │   └── [slug]/
│   │   │       ├── page.tsx             ← Детальная новость
│   │   │       └── opengraph-image.tsx
│   │   └── research/
│   │       ├── page.tsx                 ← Проекты + публикации
│   │       └── departments/[slug]/page.tsx ← Страница подразделения
│   ├── (admin)/admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx                     ← Дашборд
│   │   ├── login/page.tsx
│   │   ├── news/ + pages/ + knowledge/
│   │   ├── team/ + departments/ + projects/
│   │   ├── publications/ + files/
│   │   ├── crosspost/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── news/ [id]/ [id]/publish/    ← + Meilisearch upsert/delete
│       ├── pages/ [id]/
│       ├── knowledge/ [id]/ [id]/publish/ ← + Meilisearch upsert/delete
│       ├── team/ [id]/
│       ├── departments/ [id]/
│       ├── projects/ [id]/
│       ├── publications/ [id]/
│       ├── files/ [id]/
│       ├── crosspost/route.ts
│       ├── settings/route.ts
│       ├── search/route.ts              ← Meilisearch first, fallback DB ilike
│       ├── health/route.ts
│       └── v1/
│           ├── stats/route.ts
│           ├── departments/route.ts
│           ├── knowledge/route.ts
│           ├── search/route.ts
│           └── ai/query/route.ts        ← DeepSeek RAG (рабочий!)
├── auth.ts                              ← NextAuth config
├── proxy.ts                             ← Middleware (защита /admin/*)
├── instrumentation.ts                   ← Next.js startup hook (логирует конфиг)
├── components/
│   ├── public/
│   │   ├── PublicHeader.tsx             ← Мобильный гамбургер + активные ссылки
│   │   ├── PublicFooter.tsx
│   │   ├── NewsSearch.tsx               ← Клиентский поиск (useTransition)
│   │   └── AskAI.tsx                   ← ИИ-виджет (useTransition, expandable)
│   ├── admin/
│   │   ├── Sidebar.tsx
│   │   ├── SessionProvider.tsx
│   │   ├── TiptapEditor.tsx             ← WYSIWYG (переиспользуемый)
│   │   ├── NewsForm.tsx                 ← Форма новости (inline Tiptap)
│   │   ├── PageForm.tsx                 ← + dynamic import TiptapEditor
│   │   ├── KnowledgeForm.tsx            ← + dynamic import TiptapEditor
│   │   ├── TeamForm.tsx
│   │   ├── ProjectForm.tsx
│   │   ├── PublicationForm.tsx
│   │   ├── DepartmentDialog.tsx
│   │   ├── FileUploader.tsx             ← Drag & drop
│   │   └── DeleteButton.tsx             ← Confirm dialog
│   └── ui/                             ← shadcn/ui (Button, Input, Dialog...)
└── lib/
    ├── db/
    │   ├── index.ts                    ← Drizzle connection
    │   └── schema.ts                   ← 13 таблиц + relations
    ├── ai/
    │   └── deepseek.ts                 ← DeepSeek client (нативный fetch)
    ├── search/
    │   └── meili.ts                    ← Meilisearch client + helpers
    ├── crosspost/
    │   ├── telegram.ts                 ← Bot API sendMessage
    │   └── vk.ts                       ← wall.post API
    ├── logger.ts                        ← Структурированный JSON-логгер
    └── utils/
        ├── api.ts                      ← apiSuccess/apiError/withErrorHandler
        ├── og-font.ts                  ← Google Fonts text-subsetting для OG
        ├── slug.ts                     ← generateSlug (транслитерация)
        ├── format.ts                   ← форматирование дат
        ├── tiptap-render.ts            ← Tiptap JSON → HTML (server-side)
        └── api-key.ts                  ← Bearer auth для /api/v1

scripts/
├── seed.ts                             ← Тестовые данные
├── meili-reindex.ts                    ← Полная переиндексация Meilisearch
├── setup-vps.sh                        ← Настройка Ubuntu VPS
└── deploy.sh                           ← Деплой на production

docs/
├── 1-architecture.md                   ← Стек, маршруты, БД
├── 2-api-reference.md                  ← Все API
├── 3-admin-guide.md                    ← Руководство CMS
├── 4-deploy-guide.md                   ← Деплой на VPS
├── 5-knowledge-base.md                 ← Структура БЗ
└── 6-ai-roadmap.md                     ← RAG + Claude API дорожная карта

ecosystem.config.js                     ← PM2 cluster config
nginx.conf.example                      ← Nginx reverse proxy
.env.production.example                 ← Все переменные для prod
```

---

## Meilisearch — поиск

**Установка:** `npm install meilisearch` (уже в package.json)

**Единый индекс:** `site_content` с полями:
```
id          — string (news-1, kb-5, page-3)
type        — "news" | "knowledge" | "page"
numericId   — number
title, slug, body, tags[], category, publishedAt
```

**Настройка в `.env`:**
```
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_KEY=masterKey
```

**Если `MEILISEARCH_HOST` не задан** — поиск автоматически падает на DB ilike (graceful degradation).

**Первичная индексация:**
```bash
pnpm meili:reindex
```

**Автоиндексация:** при публикации/снятии публикации/удалении новостей и статей БЗ через API (fire-and-forget `void upsertDoc(...)` — не блокирует ответ).

---

## DeepSeek ИИ-ответчик

**Файлы:**
- `src/lib/ai/deepseek.ts` — клиент (нативный fetch, без зависимостей)
- `src/app/api/v1/ai/query/route.ts` — RAG endpoint
- `src/components/public/AskAI.tsx` — React-виджет

**Алгоритм RAG:**
1. Zod-валидация вопроса (5–500 символов)
2. Rate limit: 5 запросов/мин с одного IP
3. `retrieveContext()`: Meilisearch → fallback DB ilike (топ-5 результатов)
4. Формируется русский system prompt с фрагментами контекста
5. Вызов DeepSeek API (`deepseek-chat` по умолчанию)
6. Возврат `{ answer, sources[], question, configured, model }`

**Env:**
```
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-chat
```

**Если `DEEPSEEK_API_KEY` не задан** — возвращает дружелюбное русское сообщение, не падает.

**Виджет `AskAI.tsx`:**
- Кнопка "Спросить ИИ" → разворачиваемая панель
- Показывает ответ + список источников (ExternalLink)
- "Задать другой вопрос" — сброс

---

## Структурированное логирование

**Файл:** `src/lib/logger.ts`

**Production** (JSON в stdout/stderr, PM2 захватывает в файл):
```json
{"ts":"2026-03-01T10:00:00.000Z","level":"info","msg":"Сервер АНИЦ запущен","env":"production","meilisearch":true,"deepseek":true,"smtp":false}
```

**Dev** (цветной консольный вывод):
```
[INFO] Сервер АНИЦ запущен {"env":"development",...}
[ERROR] DeepSeek API error {"status":429,"body":"..."}
```

**Уровни:** `debug` / `info` / `warn` / `error`
- `error` → stderr, остальное → stdout

**Startup hook:** `src/instrumentation.ts` — логирует конфигурацию сервисов при старте.

**Логгер используется в:**
- `src/lib/utils/api.ts` — необработанные ошибки API
- `src/lib/ai/deepseek.ts` — ошибки DeepSeek
- `src/lib/search/meili.ts` — ошибки Meilisearch
- `src/app/api/contact/route.ts` — SMTP успех/ошибки

---

## Технические особенности (важно знать!)

| Проблема | Решение |
|----------|---------|
| Next.js 16: `middleware.ts` не работает | Переименован в `src/proxy.ts` |
| Zod v4: `error.errors` не существует | Использовать `error.issues[0].message` |
| Zod v4: `z.record(z.any())` — ошибка | Использовать `z.record(z.string(), z.any())` |
| NextAuth v5: импорт из `@/auth` | Файл находится в `src/auth.ts` |
| Tiptap нет пакета `@tiptap/html` | Написан кастомный `tiptap-render.ts` |
| Главная не может быть в `(public)/` | Лежит в `app/page.tsx` с ручным Header/Footer |
| `next/og` тип шрифта: `Weight` union | Использовать `weight: 700 as const` в spread |
| `experimentalInstrumentationHook` в Next.js 16 | Флаг не нужен, работает по умолчанию |
| Meilisearch `tags: string[] \| null` | Тип в `newsDoc`/`knowledgeDoc` принимает `string[] \| null` |

---

## Кросс-постинг

Настройка токенов: `/admin/settings` → Социальные сети

**Telegram:**
- `TELEGRAM_BOT_TOKEN` — токен бота (@BotFather)
- `TELEGRAM_CHANNEL_ID` — ID канала (напр. `-1001234567890`)

**ВКонтакте:**
- `VK_ACCESS_TOKEN` — токен группы (manage + wall)
- `VK_GROUP_ID` — ID группы без минуса

**Дзен/ОК/MAX** — заглушки (env готовы в `.env.example`)

---

## Деплой на production

```bash
# 1. Настройка VPS (один раз)
bash scripts/setup-vps.sh

# 2. Nginx
cp nginx.conf.example /etc/nginx/sites-available/anic-portal
# Заменить YOUR_DOMAIN.RU → реальный домен
certbot --nginx -d your-domain.ru

# 3. Переменные
cp .env.production.example /var/www/anic-portal/.env.local
# Заполнить DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL
# Опционально: MEILISEARCH_HOST, DEEPSEEK_API_KEY, SMTP_HOST

# 4. Каждый деплой
bash scripts/deploy.sh

# 5. Первичная индексация поиска (после деплоя)
pnpm meili:reindex

# 6. Проверка
curl https://your-domain.ru/api/health
```

---

## Что осталось (post-MVP)

### Ждёт заказчика
- [ ] VPS + DNS → деплой (скрипты готовы)
- [ ] Доступ к WordPress → миграция контента (`scripts/migrate-wp.ts` нужно написать)
- [ ] Логотип + брендбук → Figma-дизайн

### Можно сделать без заказчика
- [ ] Кросс-постинг Дзен/ОК/MAX (заглушки есть, env готов)
- [ ] Страница `/search` на публичном сайте
- [ ] Интеграция `AskAI` виджета в нужные страницы

---

## Что сделано (полный список)

### Фазы 0–3 (MVP)
- [x] БД: 13 таблиц, Drizzle ORM, seed
- [x] Auth: NextAuth v5, Credentials, JWT, middleware
- [x] CMS: все CRUD (новости, страницы, БЗ, команда, подразделения, проекты, публикации, файлы, настройки)
- [x] WYSIWYG: Tiptap v3 + server-side рендер
- [x] Публичный сайт: главная, новости, БЗ, исследования, подразделения, контакты
- [x] Кросс-постинг: Telegram + VK (рабочие), Дзен/ОК/MAX (заглушки)
- [x] API v1: stats, departments, knowledge, search, ai/query
- [x] Healthcheck, slug-генерация, форматирование дат

### Post-MVP #1 — Форма обратной связи
- [x] `/contacts` → форма с nodemailer (SMTP)
- [x] Rate limit 3 письма/час с IP

### Post-MVP #2 — Динамические страницы `/[slug]`
- [x] `src/app/(public)/[slug]/page.tsx`
- [x] `generateStaticParams` + `generateMetadata` (seoTitle/seoDescription)
- [x] ISR 300s, arctic-стиль, renderTiptap

### Post-MVP #3 — OG-изображения
- [x] `src/lib/utils/og-font.ts` — Google Fonts text-subsetting (кириллица)
- [x] 4 файла `opengraph-image.tsx` (сайт, новость, БЗ, страница)
- [x] Размер 1200×630, цветные бэджи по типу контента

### Post-MVP #4 — Meilisearch
- [x] `src/lib/search/meili.ts` — клиент, единый индекс `site_content`
- [x] `scripts/meili-reindex.ts` — полная переиндексация
- [x] Auto-upsert/delete при publish/unpublish/delete (news + knowledge)
- [x] Fallback на DB ilike если Meilisearch недоступен
- [x] `pnpm meili:reindex` скрипт

### Post-MVP #5 — DeepSeek ИИ-ответчик
- [x] `src/lib/ai/deepseek.ts` — нативный fetch, без зависимостей
- [x] `/api/v1/ai/query` — полноценный RAG (Meilisearch → prompt → DeepSeek)
- [x] `src/components/public/AskAI.tsx` — клиентский виджет
- [x] Rate limit 5 req/min, graceful degradation

### Post-MVP #6 — Структурированное логирование
- [x] `src/lib/logger.ts` — JSON в prod, цветной консоль в dev
- [x] `src/instrumentation.ts` — лог конфигурации при старте сервера
- [x] Все `console.error/warn` заменены на `logger.*` в ключевых файлах

---

## Статус на 2026-03-01

```
pnpm tsc --noEmit → 0 ошибок ✅
Фазы 0, 1, 2, 3 (MVP) → выполнены ✅
Post-MVP #1–#6 → выполнены ✅
MVP + поиск + ИИ + логирование готовы к деплою ✅
```
