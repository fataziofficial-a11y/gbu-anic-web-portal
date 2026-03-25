# План реализации — Договор № 2
## ГБУ АНИЦ × АСТРА ГРУПП

> Это рабочий план для нас двоих: что делаем, в каком порядке, как устроено внутри.
> Языковая модель для ИИ-ассистента — решается отдельно, в плане обозначена как `AI_PROVIDER`.

---

## Что уже есть (не трогаем без причины)

| Область | Статус |
|---|---|
| Next.js App Router, TypeScript, Tailwind, shadcn/ui | ✅ работает |
| PostgreSQL + Drizzle ORM | ✅ работает |
| Meilisearch + `src/lib/search/meili.ts` | ✅ работает |
| NextAuth (вход в CMS) | ✅ работает |
| Кросс-постинг: `src/lib/crosspost/` (5 модулей) | ✅ есть, нужны боевые ключи |
| Публичный сайт: все основные страницы | ✅ есть |
| CMS-панель: 12 разделов | ✅ есть |
| AI-заглушка: `src/lib/ai/deepseek.ts` | ⚠️ замените на `AI_PROVIDER` |
| SEO (sitemap, OG, robots) | ✅ есть |
| VPS: PM2, Nginx, PostgreSQL, Meilisearch | ✅ работает |

---

---

# ЭТАП 1 — Аналитика, инфраструктура, контент

---

## Блок А. Веб-аналитика

### А1. Яндекс.Метрика

**Файл:** `src/components/analytics/YandexMetrika.tsx`

```tsx
// Компонент — клиентский, вставляем в src/app/(public)/layout.tsx
'use client'
import Script from 'next/script'

export function YandexMetrika({ id }: { id: string }) {
  return (
    <Script id="ym" strategy="afterInteractive">
      {`(function(m,e,t,r,i,k,a){...})(window, ...)`}
    </Script>
  )
}
```

- Счётчик добавляем через `NEXT_PUBLIC_YM_ID` в `.env.local`
- Цели (goals) настраиваем в интерфейсе Метрики вручную — не код
- Вебвизор включаем в настройках счётчика
- Фильтр внутреннего трафика: IP АНИЦ + IP Исполнителя — в настройках счётчика

### А2. Google Analytics 4

**Файл:** `src/components/analytics/GoogleAnalytics.tsx`

- Аналогичный паттерн: `NEXT_PUBLIC_GA_ID`
- Кастомные события `file_download`, `social_click` — добавляем `gtag('event', ...)` в обработчики кнопок скачивания и иконок соцсетей
- GA4 DebugView для проверки

### А3. JSON-LD разметка

**Файл:** `src/components/seo/JsonLd.tsx`

Добавляем на:
- Главную — `Organization` + `WebSite` (с `SearchAction`)
- Каждую новость — `NewsArticle`
- Страницу контактов — `LocalBusiness`

Вставляем через `<script type="application/ld+json">` в `<head>` каждой страницы.

### А4. Верификация в поисковиках

- Яндекс.Вебмастер: метатег `<meta name="yandex-verification" content="...">` в `layout.tsx`
- Google Search Console: файл `public/google<hash>.html` или метатег
- Оба — через переменные окружения: `NEXT_PUBLIC_YM_VERIFY`, `NEXT_PUBLIC_GSC_VERIFY`

---

## Блок Б. Кросс-постинг (боевые ключи)

Код уже есть в `src/lib/crosspost/`. Задача — получить реальные токены и проверить.

| Платформа | Что нужно от заказчика | Переменная .env.local |
|---|---|---|
| Telegram | Токен бота + chat_id канала | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| ВКонтакте | access_token сообщества | `VK_ACCESS_TOKEN`, `VK_GROUP_ID` |
| MAX | Токен приложения | `MAX_ACCESS_TOKEN` |
| Яндекс.Дзен | OAuth token | `DZEN_TOKEN` |
| Одноклассники | access_token + app_key | `OK_ACCESS_TOKEN`, `OK_APP_KEY` |

После получения ключей — тестовая публикация каждой новости на все 5 платформ.
Скриншоты результатов → в акт приёмки.

---

## Блок В. Инфраструктура

### В1. Резервное копирование БД

