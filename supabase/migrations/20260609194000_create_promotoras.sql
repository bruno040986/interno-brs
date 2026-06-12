-- Cadastro de Promotoras reutilizável por outros subsistemas.
-- Estrutura híbrida: campos principais normalizados e blocos aninhados em JSONB
-- para contatos, fiscal, financeiro, contas bancárias e sistemas.

create table if not exists public.promotoras (
  id uuid primary key default gen_random_uuid(),
  cnpj text not null,
  razao_social text not null,
  nome_fantasia text not null default '',
  logo_url text not null default '',
  address_data jsonb not null default '{}'::jsonb,
  contacts_commercial jsonb not null default '[]'::jsonb,
  contacts_operational jsonb not null default '[]'::jsonb,
  fiscal_data jsonb not null default '{}'::jsonb,
  financial_data jsonb not null default '{}'::jsonb,
  bank_accounts jsonb not null default '[]'::jsonb,
  systems jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists promotoras_cnpj_unique_idx
  on public.promotoras ((lower(trim(cnpj))));

create index if not exists promotoras_is_active_idx
  on public.promotoras (is_active);

create index if not exists promotoras_deleted_at_idx
  on public.promotoras (deleted_at);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('promotoras');
  perform app_private.apply_policy(t, 'promotoras_select_permitted', 'SELECT', 'app_private.has_permission(''promotoras'', ''can_view'')');
  perform app_private.apply_policy(t, 'promotoras_insert_permitted', 'INSERT', null, 'app_private.has_permission(''promotoras'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'promotoras_update_permitted',
    'UPDATE',
    'app_private.has_permission(''promotoras'', ''can_edit'') OR app_private.has_permission(''promotoras'', ''can_activate_inactivate'')',
    'app_private.has_permission(''promotoras'', ''can_edit'') OR app_private.has_permission(''promotoras'', ''can_activate_inactivate'')'
  );
end $$;

insert into public.profile_permissions (
  profile_id,
  resource_name,
  can_view,
  can_include,
  can_edit,
  can_delete,
  can_activate_inactivate
)
select distinct
  pp.profile_id,
  'promotoras',
  true,
  true,
  true,
  false,
  true
from public.profile_permissions pp
where pp.resource_name = 'workspace-ops'
on conflict (profile_id, resource_name) do update
set
  can_view = excluded.can_view,
  can_include = excluded.can_include,
  can_edit = excluded.can_edit,
  can_delete = excluded.can_delete,
  can_activate_inactivate = excluded.can_activate_inactivate;

insert into public.user_permissions (
  user_id,
  resource_name,
  can_view,
  can_include,
  can_edit,
  can_delete,
  can_activate_inactivate
)
select distinct
  up.user_id,
  'promotoras',
  true,
  true,
  true,
  false,
  true
from public.user_permissions up
where up.resource_name = 'workspace-ops'
on conflict (user_id, resource_name) do update
set
  can_view = excluded.can_view,
  can_include = excluded.can_include,
  can_edit = excluded.can_edit,
  can_delete = excluded.can_delete,
  can_activate_inactivate = excluded.can_activate_inactivate;

notify pgrst, 'reload schema';
