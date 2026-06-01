CREATE TABLE IF NOT EXISTS public.workspace_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL DEFAULT 'direct',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.workspace_chat_participants (
  conversation_id UUID NOT NULL REFERENCES public.workspace_chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  last_read_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.workspace_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.workspace_chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_workspace_chat_participants_user ON public.workspace_chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_chat_messages_conversation ON public.workspace_chat_messages(conversation_id, created_at DESC);

ALTER TABLE public.workspace_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_chat_conversations_select_participant ON public.workspace_chat_conversations;
CREATE POLICY workspace_chat_conversations_select_participant
ON public.workspace_chat_conversations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_chat_participants p
    WHERE p.conversation_id = id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS workspace_chat_conversations_insert_authenticated ON public.workspace_chat_conversations;
CREATE POLICY workspace_chat_conversations_insert_authenticated
ON public.workspace_chat_conversations
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS workspace_chat_participants_select_own_conversation ON public.workspace_chat_participants;
CREATE POLICY workspace_chat_participants_select_own_conversation
ON public.workspace_chat_participants
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.workspace_chat_participants p
    WHERE p.conversation_id = conversation_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS workspace_chat_participants_insert_in_own_conversation ON public.workspace_chat_participants;
CREATE POLICY workspace_chat_participants_insert_in_own_conversation
ON public.workspace_chat_participants
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.workspace_chat_participants p
    WHERE p.conversation_id = conversation_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS workspace_chat_participants_update_own_read ON public.workspace_chat_participants;
CREATE POLICY workspace_chat_participants_update_own_read
ON public.workspace_chat_participants
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS workspace_chat_messages_select_participant ON public.workspace_chat_messages;
CREATE POLICY workspace_chat_messages_select_participant
ON public.workspace_chat_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_chat_participants p
    WHERE p.conversation_id = conversation_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS workspace_chat_messages_insert_participant ON public.workspace_chat_messages;
CREATE POLICY workspace_chat_messages_insert_participant
ON public.workspace_chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.workspace_chat_participants p
    WHERE p.conversation_id = conversation_id
      AND p.user_id = auth.uid()
  )
);
