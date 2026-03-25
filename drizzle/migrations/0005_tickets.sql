CREATE TABLE "tickets" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text NOT NULL,
  "type" varchar(20) NOT NULL DEFAULT 'bug',
  "status" varchar(20) NOT NULL DEFAULT 'new',
  "priority" varchar(10) NOT NULL DEFAULT 'medium',
  "created_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "admin_comment" text,
  "resolved_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
