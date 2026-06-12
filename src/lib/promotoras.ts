import { createEmptyBankAccount, normalizeCompanyBankAccounts, type CompanyBankAccount } from '@/lib/company-bank-accounts'

export type PromotoraAddressData = {
  cep?: string
  logradouro?: string
  bairro?: string
  cidade?: string
  uf?: string
  numero?: string
  complemento?: string
  site_institucional?: string
  email_principal?: string
  contrato_url?: string
  drive_documentos_url?: string
  drive_logotipos_url?: string
}

export type PromotoraCommercialContact = {
  id: string
  commercial_type_id: string
  region_ufs: string[]
  cpf: string
  nome_completo: string
  data_nascimento: string
  email: string
  whatsapp: string
  data_inicial: string
  data_final: string
  is_active: boolean
}

export type PromotoraOperationalContact = {
  id: string
  sector_id: string
  nome_responsavel: string
  data_nascimento: string
  whatsapp: string
  email: string
  data_inicial: string
  data_final: string
  is_active: boolean
}

export type PromotoraFiscalData = {
  exige_nfse: boolean
  nfse_emission_type_id: string
  simples_nacional: string
  iss: string
  irpj_retido: string
  csll_retido: string
  pis_retido: string
  cofins_retido: string
  cbs_retido: string
  ibs_retido: string
  total_retencoes: string
  meio_envio_nfse: 'email' | 'sistema'
  nfse_email: string
  nfse_system_url: string
}

export type PromotoraFinancialData = {
  realiza_comissao: boolean
  solicitar_saque: boolean
  saque_dias: string[]
  saque_inicio: string
  saque_fim: string
  url_sistema: string
  prazo_pagamento: number
  flag_dia_pagamento: boolean
  dia_semana_ativo: boolean
  dia_semana_valor: string
  dia_mes_valor: string
  empresa_contratada_id: string
  conta_recebimento_index: string
  forma_recebimento_id: string
}

export type PromotoraSystemEntry = {
  id: string
  system_type_ids: string[]
  descricao: string
  url: string
  observacoes: string
  is_active: boolean
}

