CREATE TABLE "news_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "news_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "news_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "section" varchar(255) DEFAULT 'Прочее';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "section_order" integer DEFAULT 0;