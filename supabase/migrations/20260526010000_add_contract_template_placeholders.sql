-- Add placeholder metadata to contract templates
-- Enables label/id/required mapping in Process Builder

ALTER TABLE IF EXISTS contract_templates
  ADD COLUMN IF NOT EXISTS placeholders JSONB NOT NULL DEFAULT '[]'::jsonb;
