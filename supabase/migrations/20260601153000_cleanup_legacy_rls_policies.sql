DO $$
BEGIN
  -- users
  DROP POLICY IF EXISTS "acesso_total" ON public.users;
  DROP POLICY IF EXISTS "admins tem acesso total" ON public.users;
  DROP POLICY IF EXISTS "usuários podem ver seu próprio perfil" ON public.users;
  DROP POLICY IF EXISTS "Allow all for admins" ON public.users;
  DROP POLICY IF EXISTS "Allow view for authenticated" ON public.users;

  -- profile / permissions schedules
  DROP POLICY IF EXISTS "Gestão total profile_permissions" ON public.profile_permissions;
  DROP POLICY IF EXISTS "Gestão total profile_schedules" ON public.profile_schedules;
  DROP POLICY IF EXISTS "Permitir gestão de horários de perfil" ON public.profile_schedules;
  DROP POLICY IF EXISTS "Gestão total user_permissions" ON public.user_permissions;
  DROP POLICY IF EXISTS "Gestão total user_schedules" ON public.user_schedules;
  DROP POLICY IF EXISTS "Permitir gestão de horários de usuário" ON public.user_schedules;

  -- links
  DROP POLICY IF EXISTS "Permitir gestão total" ON public.sector_links;

  -- RH
  DROP POLICY IF EXISTS "acesso colaboradores" ON public.employees;
  DROP POLICY IF EXISTS "acesso_total" ON public.employees;
  DROP POLICY IF EXISTS "acesso unidades" ON public.company_units;
  DROP POLICY IF EXISTS "acesso_total" ON public.company_units;
  DROP POLICY IF EXISTS "acesso motivos" ON public.disciplinary_reasons;
  DROP POLICY IF EXISTS "acesso_total" ON public.disciplinary_reasons;
  DROP POLICY IF EXISTS "acesso vt" ON public.vt_records;
  DROP POLICY IF EXISTS "acesso_total" ON public.vt_records;
  DROP POLICY IF EXISTS "Allow all for authenticated" ON public.vt_routes;
END $$;
