-- =========================================================================
-- MIGRAÇÃO COMPLETA SCP - Execute no Supabase SQL Editor
-- https://supabase.com/dashboard/project/gazwohjfigvcycnukdwj/sql/new
-- =========================================================================

-- 1. Tabela: resend_config
CREATE TABLE IF NOT EXISTS resend_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL,
  from_email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
INSERT INTO resend_config (api_key, from_email, is_active)
SELECT '', '', false
WHERE NOT EXISTS (SELECT 1 FROM resend_config);

-- 2. Tabela: zapi_config
CREATE TABLE IF NOT EXISTS zapi_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id TEXT NOT NULL,
  token TEXT NOT NULL,
  client_key TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
INSERT INTO zapi_config (instance_id, token, client_key, is_active)
SELECT '', '', '', false
WHERE NOT EXISTS (SELECT 1 FROM zapi_config);

-- 3. Tabela: partner_forms
CREATE TABLE IF NOT EXISTS partner_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 4. Tabela: agentes_parceiros
CREATE TABLE IF NOT EXISTS agentes_parceiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES partner_forms(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'novo' NOT NULL CHECK (status IN ('novo', 'aguarda_assinatura', 'assinatura_realizada', 'validacao_final', 'finalizado')),
  person_type TEXT NOT NULL CHECK (person_type IN ('PF', 'PJ')),
  cpf_cnpj TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  fantasy_name TEXT,
  representante_legal TEXT,
  rg TEXT,
  rg_expedition_date DATE,
  rg_issuer TEXT,
  rg_state TEXT,
  birth_date DATE,
  cep TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  phone_whatsapp TEXT NOT NULL,
  phone_whatsapp_financeiro TEXT,
  phone_commercial TEXT,
  phone_residential TEXT,
  phone_support TEXT,
  email_comissao TEXT NOT NULL,
  email_informe TEXT,
  email_formalizacao TEXT,
  email_proposta TEXT,
  email_mesa_liberacao TEXT,
  email_juridico TEXT,
  email_proprio_cunho TEXT,
  commission_receive_type TEXT,
  bank_code TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  bank_account_type TEXT,
  pix_type TEXT,
  pix_key TEXT,
  filial TEXT,
  nivel_acesso TEXT,
  tipo_agente TEXT,
  regra_fisico TEXT,
  arw_code TEXT UNIQUE,
  temporary_password TEXT,
  google_drive_url TEXT,
  additional_data JSONB DEFAULT '{}'::jsonb,
  superintendente_id UUID REFERENCES commercial_entities(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES commercial_entities(id) ON DELETE SET NULL,
  gerente_id UUID REFERENCES commercial_entities(id) ON DELETE SET NULL,
  assinafy_document_id TEXT,
  assinafy_signature_url TEXT,
  contract_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 5. Tabela: contract_templates
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 6. Tabela: email_templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 7. Triggers de updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_timestamp_resend_config
BEFORE UPDATE ON resend_config FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_zapi_config
BEFORE UPDATE ON zapi_config FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_partner_forms
BEFORE UPDATE ON partner_forms FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_agentes_parceiros
BEFORE UPDATE ON agentes_parceiros FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 8. Trigger para vincular funcionário CLT por CPF
CREATE OR REPLACE FUNCTION link_employee_by_cpf()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_id UUID;
BEGIN
  IF NEW.cpf IS NOT NULL AND NEW.cpf <> '' THEN
    SELECT id INTO v_employee_id FROM employees WHERE cpf = NEW.cpf LIMIT 1;
    NEW.employee_id := v_employee_id;
  ELSE
    NEW.employee_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_link_employee_by_cpf
BEFORE INSERT OR UPDATE OF cpf ON users
FOR EACH ROW EXECUTE FUNCTION link_employee_by_cpf();
