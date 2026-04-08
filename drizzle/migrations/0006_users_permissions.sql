ALTER TABLE "users" ALTER COLUMN "permissions" TYPE jsonb USING CASE WHEN permissions IS NULL THEN NULL ELSE to_jsonb(permissions) END;
