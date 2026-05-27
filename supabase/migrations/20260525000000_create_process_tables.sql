-- Migration: Create process/workflow tables for SCP
-- Date: 2026-05-25

-- =========================================================================
-- 1. Process Models (definition)
-- =========================================================================

CREATE TABLE IF NOT EXISTS process_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'generic',
  is_active BOOLEAN DEFAULT true NOT NULL,

  -- Public entrypoint for this process (instead of partner_forms.slug)
  is_public BOOLEAN DEFAULT false NOT NULL,
  public_slug TEXT,

  -- Form used for the public step (optional; can be internal-only processes)
  form_id UUID REFERENCES partner_forms(id) ON DELETE SET NULL,

  -- JSON configs: identifier source, dedupe, branding overrides, etc
  entry_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Keep public_slug unique when set for public processes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'process_models_public_slug_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX process_models_public_slug_unique_idx
      ON process_models (public_slug)
      WHERE public_slug IS NOT NULL AND public_slug <> '';
  END IF;
END $$;

-- =========================================================================
-- 2. Stage Models (kanban columns / steps)
-- =========================================================================

CREATE TABLE IF NOT EXISTS process_stage_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES process_models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  bg TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS process_stage_models_process_id_idx ON process_stage_models(process_id);

-- =========================================================================
-- 3. Process Instances (cards)
-- =========================================================================

CREATE TABLE IF NOT EXISTS process_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES process_models(id) ON DELETE RESTRICT,
  partner_id UUID REFERENCES agentes_parceiros(id) ON DELETE SET NULL,
  identifier_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed', 'canceled')),
  current_stage_id UUID REFERENCES process_stage_models(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS process_instances_process_id_idx ON process_instances(process_id);
CREATE INDEX IF NOT EXISTS process_instances_partner_id_idx ON process_instances(partner_id);
CREATE INDEX IF NOT EXISTS process_instances_identifier_idx ON process_instances(identifier_value);

-- Enforce dedupe for active instances (one active per identifier per process)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'process_instances_active_dedupe_idx'
  ) THEN
    CREATE UNIQUE INDEX process_instances_active_dedupe_idx
      ON process_instances(process_id, identifier_value)
      WHERE status = 'active';
  END IF;
END $$;

-- =========================================================================
-- 4. Form snapshots (public submission payload per instance)
-- =========================================================================

CREATE TABLE IF NOT EXISTS process_instance_form_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES process_instances(id) ON DELETE CASCADE,
  form_id UUID REFERENCES partner_forms(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS process_instance_form_snapshots_instance_id_idx ON process_instance_form_snapshots(instance_id);

-- =========================================================================
-- 5. Instance fields (backoffice/internal fields)
-- =========================================================================

CREATE TABLE IF NOT EXISTS process_instance_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES process_instances(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS process_instance_fields_instance_key_uniq
  ON process_instance_fields(instance_id, key);

-- =========================================================================
-- 6. Field validations (audit)
-- =========================================================================

CREATE TABLE IF NOT EXISTS process_instance_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES process_instances(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  note TEXT
);

CREATE INDEX IF NOT EXISTS process_instance_validations_instance_id_idx ON process_instance_validations(instance_id);

-- =========================================================================
-- 7. Events log
-- =========================================================================

CREATE TABLE IF NOT EXISTS process_instance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES process_instances(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS process_instance_events_instance_id_idx ON process_instance_events(instance_id);
CREATE INDEX IF NOT EXISTS process_instance_events_event_type_idx ON process_instance_events(event_type);

-- =========================================================================
-- 8. WhatsApp templates (separate from email_templates)
-- =========================================================================

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 9. Update timestamps triggers
-- =========================================================================

-- Reuse existing trigger_set_timestamp() if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_process_models') THEN
      CREATE TRIGGER set_timestamp_process_models
      BEFORE UPDATE ON process_models
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_process_stage_models') THEN
      CREATE TRIGGER set_timestamp_process_stage_models
      BEFORE UPDATE ON process_stage_models
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_process_instances') THEN
      CREATE TRIGGER set_timestamp_process_instances
      BEFORE UPDATE ON process_instances
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_process_instance_fields') THEN
      CREATE TRIGGER set_timestamp_process_instance_fields
      BEFORE UPDATE ON process_instance_fields
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
  END IF;
END $$;

