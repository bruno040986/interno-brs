-- Cadastro de setores da empresa reutilizável em outros subsistemas.
-- Mantém o histórico para ativação/inativação sem exclusão física no front.

create table if not exists public.company_sectors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists company_sectors_name_unique_idx
  on public.company_sectors ((lower(trim(name))));

create index if not exists company_sectors_is_active_idx
  on public.company_sectors (is_active);

create index if not exists company_sectors_deleted_at_idx
  on public.company_sectors (deleted_at);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('company_sectors');
  perform app_private.apply_policy(t, 'company_sectors_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-setores'', ''can_view'')');
  perform app_private.apply_policy(t, 'company_sectors_insert_permitted', 'INSERT', null, 'app_private.has_permission(''sistema-config-setores'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'company_sectors_update_permitted',
    'UPDATE',
    'app_private.has_permission(''sistema-config-setores'', ''can_edit'') OR app_private.has_permission(''sistema-config-setores'', ''can_activate_inactivate'')',
    'app_private.has_permission(''sistema-config-setores'', ''can_edit'') OR app_private.has_permission(''sistema-config-setores'', ''can_activate_inactivate'')'
  );
end $$;

notify pgrst, 'reload schema';
