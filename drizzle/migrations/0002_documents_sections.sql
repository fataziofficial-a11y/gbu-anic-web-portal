ALTER TABLE "documents" ADD COLUMN "section" varchar(255) DEFAULT 'Прочее';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "section_order" integer DEFAULT 0;
