import { onlyDigits } from '@/lib/company-bank-accounts'

export type TaxRegime = 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'

export type FiscalRateField = {
  enabled: boolean
  value: string
}

export type FiscalCodeRow = {
  id: string
  code: string
  description: string
}

export type FiscalCodePair = {
  id: string
  ctn: FiscalCodeRow
  nbs: FiscalCodeRow
}

export type CompanyFiscalData = {
  tax_regime: TaxRegime
  fiscal_code_pairs: FiscalCodePair[]
  withheld_taxes: {
    irpj: FiscalRateField
    csll: FiscalRateField
    pis: FiscalRateField
    cofins: FiscalRateField
    cbs: FiscalRateField
    ibs: FiscalRateField
    totalizer: string
  }
  nfse_without_credit: {
    simples_nacional: FiscalRateField
    iss: FiscalRateField
    total: string
  }
  nfse_with_credit: {
    pis: FiscalRateField
    cofins: FiscalRateField
    cbs: FiscalRateField
    ibs: FiscalRateField
    total: string
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `fiscal-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function normalizePercentDigits(value: string) {
  return onlyDigits(String(value || '')).slice(0, 4)
}

export function normalizeCodeDigits(value: string, maxLength: number) {
  return onlyDigits(String(value || '')).slice(0, maxLength)
}

export function formatPercentSequence(value: string) {
  const digits = normalizePercentDigits(value).padStart(4, '0')
  return `${digits.slice(0, 2)},${digits.slice(2)}`
}

export function percentSequenceToNumber(value: string) {
  const digits = normalizePercentDigits(value).padStart(4, '0')
  return Number(`${digits.slice(0, 2)}.${digits.slice(2)}`) || 0
}

export function numberToPercentSequence(value: number) {
  const cents = Math.max(0, Math.round(Number(value || 0) * 100))
  return String(cents).padStart(4, '0').slice(-4)
}

export function formatPercentValue(value: string) {
  return formatPercentSequence(value)
}

export function createEmptyFiscalRateField(enabled = false): FiscalRateField {
  return {
    enabled,
    value: '',
  }
}

export function createEmptyFiscalCodeRow(): FiscalCodeRow {
  return {
    id: createId(),
    code: '',
    description: '',
  }
}

export function createEmptyFiscalCodePair(): FiscalCodePair {
  return {
    id: createId(),
    ctn: createEmptyFiscalCodeRow(),
    nbs: createEmptyFiscalCodeRow(),
  }
}

export function createEmptyCompanyFiscalData(): CompanyFiscalData {
  return {
    tax_regime: 'Lucro Real',
    fiscal_code_pairs: [createEmptyFiscalCodePair()],
    withheld_taxes: {
      irpj: createEmptyFiscalRateField(),
      csll: createEmptyFiscalRateField(),
      pis: createEmptyFiscalRateField(),
      cofins: createEmptyFiscalRateField(),
      cbs: createEmptyFiscalRateField(),
      ibs: createEmptyFiscalRateField(),
      totalizer: '00,00',
    },
    nfse_without_credit: {
      simples_nacional: createEmptyFiscalRateField(),
      iss: createEmptyFiscalRateField(),
      total: '00,00',
    },
    nfse_with_credit: {
      pis: createEmptyFiscalRateField(),
      cofins: createEmptyFiscalRateField(),
      cbs: createEmptyFiscalRateField(),
      ibs: createEmptyFiscalRateField(),
      total: '00,00',
    },
  }
}

function normalizeRateField(raw: unknown): FiscalRateField {
  const record = isRecord(raw) ? raw : {}
  const enabled = !!record.enabled || !!record.is_enabled || !!record.active
  return {
    enabled,
    value: normalizePercentDigits(String(record.value ?? record.amount ?? record.rate ?? '')),
  }
}

function normalizeFiscalCodeRow(rawRow: unknown, maxLength: number) {
  const record = isRecord(rawRow) ? rawRow : {}
  return {
    id: String(record.id || createId()),
    code: normalizeCodeDigits(String(record.code || record.ctn || record.nbs || ''), maxLength),
    description: String(record.description || record.descricao || '').slice(0, 100),
  }
}

function normalizeFiscalCodePairs(rawPairs: unknown, rawCtnRows: unknown, rawNbsRows: unknown) {
  if (Array.isArray(rawPairs) && rawPairs.length > 0) {
    const normalizedPairs = rawPairs
      .map((pair) => {
        const record = isRecord(pair) ? pair : {}
        const ctn = normalizeFiscalCodeRow(record.ctn ?? record.ctn_authorized ?? pair, 6)
        const nbs = normalizeFiscalCodeRow(record.nbs ?? record.nbs_authorized ?? pair, 9)
        return {
          id: String(record.id || createId()),
          ctn,
          nbs,
        }
      })
      .filter((pair) => pair.id)

    if (normalizedPairs.length > 0) return normalizedPairs
  }

  const ctnRows = Array.isArray(rawCtnRows) ? rawCtnRows : []
  const nbsRows = Array.isArray(rawNbsRows) ? rawNbsRows : []
  const length = Math.max(ctnRows.length, nbsRows.length, 1)

  const pairs = Array.from({ length }, (_, index) => ({
    id: createId(),
    ctn: normalizeFiscalCodeRow(ctnRows[index], 6),
    nbs: normalizeFiscalCodeRow(nbsRows[index], 9),
  }))

  return pairs
}

function sumEnabledRates(fields: FiscalRateField[]) {
  return fields.reduce((total, field) => (field.enabled ? total + percentSequenceToNumber(field.value) : total), 0)
}

function formatPercentTotal(value: number) {
  return Number(value || 0).toFixed(2).replace('.', ',')
}

export function normalizeCompanyFiscalData(input: unknown): CompanyFiscalData {
  const raw = isRecord(input) ? input : {}
  const withheld = isRecord(raw.withheld_taxes) ? raw.withheld_taxes : {}
  const withoutCredit = isRecord(raw.nfse_without_credit) ? raw.nfse_without_credit : {}
  const withCredit = isRecord(raw.nfse_with_credit) ? raw.nfse_with_credit : {}

  const normalized: CompanyFiscalData = {
    tax_regime:
      raw.tax_regime === 'Lucro Presumido' || raw.tax_regime === 'Simples Nacional'
        ? raw.tax_regime
        : 'Lucro Real',
    fiscal_code_pairs: normalizeFiscalCodePairs(
      raw.fiscal_code_pairs ?? raw.fiscal_codes ?? raw.ctn_nbs_pairs,
      raw.ctn_authorized ?? raw.ctn ?? raw.ctn_rows,
      raw.nbs_authorized ?? raw.nbs ?? raw.nbs_rows,
    ),
    withheld_taxes: {
      irpj: normalizeRateField(withheld.irpj),
      csll: normalizeRateField(withheld.csll),
      pis: normalizeRateField(withheld.pis),
      cofins: normalizeRateField(withheld.cofins),
      cbs: normalizeRateField(withheld.cbs),
      ibs: normalizeRateField(withheld.ibs),
      totalizer: '00,00',
    },
    nfse_without_credit: {
      simples_nacional: normalizeRateField(withoutCredit.simples_nacional ?? withoutCredit.simples ?? raw.simples_nacional),
      iss: normalizeRateField(withoutCredit.iss ?? raw.iss),
      total: '00,00',
    },
    nfse_with_credit: {
      pis: normalizeRateField(withCredit.pis ?? raw.credit_pis),
      cofins: normalizeRateField(withCredit.cofins ?? raw.credit_cofins),
      cbs: normalizeRateField(withCredit.cbs ?? raw.credit_cbs),
      ibs: normalizeRateField(withCredit.ibs ?? raw.credit_ibs),
      total: '00,00',
    },
  }

  normalized.withheld_taxes.totalizer = formatPercentTotal(
    sumEnabledRates([
      normalized.withheld_taxes.irpj,
      normalized.withheld_taxes.csll,
      normalized.withheld_taxes.pis,
      normalized.withheld_taxes.cofins,
      normalized.withheld_taxes.cbs,
      normalized.withheld_taxes.ibs,
    ]),
  )

  normalized.nfse_without_credit.total = formatPercentTotal(
    sumEnabledRates([
      normalized.nfse_without_credit.simples_nacional,
      normalized.nfse_without_credit.iss,
    ]) + percentSequenceToNumber(normalized.withheld_taxes.totalizer.replace(',', '.')),
  )

  normalized.nfse_with_credit.total = formatPercentTotal(
    sumEnabledRates([
      normalized.nfse_with_credit.pis,
      normalized.nfse_with_credit.cofins,
      normalized.nfse_with_credit.cbs,
      normalized.nfse_with_credit.ibs,
    ]),
  )

  return normalized
}

export function getFiscalRateFieldDisplay(field: FiscalRateField) {
  return formatPercentSequence(field.value)
}

export function calculateFiscalRateSum(fields: FiscalRateField[]) {
  return formatPercentTotal(sumEnabledRates(fields))
}

export function getCompanyFiscalDirectTotal(fiscalData: CompanyFiscalData) {
  const withheld = percentSequenceToNumber(fiscalData.withheld_taxes.totalizer.replace(',', '.'))
  const simple = fiscalData.nfse_without_credit.simples_nacional.enabled
    ? percentSequenceToNumber(fiscalData.nfse_without_credit.simples_nacional.value)
    : 0
  const iss = fiscalData.nfse_without_credit.iss.enabled
    ? percentSequenceToNumber(fiscalData.nfse_without_credit.iss.value)
    : 0
  return formatPercentTotal(withheld + simple + iss)
}
