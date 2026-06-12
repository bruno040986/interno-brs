-- Cadastro-base de Regimes Tributários com vigências históricas.
-- O nome do regime fica na tabela principal e cada versão de vigência
-- fica separada para permitir histórico e recálculo futuro.

create table if not exists public.tax_regimes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tax_regimes_name_unique_idx
  on public.tax_regimes ((lower(trim(name))));

create table if not exists public.tax_regime_versions (
  id uuid primary key default gen_random_uuid(),
  tax_regime_id uuid not null references public.tax_regimes(id) on delete cascade,
  effective_from date not null,
  effective_to date null,
  locked_at timestamptz null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tax_regime_versions_start_unique_idx
  on public.tax_regime_versions (tax_regime_id, effective_from);

create unique index if not exists tax_regime_versions_active_unique_idx
  on public.tax_regime_versions (tax_regime_id)
  where effective_to is null;

create index if not exists tax_regime_versions_regime_idx
  on public.tax_regime_versions (tax_regime_id);

create index if not exists tax_regime_versions_effective_from_idx
  on public.tax_regime_versions (effective_from);

create index if not exists tax_regime_versions_effective_to_idx
  on public.tax_regime_versions (effective_to);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('tax_regimes');
  perform app_private.apply_policy(t, 'tax_regimes_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-regimes-tributarios'', ''can_view'')');
  perform app_private.apply_policy(t, 'tax_regimes_insert_permitted', 'INSERT', null, 'app_private.has_permission(''sistema-config-regimes-tributarios'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'tax_regimes_update_permitted',
    'UPDATE',
    'app_private.has_permission(''sistema-config-regimes-tributarios'', ''can_edit'')',
    'app_private.has_permission(''sistema-config-regimes-tributarios'', ''can_edit'')'
  );
end $$;

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('tax_regime_versions');
  perform app_private.apply_policy(t, 'tax_regime_versions_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-regimes-tributarios'', ''can_view'')');
  perform app_private.apply_policy(t, 'tax_regime_versions_insert_permitted', 'INSERT', null, 'app_private.has_permission(''sistema-config-regimes-tributarios'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'tax_regime_versions_update_permitted',
    'UPDATE',
    'app_private.has_permission(''sistema-config-regimes-tributarios'', ''can_edit'')',
    'app_private.has_permission(''sistema-config-regimes-tributarios'', ''can_edit'')'
  );
end $$;

notify pgrst, 'reload schema';
