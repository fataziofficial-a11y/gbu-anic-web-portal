# ИИ-модуль — дорожная карта

## Текущее состояние

Заглушка: `POST /api/v1/ai/query` принимает вопрос и возвращает статус `"stub"`.

## Архитектура RAG (Retrieval-Augmented Generation)

```
Вопрос пользователя
       ↓
[Meilisearch / pgvector]  ← Поиск релевантных материалов БЗ
       ↓
    Контекст (top-5 документов)
       ↓
[Claude API / anthropic SDK]  ← Генерация ответа
       ↓
   Ответ + источники
```

## Шаги внедрения

### Шаг 1 — Meilisearch (поиск)

```bash
# Установка и запуск (уже в setup-vps.sh)
meilisearch.exe --master-key="dev-master-key"

# Индексация
pnpm tsx scripts/reindex.ts
```

```typescript
// src/lib/search/client.ts
import { MeiliSearch } from "meilisearch";
export const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY,
});
```

### Шаг 2 — pgvector (семантический поиск)

```sql
-- Добавить расширение
CREATE EXTENSION IF NOT EXISTS vector;

-- Добавить поле в knowledge_items
ALTER TABLE knowledge_items ADD COLUMN embedding vector(1536);

-- Индекс
CREATE INDEX ON knowledge_items USING ivfflat (embedding vector_cosine_ops);
```

Генерация embeddings: `text-embedding-3-small` (OpenAI) или `voyage-3` (Anthropic).

### Шаг 3 — Claude API (генерация)

```typescript
// src/app/api/v1/ai/query/route.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Поиск контекста в Meilisearch
const hits = await meili.index("knowledge").search(question, { limit: 5 });

// Генерация ответа
const message = await anthropic.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Контекст:\n${hits.hits.map(h => h.content).join("\n\n")}\n\nВопрос: ${question}`
  }]
});
```

### Шаг 4 — UI на публичном сайте

```
/knowledge-base/search — страница с поиском + ИИ-ответом
  ├── Поле ввода вопроса
  ├── Ответ Claude (стриминг через SSE)
  └── Источники (ссылки на статьи БЗ)
```

## Стоимость (ориентировочно)

| Сервис | Цена | Нагрузка ~100 запросов/день |
|--------|------|------------------------------|
| Claude claude-opus-4-6 | $15/MTok in, $75/MTok out | ~$3-5/мес |
| text-embedding-3-small | $0.02/MTok | <$1/мес |
| Meilisearch | Бесплатно (self-hosted) | $0 |

## Переменные окружения (добавить в .env)

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...        # для embeddings (опционально)
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=dev-master-key
```
