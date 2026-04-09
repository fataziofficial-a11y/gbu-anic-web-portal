ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "type" varchar(30) DEFAULT 'project';
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "lead" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "consultant" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "partner_org" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "partners_list" jsonb DEFAULT '[]';
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "duration" varchar(255);
