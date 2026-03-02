# Архитектура системы — ГБУ АНИЦ Веб-портал

## Технологический стек

| Компонент | Технология | Версия |
|-----------|-----------|--------|
| Фреймворк | Next.js (App Router) | 16+ |
| Язык | TypeScript | 5+ |
| Стилизация | Tailwind CSS + shadcn/ui | v4 |
| ORM | Drizzle ORM | latest |
| База данных | PostgreSQL | 16 |
| Аутентификация | NextAuth.js | v5 (beta) |
| WYSIWYG | Tiptap (ProseMirror) | v3 |
| Поиск | In-house (ilike) / Meilisearch (prod) | — |

## Структура маршрутов

```
/ (app/page.tsx)                ← Главная страница
(public)/                       ← Публичный сайт
  news/                         ← Лента новостей + поиск
  news/[slug]/                  ← Детальная новость (ISR 300s)
  about/                        ← О центре (ISR 1h)
  contacts/                     ← Контакты (ISR 24h)
  research/                     ← Проекты + публикации (ISR 5m)
  research/departments/[slug]/  ← Страница подразделения (ISR 1h)
  knowledge-base/               ← Список материалов БЗ (ISR 1m)
  knowledge-base/[slug]/        ← Детальный материал (ISR 5m)

(admin)/admin/                  ← CMS (защищена JWT)
  login/                        ← Вход
  (dashboard)                   ← Дашборд
  news/                         ← Управление новостями
  pages/                        ← Страницы
  knowledge/                    ← База знаний
  team/                         ← Сотрудники
  departments/                  ← Подразделения
  projects/                     ← Проекты
  publications/                 ← Публикации
  files/                        ← Файловый менеджер
  crosspost/                    ← Лог кросс-постинга
  settings/                     ← Настройки сайта

api/
  auth/[...nextauth]/           ← NextAuth.js
  news/ [id]/                   ← CRUD новостей
  pages/ [id]/                  ← CRUD страниц
  knowledge/ [id]/              ← CRUD базы знаний
  team/ [id]/                   ← CRUD команды
  departments/ [id]/            ← CRUD подразделений
  projects/ [id]/               ← CRUD проектов
  publications/ [id]/           ← CRUD публикаций
  files/ [id]/                  ← Загрузка и удаление файлов
  crosspost/                    ← Кросс-постинг
  settings/                     ← Настройки
  search/                       ← Внутренний поиск
  health/                       ← Healthcheck
  v1/                           ← Публичный REST API
    knowledge/                  ← БЗ для внешних систем
    departments/                ← Подразделения
    stats/                      ← Статистика (кэш 5m)
    search/                     ← Поиск
    ai/query/                   ← ИИ-заглушка (POST)
```

## База данных (13 таблиц)

```
users           — пользователи CMS (admin, editor, author)
news            — новости (title, slug, content JSONB, status, tags[])
pages           — статические страницы (иерархия через parent_id)
departments     — научные подразделения
team_members    — сотрудники (bio, photo, department)
projects        — исследовательские проекты (status: active/planned/completed)
publications    — научные публикации (DOI, authors, journal)
knowledge_items — материалы БЗ (content JSONB, tags[], category)
kb_categories   — категории БЗ (иерархия)
files           — загруженные файлы (media/documents/knowledge)
crosspost_log   — история кросс-постинга
settings        — key-value настройки сайта
api_logs        — лог API запросов
```

## Аутентификация

- NextAuth v5, стратегия JWT
- Credentials provider (email + bcrypt)
- Roles: `admin` (всё), `editor` (CRUD без настроек), `author` (черновики)
- Middleware (`src/proxy.ts`) защищает `/admin/*`

## Кэширование

| Страница | Стратегия | TTL |
|----------|-----------|-----|
| Главная | ISR | 60s |
| Новости список | ISR | 60s |
| Новость [slug] | ISR + generateStaticParams | 300s |
| О центре | ISR | 3600s |
| Исследования | ISR | 300s |
| Контакты | ISR | 86400s |
| БЗ список | ISR | 60s |
| БЗ [slug] | ISR + generateStaticParams | 300s |
| Подразделение | ISR + generateStaticParams | 3600s |
| Admin | force-dynamic | — |

## Файловая система

```
public/uploads/
  media/        ← изображения для новостей и сотрудников
  documents/    ← документы для загрузки
  knowledge/    ← файлы базы знаний
```

Загрузка: multipart → UUID-имя → `public/uploads/{folder}/{uuid}.{ext}`
URL: `/uploads/{folder}/{uuid}.{ext}` (Nginx отдаёт напрямую на prod)
