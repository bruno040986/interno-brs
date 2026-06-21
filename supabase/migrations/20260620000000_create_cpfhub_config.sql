-- Cadastro das credenciais da CPFHub.io para a área de Configurações > API e Integração.

create table if not exists public.cpfhub_config (
  id uuid primary key default gen_random_uuid(),
  email text not null default '',
  api_key text not null default '',
  plan text not null default 'gratuito',
  free_queries_per_month integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint cpfhub_config_plan_chk check (plan in ('gratuito', 'pago')),
  constraint cpfhub_config_free_queries_chk check (free_queries_per_month >= 0)
);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('cpfhub_config');
  perform app_private.apply_policy(t, 'cpfhub_config_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-cpf'', ''can_view'')');
  perform app_private.apply_policy(t, 'cpfhub_config_insert_permitted', 'INSERT', null, 'app_private.has_permission(''sistema-config-cpf'', ''can_edit'')');
  perform app_private.apply_policy(
    t,
    'cpfhub_config_update_permitted',
    'UPDATE',
    'app_private.has_permission(''sistema-config-cpf'', ''can_edit'')',
    'app_private.has_permission(''sistema-config-cpf'', ''can_edit'')'
  );
end $$;

notify pgrst, 'reload schema';
