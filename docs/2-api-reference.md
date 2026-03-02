# API Reference — ГБУ АНИЦ

## Публичный REST API v1

Base URL: `https://your-domain.ru/api/v1`

### Аутентификация

```
Authorization: Bearer <API_SECRET_KEY>
```

Или в query string: `?api_key=<key>`

Если переменная `API_SECRET_KEY` не задана — API открыт (dev-режим).

---

### GET /api/v1/stats

Агрегированная статистика портала.

**Ответ:**
```json
{
  "data": {
    "news": 42,
    "team": 18,
    "departments": 4,
    "projects": { "active": 3, "total": 12 },
    "publications": 87,
    "knowledgeBase": 35
  },
  "generatedAt": "2026-03-01T10:00:00.000Z"
}
```

---

### GET /api/v1/departments

Список научных подразделений.

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Лаборатория климатологии",
      "slug": "klimatologiya",
      "description": "...",
      "head": { "name": "Иванов И.И.", "position": "Заведующий", "email": "..." }
    }
  ]
}
```

---

### GET /api/v1/knowledge

Материалы базы знаний.

**Query params:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| q | string | Поиск по заголовку |
| category | string | Slug категории |
| department | number | ID подразделения |
| limit | number | Макс. записей (default 20, max 100) |
| offset | number | Смещение |

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Климатические изменения Якутии",
      "slug": "klimaticheskie-izmeneniya-yakutii",
      "tags": ["климат", "арктика"],
      "publishedAt": "2026-02-10T00:00:00.000Z",
      "category": { "name": "Климатология", "slug": "klimatologiya" },
      "department": { "name": "Лаборатория климатологии" }
    }
  ],
  "meta": { "limit": 20, "offset": 0, "count": 1 }
}
```

---

### GET /api/v1/search

Полнотекстовый поиск.

**Query params:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| q | string | Поисковый запрос (≥2 символа, обязательный) |
| type | string | Фильтр: `news` / `knowledge` / `pages` |
| limit | number | Макс. результатов (default 20, max 50) |

**Ответ:**
```json
{
  "data": [
    { "type": "news", "id": 5, "title": "...", "slug": "...", "excerpt": "..." },
    { "type": "knowledge", "id": 2, "title": "...", "slug": "..." }
  ],
  "meta": { "q": "арктика", "count": 2 }
}
```

---

### POST /api/v1/ai/query

Вопрос к ИИ-помощнику по базе знаний (в разработке).

**Тело запроса:**
```json
{ "question": "Как изменился климат Якутии за 50 лет?" }
```

**Ответ:**
```json
{
  "answer": "...",
  "sources": [{ "slug": "...", "title": "..." }],
  "status": "stub"
}
```

---

## Внутренний API (требует авторизации сессии CMS)

### Новости

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/news | Список новостей (пагинация, фильтры) |
| POST | /api/news | Создать новость |
| GET | /api/news/:id | Получить новость |
| PATCH | /api/news/:id | Обновить новость |
| DELETE | /api/news/:id | Удалить новость |
| POST | /api/news/:id/publish | Опубликовать |

### Аналогичная структура для:
- `/api/pages` — страницы
- `/api/knowledge` — база знаний
- `/api/team` — команда
- `/api/departments` — подразделения
- `/api/projects` — проекты
- `/api/publications` — публикации

### Файлы

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/files | Список файлов (фильтр по folder) |
| POST | /api/files | Загрузить файл (multipart/form-data) |
| DELETE | /api/files/:id | Удалить файл |

### Настройки

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/settings | Получить все настройки (map + items) |
| PUT | /api/settings | Сохранить настройки (Record<key, value>) |

### Кросс-постинг

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/crosspost | Лог публикаций |
| POST | /api/crosspost | Опубликовать в соцсеть |

### Служебные

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/search | Внутренний поиск (q, type) |
| GET | /api/health | Healthcheck + latencyMs |

## Коды ошибок

| Код | Значение |
|-----|----------|
| 400 | Ошибка валидации |
| 401 | Не авторизован |
| 403 | Нет прав |
| 404 | Не найдено |
| 500 | Внутренняя ошибка |

Формат ошибки: `{ "error": "Описание" }`
