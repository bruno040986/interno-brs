-- Migração: Tipos de notificação do Mural de Elogios
-- Data: 2026-05-29

ALTER TABLE praise_notifications
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'praise_received';

ALTER TABLE praise_notifications
  ADD COLUMN IF NOT EXISTS from_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE praise_notifications
  ADD COLUMN IF NOT EXISTS emoji TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'praise_notifications_type_check'
  ) THEN
    ALTER TABLE praise_notifications
      ADD CONSTRAINT praise_notifications_type_check
      CHECK (type IN ('praise_received', 'praise_reaction'));
  END IF;
END $$;

