-- Cadastro de CTNs normalizados para uso no quadro Dados Fiscais e em outros
-- pontos do sistema.
-- O código é armazenado de forma normalizada com 6 dígitos e permanece único.

create table if not exists public.ctns (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text not null,
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ctns_code_format_chk check (code ~ '^[0-9]{6}$')
);

create unique index if not exists ctns_code_unique_idx
  on public.ctns (code);

create index if not exists ctns_is_active_idx
  on public.ctns (is_active);

create index if not exists ctns_deleted_at_idx
  on public.ctns (deleted_at);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('ctns');
  perform app_private.apply_policy(t, 'ctns_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-ctn'', ''can_view'')');
  perform app_private.apply_policy(t, 'ctns_insert_permitted', 'INSERT', null, 'app_private.has_permission(''sistema-config-ctn'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'ctns_update_permitted',
    'UPDATE',
    'app_private.has_permission(''sistema-config-ctn'', ''can_edit'') OR app_private.has_permission(''sistema-config-ctn'', ''can_activate_inactivate'')',
    'app_private.has_permission(''sistema-config-ctn'', ''can_edit'') OR app_private.has_permission(''sistema-config-ctn'', ''can_activate_inactivate'')'
  );
end $$;

notify pgrst, 'reload schema';
