CREATE TABLE "project_rubrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "project_rubrics_project_slug" UNIQUE("project_id","slug")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'author';--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "project_id" integer;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "rubric_id" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "type" varchar(30) DEFAULT 'project';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "lead" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "consultant" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "partner_org" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "partners_list" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "duration" varchar(255);--> statement-breakpoint
ALTER TABLE "project_rubrics" ADD CONSTRAINT "project_rubrics_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_rubric_id_project_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."project_rubrics"("id") ON DELETE set null ON UPDATE no action;