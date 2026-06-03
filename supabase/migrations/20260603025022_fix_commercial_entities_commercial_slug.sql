-- Garante a coluna usada pelo Cartão Virtual sem alterar dados existentes.

ALTER TABLE commercial_entities
  ADD COLUMN IF NOT EXISTS commercial_slug TEXT;

-- Mantém unicidade apenas para slugs realmente preenchidos.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'commercial_entities_commercial_slug_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX commercial_entities_commercial_slug_unique_idx
      ON commercial_entities (commercial_slug)
      WHERE commercial_slug IS NOT NULL AND commercial_slug <> '';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
