CREATE TABLE IF NOT EXISTS "news_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(100) UNIQUE NOT NULL,
  "slug" varchar(100) UNIQUE NOT NULL,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);

-- Заполняем существующими категориями из hardcoded списка
INSERT INTO "news_categories" ("name", "slug", "sort_order") VALUES
  ('Наука',                       'nauka',                         1),
  ('Экспедиции',                  'ekspedicii',                    2),
  ('Инфраструктура',              'infrastruktura',                3),
  ('Финансирование',              'finansirovanie',                4),
  ('Мероприятия',                 'meropriyatiya',                 5),
  ('Публикации',                  'publikacii',                    6),
  ('Международное сотрудничество','mezhdunarodnoe-sotrudnichestvo', 7)
ON CONFLICT DO NOTHING;
