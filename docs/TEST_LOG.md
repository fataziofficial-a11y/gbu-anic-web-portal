# Лог тестирования — Веб-портал ГБУ «АНИЦ»

> Дата: 2026-03-25
> Инструмент: Playwright (Chromium headless) + Python
> Скрипт: `scripts/test_runner.py`
> Прогонов: 10
> Всего проверок: **71** | ✅ Прошло: **71** | ❌ Ошибок: **0** | Успешность: **100%**

---

## Сводка по прогонам

| # | Описание | Статус |
|---|----------|--------|
| 1 | Публичные страницы — HTTP-статусы и рендер | ✅ 11/11 |
| 2 | Навигация — header, footer, logo, ссылки | ✅ 4/4 |
| 3 | Новости — список, фильтры по категориям, открытие статьи | ✅ 4/4 |
| 4 | API endpoints (health, v1, CRUD, search) | ✅ 7/7 |
| 5 | CMS — страница логина, валидация, вход | ✅ 6/6 |
| 6 | CMS — дашборд, sidebar (все 7 ссылок) | ✅ 8/8 |
| 7 | CMS — форма новости (Tiptap, поля, кнопка) | ✅ 6/6 |
| 8 | CMS — обход всех 12 разделов | ✅ 12/12 |
| 9 | Форма обратной связи — поля, валидация, отправка | ✅ 7/7 |
| 10 | Поиск, документы, robots.txt, sitemap, OG-теги | ✅ 6/6 |

---

## Реальные баги, найденные и исправленные

### 🔴 БАГ 1: PostgreSQL — переполнение пула соединений

**Проявление:** Все страницы и API возвращают HTTP 500, `/api/health` → `db: disconnected`.
В логах PostgreSQL: `FATAL: sorry, too many clients already`.

**Причина:** `src/lib/db/index.ts` создавал новый `postgres()` клиент без ограничения `max`
и без сохранения в глобальной переменной. В dev-режиме Next.js при каждом HMR-обновлении
модуль пересоздавался, открывая новые соединения. PostgreSQL исчерпывал лимит (~100 по умолчанию).

**Исправление:** Добавлен глобальный синглтон + `max: 10`:

```typescript
// БЫЛО:
const queryClient = postgres(connectionString);

// СТАЛО:
declare global { var __pgClient: postgres.Sql | undefined; }
const queryClient = global.__pgClient ?? postgres(connectionString, {
  max: 10, idle_timeout: 30, connect_timeout: 10,
});
if (process.env.NODE_ENV !== "production") global.__pgClient = queryClient;
```

**Файл:** `src/lib/db/index.ts` | **Статус:** ✅ Исправлено

---

### 🟡 Наблюдение 2: Отсутствие `.env.local`

**Проявление:** При первом запуске dev-сервера все страницы возвращают 500,
в логах `DATABASE_URL is not set`.

**Причина:** `.env.local` не был создан (разработка велась на Windows, файл не попал в git, что корректно).

**Решение:** Создан `.env.local` с параметрами из `HANDOFF.md`. Для нового dev-окружения:
```
DATABASE_URL=postgresql://postgres:12345678@localhost:5432/anic_portal
AUTH_SECRET=<random 32+ chars>
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
```

**Статус:** ✅ Задокументировано (`.env.local` создан)

---

### 🟡 Наблюдение 3: Meilisearch не запущен в dev

**Проявление:** В логах `MeiliSearchRequestError`. Поиск работает через fallback на DB ILIKE.

**Статус:** ✅ Не критично — fallback корректен. Для prod: `docker compose up -d meilisearch`.

---

## Что проверено и работает ✅

### Публичный сайт
- Все 11 страниц рендерятся без ошибок: `/`, `/about`, `/news`, `/research`, `/knowledge-base`, `/documents`, `/media`, `/partners`, `/procurement`, `/contacts`, `/education`
- Навигация: header, footer, logo→главная, ссылка →новости
- Страница новостей: список, фильтрация по 3 категориям, открытие статьи («Открытие новой лаборатории биогеохимии»)
- Страница документов: 4 PDF-ссылки из `public/documents/`
- Форма обратной связи: все 4 поля (Имя, Email, Тема, Сообщение), HTML5-валидация, успешная отправка
- SEO: `robots.txt` корректный, `sitemap.xml` корректный, `og:title`, `og:description` заданы

### API
- `/api/health` — `db: connected`, latency < 20ms
- `/api/v1/stats`, `/api/v1/departments`, `/api/v1/knowledge` — 401 (защищены, ожидаемо)
- `/api/news`, `/api/pages` — 200 OK
- `/api/search?q=арктический` — 200 JSON

### CMS-панель
- Редирект незалогиненных → `/admin/login`
- Форма логина: email, password, submit — все найдены; неверные данные отклоняются
- Успешный вход: `admin@anic.ru / admin123`
- Dashboard загружается после входа
- Sidebar: `/admin/news`, `/admin/pages`, `/admin/knowledge`, `/admin/files`, `/admin/team`, `/admin/departments`, `/admin/settings` — все ссылки найдены
- Форма создания новости: поле «Заголовок» (`id="title"`), редактор Tiptap (`.ProseMirror`), кнопка «Опубликовать»
- Все 12 разделов CMS доступны без ошибок: Страницы, База знаний, Команда, Подразделения, Проекты, Публикации, Партнёры, Закупки, Медиа, Кросс-постинг, Файлы, Настройки

---

## Известные ограничения (не баги)

| Пункт | Описание |
|-------|----------|
| Meilisearch | Не запущен в dev; fallback на PostgreSQL ILIKE работает |
| SMTP | Не настроен в `.env.local`; форма возвращает `{ ok: true, stub: true }` |
| API v1 protected | `/api/v1/*` требует Bearer токен (401) — ожидаемо |
| dev HMR lazy compile | Первая компиляция нового route ~3–18s в dev-режиме, в production — 0ms |

---

## Файлы

- **Тест-скрипт:** `scripts/test_runner.py` (Playwright, Python)
- **Исправленный файл:** `src/lib/db/index.ts` (singleton + max connections)
- **Env-шаблон:** `HANDOFF.md` → раздел «База данных»
