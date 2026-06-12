-- Cadastro de tipos de comercial reutilizáveis por outros subsistemas.
-- Mantém o registro mesmo quando o item é inativado, permitindo reativação.

create table if not exists public.commercial_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists commercial_types_name_unique_idx
  on public.commercial_types ((lower(trim(name))));

create index if not exists commercial_types_is_active_idx
  on public.commercial_types (is_active);

create index if not exists commercial_types_deleted_at_idx
  on public.commercial_types (deleted_at);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('commercial_types');
  perform app_private.apply_policy(t, 'commercial_types_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-comercial-tipos'', ''can_view'')');
  perform app_private.apply_policy(t, 'commercial_types_insert_permitted', 'INSERT', null, 'app_private.has_permission(''sistema-config-comercial-tipos'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'commercial_types_update_permitted',
    'UPDATE',
    'app_private.has_permission(''sistema-config-comercial-tipos'', ''can_edit'') OR app_private.has_permission(''sistema-config-comercial-tipos'', ''can_activate_inactivate'')',
    'app_private.has_permission(''sistema-config-comercial-tipos'', ''can_edit'') OR app_private.has_permission(''sistema-config-comercial-tipos'', ''can_activate_inactivate'')'
  );
end $$;

-- Concede o novo recurso aos perfis e usuários que já administram outras telas
-- de Configurações, para o menu aparecer automaticamente no mesmo agrupamento.
insert into public.profile_permissions (
  profile_id,
  resource_name,
  can_view,
  can_include,
  can_edit,
  can_delete,
  can_activate_inactivate,
  created_at
)
select distinct
  pp.profile_id,
  'sistema-config-comercial-tipos',
  true,
  true,
  true,
  false,
  true,
  now()
from public.profile_permissions pp
where pp.resource_name in (
  'sistema-config-email',
  'sistema-config-whatsapp',
  'sistema-config-assinatura',
  'sistema-config-empresa',
  'sistema-config-google',
  'sistema-config-quarkrh',
  'sistema-config-contaazul',
  'sistema-config-arw',
  'sistema-config-instituicoes',
  'sistema-config-crm'
)
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
  can_activate_inactivate,
  created_at
)
select distinct
  up.user_id,
  'sistema-config-comercial-tipos',
  true,
  true,
  true,
  false,
  true,
  now()
from public.user_permissions up
where up.resource_name in (
  'sistema-config-email',
  'sistema-config-whatsapp',
  'sistema-config-assinatura',
  'sistema-config-empresa',
  'sistema-config-google',
  'sistema-config-quarkrh',
  'sistema-config-contaazul',
  'sistema-config-arw',
  'sistema-config-instituicoes',
  'sistema-config-crm'
)
on conflict (user_id, resource_name) do update
set
  can_view = excluded.can_view,
  can_include = excluded.can_include,
  can_edit = excluded.can_edit,
  can_delete = excluded.can_delete,
  can_activate_inactivate = excluded.can_activate_inactivate;

notify pgrst, 'reload schema';
