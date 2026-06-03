-- Garante que a tabela commercial_entities tenha as colunas esperadas pelo fluxo
-- comercial sem alterar ou apagar nenhum dado existente.

ALTER TABLE commercial_entities
  ADD COLUMN IF NOT EXISTS arw_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cadastral_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS documents_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contract_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS remuneration_variable_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS vehicle_rental_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS card_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS card_enabled BOOLEAN DEFAULT false;

-- Recarrega o schema do PostgREST para refletir a nova coluna imediatamente.
NOTIFY pgrst, 'reload schema';
