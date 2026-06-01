CREATE TABLE IF NOT EXISTS public.workspace_chat_user_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  nickname TEXT,
  status TEXT NOT NULL DEFAULT 'online',
  mood TEXT,
  mood_date DATE,
  status_message VARCHAR(50),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.workspace_chat_user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_chat_user_profiles_select_authenticated ON public.workspace_chat_user_profiles;
CREATE POLICY workspace_chat_user_profiles_select_authenticated
ON public.workspace_chat_user_profiles
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS workspace_chat_user_profiles_insert_own ON public.workspace_chat_user_profiles;
CREATE POLICY workspace_chat_user_profiles_insert_own
ON public.workspace_chat_user_profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS workspace_chat_user_profiles_update_own ON public.workspace_chat_user_profiles;
CREATE POLICY workspace_chat_user_profiles_update_own
ON public.workspace_chat_user_profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

ALTER TABLE public.workspace_chat_messages
  ADD COLUMN IF NOT EXISTS text_style JSONB,
  ADD COLUMN IF NOT EXISTS attachments JSONB;
