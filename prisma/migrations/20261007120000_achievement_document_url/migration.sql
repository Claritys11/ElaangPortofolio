-- Original certificate document (e.g. PDF) when image_url holds its rendered preview. NULL = image only.
ALTER TABLE "achievements" ADD COLUMN IF NOT EXISTS "document_url" TEXT;
