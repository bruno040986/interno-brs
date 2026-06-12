-- Garante que o cadastro de Formas de Recebimento apareça no menu
-- de Configurações para perfis e usuários que já têm acesso ao agrupamento.

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
  'sistema-config-formas-recebimento',
  true,
  true,
  true,
  false,
  true
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
  'sistema-config-crm',
  'sistema-config-comercial-tipos',
  'sistema-config-setores',
  'sistema-config-nfse-emissao'
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
  'sistema-config-formas-recebimento',
  true,
  true,
  true,
  false,
  true
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
  'sistema-config-crm',
  'sistema-config-comercial-tipos',
  'sistema-config-setores',
  'sistema-config-nfse-emissao'
)
on conflict (user_id, resource_name) do update
set
  can_view = excluded.can_view,
  can_include = excluded.can_include,
  can_edit = excluded.can_edit,
  can_delete = excluded.can_delete,
  can_activate_inactivate = excluded.can_activate_inactivate;

notify pgrst, 'reload schema';