export type PromotoraRecord = {
  id?: string
  cnpj: string
  razao_social: string
  nome_fantasia: string
  logo_url: string
  address_data: PromotoraAddressData
  contacts_commercial: PromotoraCommercialContact[]
  contacts_operational: PromotoraOperationalContact[]
  fiscal_data: PromotoraFiscalData
  financial_data: PromotoraFinancialData
  bank_accounts: CompanyBankAccount[]
  systems: PromotoraSystemEntry[]
  is_active?: boolean
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `prom-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function onlyDigits(value: string) {
  return String(value || '').replace(/\D/g, '')
}

function normalizeText(value: any) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalizePercent(value: any) {
  const raw = String(value || '').replace(',', '.').replace(/[^0-9.]/g, '')
  if (!raw) return ''
  const parsed = Number(raw)
  if (Number.isNaN(parsed)) return ''
  return parsed.toFixed(2)
}

function normalizeUfList(value: any) {
  const list = Array.isArray(value) ? value : String(value || '').split(',')
  return [...new Set(list.map((uf) => normalizeText(uf).toUpperCase()).filter(Boolean))].sort()
}

function normalizeStringArray(value: any) {
  const list = Array.isArray(value) ? value : String(value || '').split(',')
  return [...new Set(list.map((item) => normalizeText(item)).filter(Boolean))]
}

function normalizeCommercialContacts(rows: any): PromotoraCommercialContact[] {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    id: normalizeText(row?.id) || createId(),
    commercial_type_id: normalizeText(row?.commercial_type_id),
    region_ufs: normalizeUfList(row?.region_ufs),
    cpf: onlyDigits(row?.cpf).slice(0, 11),
    nome_completo: normalizeText(row?.nome_completo),
    data_nascimento: normalizeText(row?.data_nascimento),
    email: normalizeText(row?.email).toLowerCase(),
    whatsapp: onlyDigits(row?.whatsapp).slice(0, 11),
    data_inicial: normalizeText(row?.data_inicial),
    data_final: normalizeText(row?.data_final),
    is_active: row?.is_active !== false,
  })).filter((row) =>
    Boolean(
      row.commercial_type_id ||
      row.region_ufs.length ||
      row.cpf ||
      row.nome_completo ||
      row.data_nascimento ||
      row.email ||
      row.whatsapp ||
      row.data_inicial ||
      row.data_final,
    ),
  )
}

function normalizeOperationalContacts(rows: any): PromotoraOperationalContact[] {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    id: normalizeText(row?.id) || createId(),
    sector_id: normalizeText(row?.sector_id),
    nome_responsavel: normalizeText(row?.nome_responsavel),
    data_nascimento: normalizeText(row?.data_nascimento),
    whatsapp: onlyDigits(row?.whatsapp).slice(0, 11),
    email: normalizeText(row?.email).toLowerCase(),
    data_inicial: normalizeText(row?.data_inicial),
    data_final: normalizeText(row?.data_final),
    is_active: row?.is_active !== false,
  })).filter((row) =>
    Boolean(
      row.sector_id ||
      row.nome_responsavel ||
      row.data_nascimento ||
      row.whatsapp ||
      row.email ||
      row.data_inicial ||
      row.data_final,
    ),
  )
}

function normalizeSystems(rows: any): PromotoraSystemEntry[] {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    id: normalizeText(row?.id) || createId(),
    system_type_ids: normalizeStringArray(row?.system_type_ids),
    descricao: normalizeText(row?.descricao),
    url: normalizeText(row?.url),
    observacoes: normalizeText(row?.observacoes),
    is_active: row?.is_active !== false,
  })).filter((row) =>
    Boolean(row.system_type_ids.length || row.descricao || row.url || row.observacoes),
  )
}

export function createEmptyPromotora(): PromotoraRecord {
  return {
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    logo_url: '',
    address_data: {
      cep: '',
      logradouro: '',
      bairro: '',
      cidade: '',
      uf: '',
      numero: '',
      complemento: '',
      site_institucional: '',
      email_principal: '',
      contrato_url: '',
      drive_documentos_url: '',
      drive_logotipos_url: '',
    },
    contacts_commercial: [],
    contacts_operational: [],
    fiscal_data: {
      exige_nfse: false,
      nfse_emission_type_id: '',
      simples_nacional: '',
      iss: '',
      irpj_retido: '',
      csll_retido: '',
      pis_retido: '',
      cofins_retido: '',
      cbs_retido: '',
      ibs_retido: '',
      total_retencoes: '',
      meio_envio_nfse: 'email',
      nfse_email: '',
      nfse_system_url: '',
    },
    financial_data: {
      realiza_comissao: false,
      solicitar_saque: false,
      saque_dias: [],
      saque_inicio: '',
      saque_fim: '',
      url_sistema: '',
      prazo_pagamento: 1,
      flag_dia_pagamento: false,
      dia_semana_ativo: true,
      dia_semana_valor: '',
      dia_mes_valor: '',
      empresa_contratada_id: '',
      conta_recebimento_index: '',
      forma_recebimento_id: '',
    },
    bank_accounts: [createEmptyBankAccount({ is_principal: true })],
    systems: [],
    is_active: true,
  }
}

export function normalizePromotoraRecord(input: Partial<PromotoraRecord> & Record<string, any>): PromotoraRecord {
  const cnpj = onlyDigits(input.cnpj || '').slice(0, 14)
  const baseAddress = input.address_data || {}
  const companyBankData = normalizeCompanyBankAccounts(
    { bank_accounts: Array.isArray(input.bank_accounts) ? input.bank_accounts : [] },
    cnpj,
  )
  const bankAccounts = (companyBankData.bank_accounts || []).filter((account: CompanyBankAccount) =>
    Boolean(
      account.bank_code ||
      account.bank_name ||
      account.bank_ispb ||
      account.bank_full_name ||
      account.bank_logo_data_url ||
      account.name ||
      account.bank_agency ||
      account.bank_account ||
      account.pix_key,
    ),
  )

  const fiscalData: PromotoraFiscalData = {
    exige_nfse: !!input.fiscal_data?.exige_nfse,
    nfse_emission_type_id: normalizeText(input.fiscal_data?.nfse_emission_type_id),
    simples_nacional: normalizePercent(input.fiscal_data?.simples_nacional),
    iss: normalizePercent(input.fiscal_data?.iss),
    irpj_retido: normalizePercent(input.fiscal_data?.irpj_retido),
    csll_retido: normalizePercent(input.fiscal_data?.csll_retido),
    pis_retido: normalizePercent(input.fiscal_data?.pis_retido),
    cofins_retido: normalizePercent(input.fiscal_data?.cofins_retido),
    cbs_retido: normalizePercent(input.fiscal_data?.cbs_retido),
    ibs_retido: normalizePercent(input.fiscal_data?.ibs_retido),
    total_retencoes: normalizePercent(input.fiscal_data?.total_retencoes),
    meio_envio_nfse: input.fiscal_data?.meio_envio_nfse === 'sistema' ? 'sistema' : 'email',
    nfse_email: normalizeText(input.fiscal_data?.nfse_email).toLowerCase(),
    nfse_system_url: normalizeText(input.fiscal_data?.nfse_system_url),
  }

  const financialData: PromotoraFinancialData = {
    realiza_comissao: !!input.financial_data?.realiza_comissao,
    solicitar_saque: !!input.financial_data?.solicitar_saque,
    saque_dias: normalizeStringArray(input.financial_data?.saque_dias),
    saque_inicio: normalizeText(input.financial_data?.saque_inicio),
    saque_fim: normalizeText(input.financial_data?.saque_fim),
    url_sistema: normalizeText(input.financial_data?.url_sistema),
    prazo_pagamento: Math.max(1, Math.min(99, Number(input.financial_data?.prazo_pagamento || 1) || 1)),
    flag_dia_pagamento: !!input.financial_data?.flag_dia_pagamento,
    dia_semana_ativo: input.financial_data?.dia_semana_ativo !== false,
    dia_semana_valor: normalizeText(input.financial_data?.dia_semana_valor),
    dia_mes_valor: normalizeText(input.financial_data?.dia_mes_valor),
    empresa_contratada_id: normalizeText(input.financial_data?.empresa_contratada_id),
    conta_recebimento_index: normalizeText(input.financial_data?.conta_recebimento_index),
    forma_recebimento_id: normalizeText(input.financial_data?.forma_recebimento_id),
  }

  const normalizedBankAccounts = bankAccounts

  return {
    id: input.id,
    cnpj,
    razao_social: normalizeText(input.razao_social),
    nome_fantasia: normalizeText(input.nome_fantasia),
    logo_url: normalizeText(input.logo_url),
    address_data: {
      cep: normalizeText(baseAddress.cep),
      logradouro: normalizeText(baseAddress.logradouro),
      bairro: normalizeText(baseAddress.bairro),
      cidade: normalizeText(baseAddress.cidade),
      uf: normalizeText(baseAddress.uf).toUpperCase(),
      numero: normalizeText(baseAddress.numero),
      complemento: normalizeText(baseAddress.complemento),
      site_institucional: normalizeText(baseAddress.site_institucional),
      email_principal: normalizeText(baseAddress.email_principal).toLowerCase(),
      contrato_url: normalizeText(baseAddress.contrato_url),
      drive_documentos_url: normalizeText(baseAddress.drive_documentos_url),
      drive_logotipos_url: normalizeText(baseAddress.drive_logotipos_url),
    },
    contacts_commercial: normalizeCommercialContacts(input.contacts_commercial),
    contacts_operational: normalizeOperationalContacts(input.contacts_operational),
    fiscal_data: fiscalData,
    financial_data: financialData,
    bank_accounts: normalizedBankAccounts,
    systems: normalizeSystems(input.systems),
    is_active: input.is_active !== false,
    deleted_at: input.deleted_at ?? null,
    created_at: input.created_at,
    updated_at: input.updated_at,
  }
}
