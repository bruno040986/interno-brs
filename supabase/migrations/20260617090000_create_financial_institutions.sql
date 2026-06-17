-- Cadastro mínimo de Instituições Financeiras para uso como catálogo
-- na aba Financeiro das Promotoras.

create table if not exists public.financial_institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text not null default '',
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists financial_institutions_name_unique_idx
  on public.financial_institutions ((lower(trim(name))));

create index if not exists financial_institutions_is_active_idx
  on public.financial_institutions (is_active);

create index if not exists financial_institutions_deleted_at_idx
  on public.financial_institutions (deleted_at);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('financial_institutions');
  perform app_private.apply_policy(t, 'financial_institutions_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-instituicoes'', ''can_view'')');
  perform app_private.apply_policy(t, 'financial_institutions_insert_permitted', 'INSERT', null, 'app_private.has_permission(''sistema-config-instituicoes'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'financial_institutions_update_permitted',
    'UPDATE',
    'app_private.has_permission(''sistema-config-instituicoes'', ''can_edit'') OR app_private.has_permission(''sistema-config-instituicoes'', ''can_activate_inactivate'')',
    'app_private.has_permission(''sistema-config-instituicoes'', ''can_edit'') OR app_private.has_permission(''sistema-config-instituicoes'', ''can_activate_inactivate'')'
  );
end $$;

notify pgrst, 'reload schema';
