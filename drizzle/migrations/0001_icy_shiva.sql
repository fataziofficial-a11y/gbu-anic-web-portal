CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(1000) NOT NULL,
	"doc_type" varchar(50) DEFAULT 'normative',
	"file_id" integer,
	"file_url" varchar(1000),
	"issued_at" date,
	"status" varchar(20) DEFAULT 'active',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"type" varchar(20) DEFAULT 'video' NOT NULL,
	"video_url" varchar(1000),
	"thumbnail_id" integer,
	"event_date" date,
	"sort_order" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'published',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_id" integer,
	"description" text,
	"services" text,
	"website_url" varchar(1000),
	"project_ids" jsonb DEFAULT '[]'::jsonb,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "procurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(1000) NOT NULL,
	"description" text,
	"eis_url" varchar(1000),
	"published_at" date,
	"deadline" date,
	"amount" varchar(255),
	"status" varchar(20) DEFAULT 'open',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_thumbnail_id_files_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_files_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;