-- Migration: Add slug + config to partner_forms (schema builder v2 support)
-- Date: 2026-05-20

ALTER TABLE partner_forms
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Keep slug unique when set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'partner_forms_slug_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX partner_forms_slug_unique_idx ON partner_forms (slug) WHERE slug IS NOT NULL AND slug <> '';
  END IF;
END $$;

ALTER TABLE partner_forms
  ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;

