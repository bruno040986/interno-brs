-- Subsistema Agente Corban.
-- Mantém o cadastro mestre em agentes_parceiros e adiciona catálogos leves
-- para os campos de acesso usados pelo novo editor operacional.

create table if not exists public.agente_corban_niveis_acesso (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists agente_corban_niveis_acesso_name_unique_idx
  on public.agente_corban_niveis_acesso ((lower(trim(name))));

create index if not exists agente_corban_niveis_acesso_is_active_idx
  on public.agente_corban_niveis_acesso (is_active);

create index if not exists agente_corban_niveis_acesso_deleted_at_idx
  on public.agente_corban_niveis_acesso (deleted_at);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('agente_corban_niveis_acesso');
  perform app_private.apply_policy(t, 'agente_corban_niveis_acesso_select_permitted', 'SELECT', 'app_private.has_permission(''agente-corban-niveis-acesso'', ''can_view'')');
  perform app_private.apply_policy(t, 'agente_corban_niveis_acesso_insert_permitted', 'INSERT', null, 'app_private.has_permission(''agente-corban-niveis-acesso'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'agente_corban_niveis_acesso_update_permitted',
    'UPDATE',
    'app_private.has_permission(''agente-corban-niveis-acesso'', ''can_edit'') OR app_private.has_permission(''agente-corban-niveis-acesso'', ''can_activate_inactivate'')',
    'app_private.has_permission(''agente-corban-niveis-acesso'', ''can_edit'') OR app_private.has_permission(''agente-corban-niveis-acesso'', ''can_activate_inactivate'')'
  );
end $$;

create table if not exists public.agente_corban_tipos_agente (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists agente_corban_tipos_agente_name_unique_idx
  on public.agente_corban_tipos_agente ((lower(trim(name))));

create index if not exists agente_corban_tipos_agente_is_active_idx
  on public.agente_corban_tipos_agente (is_active);

create index if not exists agente_corban_tipos_agente_deleted_at_idx
  on public.agente_corban_tipos_agente (deleted_at);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('agente_corban_tipos_agente');
  perform app_private.apply_policy(t, 'agente_corban_tipos_agente_select_permitted', 'SELECT', 'app_private.has_permission(''agente-corban-tipos-agente'', ''can_view'')');
  perform app_private.apply_policy(t, 'agente_corban_tipos_agente_insert_permitted', 'INSERT', null, 'app_private.has_permission(''agente-corban-tipos-agente'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'agente_corban_tipos_agente_update_permitted',
    'UPDATE',
    'app_private.has_permission(''agente-corban-tipos-agente'', ''can_edit'') OR app_private.has_permission(''agente-corban-tipos-agente'', ''can_activate_inactivate'')',
    'app_private.has_permission(''agente-corban-tipos-agente'', ''can_edit'') OR app_private.has_permission(''agente-corban-tipos-agente'', ''can_activate_inactivate'')'
  );
end $$;

create table if not exists public.agente_corban_regras_fisico (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists agente_corban_regras_fisico_name_unique_idx
  on public.agente_corban_regras_fisico ((lower(trim(name))));

create index if not exists agente_corban_regras_fisico_is_active_idx
  on public.agente_corban_regras_fisico (is_active);

create index if not exists agente_corban_regras_fisico_deleted_at_idx
  on public.agente_corban_regras_fisico (deleted_at);

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('agente_corban_regras_fisico');
  perform app_private.apply_policy(t, 'agente_corban_regras_fisico_select_permitted', 'SELECT', 'app_private.has_permission(''agente-corban-regras-fisico'', ''can_view'')');
  perform app_private.apply_policy(t, 'agente_corban_regras_fisico_insert_permitted', 'INSERT', null, 'app_private.has_permission(''agente-corban-regras-fisico'', ''can_include'')');
  perform app_private.apply_policy(
    t,
    'agente_corban_regras_fisico_update_permitted',
    'UPDATE',
    'app_private.has_permission(''agente-corban-regras-fisico'', ''can_edit'') OR app_private.has_permission(''agente-corban-regras-fisico'', ''can_activate_inactivate'')',
    'app_private.has_permission(''agente-corban-regras-fisico'', ''can_edit'') OR app_private.has_permission(''agente-corban-regras-fisico'', ''can_activate_inactivate'')'
  );
end $$;

do $$
begin
  alter table public.agentes_parceiros
    add column if not exists corban_data jsonb not null default '{}'::jsonb;
end $$;

do $$
declare
  t regclass;
begin
  t := app_private.enable_rls_if_exists('agentes_parceiros');
  perform app_private.apply_policy(
    t,
    'agentes_parceiros_select_permitted',
    'SELECT',
    'app_private.has_permission(''scp-crm'', ''can_view'') OR app_private.has_permission(''agente-corban'', ''can_view'')'
  );
  perform app_private.apply_policy(
    t,
    'agentes_parceiros_insert_permitted',
    'INSERT',
    null,
    'app_private.has_permission(''scp-crm'', ''can_include'') OR app_private.has_permission(''agente-corban'', ''can_include'')'
  );
  perform app_private.apply_policy(
    t,
    'agentes_parceiros_update_permitted',
    'UPDATE',
    'app_private.has_permission(''scp-crm'', ''can_edit'') OR app_private.has_permission(''agente-corban'', ''can_edit'')',
    'app_private.has_permission(''scp-crm'', ''can_edit'') OR app_private.has_permission(''agente-corban'', ''can_edit'')'
  );
  perform app_private.apply_policy(
    t,
    'agentes_parceiros_delete_permitted',
    'DELETE',
    'app_private.has_permission(''scp-crm'', ''can_delete'') OR app_private.has_permission(''agente-corban'', ''can_delete'')'
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
  'agente-corban',
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
  'agente-corban',
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
  'agente-corban-niveis-acesso',
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
  'agente-corban-niveis-acesso',
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
  'agente-corban-tipos-agente',
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
  'agente-corban-tipos-agente',
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
  'agente-corban-regras-fisico',
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
  'agente-corban-regras-fisico',
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

do $$
begin
  if exists (select 1 from pg_proc where proname = 'trigger_set_timestamp') then
    if not exists (select 1 from pg_trigger where tgname = 'set_timestamp_agente_corban_niveis_acesso') then
      create trigger set_timestamp_agente_corban_niveis_acesso
      before update on public.agente_corban_niveis_acesso
      for each row
      execute function trigger_set_timestamp();
    end if;

    if not exists (select 1 from pg_trigger where tgname = 'set_timestamp_agente_corban_tipos_agente') then
      create trigger set_timestamp_agente_corban_tipos_agente
      before update on public.agente_corban_tipos_agente
      for each row
      execute function trigger_set_timestamp();
    end if;

    if not exists (select 1 from pg_trigger where tgname = 'set_timestamp_agente_corban_regras_fisico') then
      create trigger set_timestamp_agente_corban_regras_fisico
      before update on public.agente_corban_regras_fisico
      for each row
      execute function trigger_set_timestamp();
    end if;
  end if;
end $$;

notify pgrst, 'reload schema';
