CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" varchar(20) DEFAULT 'bug' NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"priority" varchar(10) DEFAULT 'medium' NOT NULL,
	"created_by" integer,
	"admin_comment" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "source_url" varchar(500);--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_source_url_unique" UNIQUE("source_url");