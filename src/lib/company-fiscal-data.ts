import { onlyDigits } from '@/lib/company-bank-accounts'
import {
  createEmptyTaxRegimeConfiguration,
  formatPercentSequence,
  formatPercentTotal,
  normalizeTaxRegimeConfig,
  type TaxRateField,
  type TaxRegimeConfiguration,
} from '@/lib/tax-regimes'

export type FiscalRateField = TaxRateField

export type FiscalCatalogReference = {
  id?: string
  code: string
  description: string
}

export type FiscalFigureRecord = {
  id: string
  tax_regime_id: string
  tax_regime_name: string
  tax_regime_version_id?: string
  tax_regime_version_name?: string
  effective_from: string
  effective_to: string | null
  cnae: FiscalCatalogReference
  ctn: FiscalCatalogReference
  nbs: FiscalCatalogReference
  config: TaxRegimeConfiguration
}

export type CompanyFiscalData = {
  tax_regime_id: string
  tax_regime_name: string
  figures: FiscalFigureRecord[]
}

type RawRecord = Record<string, unknown>

function createId() {
  return globalThis.crypto?.randomUUID?.() || `company-fiscal-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isRecord(value: unknown): value is RawRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function cloneConfig(config: TaxRegimeConfiguration) {
  return typeof structuredClone === 'function'
    ? structuredClone(config)
    : JSON.parse(JSON.stringify(config)) as TaxRegimeConfiguration
}

function normalizeText(value: unknown, maxLength = 500) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function normalizeDigits(value: unknown, maxDigits: number) {
  return onlyDigits(String(value || '')).slice(0, maxDigits)
}

function normalizeCatalogReference(
  raw: unknown,
  maxDigits: number,
  aliases: string[] = [],
): FiscalCatalogReference {
  const record = isRecord(raw) ? raw : {}
  const rawCode =
    record.code ??
    record.codigo ??
    record.value ??
    record.number ??
    aliases.map((alias) => record[alias]).find((value) => value !== undefined)

  return {
    id: record.id ? String(record.id) : undefined,
    code: normalizeDigits(rawCode, maxDigits),
    description: normalizeText(record.description ?? record.descricao ?? record.name ?? record.nome ?? '', 500),
  }
}

function createEmptyCatalogReference(): FiscalCatalogReference {
  return {
    id: undefined,
    code: '',
    description: '',
  }
}

function normalizeFigureConfig(raw: unknown): TaxRegimeConfiguration {
  const record = isRecord(raw) ? raw : {}
  const source = record.config ?? record.tax_regime_config ?? record.taxRegimeConfig ?? record
  return normalizeTaxRegimeConfig(source)
}

function normalizeLegacyConfig(raw: RawRecord) {
  return normalizeTaxRegimeConfig({
    section_1: raw.nfse_without_credit ?? raw.section_1 ?? raw.section1,
    section_2: raw.nfse_with_credit ?? raw.section_2 ?? raw.section2,
    section_3: raw.credit_pleno ?? raw.section_3 ?? raw.section3,
    section_4: raw.withheld_taxes ?? raw.section_4 ?? raw.section4,
  })
}

function normalizeFigureRecord(raw: unknown, fallbackConfig?: TaxRegimeConfiguration): FiscalFigureRecord {
  const record = isRecord(raw) ? raw : {}
  const config = normalizeFigureConfig(record)
  const effectiveConfig = JSON.stringify(config) === JSON.stringify(createEmptyTaxRegimeConfiguration())
    && fallbackConfig
    ? cloneConfig(fallbackConfig)
    : config

  return {
    id: record.id ? String(record.id) : createId(),
    tax_regime_id: String(record.tax_regime_id ?? record.regime_id ?? record.tax_regime ?? ''),
    tax_regime_name: normalizeText(record.tax_regime_name ?? record.regime_name ?? record.tax_regime_label ?? '', 120),
    tax_regime_version_id: record.tax_regime_version_id ? String(record.tax_regime_version_id) : undefined,
    tax_regime_version_name: normalizeText(record.tax_regime_version_name ?? record.version_name ?? '', 120) || undefined,
    effective_from: normalizeText(record.effective_from ?? record.vigencia_inicio ?? record.start_date ?? '', 10),
    effective_to:
      record.effective_to === null
        ? null
        : normalizeText(record.effective_to ?? record.vigencia_fim ?? record.end_date ?? '', 10) || null,
    cnae: normalizeCatalogReference(record.cnae ?? record.cnae_data, 7, ['cnae_code', 'cnaeCode']),
    ctn: normalizeCatalogReference(record.ctn ?? record.ctn_data, 6, ['ctn_code', 'ctnCode']),
    nbs: normalizeCatalogReference(record.nbs ?? record.nbs_data, 9, ['nbs_code', 'nbsCode']),
    config: cloneConfig(effectiveConfig),
  }
}

function normalizeLegacyFigureFromPair(raw: unknown, fallbackConfig?: TaxRegimeConfiguration): FiscalFigureRecord | null {
  const record = isRecord(raw) ? raw : {}
  const hasAnyCode =
    !!record.ctn ||
    !!record.nbs ||
    !!record.cnae ||
    !!record.ctn_code ||
    !!record.nbs_code ||
    !!record.cnae_code

  if (!hasAnyCode && !fallbackConfig) return null

  return {
    id: record.id ? String(record.id) : createId(),
    tax_regime_id: String(record.tax_regime_id ?? record.regime_id ?? record.tax_regime ?? ''),
    tax_regime_name: normalizeText(record.tax_regime_name ?? record.regime_name ?? record.tax_regime_label ?? '', 120),
    tax_regime_version_id: record.tax_regime_version_id ? String(record.tax_regime_version_id) : undefined,
    tax_regime_version_name: normalizeText(record.tax_regime_version_name ?? record.version_name ?? '', 120) || undefined,
    effective_from: normalizeText(record.effective_from ?? record.vigencia_inicio ?? record.start_date ?? '', 10),
    effective_to:
      record.effective_to === null
        ? null
        : normalizeText(record.effective_to ?? record.vigencia_fim ?? record.end_date ?? '', 10) || null,
    cnae: normalizeCatalogReference(record.cnae, 7),
    ctn: normalizeCatalogReference(record.ctn, 6, ['ctn_code', 'ctnCode']),
    nbs: normalizeCatalogReference(record.nbs, 9, ['nbs_code', 'nbsCode']),
    config: cloneConfig(fallbackConfig || createEmptyTaxRegimeConfiguration()),
  }
}

export function calculateFiscalRateSum(fields: Array<FiscalRateField | null | undefined>) {
  const total = fields.reduce((accumulator, field) => {
    if (!field?.enabled) return accumulator
    const digits = String(field.value || '').replace(/\D/g, '').slice(0, 4).padStart(4, '0')
    const rate = Number(`${digits.slice(0, 2)}.${digits.slice(2)}`) || 0
    return accumulator + rate
  }, 0)

  return formatPercentTotal(total)
}

export function createEmptyFiscalFigure(): FiscalFigureRecord {
  return {
    id: createId(),
    tax_regime_id: '',
    tax_regime_name: '',
    effective_from: '',
    effective_to: null,
    cnae: createEmptyCatalogReference(),
    ctn: createEmptyCatalogReference(),
    nbs: createEmptyCatalogReference(),
    config: createEmptyTaxRegimeConfiguration(),
  }
}

export function createEmptyCompanyFiscalData(): CompanyFiscalData {
  return {
    tax_regime_id: '',
    tax_regime_name: '',
    figures: [],
  }
}

function normalizeFigureList(raw: RawRecord, fallbackConfig?: TaxRegimeConfiguration) {
  const figuresRaw = Array.isArray(raw.figures)
    ? raw.figures
    : Array.isArray(raw.fiscal_figures)
      ? raw.fiscal_figures
      : Array.isArray(raw.figuras)
        ? raw.figuras
        : []

  if (figuresRaw.length > 0) {
    return figuresRaw.map((figure) => normalizeFigureRecord(figure, fallbackConfig))
  }

  const legacyPairs = Array.isArray(raw.fiscal_code_pairs) ? raw.fiscal_code_pairs : []
  if (legacyPairs.length > 0) {
    return legacyPairs
      .map((pair) => normalizeLegacyFigureFromPair(pair, fallbackConfig))
      .filter((item): item is FiscalFigureRecord => !!item)
  }

  return []
}

export function normalizeCompanyFiscalData(input: unknown): CompanyFiscalData {
  const record = isRecord(input) ? input : {}
  const taxRegimeId = String(record.tax_regime_id ?? record.regime_id ?? record.tax_regime_uuid ?? '')
  const taxRegimeName = normalizeText(record.tax_regime_name ?? record.regime_name ?? record.tax_regime ?? '', 120)
  const fallbackConfig = normalizeLegacyConfig(record)
  const figures = normalizeFigureList(record, fallbackConfig)

  return {
    tax_regime_id: taxRegimeId,
    tax_regime_name: taxRegimeName,
    figures,
  }
}
