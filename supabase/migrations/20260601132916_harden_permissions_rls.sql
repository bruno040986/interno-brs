CREATE SCHEMA IF NOT EXISTS app_private;

REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO authenticated;

CREATE OR REPLACE FUNCTION app_private.has_permission(
  resource text,
  permission_action text DEFAULT 'can_view'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_user_row AS (
    SELECT id, profile_id
    FROM public.users
    WHERE id = auth.uid()
      AND COALESCE(active, true) = true
    LIMIT 1
  ),
  direct_permission AS (
    SELECT
      up.resource_name,
      up.can_view,
      up.can_include,
      up.can_edit,
      up.can_delete,
      up.can_activate_inactivate
    FROM public.user_permissions up
    JOIN current_user_row u ON u.id = up.user_id
    WHERE up.resource_name = resource
    LIMIT 1
  ),
  profile_permission AS (
    SELECT
      pp.resource_name,
      pp.can_view,
      pp.can_include,
      pp.can_edit,
      pp.can_delete,
      pp.can_activate_inactivate
    FROM public.profile_permissions pp
    JOIN current_user_row u ON u.profile_id = pp.profile_id
    WHERE pp.resource_name = resource
      AND NOT EXISTS (SELECT 1 FROM direct_permission)
    LIMIT 1
  ),
  effective_permission AS (
    SELECT * FROM direct_permission
    UNION ALL
    SELECT * FROM profile_permission
  )
  SELECT COALESCE((
    SELECT CASE permission_action
      WHEN 'can_view' THEN COALESCE(can_view, false)
      WHEN 'can_include' THEN COALESCE(can_include, false)
      WHEN 'can_edit' THEN COALESCE(can_edit, false)
      WHEN 'can_delete' THEN COALESCE(can_delete, false)
      WHEN 'can_activate_inactivate' THEN COALESCE(can_activate_inactivate, false)
      ELSE false
    END
    FROM effective_permission
    LIMIT 1
  ), false);
$$;

CREATE OR REPLACE FUNCTION app_private.is_own_employee(target_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND employee_id = target_employee_id
      AND COALESCE(active, true) = true
  );
$$;

CREATE OR REPLACE FUNCTION app_private.enable_rls_if_exists(table_name text)
RETURNS regclass
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_table regclass;
BEGIN
  target_table := to_regclass(format('public.%I', table_name));
  IF target_table IS NULL THEN
    RETURN NULL;
  END IF;

  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target_table);
  RETURN target_table;
END;
$$;

