-- Manual display order for /achievements (set via drag-and-drop in /admin). NULL = fall back to date order.
ALTER TABLE "achievements" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER;
