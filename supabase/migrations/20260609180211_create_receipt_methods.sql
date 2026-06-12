-- Cadastro de formas de recebimento reutilizáveis em outros subsistemas.
-- O frontend trabalha apenas com ativar/inativar, preservando o registro.

create table if not exists public.receipt_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists receipt_methods_name_unique_idx
  on public.receipt_methods ((lower(trim(name))));

create index if not exists receipt_methods_is_active_idx
  on public.receipt_methods (is_active);

create index if not exists receipt_methods_deleted_at_idx
  on public.receipt_methods (deleted_at);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('receipt_methods');
  perform app_private.apply_policy(t, 'receipt_methods_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-formas-recebimento'', ''can_view'')');
  perform app_private.apply_policy(t, 'receipt_methods_insert_permitted', 'INSERT', null, 'app_private.has_permission(''sistema-config-formas-recebimento'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'receipt_methods_update_permitted',
    'UPDATE',
    'app_private.has_permission(''sistema-config-formas-recebimento'', ''can_edit'') OR app_private.has_permission(''sistema-config-formas-recebimento'', ''can_activate_inactivate'')',
    'app_private.has_permission(''sistema-config-formas-recebimento'', ''can_edit'') OR app_private.has_permission(''sistema-config-formas-recebimento'', ''can_activate_inactivate'')'
  );
end $$;

notify pgrst, 'reload schema';
