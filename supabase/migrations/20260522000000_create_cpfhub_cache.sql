-- Migração: Cache/Histórico de consultas CPFHub
-- Data: 2026-05-22

CREATE TABLE IF NOT EXISTS cpfhub_cache (
  cpf TEXT PRIMARY KEY,
  success BOOLEAN NOT NULL DEFAULT false,
  response JSONB,
  last_error JSONB,
  cached_until TIMESTAMP WITH TIME ZONE,
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para atualizar updated_at automaticamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_timestamp_cpfhub_cache'
  ) THEN
    CREATE TRIGGER set_timestamp_cpfhub_cache
    BEFORE UPDATE ON cpfhub_cache
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END $$;