CREATE OR REPLACE FUNCTION app_private.apply_policy(
  target_table regclass,
  policy_name text,
  command_name text,
  using_expression text DEFAULT NULL,
  check_expression text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  statement text;
BEGIN
  IF target_table IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', policy_name, target_table);

  statement := format(
    'CREATE POLICY %I ON %s FOR %s TO authenticated',
    policy_name,
    target_table,
    command_name
  );

  IF using_expression IS NOT NULL THEN
    statement := statement || ' USING (' || using_expression || ')';
  END IF;

  IF check_expression IS NOT NULL THEN
    statement := statement || ' WITH CHECK (' || check_expression || ')';
  END IF;

  EXECUTE statement;
END;
$$;

REVOKE ALL ON FUNCTION app_private.has_permission(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.is_own_employee(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.enable_rls_if_exists(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.apply_policy(regclass, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.has_permission(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_own_employee(uuid) TO authenticated;

DO $$
DECLARE
  t regclass;
BEGIN
  t := app_private.enable_rls_if_exists('users');
  PERFORM app_private.apply_policy(
    t,
    'users_select_self_or_user_admin',
    'SELECT',
    'id = auth.uid()
      OR app_private.has_permission(''sistema-usuarios-root'', ''can_view'')
      OR app_private.has_permission(''sistema-usuarios-cadastro'', ''can_view'')
      OR app_private.has_permission(''sistema-usuarios-perfis'', ''can_view'')'
  );

  t := app_private.enable_rls_if_exists('access_profiles');
  PERFORM app_private.apply_policy(
    t,
    'access_profiles_select_user_admin',
    'SELECT',
    'app_private.has_permission(''sistema-usuarios-root'', ''can_view'')
      OR app_private.has_permission(''sistema-usuarios-perfis'', ''can_view'')'
  );

  t := app_private.enable_rls_if_exists('profile_permissions');
  PERFORM app_private.apply_policy(
    t,
    'profile_permissions_select_user_admin',
    'SELECT',
    'app_private.has_permission(''sistema-usuarios-root'', ''can_view'')
      OR app_private.has_permission(''sistema-usuarios-perfis'', ''can_view'')'
  );

  t := app_private.enable_rls_if_exists('user_permissions');
  PERFORM app_private.apply_policy(
    t,
    'user_permissions_select_user_admin',
    'SELECT',
    'app_private.has_permission(''sistema-usuarios-root'', ''can_view'')
      OR app_private.has_permission(''sistema-usuarios-cadastro'', ''can_view'')'
  );

  t := app_private.enable_rls_if_exists('profile_schedules');
  PERFORM app_private.apply_policy(
    t,
    'profile_schedules_select_user_admin',
    'SELECT',
    'app_private.has_permission(''sistema-usuarios-root'', ''can_view'')
      OR app_private.has_permission(''sistema-usuarios-perfis'', ''can_view'')'
  );

  t := app_private.enable_rls_if_exists('user_schedules');
  PERFORM app_private.apply_policy(
    t,
    'user_schedules_select_user_admin',
    'SELECT',
    'app_private.has_permission(''sistema-usuarios-root'', ''can_view'')
      OR app_private.has_permission(''sistema-usuarios-cadastro'', ''can_view'')'
  );

  t := app_private.enable_rls_if_exists('user_google_auth');
  PERFORM app_private.apply_policy(t, 'user_google_auth_select_own', 'SELECT', 'user_id = auth.uid()');
  PERFORM app_private.apply_policy(t, 'user_google_auth_insert_own', 'INSERT', NULL, 'user_id = auth.uid()');
  PERFORM app_private.apply_policy(t, 'user_google_auth_update_own', 'UPDATE', 'user_id = auth.uid()', 'user_id = auth.uid()');
  PERFORM app_private.apply_policy(t, 'user_google_auth_delete_own', 'DELETE', 'user_id = auth.uid()');

  t := app_private.enable_rls_if_exists('system_google_config');
  PERFORM app_private.apply_policy(t, 'system_google_config_select_google_admin', 'SELECT', 'app_private.has_permission(''sistema-config-google'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'system_google_config_insert_google_admin', 'INSERT', NULL, 'app_private.has_permission(''sistema-config-google'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'system_google_config_update_google_admin', 'UPDATE', 'app_private.has_permission(''sistema-config-google'', ''can_edit'')', 'app_private.has_permission(''sistema-config-google'', ''can_edit'')');

  t := app_private.enable_rls_if_exists('sector_links');
  PERFORM app_private.apply_policy(
    t,
    'sector_links_select_by_workspace_or_admin',
    'SELECT',
    'app_private.has_permission(''workspace-'' || sector_id, ''can_view'')
      OR app_private.has_permission(''sistema-links'', ''can_view'')'
  );
  PERFORM app_private.apply_policy(t, 'sector_links_insert_admin', 'INSERT', NULL, 'app_private.has_permission(''sistema-links'', ''can_include'')');
  PERFORM app_private.apply_policy(t, 'sector_links_update_admin', 'UPDATE', 'app_private.has_permission(''sistema-links'', ''can_edit'')', 'app_private.has_permission(''sistema-links'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'sector_links_delete_admin', 'DELETE', 'app_private.has_permission(''sistema-links'', ''can_delete'')');

  t := app_private.enable_rls_if_exists('employees');
  PERFORM app_private.apply_policy(
    t,
    'employees_select_rh_or_own',
    'SELECT',
    'app_private.is_own_employee(id)
      OR app_private.has_permission(''rh-painel'', ''can_view'')
      OR app_private.has_permission(''rh-colaboradores'', ''can_view'')
      OR app_private.has_permission(''rh-vale-transporte'', ''can_view'')
      OR app_private.has_permission(''rh-medidas-disciplinares'', ''can_view'')
      OR app_private.has_permission(''rh-importacoes'', ''can_view'')'
  );
  PERFORM app_private.apply_policy(
    t,
    'employees_insert_rh',
    'INSERT',
    NULL,
    'app_private.has_permission(''rh-colaboradores'', ''can_include'')
      OR app_private.has_permission(''rh-importacoes'', ''can_include'')'
  );
  PERFORM app_private.apply_policy(
    t,
    'employees_update_rh_or_vt',
    'UPDATE',
    'app_private.has_permission(''rh-colaboradores'', ''can_edit'')
      OR app_private.has_permission(''rh-vale-transporte'', ''can_include'')
      OR app_private.has_permission(''rh-vale-transporte'', ''can_edit'')
      OR app_private.has_permission(''rh-vale-transporte'', ''can_delete'')',
    'app_private.has_permission(''rh-colaboradores'', ''can_edit'')
      OR app_private.has_permission(''rh-vale-transporte'', ''can_include'')
      OR app_private.has_permission(''rh-vale-transporte'', ''can_edit'')
      OR app_private.has_permission(''rh-vale-transporte'', ''can_delete'')'
  );

  t := app_private.enable_rls_if_exists('company_units');
  PERFORM app_private.apply_policy(
    t,
    'company_units_select_rh',
    'SELECT',
    'app_private.has_permission(''rh-unidades'', ''can_view'')
      OR app_private.has_permission(''rh-vale-transporte'', ''can_view'')
      OR app_private.has_permission(''rh-vale-transporte'', ''can_include'')
      OR app_private.has_permission(''sistema-config-empresa'', ''can_view'')'
  );
  PERFORM app_private.apply_policy(t, 'company_units_insert_rh', 'INSERT', NULL, 'app_private.has_permission(''rh-unidades'', ''can_include'') OR app_private.has_permission(''rh-unidades'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'company_units_update_rh', 'UPDATE', 'app_private.has_permission(''rh-unidades'', ''can_edit'') OR app_private.has_permission(''rh-unidades'', ''can_activate_inactivate'')', 'app_private.has_permission(''rh-unidades'', ''can_edit'') OR app_private.has_permission(''rh-unidades'', ''can_activate_inactivate'')');
  PERFORM app_private.apply_policy(t, 'company_units_delete_rh', 'DELETE', 'app_private.has_permission(''rh-unidades'', ''can_delete'')');

  t := app_private.enable_rls_if_exists('disciplinary_reasons');
  PERFORM app_private.apply_policy(t, 'disciplinary_reasons_select_rh', 'SELECT', 'app_private.has_permission(''rh-motivos'', ''can_view'') OR app_private.has_permission(''rh-medidas-disciplinares'', ''can_view'') OR app_private.has_permission(''rh-medidas-disciplinares'', ''can_include'')');
  PERFORM app_private.apply_policy(t, 'disciplinary_reasons_insert_rh', 'INSERT', NULL, 'app_private.has_permission(''rh-motivos'', ''can_include'') OR app_private.has_permission(''rh-motivos'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'disciplinary_reasons_update_rh', 'UPDATE', 'app_private.has_permission(''rh-motivos'', ''can_edit'')', 'app_private.has_permission(''rh-motivos'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'disciplinary_reasons_delete_rh', 'DELETE', 'app_private.has_permission(''rh-motivos'', ''can_delete'')');

  t := app_private.enable_rls_if_exists('disciplinary_records');
  PERFORM app_private.apply_policy(t, 'disciplinary_records_select_rh', 'SELECT', 'app_private.has_permission(''rh-painel'', ''can_view'') OR app_private.has_permission(''rh-medidas-disciplinares'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'disciplinary_records_insert_rh', 'INSERT', NULL, 'app_private.has_permission(''rh-medidas-disciplinares'', ''can_include'')');
  PERFORM app_private.apply_policy(t, 'disciplinary_records_update_rh', 'UPDATE', 'app_private.has_permission(''rh-medidas-disciplinares'', ''can_edit'')', 'app_private.has_permission(''rh-medidas-disciplinares'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'disciplinary_records_delete_rh', 'DELETE', 'app_private.has_permission(''rh-medidas-disciplinares'', ''can_delete'')');

  t := app_private.enable_rls_if_exists('vt_records');
  PERFORM app_private.apply_policy(
    t,
    'vt_records_select_rh_or_own',
    'SELECT',
    'app_private.has_permission(''rh-painel'', ''can_view'')
      OR app_private.has_permission(''rh-vale-transporte'', ''can_view'')
      OR app_private.has_permission(''rh-colaboradores'', ''can_view'')
      OR app_private.is_own_employee(employee_id)'
  );
  PERFORM app_private.apply_policy(t, 'vt_records_insert_rh', 'INSERT', NULL, 'app_private.has_permission(''rh-vale-transporte'', ''can_include'')');
  PERFORM app_private.apply_policy(t, 'vt_records_update_rh', 'UPDATE', 'app_private.has_permission(''rh-vale-transporte'', ''can_include'') OR app_private.has_permission(''rh-vale-transporte'', ''can_edit'')', 'app_private.has_permission(''rh-vale-transporte'', ''can_include'') OR app_private.has_permission(''rh-vale-transporte'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'vt_records_delete_rh', 'DELETE', 'app_private.has_permission(''rh-vale-transporte'', ''can_delete'')');

  t := app_private.enable_rls_if_exists('vt_routes');
  PERFORM app_private.apply_policy(
    t,
    'vt_routes_select_rh_or_own',
    'SELECT',
    'EXISTS (
      SELECT 1 FROM public.vt_records vr
      WHERE vr.id = vt_record_id
        AND (
          app_private.has_permission(''rh-vale-transporte'', ''can_view'')
          OR app_private.has_permission(''rh-colaboradores'', ''can_view'')
          OR app_private.is_own_employee(vr.employee_id)
        )
    )'
  );
  PERFORM app_private.apply_policy(t, 'vt_routes_insert_rh', 'INSERT', NULL, 'app_private.has_permission(''rh-vale-transporte'', ''can_include'')');
  PERFORM app_private.apply_policy(t, 'vt_routes_update_rh', 'UPDATE', 'app_private.has_permission(''rh-vale-transporte'', ''can_edit'')', 'app_private.has_permission(''rh-vale-transporte'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'vt_routes_delete_rh', 'DELETE', 'app_private.has_permission(''rh-vale-transporte'', ''can_delete'')');

  t := app_private.enable_rls_if_exists('audit_logs');
  PERFORM app_private.apply_policy(t, 'audit_logs_select_rh', 'SELECT', 'app_private.has_permission(''rh-auditoria'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'audit_logs_insert_own', 'INSERT', NULL, 'user_id = auth.uid()');

  t := app_private.enable_rls_if_exists('import_logs');
  PERFORM app_private.apply_policy(t, 'import_logs_select_rh', 'SELECT', 'app_private.has_permission(''rh-importacoes'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'import_logs_insert_rh', 'INSERT', NULL, 'app_private.has_permission(''rh-importacoes'', ''can_include'')');
END $$;

DO $$
DECLARE
  t regclass;
BEGIN
  t := app_private.enable_rls_if_exists('commercial_entities');
  PERFORM app_private.apply_policy(t, 'commercial_entities_select_permitted', 'SELECT', 'app_private.has_permission(''comercial-agentes'', ''can_view'') OR app_private.has_permission(''comercial-estrutura'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'commercial_entities_insert_permitted', 'INSERT', NULL, 'app_private.has_permission(''comercial-agentes'', ''can_include'')');
  PERFORM app_private.apply_policy(t, 'commercial_entities_update_permitted', 'UPDATE', 'app_private.has_permission(''comercial-agentes'', ''can_edit'') OR app_private.has_permission(''comercial-agentes'', ''can_activate_inactivate'')', 'app_private.has_permission(''comercial-agentes'', ''can_edit'') OR app_private.has_permission(''comercial-agentes'', ''can_activate_inactivate'')');
  PERFORM app_private.apply_policy(t, 'commercial_entities_delete_permitted', 'DELETE', 'app_private.has_permission(''comercial-agentes'', ''can_delete'')');

  t := app_private.enable_rls_if_exists('resend_config');
  PERFORM app_private.apply_policy(t, 'resend_config_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-email'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'resend_config_insert_permitted', 'INSERT', NULL, 'app_private.has_permission(''sistema-config-email'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'resend_config_update_permitted', 'UPDATE', 'app_private.has_permission(''sistema-config-email'', ''can_edit'')', 'app_private.has_permission(''sistema-config-email'', ''can_edit'')');

  t := app_private.enable_rls_if_exists('zapi_config');
  PERFORM app_private.apply_policy(t, 'zapi_config_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-whatsapp'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'zapi_config_insert_permitted', 'INSERT', NULL, 'app_private.has_permission(''sistema-config-whatsapp'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'zapi_config_update_permitted', 'UPDATE', 'app_private.has_permission(''sistema-config-whatsapp'', ''can_edit'')', 'app_private.has_permission(''sistema-config-whatsapp'', ''can_edit'')');

  t := app_private.enable_rls_if_exists('assinafy_config');
  PERFORM app_private.apply_policy(t, 'assinafy_config_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-assinatura'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'assinafy_config_insert_permitted', 'INSERT', NULL, 'app_private.has_permission(''sistema-config-assinatura'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'assinafy_config_update_permitted', 'UPDATE', 'app_private.has_permission(''sistema-config-assinatura'', ''can_edit'')', 'app_private.has_permission(''sistema-config-assinatura'', ''can_edit'')');

  t := app_private.enable_rls_if_exists('company_profiles');
  PERFORM app_private.apply_policy(t, 'company_profiles_select_permitted', 'SELECT', 'app_private.has_permission(''sistema-config-empresa'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'company_profiles_insert_permitted', 'INSERT', NULL, 'app_private.has_permission(''sistema-config-empresa'', ''can_include'')');
  PERFORM app_private.apply_policy(t, 'company_profiles_update_permitted', 'UPDATE', 'app_private.has_permission(''sistema-config-empresa'', ''can_edit'') OR app_private.has_permission(''sistema-config-empresa'', ''can_activate_inactivate'')', 'app_private.has_permission(''sistema-config-empresa'', ''can_edit'') OR app_private.has_permission(''sistema-config-empresa'', ''can_activate_inactivate'')');
  PERFORM app_private.apply_policy(t, 'company_profiles_delete_permitted', 'DELETE', 'app_private.has_permission(''sistema-config-empresa'', ''can_delete'')');

  t := app_private.enable_rls_if_exists('partner_forms');
  PERFORM app_private.apply_policy(t, 'partner_forms_select_permitted', 'SELECT', 'app_private.has_permission(''scp-construtor'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'partner_forms_insert_permitted', 'INSERT', NULL, 'app_private.has_permission(''scp-construtor'', ''can_include'')');
  PERFORM app_private.apply_policy(t, 'partner_forms_update_permitted', 'UPDATE', 'app_private.has_permission(''scp-construtor'', ''can_edit'')', 'app_private.has_permission(''scp-construtor'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'partner_forms_delete_permitted', 'DELETE', 'app_private.has_permission(''scp-construtor'', ''can_delete'')');

  t := app_private.enable_rls_if_exists('agentes_parceiros');
  PERFORM app_private.apply_policy(t, 'agentes_parceiros_select_permitted', 'SELECT', 'app_private.has_permission(''scp-crm'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'agentes_parceiros_insert_permitted', 'INSERT', NULL, 'app_private.has_permission(''scp-crm'', ''can_include'')');
  PERFORM app_private.apply_policy(t, 'agentes_parceiros_update_permitted', 'UPDATE', 'app_private.has_permission(''scp-crm'', ''can_edit'')', 'app_private.has_permission(''scp-crm'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'agentes_parceiros_delete_permitted', 'DELETE', 'app_private.has_permission(''scp-crm'', ''can_delete'')');

  t := app_private.enable_rls_if_exists('contract_templates');
  PERFORM app_private.apply_policy(t, 'contract_templates_select_permitted', 'SELECT', 'app_private.has_permission(''scp-documentos'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'contract_templates_insert_permitted', 'INSERT', NULL, 'app_private.has_permission(''scp-documentos'', ''can_include'')');
  PERFORM app_private.apply_policy(t, 'contract_templates_update_permitted', 'UPDATE', 'app_private.has_permission(''scp-documentos'', ''can_edit'')', 'app_private.has_permission(''scp-documentos'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'contract_templates_delete_permitted', 'DELETE', 'app_private.has_permission(''scp-documentos'', ''can_delete'')');

  t := app_private.enable_rls_if_exists('email_templates');
  PERFORM app_private.apply_policy(t, 'email_templates_select_permitted', 'SELECT', 'app_private.has_permission(''scp-emails'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'email_templates_insert_permitted', 'INSERT', NULL, 'app_private.has_permission(''scp-emails'', ''can_include'')');
  PERFORM app_private.apply_policy(t, 'email_templates_update_permitted', 'UPDATE', 'app_private.has_permission(''scp-emails'', ''can_edit'')', 'app_private.has_permission(''scp-emails'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'email_templates_delete_permitted', 'DELETE', 'app_private.has_permission(''scp-emails'', ''can_delete'')');

  t := app_private.enable_rls_if_exists('whatsapp_templates');
  PERFORM app_private.apply_policy(t, 'whatsapp_templates_select_permitted', 'SELECT', 'app_private.has_permission(''scp-whatsapp'', ''can_view'')');
  PERFORM app_private.apply_policy(t, 'whatsapp_templates_insert_permitted', 'INSERT', NULL, 'app_private.has_permission(''scp-whatsapp'', ''can_include'')');
  PERFORM app_private.apply_policy(t, 'whatsapp_templates_update_permitted', 'UPDATE', 'app_private.has_permission(''scp-whatsapp'', ''can_edit'')', 'app_private.has_permission(''scp-whatsapp'', ''can_edit'')');
  PERFORM app_private.apply_policy(t, 'whatsapp_templates_delete_permitted', 'DELETE', 'app_private.has_permission(''scp-whatsapp'', ''can_delete'')');
END $$;

DO $$
DECLARE
  t regclass;
  process_select text := 'app_private.has_permission(''scp-processos'', ''can_view'') OR app_private.has_permission(''scp-crm'', ''can_view'')';
  process_write text := 'app_private.has_permission(''scp-processos'', ''can_edit'') OR app_private.has_permission(''scp-processos'', ''can_include'')';
BEGIN
  FOREACH t IN ARRAY ARRAY[
    app_private.enable_rls_if_exists('process_models'),
    app_private.enable_rls_if_exists('process_stage_models'),
    app_private.enable_rls_if_exists('process_instances'),
    app_private.enable_rls_if_exists('process_instance_form_snapshots'),
    app_private.enable_rls_if_exists('process_instance_fields'),
    app_private.enable_rls_if_exists('process_instance_validations'),
    app_private.enable_rls_if_exists('process_instance_events')
  ]
  LOOP
    PERFORM app_private.apply_policy(t, 'process_select_permitted', 'SELECT', process_select);
    PERFORM app_private.apply_policy(t, 'process_insert_permitted', 'INSERT', NULL, process_write);
    PERFORM app_private.apply_policy(t, 'process_update_permitted', 'UPDATE', process_write || ' OR app_private.has_permission(''scp-crm'', ''can_edit'')', process_write || ' OR app_private.has_permission(''scp-crm'', ''can_edit'')');
    PERFORM app_private.apply_policy(t, 'process_delete_permitted', 'DELETE', 'app_private.has_permission(''scp-processos'', ''can_delete'')');
  END LOOP;
END $$;

DO $$
DECLARE
  t regclass;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    app_private.enable_rls_if_exists('praise_messages'),
    app_private.enable_rls_if_exists('praise_reactions'),
    app_private.enable_rls_if_exists('praise_notifications'),
    app_private.enable_rls_if_exists('cpfhub_cache')
  ]
  LOOP
    -- These tables are intentionally server-action/service-role only for now.
    NULL;
  END LOOP;
END $$;
