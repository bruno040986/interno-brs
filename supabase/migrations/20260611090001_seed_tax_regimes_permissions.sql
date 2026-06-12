-- Garante que os novos recursos de Regimes Tributários e Recálculo apareçam
-- para os mesmos perfis/usuários que já administram as demais configurações.

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
  'sistema-config-regimes-tributarios',
  true,
  true,
  true,
  false,
  false
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
  can_activate_inactivate
)
select distinct
  up.user_id,
  'sistema-config-regimes-tributarios',
  true,
  true,
  true,
  false,
  false
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
  'sistema-config-recalculo-tributario',
  true,
  false,
  false,
  false,
  false
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
  can_activate_inactivate
)
select distinct
  up.user_id,
  'sistema-config-recalculo-tributario',
  true,
  false,
  false,
  false,
  false
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
