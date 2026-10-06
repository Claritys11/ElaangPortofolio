-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "writeups" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "title" TEXT,
    "competition" TEXT,
    "category" TEXT,
    "difficulty" TEXT,
    "date" TIMESTAMPTZ(3),
    "summary" TEXT,
    "content" TEXT,
    "flag" TEXT,
    "tags_json" JSONB NOT NULL DEFAULT '[]',
    "attachments_json" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "writeups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "project_url" TEXT,
    "category" TEXT,
    "tags_json" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "issuer" TEXT,
    "platform" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "date" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secure_messages" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "username" TEXT,
    "source" TEXT,

    CONSTRAINT "secure_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "accessed_at" TIMESTAMPTZ(3) NOT NULL,
    "access_successful" BOOLEAN NOT NULL,
    "ip" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_settings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "display_name" TEXT,
    "alias" TEXT,
    "navbar_brand_mode" TEXT NOT NULL DEFAULT 'default',
    "navbar_brand_name" TEXT,
    "email" TEXT,
    "website_url" TEXT,
    "github_url" TEXT,
    "instagram_url" TEXT,
    "profile_image_url" TEXT,
    "about_text" TEXT,
    "philosophy_text" TEXT,
    "technical_arsenal_json" JSONB NOT NULL DEFAULT '[]',
    "professional_journey_json" JSONB NOT NULL DEFAULT '[]',
    "education_history_json" JSONB NOT NULL DEFAULT '[]',
    "seo_settings_json" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "profile_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "writeups_created_at_idx" ON "writeups"("created_at" DESC);
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at" DESC);
CREATE INDEX "achievements_created_at_idx" ON "achievements"("created_at" DESC);
CREATE INDEX "secure_messages_created_at_idx" ON "secure_messages"("created_at" DESC);
CREATE INDEX "access_logs_accessed_at_idx" ON "access_logs"("accessed_at" DESC);

-- Prisma schema DSL cannot express this partial unique index.
CREATE UNIQUE INDEX "idx_writeups_slug" ON "writeups"("slug") WHERE "slug" IS NOT NULL;
