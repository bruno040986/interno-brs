-- Migração: Criação da tabela assinafy_config
-- Data: 2026-05-20

CREATE TABLE IF NOT EXISTS assinafy_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insere um registro padrão vazio se não existir
INSERT INTO assinafy_config (api_key, is_active)
SELECT '', false
WHERE NOT EXISTS (SELECT 1 FROM assinafy_config);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE TRIGGER set_timestamp_assinafy_config
BEFORE UPDATE ON assinafy_config
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