**Файл на сервере:** `~/scripts/backup.sh`

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M)
pg_dump $DATABASE_URL > ~/backups/anic_$DATE.sql
# Оставляем только 7 последних
ls -t ~/backups/*.sql | tail -n +8 | xargs rm -f
```

Cron (через `crontab -e` или PM2 ecosystem):
```
0 2 * * * /home/user/scripts/backup.sh
```

### В2. UptimeRobot

Регистрируем на uptimerobot.com (free), добавляем монитор на домен сайта.
E-mail уведомления → почта Заказчика и Исполнителя.

### В3. Оптимизация производительности

**Уже делаем в `/api/upload`:** конвертация в WebP через Sharp при загрузке.
Проверим, что это работает — если нет, добавим.

**Nginx** (`/etc/nginx/sites-available/anic`):
```nginx
# Gzip
gzip on;
gzip_types text/plain text/css application/javascript application/json image/svg+xml;

# Долгое кэширование статики
location /_next/static/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

**Lighthouse аудит:** запускаем через Chrome DevTools, фиксируем цифры, устраняем красные замечания.

---

## Блок Г. Наполнение контентом

> Ждём материалы от АНИЦ. Параллельно — делаем компоненты, которых не хватает.

### Г1. Форма обратной связи (нужно написать)

**Файлы:**
- `src/app/(public)/contacts/ContactForm.tsx` — клиентский компонент
- `src/app/api/contact/route.ts` — API route

```
Поля: имя, e-mail, тема, сообщение, файл (опционально)
Защита: honeypot-поле + rate limiting (5 отправок / IP / час, храним в Map с TTL)
Отправка: Nodemailer + SMTP (переменные SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
После отправки: toast + автоответное письмо на e-mail пользователя
```

### Г2. Lightbox для медиагалереи (нужно добавить)

Используем `yet-another-react-lightbox` или `react-photo-view` (лёгкий, без лишних зависимостей).
Добавляем в `src/app/(public)/media/` — открытие по клику на фото.

### Г3. Страница сотрудника (нужно проверить / доделать)

`src/app/(public)/team/[slug]/page.tsx` — детальная страница:
- Фото, ФИО, должность, учёная степень, e-mail
- Список публикаций (выборка из таблицы publications по author_id)
- Текущие проекты (выборка из таблицы projects)

### Г4. Фильтрация и экспорт публикаций

`src/app/(public)/research/publications/page.tsx`:
- Фильтры по году и подразделению — через URL search params (`?year=2024&dept=1`)
- Кнопка «Экспорт (ГОСТ)» → `/api/publications/export` → генерация `.txt` по шаблону ГОСТ Р 7.0.5

### Г5. Наполнение через CMS

Как только АНИЦ пришлёт материалы — вносим через существующие разделы CMS:
- Новости (15+ архивных)
- Сотрудники (10+ карточек с фото)
- Подразделения (5+)
- Проекты (5+)
- Публикации (10+)
- База знаний (10+ статей)
- Партнёры (5+)
- Медиа (3+ альбома, 5+ видео)

---

---

# ЭТАП 2 — Контент-стратегия, модуль соцсетей, ИИ

---

## Блок Д. Контент-стратегия

Это документарная работа, не код:

1. Собираем данные по текущим аккаунтам АНИЦ в соцсетях (вручную)
2. Я помогаю составить: портрет аудитории, рубрикатор, контент-план в виде таблицы (XLSX)
3. Готовим шаблоны постов (Figma / Canva — по договорённости с АНИЦ)
4. Финальный тест кросс-постинга с боевыми ключами (если не сделано в Этапе 1)

**Результат:** два файла — PDF-стратегия и XLSX контент-план. Я помогаю с текстом и структурой.

---

## Блок Е. Модуль соцсетей в CMS

Это полноценная фича. Делаем по шагам:

### Е1. Миграция БД

**Файл:** `drizzle/migrations/XXXX_social_posts.sql`

```sql
CREATE TABLE social_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platforms   TEXT[] NOT NULL,
  text        JSONB NOT NULL,           -- { telegram: "...", vk: "..." }
  image_url   TEXT,
  link        TEXT,
  status      TEXT NOT NULL DEFAULT 'draft',  -- draft|scheduled|published|error
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  post_ids    JSONB,                    -- { telegram: "123", vk: "456" }
  post_urls   JSONB,
  error_message TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scheduler_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at      TIMESTAMPTZ DEFAULT NOW(),
  processed   INT DEFAULT 0,
  errors      INT DEFAULT 0
);
```

Схема Drizzle: `src/lib/db/schema.ts` — добавляем `socialPosts` и `schedulerLog`.

### Е2. API routes

**Директория:** `src/app/api/social-posts/`

```
GET    /api/social-posts              — список (фильтры: platform, status, page)
POST   /api/social-posts              — создать пост
GET    /api/social-posts/[id]         — детали
PATCH  /api/social-posts/[id]         — обновить черновик
DELETE /api/social-posts/[id]         — удалить (только draft/error)
POST   /api/social-posts/[id]/send    — немедленная отправка
POST   /api/social-posts/[id]/retry   — повтор после ошибки
GET    /api/social-posts/stats        — счётчики по платформам
```

Каждый route — `route.ts` с `getServerSession` из NextAuth.

### Е3. Планировщик

**Файл:** `src/lib/social-scheduler.ts`

```ts
// Запускаем в src/app/api/health/route.ts (уже существует, вызывается PM2)
// Или через отдельный setInterval в корневом layout.tsx (server-side)

async function runScheduler() {
  const due = await db.query.socialPosts.findMany({
    where: and(
      eq(socialPosts.status, 'scheduled'),
      lte(socialPosts.scheduledAt, new Date())
    )
  })
  for (const post of due) {
    await sendSocialPost(post)  // вызывает существующие модули crosspost/
  }
}

setInterval(runScheduler, 60_000)
```

Важно: `setInterval` живёт пока живёт Node-процесс. PM2 restart его перезапустит — это нормально.

### Е4. Интерфейс CMS

**Страница:** `src/app/(admin)/admin/social/page.tsx`

Три вкладки (shadcn `<Tabs>`):
- **Лента** — `<DataTable>` с колонками: платформы, превью, статус, дата, действия
- **Создать пост** — `<SocialPostForm>`: чекбоксы платформ, textarea с счётчиком, загрузка фото, дата/время
- **Статистика** — 5 карточек (по платформе): всего / ок / ошибок / ожидает

Компоненты:
```
src/components/admin/social/SocialPostForm.tsx
src/components/admin/social/SocialPostTable.tsx
src/components/admin/social/SocialPostStats.tsx
src/components/admin/social/PlatformSelector.tsx
src/components/admin/social/CharCounter.tsx     — счётчик символов под каждую платформу
```

Добавляем «Соцсети» в `src/components/admin/Sidebar.tsx`.

---

## Блок Ж. ИИ-ассистент

> **Языковая модель (AI_PROVIDER) — TBD.** Весь код пишем через абстрактный интерфейс.
> Когда решим на совещании — вставляем конкретный SDK за 30 минут.

### Ж1. Абстракция AI провайдера

**Файл:** `src/lib/ai/provider.ts`

```ts
export interface AIProvider {
  chat(messages: ChatMessage[], systemPrompt: string): AsyncIterable<string>
  embed(text: string): Promise<number[]>
  embedBatch(texts: string[]): Promise<number[][]>
}

// Реализации подключаются через env: AI_PROVIDER=claude|openai|deepseek|...
export function getAIProvider(): AIProvider {
  switch (process.env.AI_PROVIDER) {
    case 'claude':   return new ClaudeProvider()
    case 'openai':   return new OpenAIProvider()
    default:         throw new Error('AI_PROVIDER not set')
  }
}
```

Каждая реализация в отдельном файле: `src/lib/ai/claude.ts`, `src/lib/ai/openai.ts` и т.д.
До совещания — пишем всё остальное, провайдер оставляем пустым или заглушкой.

### Ж2. Миграции БД для ИИ

```sql
-- Векторное хранилище (нужно: CREATE EXTENSION vector)
CREATE TABLE knowledge_vectors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,   -- news|knowledge|page|team|document
  content_id  UUID NOT NULL,
  chunk_index INT NOT NULL,
  chunk_text  TEXT NOT NULL,
  embedding   vector(1536),     -- размер зависит от провайдера эмбеддингов
  metadata    JSONB,            -- { title, url, published_at }
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON knowledge_vectors USING ivfflat (embedding vector_cosine_ops);

-- Сессии и сообщения
CREATE TABLE ai_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES ai_sessions(id),
  role       TEXT NOT NULL,  -- user|assistant
  content    TEXT NOT NULL,
  sources    JSONB,          -- [ { title, url } ]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Логирование расходов
CREATE TABLE ai_usage_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID REFERENCES ai_sessions(id),
  input_tokens   INT,
  output_tokens  INT,
  provider       TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Ручной FAQ
CREATE TABLE ai_faq (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question  TEXT NOT NULL,
  answer    TEXT NOT NULL,
  enabled   BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Установка pgvector на VPS:**
```bash
sudo apt install postgresql-16-pgvector
# В psql:
CREATE EXTENSION IF NOT EXISTS vector;
```

### Ж3. Конвейер индексации

**Файл:** `src/lib/ai/indexer.ts`

```ts
// Вызывается при сохранении/обновлении контента в CMS
export async function indexContent(item: {
  type: 'news' | 'knowledge' | 'page' | 'team' | 'document'
  id: string
  title: string
  text: string
  url: string
  publishedAt?: Date
}) {
  // 1. Разбить на чанки по ~512 токенов с перекрытием 50
  const chunks = splitIntoChunks(item.text, 512, 50)

  // 2. Получить эмбеддинги батчем
  const ai = getAIProvider()
  const embeddings = await ai.embedBatch(chunks)

  // 3. Удалить старые векторы для этого content_id
  await db.delete(knowledgeVectors).where(eq(knowledgeVectors.contentId, item.id))

  // 4. Сохранить новые
  await db.insert(knowledgeVectors).values(
    chunks.map((chunk, i) => ({
      contentType: item.type,
      contentId: item.id,
      chunkIndex: i,
      chunkText: chunk,
      embedding: embeddings[i],
      metadata: { title: item.title, url: item.url }
    }))
  )
}
```

Хук вызова: добавляем `await indexContent(...)` в API routes сохранения новостей, статей БЗ, страниц.

Команда ручной переиндексации:
```ts
// pnpm search:reindex — уже есть, расширяем
// Добавить: переиндексация knowledge_vectors
```

### Ж4. Гибридный поиск

**Файл:** `src/lib/ai/hybrid-search.ts`

```ts
export async function hybridSearch(query: string, limit = 10) {
  const ai = getAIProvider()

  // 1. Семантический поиск (pgvector)
  const queryEmbedding = await ai.embed(query)
  const vectorResults = await db.execute(sql`
    SELECT content_type, content_id, chunk_text, metadata,
           1 - (embedding <=> ${queryEmbedding}::vector) as score
    FROM knowledge_vectors
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 20
  `)

  // 2. Полнотекстовый поиск (Meilisearch — уже работает)
  const textResults = await meiliSearch(query, { limit: 20 })

  // 3. Объединить и ранжировать (RRF: Reciprocal Rank Fusion)
  return mergeAndRank(vectorResults, textResults, limit)
}
```

### Ж5. API чата (SSE стриминг)

**Файл:** `src/app/api/ai/chat/route.ts`

```ts
export async function POST(req: Request) {
  const { message, sessionId } = await req.json()

  // Rate limiting: Map<ip, {count, resetAt}>
  if (isRateLimited(req)) return Response.json({ error: 'Too many requests' }, { status: 429 })

  // FAQ проверка (точное/нечёткое совпадение)
  const faqAnswer = await checkFAQ(message)
  if (faqAnswer) return streamText(faqAnswer)

  // RAG: найти релевантные чанки
  const context = await hybridSearch(message, 5)

  // Получить историю сессии (последние 10 сообщений)
  const history = await getSessionHistory(sessionId, 10)

  // Стриминг ответа
  const ai = getAIProvider()
  const stream = ai.chat([...history, { role: 'user', content: message }], buildSystemPrompt(context))

  // Сохранить сообщение в БД и стримить клиенту
  return new Response(toSSEStream(stream, { sessionId, sources: context }), {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

### Ж6. Виджет на сайте

**Файлы:**
```
src/components/public/ai/ChatWidget.tsx       — плавающая кнопка + окно
src/components/public/ai/ChatWindow.tsx       — область диалога
src/components/public/ai/ChatMessage.tsx      — одно сообщение + источники
src/components/public/ai/ChatInput.tsx        — поле ввода + кнопка
```

Добавляем в `src/app/(public)/layout.tsx` — отображается на всём сайте.

Управление видимостью — через публичную настройку (`public_settings` таблица или env):
`AI_CHAT_ENABLED=true/false` — без перезапуска сервера.

### Ж7. Административный модуль ИИ

**Страница:** `src/app/(admin)/admin/ai/page.tsx`

Пять вкладок:
```
Вкладка          Компонент
─────────────────────────────────────────────────────────
История          /admin/ai/history  — таблица сессий → раскрытие диалога
Частые вопросы   /admin/ai/topics   — агрегация по ключевым словам, доля без ответа
База знаний      /admin/ai/index    — список проиндексированных записей + ручная переиндексация
Настройки        /admin/ai/settings — textarea системного промпта, on/off виджета
FAQ              /admin/ai/faq      — CRUD таблица ai_faq
```

Добавляем «ИИ-ассистент» в `src/components/admin/Sidebar.tsx`.

---

## Порядок реализации (приоритет)

```
ЭТАП 1 — начинаем сразу:

  [1] А1-А4   Яндекс.Метрика + GA4 + JSON-LD + верификация       ~2-3 ч
  [2] В1-В2   Backup cron + UptimeRobot                           ~1 ч (на сервере)
  [3] В3       Nginx gzip + кэш + Lighthouse аудит                ~2 ч
  [4] Б        Боевые ключи кросс-постинга (ждём токены от АНИЦ)  ~1 ч
  [5] Г1       Форма обратной связи (API + UI)                    ~3-4 ч
  [6] Г2       Lightbox для медиагалереи                          ~1-2 ч
  [7] Г3-Г4    Страница сотрудника + фильтр публикаций + экспорт  ~3-4 ч
  [8] Г5       Наполнение контентом (ждём материалы от АНИЦ)      параллельно

ЭТАП 2 — после акта Этапа 1:

  [9] Д        Контент-стратегия (документ + XLSX)                не код
  [10] Е1-Е2  Миграция social_posts + API routes                 ~3-4 ч
  [11] Е3      Планировщик публикаций                             ~2 ч
  [12] Е4      CMS-интерфейс соцсетей                            ~4-5 ч
  [13] Ж2      Миграции БД для ИИ + pgvector на VPS              ~2 ч
  [14] Ж1      Абстракция AI_PROVIDER                            ~1-2 ч
      ↑ здесь вставляем выбранного провайдера после совещания
  [15] Ж3      Конвейер индексации (чанки + эмбеддинги)          ~3-4 ч
  [16] Ж4      Гибридный поиск (pgvector + Meilisearch)          ~3-4 ч
  [17] Ж5      API /api/ai/chat с SSE-стримингом                 ~4-5 ч
  [18] Ж6      Виджет чата на публичном сайте                    ~4-5 ч
  [19] Ж7      Административный модуль ИИ в CMS                  ~4-5 ч
  [20] Финал   Тестирование, нагрузка, документация              ~3-4 ч
```

---

## Что нужно от АНИЦ (блокирующие зависимости)

| Что | Для чего | Когда нужно |
|---|---|---|
| API-токены 5 платформ | Блок Б (кросс-постинг) | Начало Этапа 1 |
| Реквизиты организации | Страница «Контакты» | Начало Этапа 1 |
| SMTP-данные для почты | Форма обратной связи | Начало Этапа 1 |
| Тексты, фото, видео | Наполнение разделов (Г5) | В течение Этапа 1 |
| Аккаунты в соцсетях | Контент-стратегия (Блок Д) | Начало Этапа 2 |
| Решение по языковой модели | ИИ-ассистент (Ж1) | Совещание |

---

## Точки риска

| Риск | Вероятность | Смягчение |
|---|---|---|
| АНИЦ задерживает контент | Высокая | Делаем компоненты сразу, контент вносим позже |
| API платформ меняют формат | Средняя | Каждый модуль crosspost/ независим, правим точечно |
| pgvector требует прав на VPS | Низкая | `sudo apt install postgresql-16-pgvector` — стандартный пакет |
| Выбранная языковая модель дорогая | Средняя | Кэширование повторных запросов + rate limiting |
| Lighthouse < 90 после оптимизации | Низкая | Sharp + gzip + next/font решают большинство проблем |
