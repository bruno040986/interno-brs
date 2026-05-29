-- Migração: Mural de Elogios (Workspace)
-- Data: 2026-05-29

CREATE TABLE IF NOT EXISTS praise_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  to_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  to_all BOOLEAN NOT NULL DEFAULT false,
  message TEXT NOT NULL CHECK (char_length(message) <= 150),
  bg_color TEXT NOT NULL DEFAULT '#FFF8C5',
  text_color TEXT NOT NULL DEFAULT '#111827',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'denied')),
  decided_at TIMESTAMP WITH TIME ZONE,
  decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'praise_messages_to_all_consistency'
  ) THEN
    ALTER TABLE praise_messages
      ADD CONSTRAINT praise_messages_to_all_consistency
      CHECK (
        (to_all = true AND to_user_id IS NULL AND status = 'accepted')
        OR
        (to_all = false AND to_user_id IS NOT NULL)
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS praise_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  praise_id UUID NOT NULL REFERENCES praise_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (praise_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS praise_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  praise_id UUID NOT NULL REFERENCES praise_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_praise_messages_created_at ON praise_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_praise_messages_to_user_status ON praise_messages (to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_praise_notifications_user_read ON praise_notifications (user_id, read_at);
