'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { getCnaes, getCtns, getNbses, getTaxRegimes } from '../../actions'
import { formatCnaeCode } from '@/lib/cnaes'
import { formatCtnCode } from '@/lib/ctns'
import { formatNbsCode } from '@/lib/nbs'
import {
  calculateFiscalRateSum,
  createEmptyFiscalFigure,
  normalizeCompanyFiscalData,
  type CompanyFiscalData,
  type FiscalCatalogReference,
  type FiscalFigureRecord,
  type FiscalRateField,
} from '@/lib/company-fiscal-data'
import {
  formatPercentSequence,
  getActiveTaxRegimeVersion,
  sortTaxRegimeVersions,
  type TaxRegimeConfiguration,
  type TaxRegimeRecord,
} from '@/lib/tax-regimes'
import { onlyDigits } from '@/lib/company-bank-accounts'
import { type CnaeRecord } from '@/lib/cnaes'
import { type CtnRecord } from '@/lib/ctns'
import { type NbsRecord } from '@/lib/nbs'

type Props = {
  value: CompanyFiscalData
  onChange: (next: CompanyFiscalData) => void
  onAutoSave?: () => void | Promise<void>
}

type CatalogOption = FiscalCatalogReference & {
  label: string
  active?: boolean
}

type RateItem = {
  key: keyof TaxRegimeConfiguration['section_1'] | keyof TaxRegimeConfiguration['section_2'] | keyof TaxRegimeConfiguration['section_3'] | keyof TaxRegimeConfiguration['section_4']
  label: string
  field: FiscalRateField
}

function deepCloneFigure(figure: FiscalFigureRecord): FiscalFigureRecord {
  return typeof structuredClone === 'function'
    ? structuredClone(figure)
    : (JSON.parse(JSON.stringify(figure)) as FiscalFigureRecord)
}

