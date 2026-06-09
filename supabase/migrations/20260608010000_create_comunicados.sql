CREATE TABLE IF NOT EXISTS public.comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(60) NOT NULL,
  texto_html TEXT NOT NULL,
  fixo_topo BOOLEAN NOT NULL DEFAULT FALSE,
  data_inicio_veiculacao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim_veiculacao TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT comunicados_period_valid CHECK (data_fim_veiculacao >= data_inicio_veiculacao)
);

CREATE TABLE IF NOT EXISTS public.comunicado_target_profiles (
  comunicado_id UUID NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.access_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (comunicado_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.comunicado_reads (
  comunicado_id UUID NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (comunicado_id, user_id)
);

ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicado_target_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicado_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comunicados_select_authenticated ON public.comunicados;
CREATE POLICY comunicados_select_authenticated
ON public.comunicados
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS comunicado_target_profiles_select_authenticated ON public.comunicado_target_profiles;
CREATE POLICY comunicado_target_profiles_select_authenticated
ON public.comunicado_target_profiles
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS comunicado_reads_select_own ON public.comunicado_reads;
CREATE POLICY comunicado_reads_select_own
ON public.comunicado_reads
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS comunicado_reads_insert_own ON public.comunicado_reads;
CREATE POLICY comunicado_reads_insert_own
ON public.comunicado_reads
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS comunicado_reads_update_own ON public.comunicado_reads;
CREATE POLICY comunicado_reads_update_own
ON public.comunicado_reads
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

