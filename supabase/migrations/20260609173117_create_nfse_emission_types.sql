-- Cadastro de tipos de emissão de NFSe reutilizáveis em outros subsistemas.
-- O frontend trabalha apenas com ativar/inativar, preservando o registro.

create table if not exists public.nfse_emission_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists nfse_emission_types_name_unique_idx
  on public.nfse_emission_types ((lower(trim(name))));

create index if not exists nfse_emission_types_is_active_idx
  on public.nfse_emission_types (is_active);

create index if not exists nfse_emission_types_deleted_at_idx
  on public.nfse_emission_types (deleted_at);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('nfse_emission_types');
  perform app_private.apply_policy(t, 'nfse_emission_types_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-nfse-emissao'', ''can_view'')');
  perform app_private.apply_policy(t, 'nfse_emission_types_insert_permitted', 'INSERT', null, 'app_private.has_permission(''sistema-config-nfse-emissao'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'nfse_emission_types_update_permitted',
    'UPDATE',
    'app_private.has_permission(''sistema-config-nfse-emissao'', ''can_edit'') OR app_private.has_permission(''sistema-config-nfse-emissao'', ''can_activate_inactivate'')',
    'app_private.has_permission(''sistema-config-nfse-emissao'', ''can_edit'') OR app_private.has_permission(''sistema-config-nfse-emissao'', ''can_activate_inactivate'')'
  );
end $$;

notify pgrst, 'reload schema';
