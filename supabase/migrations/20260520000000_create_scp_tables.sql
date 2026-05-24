-- Migração: Criação de tabelas e colunas para o Sistema de Cadastro de Parceiros (SCP)
-- Data: 2026-05-20

-- =========================================================================
-- 1. Tabela: commercial_entities (Entidades Comerciais)
-- =========================================================================

CREATE TABLE IF NOT EXISTS commercial_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  cpf_cnpj TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superintendente', 'supervisor', 'gerente')),
  parent_id UUID REFERENCES commercial_entities(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'ativo' NOT NULL CHECK (status IN ('ativo', 'inativo')),
  
  -- Campos de Acesso e Perfil do ARW
  arw_code TEXT,
  filial TEXT,
  nivel_acesso TEXT,
  tipo_agente TEXT,
  regra_fisico TEXT,
  
  -- Contatos
  phone_whatsapp TEXT,
  email_comissao TEXT,
  
  -- Google Drive Folder Link
  google_drive_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 2. Extensões na tabela existente 'users'
-- =========================================================================

-- Adiciona coluna de papel comercial
ALTER TABLE users ADD COLUMN IF NOT EXISTS commercial_role TEXT;

-- Adiciona referências hierárquicas vinculando aos nós da estrutura comercial
ALTER TABLE users ADD COLUMN IF NOT EXISTS superintendente_id UUID REFERENCES commercial_entities(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES commercial_entities(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gerente_id UUID REFERENCES commercial_entities(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- =========================================================================
-- 3. Tabela: resend_config (Configurações do Resend)
-- =========================================================================

CREATE TABLE IF NOT EXISTS resend_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL,
  from_email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insere um registro padrão vazio se não existir
INSERT INTO resend_config (api_key, from_email, is_active)
SELECT '', '', false
WHERE NOT EXISTS (SELECT 1 FROM resend_config);

-- =========================================================================
-- 4. Tabela: zapi_config (Configurações da Z-API)
-- =========================================================================

CREATE TABLE IF NOT EXISTS zapi_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id TEXT NOT NULL,
  token TEXT NOT NULL,
  client_key TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insere um registro padrão vazio se não existir
INSERT INTO zapi_config (instance_id, token, client_key, is_active)
SELECT '', '', '', false
WHERE NOT EXISTS (SELECT 1 FROM zapi_config);

-- =========================================================================
-- 5. Tabela: partner_forms (Formulários do SCP)
-- =========================================================================

CREATE TABLE IF NOT EXISTS partner_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 6. Tabela: agentes_parceiros (Cadastro e CRM)
-- =========================================================================

CREATE TABLE IF NOT EXISTS agentes_parceiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES partner_forms(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'novo' NOT NULL CHECK (status IN ('novo', 'aguarda_assinatura', 'assinatura_realizada', 'validacao_final', 'finalizado')),
  
  -- Dados Pessoais / Jurídicos do ARW
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
  
  -- Endereço
  cep TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  
  -- Contatos
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
  
  -- Dados Bancários (Comissão)
  commission_receive_type TEXT,
  bank_code TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  bank_account_type TEXT,
  pix_type TEXT,
  pix_key TEXT,
  
  -- Acesso e Perfis do ARW
  filial TEXT,
  nivel_acesso TEXT,
  tipo_agente TEXT,
  regra_fisico TEXT,
  arw_code TEXT UNIQUE,
  temporary_password TEXT,
  
  -- Google Drive Folder Link
  google_drive_url TEXT,
  
  -- Respostas Dinâmicas do Formulário
  additional_data JSONB DEFAULT '{}'::jsonb,
  
  -- Hierarquia Comercial Responsável
  superintendente_id UUID REFERENCES commercial_entities(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES commercial_entities(id) ON DELETE SET NULL,
  gerente_id UUID REFERENCES commercial_entities(id) ON DELETE SET NULL,
  
  -- Integração Assinafy
  assinafy_document_id TEXT,
  assinafy_signature_url TEXT,
  contract_pdf_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 7. Tabela: contract_templates
-- =========================================================================

CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 8. Tabela: email_templates
-- =========================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 9. Gatilhos Automáticos (Triggers)
-- =========================================================================

-- Trigger para atualizar automaticamente o update_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_timestamp_commercial_entities
BEFORE UPDATE ON commercial_entities
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_resend_config
BEFORE UPDATE ON resend_config
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_zapi_config
BEFORE UPDATE ON zapi_config
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_partner_forms
BEFORE UPDATE ON partner_forms
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_agentes_parceiros
BEFORE UPDATE ON agentes_parceiros
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Trigger para vincular funcionário CLT por CPF no cadastro do usuário
CREATE OR REPLACE FUNCTION link_employee_by_cpf()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_id UUID;
BEGIN
  IF NEW.cpf IS NOT NULL AND NEW.cpf <> '' THEN
    -- Busca na tabela employees o funcionário correspondente
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
FOR EACH ROW
EXECUTE FUNCTION link_employee_by_cpf();
