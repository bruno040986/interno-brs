-- Migration: Company Profiles (Cadastro da Empresa)
-- Date: 2026-05-26

CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  cnpj TEXT,

  company_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  partner_primary_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  partner_secondary_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  witness_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS company_profiles_is_active_idx ON company_profiles(is_active);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'company_profiles_cnpj_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX company_profiles_cnpj_unique_idx
      ON company_profiles (cnpj)
      WHERE cnpj IS NOT NULL AND cnpj <> '';
  END IF;
END $$;

ALTER TABLE IF EXISTS process_models
  ADD COLUMN IF NOT EXISTS company_profile_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS process_models_company_profile_id_idx
  ON process_models(company_profile_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_company_profiles') THEN
      CREATE TRIGGER set_timestamp_company_profiles
      BEFORE UPDATE ON company_profiles
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
  END IF;
END $$;

