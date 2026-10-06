-- Present in production (created outside migrations); create on fresh databases.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_writeups_slug" ON "writeups"("slug") WHERE "slug" IS NOT NULL;