function formatDateForInput(value?: string | null) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const digits = String(value).replace(/\D/g, '').slice(0, 8)
  if (digits.length !== 8) return ''
  return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`
}

function formatDateForDisplay(value?: string | null) {
  if (!value) return '-'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  }
  return value
}

function formatCatalogLabel(value: FiscalCatalogReference, formatter: (code: string) => string) {
  if (!value?.code) return ''
  const code = formatter(value.code)
  return value.description ? `${code} - ${value.description}` : code
}

function normalizeCatalogQuery(value: string) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function resolveCatalogSelection(
  query: string,
  selected: FiscalCatalogReference,
  options: CatalogOption[],
  formatter: (code: string) => string,
): FiscalCatalogReference {
  const cleaned = query.trim()
  if (!cleaned) {
    return { id: undefined, code: '', description: '' }
  }

  const normalized = normalizeCatalogQuery(cleaned)
  const exact = options.find((option) => {
    const label = normalizeCatalogQuery(option.label)
    const description = normalizeCatalogQuery(option.description)
    const code = normalizeCatalogQuery(option.code)
    const formattedCode = normalizeCatalogQuery(formatter(option.code))
    return normalized === label || normalized === description || normalized === code || normalized === formattedCode
  })

  if (exact) {
    return {
      id: exact.id,
      code: exact.code,
      description: exact.description,
    }
  }

  return selected
}

function CatalogLookupField({
  label,
  value,
  options,
  formatter,
  placeholder,
  disabled,
  onSelect,
}: {
  label: string
  value: FiscalCatalogReference
  options: CatalogOption[]
  formatter: (code: string) => string
  placeholder: string
  disabled?: boolean
  onSelect: (next: FiscalCatalogReference) => void
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const skipNextBlurRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [query, setQuery] = useState(formatCatalogLabel(value, formatter))

  useEffect(() => {
    setQuery(formatCatalogLabel(value, formatter))
  }, [value.code, value.description, formatter])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const suggestions = useMemo(() => {
    const normalized = normalizeCatalogQuery(query)
    const base = options
      .filter((option) => {
        if (!normalized) return true
        const labelMatch = normalizeCatalogQuery(option.label).includes(normalized)
        const descriptionMatch = normalizeCatalogQuery(option.description).includes(normalized)
        const codeMatch = normalizeCatalogQuery(option.code).includes(normalized)
        return labelMatch || descriptionMatch || codeMatch
      })
    return base
  }, [options, query])

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1)
      return
    }

    setActiveIndex(suggestions.length > 0 ? 0 : -1)
  }, [open, suggestions.length])

  useEffect(() => {
    if (!open) return
    const current = listRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  return (
    <div ref={wrapperRef} style={{ minWidth: 180, position: 'relative' }}>
      <label
        style={{
          display: 'block',
          marginBottom: '0.35rem',
          fontSize: '0.72rem',
          fontWeight: 800,
          color: 'var(--brs-gray-600)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      <input
        ref={inputRef}
        className="form-control"
        value={query}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value
          setQuery(next)
          setOpen(true)
          if (!next.trim()) {
            onSelect({ id: undefined, code: '', description: '' })
          }
        }}
        onBlur={() => {
          if (skipNextBlurRef.current) {
            skipNextBlurRef.current = false
            return
          }

          const next = resolveCatalogSelection(query, value, options, formatter)
          setQuery(formatCatalogLabel(next, formatter))
          onSelect(next)
          window.setTimeout(() => setOpen(false), 120)
        }}
        onKeyDown={(event) => {
          if (!open || suggestions.length === 0) return

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((current) => (current + 1) % suggestions.length)
            return
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1))
            return
          }

          if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault()
            const option = suggestions[activeIndex]
            if (option) {
              const next = {
                id: option.id,
                code: option.code,
                description: option.description,
              }
              setQuery(option.label)
              onSelect(next)
              setOpen(false)
              inputRef.current?.blur()
            }
            return
          }

          if (event.key === 'Escape') {
            event.preventDefault()
            setOpen(false)
          }
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
      />
      {open ? (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.35rem)',
            left: 0,
            right: 0,
            zIndex: 40,
            background: '#fff',
            border: '1px solid var(--brs-gray-200)',
            borderRadius: 12,
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.15)',
            overflow: 'hidden',
          }}
        >
          <div
            ref={listRef}
            role="listbox"
            style={{
              maxHeight: 320,
              overflowY: 'scroll',
              overscrollBehavior: 'contain',
              scrollbarGutter: 'stable',
              scrollbarWidth: 'thin',
            }}
          >
            {suggestions.length > 0 ? (
              suggestions.map((option) => (
                <button
                  key={`${option.code}-${option.id || option.description}`}
                  type="button"
                  role="option"
                  aria-selected={suggestions[activeIndex]?.code === option.code}
                  data-active={suggestions[activeIndex]?.code === option.code}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: suggestions[activeIndex]?.code === option.code ? '#EFF6FF' : 'transparent',
                    padding: '0.7rem 0.85rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'grid',
                    gap: '0.18rem',
                    outline: 'none',
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    const next = {
                      id: option.id,
                      code: option.code,
                      description: option.description,
                    }
                    skipNextBlurRef.current = true
                    setQuery(option.label)
                    onSelect(next)
                    setOpen(false)
                    inputRef.current?.blur()
                  }}
                  onMouseEnter={() => {
                    const index = suggestions.findIndex((item) => item.code === option.code)
                    if (index >= 0) setActiveIndex(index)
                  }}
                >
                  <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)', fontSize: '0.86rem' }}>{option.label}</div>
                  {option.active === false ? (
                    <div style={{ color: '#B91C1C', fontSize: '0.74rem', fontWeight: 700 }}>Inativo</div>
                  ) : null}
                </button>
              ))
            ) : (
              <div style={{ padding: '0.85rem', color: 'var(--brs-gray-500)', fontSize: '0.85rem' }}>Nenhuma opção encontrada.</div>
            )}
          </div>
        </div>
      ) : null}
      {value.description ? (
        <div style={{ marginTop: '0.3rem', color: 'var(--brs-gray-500)', fontSize: '0.75rem', lineHeight: 1.4 }}>
          {value.description}
        </div>
      ) : null}
    </div>
  )
}

function PercentField({
  label,
  field,
  onChange,
  onBlur,
}: {
  label: string
  field: FiscalRateField
  onChange: (next: FiscalRateField) => void
  onBlur?: () => void
}) {
  function emit(nextSeq: string) {
    const next = { ...field, value: onlyDigits(String(nextSeq || '')).slice(0, 4) }
    onChange(next)
  }

  return (
    <div style={{ minWidth: 92, maxWidth: 92 }}>
      <div style={{ marginBottom: '0.35rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--brs-gray-600)', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          className="form-control"
          inputMode="numeric"
          value={formatPercentSequence(field.value)}
          onKeyDown={(event) => {
            const key = event.key
            if (key === 'Backspace') {
              event.preventDefault()
              emit(field.value.slice(0, -1))
              return
            }
            if (key === 'Delete') {
              event.preventDefault()
              emit('')
              return
            }
            if (key === 'Tab' || key.startsWith('Arrow') || key === 'Home' || key === 'End') return
            if (/^\d$/.test(key)) {
              event.preventDefault()
              emit(`${field.value}${key}`.slice(0, 4))
              return
            }
            if (key.length === 1) event.preventDefault()
          }}
          onPaste={(event) => {
            const digits = event.clipboardData.getData('text').replace(/\D/g, '')
            if (!digits) return
            event.preventDefault()
            emit(`${field.value}${digits}`.slice(0, 4))
          }}
          onChange={(event) => emit(event.target.value)}
          onBlur={onBlur}
          style={{ paddingRight: '1.7rem', fontWeight: 800, textAlign: 'right' }}
        />
        <span
          style={{
            position: 'absolute',
            right: '0.6rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--brs-gray-500)',
            fontSize: '0.88rem',
            fontWeight: 800,
            pointerEvents: 'none',
          }}
        >
          %
        </span>
      </div>
    </div>
  )
}

function TotalField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 104, maxWidth: 104 }}>
      <div style={{ marginBottom: '0.35rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--brs-gray-600)', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          className="form-control"
          value={value}
          readOnly
          style={{
            background: '#EFF6FF',
            borderColor: '#93C5FD',
            fontWeight: 800,
            textAlign: 'right',
            paddingRight: '1.7rem',
            color: 'var(--brs-navy)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: '0.6rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--brs-navy)',
            fontSize: '0.88rem',
            fontWeight: 800,
            pointerEvents: 'none',
          }}
        >
          %
        </span>
      </div>
    </div>
  )
}

function SectionRow({
  title,
  description,
  fields,
  totalLabel,
  showTotal,
  acceptsCredit,
  onAcceptsCreditChange,
  onFieldChange,
  onAutoSave,
}: {
  title: string
  description: string
  fields: RateItem[]
  totalLabel: string
  showTotal: boolean
  acceptsCredit?: boolean
  onAcceptsCreditChange?: (next: boolean) => void
  onFieldChange: (key: string, next: FiscalRateField) => void
  onAutoSave?: () => void | Promise<void>
}) {
  const enabledFields = fields.filter((item) => item.field.enabled)
  const total = calculateFiscalRateSum(enabledFields.map((item) => item.field))

  return (
    <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--brs-gray-100)' }}>
      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--brs-gray-900)', marginBottom: '0.15rem' }}>{title}</div>
      <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.8rem', marginBottom: '0.7rem', lineHeight: 1.45 }}>{description}</div>

      {enabledFields.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.55rem', paddingBottom: '0.15rem' }}>
          {enabledFields.map((item, index) => (
            <Fragment key={item.key}>
              <PercentField
                label={item.label}
                field={item.field}
                onChange={(next) => onFieldChange(item.key as string, next)}
                onBlur={onAutoSave}
              />
              {index < enabledFields.length - 1 ? <div style={{ color: 'var(--brs-gray-500)', fontWeight: 900, marginBottom: '0.5rem' }}>+</div> : null}
            </Fragment>
          ))}
          {showTotal ? <div style={{ color: 'var(--brs-gray-500)', fontWeight: 900, marginBottom: '0.5rem' }}>=</div> : null}
          {showTotal ? <TotalField label={totalLabel} value={total} /> : null}
          {onAcceptsCreditChange ? (
            <div style={{ minWidth: 140 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.35rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--brs-gray-600)',
                  textTransform: 'uppercase',
                }}
              >
                Aceita creditamento?
              </label>
              <select
                className="form-control"
                value={acceptsCredit ? 'sim' : 'nao'}
                onChange={(event) => {
                  onAcceptsCreditChange(event.target.value === 'sim')
                  void onAutoSave?.()
                }}
              >
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ color: 'var(--brs-gray-400)', fontSize: '0.82rem' }}>Sem campos habilitados nesta seção.</div>
      )}
    </div>
  )
}

function visibleRateField(field: FiscalRateField, enabled: boolean): FiscalRateField {
  return {
    enabled,
    value: field.value,
  }
}

function cloneTaxRegimeConfiguration(config: TaxRegimeConfiguration): TaxRegimeConfiguration {
  return typeof structuredClone === 'function'
    ? structuredClone(config)
    : (JSON.parse(JSON.stringify(config)) as TaxRegimeConfiguration)
}

function mergeTaxRegimeConfiguration(
  regimeConfig: TaxRegimeConfiguration,
  figureConfig: TaxRegimeConfiguration,
): TaxRegimeConfiguration {
  const mergeField = (baseField: FiscalRateField, figureField: FiscalRateField): FiscalRateField => ({
    enabled: baseField.enabled,
    value: figureField.value ?? baseField.value,
  })

  return {
    section_1: {
      simples_nacional: mergeField(regimeConfig.section_1.simples_nacional, figureConfig.section_1.simples_nacional),
      iss: mergeField(regimeConfig.section_1.iss, figureConfig.section_1.iss),
    },
    section_2: {
      pis: mergeField(regimeConfig.section_2.pis, figureConfig.section_2.pis),
      cofins: mergeField(regimeConfig.section_2.cofins, figureConfig.section_2.cofins),
      accepts_credit: regimeConfig.section_2.accepts_credit,
    },
    section_3: {
      ibs: mergeField(regimeConfig.section_3.ibs, figureConfig.section_3.ibs),
      cbs: mergeField(regimeConfig.section_3.cbs, figureConfig.section_3.cbs),
    },
    section_4: {
      irpj: mergeField(regimeConfig.section_4.irpj, figureConfig.section_4.irpj),
      csll: mergeField(regimeConfig.section_4.csll, figureConfig.section_4.csll),
      pis: mergeField(regimeConfig.section_4.pis, figureConfig.section_4.pis),
      cofins: mergeField(regimeConfig.section_4.cofins, figureConfig.section_4.cofins),
      ibs: mergeField(regimeConfig.section_4.ibs, figureConfig.section_4.ibs),
      cbs: mergeField(regimeConfig.section_4.cbs, figureConfig.section_4.cbs),
    },
  }
}

function FigureCard({
  figure,
  activeRegime,
  cnaes,
  ctns,
  nbses,
  onChange,
  onRemove,
  onAutoSave,
}: {
  figure: FiscalFigureRecord
  activeRegime: TaxRegimeRecord | null
  cnaes: CnaeRecord[]
  ctns: CtnRecord[]
  nbses: NbsRecord[]
  onChange: (next: FiscalFigureRecord) => void
  onRemove: () => void
  onAutoSave?: () => void | Promise<void>
}) {
  const activeVersion = activeRegime ? getActiveTaxRegimeVersion(activeRegime) : null
  const regimeConfig = activeVersion?.config || null
  const config = useMemo(
    () => (regimeConfig ? mergeTaxRegimeConfiguration(regimeConfig, figure.config) : figure.config),
    [figure.config, regimeConfig],
  )

  const cnaeOptions = useMemo<CatalogOption[]>(
    () =>
      cnaes.map((item) => ({
        id: item.id,
        code: String(item.code || ''),
        description: String(item.description || ''),
        label: `${formatCnaeCode(String(item.code || ''))}${item.description ? ` - ${item.description}` : ''}${item.is_active === false ? ' (Inativo)' : ''}`,
        active: item.is_active,
      })),
    [cnaes],
  )

  const ctnOptions = useMemo<CatalogOption[]>(
    () =>
      ctns.map((item) => ({
        id: item.id,
        code: String(item.code || ''),
        description: String(item.description || ''),
        label: `${formatCtnCode(String(item.code || ''))}${item.description ? ` - ${item.description}` : ''}${item.is_active === false ? ' (Inativo)' : ''}`,
        active: item.is_active,
      })),
    [ctns],
  )

  const nbsOptions = useMemo<CatalogOption[]>(
    () =>
      nbses.map((item) => ({
        id: item.id,
        code: String(item.code || ''),
        description: String(item.description || ''),
        label: `${formatNbsCode(String(item.code || ''))}${item.description ? ` - ${item.description}` : ''}${item.is_active === false ? ' (Inativo)' : ''}`,
        active: item.is_active,
      })),
    [nbses],
  )

  function update(next: Partial<FiscalFigureRecord>, save = false) {
    onChange({
      ...figure,
      ...next,
    })
    if (save) void onAutoSave?.()
  }

  function updateConfigSection<
    Section extends keyof TaxRegimeConfiguration,
    Key extends keyof TaxRegimeConfiguration[Section],
  >(section: Section, key: Key, nextField: FiscalRateField, save = false) {
    update(
      {
        config: {
          ...config,
          [section]: {
            ...config[section],
            [key]: nextField,
          },
        },
      },
      save,
    )
  }

  const section1Fields = (regimeConfig
    ? [
        {
          key: 'simples_nacional',
          label: 'Simples Nacional',
          field: visibleRateField(config.section_1.simples_nacional, regimeConfig.section_1.simples_nacional.enabled),
        },
        {
          key: 'iss',
          label: 'ISS',
          field: visibleRateField(config.section_1.iss, regimeConfig.section_1.iss.enabled),
        },
      ].filter((item) => item.field.enabled)
    : []) as RateItem[]

  const section2Fields = (regimeConfig
    ? [
        { key: 'pis', label: 'PIS', field: visibleRateField(config.section_2.pis, regimeConfig.section_2.pis.enabled) },
        { key: 'cofins', label: 'COFINS', field: visibleRateField(config.section_2.cofins, regimeConfig.section_2.cofins.enabled) },
      ].filter((item) => item.field.enabled)
    : []) as RateItem[]

  const section3Fields = (regimeConfig
    ? [
        { key: 'ibs', label: 'IBS', field: visibleRateField(config.section_3.ibs, regimeConfig.section_3.ibs.enabled) },
        { key: 'cbs', label: 'CBS', field: visibleRateField(config.section_3.cbs, regimeConfig.section_3.cbs.enabled) },
      ].filter((item) => item.field.enabled)
    : []) as RateItem[]

  const section4Fields = (regimeConfig
    ? [
        { key: 'irpj', label: 'IRPJ', field: visibleRateField(config.section_4.irpj, regimeConfig.section_4.irpj.enabled) },
        { key: 'csll', label: 'CSLL', field: visibleRateField(config.section_4.csll, regimeConfig.section_4.csll.enabled) },
        { key: 'pis', label: 'PIS', field: visibleRateField(config.section_4.pis, regimeConfig.section_4.pis.enabled) },
        { key: 'cofins', label: 'COFINS', field: visibleRateField(config.section_4.cofins, regimeConfig.section_4.cofins.enabled) },
        { key: 'ibs', label: 'IBS', field: visibleRateField(config.section_4.ibs, regimeConfig.section_4.ibs.enabled) },
        { key: 'cbs', label: 'CBS', field: visibleRateField(config.section_4.cbs, regimeConfig.section_4.cbs.enabled) },
      ].filter((item) => item.field.enabled)
    : []) as RateItem[]

  const regimeTitle = figure.tax_regime_name || activeRegime?.name || 'Regime tributário não definido'

  return (
    <div className="card" style={{ padding: '1rem', border: '1px solid var(--brs-gray-100)', display: 'grid', gap: '0.9rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)' }}>Figura Tributária</div>
              <span className={`badge ${figure.effective_to ? 'badge-gray' : 'badge-success'}`}>{figure.effective_to ? 'Inativa' : 'Ativa'}</span>
              <span className="badge badge-gray" style={{ background: '#F8FAFC', color: 'var(--brs-gray-600)' }}>
                {regimeTitle}
              </span>
            {activeVersion ? (
              <span className="badge badge-gray" style={{ background: '#F8FAFC', color: 'var(--brs-gray-600)' }}>
                Vigência do regime: {formatDateForDisplay(activeVersion.effective_from)}
              </span>
            ) : null}
          </div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.86rem' }}>
            Vincule o trio CNAE x CTN x NBS e mantenha as alíquotas sob o regime tributário selecionado.
          </div>
        </div>

        <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove} style={{ color: 'var(--brs-danger)' }}>
          <Trash2 size={16} />
          Remover figura
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: '0.8rem' }}>
        <div className="form-group">
          <label className="form-label">Vigência inicial</label>
          <input
            type="date"
            className="form-control"
            value={formatDateForInput(figure.effective_from)}
            onChange={(event) => update({ effective_from: event.target.value }, false)}
            onBlur={onAutoSave}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Vigência final</label>
          <input
            type="date"
            className="form-control"
            value={formatDateForInput(figure.effective_to)}
            onChange={(event) => update({ effective_to: event.target.value || null }, false)}
            onBlur={onAutoSave}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <span className={`badge ${figure.effective_to ? 'badge-gray' : 'badge-success'}`}>{figure.effective_to ? 'Inativa' : 'Ativa'}</span>
            <span className="badge badge-gray" style={{ background: '#EFF6FF', color: 'var(--brs-navy)' }}>
              {figure.effective_from ? `Início: ${formatDateForDisplay(figure.effective_from)}` : 'Sem vigência inicial'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(180px, 1fr) minmax(220px, 1.4fr)', gap: '0.8rem' }}>
        <CatalogLookupField
          label="CNAE"
          value={figure.cnae}
          options={cnaeOptions}
          formatter={formatCnaeCode}
          placeholder="0000-0/00"
          onSelect={(next) => {
            update(
              {
                cnae: next,
                ctn: { id: undefined, code: '', description: '' },
                nbs: { id: undefined, code: '', description: '' },
              },
              false,
            )
          }}
        />
        <CatalogLookupField
          label="CTN"
          value={figure.ctn}
          options={ctnOptions}
          formatter={formatCtnCode}
          placeholder="00.0000"
          disabled={!figure.cnae.code}
          onSelect={(next) => {
            update(
              {
                ctn: next,
                nbs: { id: undefined, code: '', description: '' },
              },
              false,
            )
          }}
        />
        <CatalogLookupField
          label="NBS"
          value={figure.nbs}
          options={nbsOptions}
          formatter={formatNbsCode}
          placeholder="1.0101.10.00"
          disabled={!figure.ctn.code}
          onSelect={(next) => update({ nbs: next }, false)}
        />
      </div>

      {regimeConfig ? (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid var(--brs-gray-100)',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
            padding: '1rem',
            display: 'grid',
            gap: '0.95rem',
          }}
        >
          {section1Fields.length > 0 ? (
            <SectionRow
              title="Alíquotas Fixas Sobre a Emissão de NFSe"
              description="Somente um dos campos pode ser habilitado de acordo com a legislação do regime tributário."
              fields={section1Fields}
              totalLabel="Total"
              showTotal={false}
              onFieldChange={(key, next) => updateConfigSection('section_1', key as keyof TaxRegimeConfiguration['section_1'], next)}
              onAutoSave={onAutoSave}
            />
          ) : null}

          {section2Fields.length > 0 ? (
            <SectionRow
              title="Alíquotas Federais Fixas Sobre a Emissão de NFSe"
              description="As alíquotas de PIS e COFINS incidem sobre as NFs emitidas e podem ou não ter creditamento de acordo com o regime tributário vigente."
              fields={section2Fields}
              totalLabel="Total"
              showTotal
              acceptsCredit={config.section_2.accepts_credit}
              onAcceptsCreditChange={(next) =>
                update(
                  {
                    config: {
                      ...config,
                      section_2: {
                        ...config.section_2,
                        accepts_credit: next,
                      },
                    },
                  },
                  false,
                )
              }
              onFieldChange={(key, next) => updateConfigSection('section_2', key as keyof TaxRegimeConfiguration['section_2'], next)}
              onAutoSave={onAutoSave}
            />
          ) : null}

          {section3Fields.length > 0 ? (
            <SectionRow
              title="Tributos com Creditamento Pleno"
              description="As alíquotas de IBS e CBS incidem sobre as NFs emitidas e têm creditamento pleno de acordo com a legislação, quando aplicáveis."
              fields={section3Fields}
              totalLabel="Total"
              showTotal
              onFieldChange={(key, next) => updateConfigSection('section_3', key as keyof TaxRegimeConfiguration['section_3'], next)}
              onAutoSave={onAutoSave}
            />
          ) : null}

          {section4Fields.length > 0 ? (
            <SectionRow
              title="Impostos Passíveis de Retenção pelo Tomador do Serviço"
              description="Alíquotas máximas para o IRPJ e as CSRF que podem ser retidos pelo tomador do serviço, com base no CNAE, CTN e NBS do serviço prestado."
              fields={section4Fields}
              totalLabel="Total"
              showTotal
              onFieldChange={(key, next) => updateConfigSection('section_4', key as keyof TaxRegimeConfiguration['section_4'], next)}
              onAutoSave={onAutoSave}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function CompanyFiscalDataCard({ value, onChange, onAutoSave }: Props) {
  const data = normalizeCompanyFiscalData(value)
  const [taxRegimes, setTaxRegimes] = useState<TaxRegimeRecord[]>([])
  const [cnaes, setCnaes] = useState<CnaeRecord[]>([])
  const [ctns, setCtns] = useState<CtnRecord[]>([])
  const [nbses, setNbses] = useState<NbsRecord[]>([])
  const [loadingLookups, setLoadingLookups] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadLookups() {
      setLoadingLookups(true)
      try {
        const [regimesRes, cnaeRes, ctnRes, nbsRes] = await Promise.all([getTaxRegimes(), getCnaes(), getCtns(), getNbses()])

        if (cancelled) return

        if (regimesRes.success) {
          setTaxRegimes(
            ((regimesRes.regimes || []) as TaxRegimeRecord[]).map((item) => ({
              ...item,
              versions: sortTaxRegimeVersions(item.versions || []),
            })),
          )
        }
        if (cnaeRes.success) setCnaes((cnaeRes.cnaes || []) as CnaeRecord[])
        if (ctnRes.success) setCtns((ctnRes.ctns || []) as CtnRecord[])
        if (nbsRes.success) setNbses((nbsRes.nbses || []) as NbsRecord[])
      } finally {
        if (!cancelled) setLoadingLookups(false)
      }
    }

    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedRegime = useMemo(() => taxRegimes.find((item) => item.id === data.tax_regime_id) || null, [data.tax_regime_id, taxRegimes])

  function commit(next: CompanyFiscalData, save = false) {
    const normalized = normalizeCompanyFiscalData(next)
    onChange(normalized)
    if (save) void onAutoSave?.()
  }

  function updateFigure(index: number, next: FiscalFigureRecord, save = false) {
    const nextFigures = data.figures.map((figure, currentIndex) => (currentIndex === index ? next : figure))
    commit({ ...data, figures: nextFigures }, save)
  }

  function addFigure() {
    const activeVersion = selectedRegime ? getActiveTaxRegimeVersion(selectedRegime) : null
    const regimeName = selectedRegime?.name || ''
    const nextFigure = createEmptyFiscalFigure()

    nextFigure.tax_regime_id = selectedRegime?.id || data.tax_regime_id || ''
    nextFigure.tax_regime_name = regimeName
    nextFigure.tax_regime_version_id = activeVersion?.id || undefined
    nextFigure.tax_regime_version_name = activeVersion ? `Vigência a partir de ${activeVersion.effective_from || 'sem data'}` : undefined
    if (activeVersion?.config) {
      nextFigure.config = cloneTaxRegimeConfiguration(activeVersion.config)
    }

    commit(
      {
        ...data,
        tax_regime_id: selectedRegime?.id || data.tax_regime_id,
        tax_regime_name: regimeName || data.tax_regime_name,
        figures: [...data.figures, nextFigure],
      },
      true,
    )
  }

  const selectedRegimeLabel = selectedRegime?.name || data.tax_regime_name || ''

  return (
    <div className="card" style={{ padding: '1rem', border: '1px solid var(--brs-gray-100)', display: 'grid', gap: '1rem' }}>
      <div>
        <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Check size={18} />
          Dados Fiscais
        </div>
        <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem' }}>
          Parâmetros fiscais utilizados por outros subsistemas do Workspace.
        </div>
      </div>

      <div style={{ display: 'grid', gap: '0.35rem', maxWidth: 420 }}>
        <label className="form-label">Regime Tributário</label>
        <select
          className="form-control"
          value={data.tax_regime_id}
          disabled={loadingLookups}
          onChange={(event) => {
            const nextRegime = taxRegimes.find((item) => item.id === event.target.value) || null
            const nextVersion = nextRegime ? getActiveTaxRegimeVersion(nextRegime) : null
            commit(
              {
                ...data,
                tax_regime_id: nextRegime?.id || '',
                tax_regime_name: nextRegime?.name || '',
                figures: data.figures.map((figure) => ({
                  ...figure,
                  tax_regime_id: nextRegime?.id || '',
                  tax_regime_name: nextRegime?.name || '',
                  tax_regime_version_id: nextVersion?.id || undefined,
                  tax_regime_version_name: nextVersion ? `Vigência a partir de ${nextVersion.effective_from || 'sem data'}` : undefined,
                  config: nextVersion?.config ? cloneTaxRegimeConfiguration(nextVersion.config) : figure.config,
                })),
              },
              true,
            )
          }}
        >
          <option value="">{loadingLookups ? 'Carregando regimes...' : 'Selecione um regime'}</option>
          {taxRegimes.map((regime) => (
            <option key={regime.id} value={regime.id || ''}>
              {regime.name}
            </option>
          ))}
        </select>
        <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.8rem' }}>
          {selectedRegimeLabel ? `O regime ${selectedRegimeLabel} define quais alíquotas ficam visíveis nas figuras tributárias.` : 'Selecione um regime tributário para habilitar a criação das figuras.'}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '0.85rem' }}>
        {data.figures.length === 0 ? (
          <div
            style={{
              padding: '1rem',
              borderRadius: 14,
              border: '1px dashed var(--brs-gray-200)',
              background: '#F8FAFC',
              color: 'var(--brs-gray-500)',
              fontSize: '0.92rem',
            }}
          >
            Nenhuma figura tributária cadastrada. Use o botão abaixo para adicionar o primeiro trio CNAE x CTN x NBS.
          </div>
        ) : (
          data.figures.map((figure, index) => (
            <FigureCard
              key={figure.id}
              figure={figure}
              activeRegime={selectedRegime}
              cnaes={cnaes}
              ctns={ctns}
              nbses={nbses}
              onChange={(next) => updateFigure(index, deepCloneFigure(next))}
              onRemove={() =>
                commit(
                  {
                    ...data,
                    figures: data.figures.filter((_, currentIndex) => currentIndex !== index),
                  },
                  true,
                )
              }
              onAutoSave={onAutoSave}
            />
          ))
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-primary" onClick={addFigure}>
          <Plus size={16} />
          Adicionar Figura Tributária
        </button>
      </div>
    </div>
  )
}
