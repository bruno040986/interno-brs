-- Cadastro de NBS normalizados para uso no quadro Dados Fiscais e em outros
-- pontos do sistema.
-- O código é armazenado de forma normalizada com 9 dígitos e permanece único.

create table if not exists public.nbses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text not null,
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nbses_code_format_chk check (code ~ '^[0-9]{9}$')
);

create unique index if not exists nbses_code_unique_idx
  on public.nbses (code);

create index if not exists nbses_is_active_idx
  on public.nbses (is_active);

create index if not exists nbses_deleted_at_idx
  on public.nbses (deleted_at);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('nbses');
  perform app_private.apply_policy(t, 'nbses_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-nbs'', ''can_view'')');
  perform app_private.apply_policy(t, 'nbses_insert_permitted', 'INSERT', null, 'app_private.has_permission(''sistema-config-nbs'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'nbses_update_permitted',
    'UPDATE',
    'app_private.has_permission(''sistema-config-nbs'', ''can_edit'') OR app_private.has_permission(''sistema-config-nbs'', ''can_activate_inactivate'')',
    'app_private.has_permission(''sistema-config-nbs'', ''can_edit'') OR app_private.has_permission(''sistema-config-nbs'', ''can_activate_inactivate'')'
  );
end $$;

notify pgrst, 'reload schema';
