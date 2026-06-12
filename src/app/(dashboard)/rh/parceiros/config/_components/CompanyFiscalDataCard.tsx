'use client'

import { Fragment } from 'react'
import { Check, Plus } from 'lucide-react'
import {
  calculateFiscalRateSum,
  createEmptyFiscalCodePair,
  formatPercentSequence,
  normalizeCompanyFiscalData,
  type CompanyFiscalData,
  type FiscalCodePair,
  type FiscalRateField,
  type TaxRegime,
} from '@/lib/company-fiscal-data'
import { onlyDigits } from '@/lib/company-bank-accounts'

type Props = {
  value: CompanyFiscalData
  onChange: (next: CompanyFiscalData) => void
  onAutoSave?: () => void | Promise<void>
}

function percentDigitsFromInput(value: string) {
  return onlyDigits(String(value || '')).slice(0, 4)
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
    const next = { ...field, value: percentDigitsFromInput(nextSeq) }
    onChange(next)
  }

  return (
    <div style={{ minWidth: 118, maxWidth: 118 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brs-gray-600)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {label}
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--brs-gray-500)', fontSize: '0.75rem', fontWeight: 700 }}>
          <input
            type="checkbox"
            checked={!!field.enabled}
            onChange={(e) => {
              onChange({ ...field, enabled: e.target.checked })
              onBlur?.()
            }}
          />
          Habilita
        </label>
      </div>
      <div style={{ position: 'relative' }}>
        <input
          className="form-control"
          inputMode="numeric"
          disabled={!field.enabled}
          value={formatPercentSequence(field.value)}
          onKeyDown={(e) => {
            if (!field.enabled) return
            const key = e.key
            if (key === 'Backspace') {
              e.preventDefault()
              emit(field.value.slice(0, -1))
              return
            }
            if (key === 'Delete') {
              e.preventDefault()
              emit('')
              return
            }
            if (key === 'Tab' || key.startsWith('Arrow') || key === 'Home' || key === 'End') return
            if (/^\d$/.test(key)) {
              e.preventDefault()
              emit(`${field.value}${key}`.slice(0, 4))
              return
            }
            if (key.length === 1) e.preventDefault()
          }}
          onPaste={(e) => {
            if (!field.enabled) return
            const digits = e.clipboardData.getData('text').replace(/\D/g, '')
            if (!digits) return
            e.preventDefault()
            emit(`${field.value}${digits}`.slice(0, 4))
          }}
          onChange={(e) => {
            if (!field.enabled) return
            emit(e.target.value)
          }}
          onBlur={onBlur}
          style={{ paddingRight: '1.85rem', fontWeight: 700, textAlign: 'right' }}
        />
        <span
          style={{
            position: 'absolute',
            right: '0.65rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: field.enabled ? 'var(--brs-gray-500)' : 'var(--brs-gray-400)',
            fontSize: '0.9rem',
            fontWeight: 700,
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
    <div style={{ minWidth: 128, maxWidth: 128 }}>
      <div style={{ marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brs-gray-600)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
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
            paddingRight: '1.85rem',
            color: 'var(--brs-navy)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: '0.65rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--brs-navy)',
            fontSize: '0.9rem',
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

function CodePairTable({
  title,
  rows,
  onChange,
  onAdd,
  onAutoSave,
}: {
  title: string
  rows: FiscalCodePair[]
  onChange: (nextRows: FiscalCodePair[]) => void
  onAdd: () => void
  onAutoSave?: () => void | Promise<void>
}) {
  return (
    <div className="card" style={{ padding: '0.9rem', border: '1px solid var(--brs-gray-100)', background: '#fff' }}>
      <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)', marginBottom: '0.75rem' }}>{title}</div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 190 }}>Código CTN</th>
              <th>Descrição do CTN</th>
              <th style={{ width: 72, textAlign: 'right' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <Fragment key={row.id}>
                <tr>
                  <td>
                    <input
                      className="form-control"
                      inputMode="numeric"
                      maxLength={6}
                      value={row.ctn.code || ''}
                      onChange={(e) => {
                        const nextRows = rows.map((current, currentIndex) =>
                          currentIndex === index
                            ? { ...current, ctn: { ...current.ctn, code: onlyDigits(e.target.value).slice(0, 6) } }
                            : current,
                        )
                        onChange(nextRows)
                      }}
                      onBlur={() => void onAutoSave?.()}
                      placeholder="000000"
                    />
                  </td>
                  <td>
                    <input
                      className="form-control"
                      maxLength={100}
                      value={row.ctn.description || ''}
                      onChange={(e) => {
                        const nextRows = rows.map((current, currentIndex) =>
                          currentIndex === index
                            ? { ...current, ctn: { ...current.ctn, description: e.target.value.slice(0, 100) } }
                            : current,
                        )
                        onChange(nextRows)
                      }}
                      onBlur={() => void onAutoSave?.()}
                      placeholder="Descrição"
                    />
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        onAdd()
                        void onAutoSave?.()
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} style={{ paddingTop: 0, paddingBottom: '0.8rem' }}>
                    <div
                      style={{
                        marginLeft: '0.65rem',
                        paddingLeft: '0.9rem',
                        borderLeft: '2px solid #DBEAFE',
                        background: '#F8FAFC',
                        borderRadius: '0 0 0.7rem 0.7rem',
                        paddingTop: '0.8rem',
                        paddingRight: '0.8rem',
                        paddingBottom: '0.85rem',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: 'var(--brs-gray-600)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          marginBottom: '0.6rem',
                        }}
                      >
                        NBS vinculado ao CTN
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0.75rem', alignItems: 'start' }}>
                        <div>
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
                            Código NBS
                          </label>
                          <input
                            className="form-control"
                            inputMode="numeric"
                            maxLength={9}
                            value={row.nbs.code || ''}
                            onChange={(e) => {
                              const nextRows = rows.map((current, currentIndex) =>
                                currentIndex === index
                                  ? { ...current, nbs: { ...current.nbs, code: onlyDigits(e.target.value).slice(0, 9) } }
                                  : current,
                              )
                              onChange(nextRows)
                            }}
                            onBlur={() => void onAutoSave?.()}
                            placeholder="000000000"
                          />
                        </div>
                        <div>
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
                            Descrição NBS
                          </label>
                          <input
                            className="form-control"
                            maxLength={100}
                            value={row.nbs.description || ''}
                            onChange={(e) => {
                              const nextRows = rows.map((current, currentIndex) =>
                                currentIndex === index
                                  ? {
                                      ...current,
                                      nbs: { ...current.nbs, description: e.target.value.slice(0, 100) },
                                    }
                                  : current,
                              )
                              onChange(nextRows)
                            }}
                            onBlur={() => void onAutoSave?.()}
                            placeholder="Descrição"
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function CompanyFiscalDataCard({ value, onChange, onAutoSave }: Props) {
  const data = normalizeCompanyFiscalData(value)

  function commit(next: CompanyFiscalData, save = false) {
    const normalized = normalizeCompanyFiscalData(next)
    onChange(normalized)
    if (save) void onAutoSave?.()
  }

  function updateRateField(
    section: 'withheld_taxes' | 'nfse_without_credit' | 'nfse_with_credit',
    key: string,
    nextField: FiscalRateField,
    save = false,
  ) {
    commit(
      {
        ...data,
        [section]: {
          ...(data[section] || {}),
          [key]: nextField,
        },
      } as CompanyFiscalData,
      save,
    )
  }

  const withheldFields = [
    { key: 'irpj', label: 'IRPJ' },
    { key: 'csll', label: 'CSLL' },
    { key: 'pis', label: 'PIS' },
    { key: 'cofins', label: 'COFINS' },
    { key: 'cbs', label: 'CBS' },
    { key: 'ibs', label: 'IBS' },
  ] as const

  const directTotal = calculateFiscalRateSum([
    data.withheld_taxes.irpj,
    data.withheld_taxes.csll,
    data.withheld_taxes.pis,
    data.withheld_taxes.cofins,
    data.withheld_taxes.cbs,
    data.withheld_taxes.ibs,
    data.nfse_without_credit.simples_nacional,
    data.nfse_without_credit.iss,
  ])

  const creditTotal = calculateFiscalRateSum([
    data.nfse_with_credit.pis,
    data.nfse_with_credit.cofins,
    data.nfse_with_credit.cbs,
    data.nfse_with_credit.ibs,
  ])

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

      <div className="form-group" style={{ maxWidth: 340 }}>
        <label className="form-label">Regime Tributário</label>
        <select className="form-control" value={data.tax_regime} onChange={(e) => commit({ ...data, tax_regime: e.target.value as TaxRegime }, true)}>
          <option value="Lucro Real">Lucro Real</option>
          <option value="Lucro Presumido">Lucro Presumido</option>
          <option value="Simples Nacional">Simples Nacional</option>
        </select>
      </div>

      <CodePairTable
        title="Código de Tributação Nacional (CTN) autorizados para o CNPJ"
        rows={data.fiscal_code_pairs}
        onChange={(nextRows) => commit({ ...data, fiscal_code_pairs: nextRows }, false)}
        onAdd={() => commit({ ...data, fiscal_code_pairs: [...data.fiscal_code_pairs, createEmptyFiscalCodePair()] }, false)}
        onAutoSave={onAutoSave}
      />

      <div className="card" style={{ padding: '0.95rem', border: '1px solid var(--brs-gray-100)', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
        <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)', marginBottom: '0.9rem' }}>
          Impostos por Apuração Padrão
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--brs-gray-600)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              Impostos Retidos na Fonte
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'nowrap', gap: '0.55rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {withheldFields.map((item, index) => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'flex-end', gap: '0.55rem' }}>
                  <PercentField
                    label={item.label}
                    field={data.withheld_taxes[item.key]}
                    onChange={(nextField) => updateRateField('withheld_taxes', item.key, nextField)}
                    onBlur={onAutoSave}
                  />
                  {index < withheldFields.length - 1 ? <div style={{ color: 'var(--brs-gray-500)', fontWeight: 900, marginBottom: '0.5rem' }}>+</div> : null}
                </div>
              ))}
              <div style={{ color: 'var(--brs-gray-500)', fontWeight: 900, marginBottom: '0.5rem' }}>=</div>
              <TotalField label="Totalizador" value={data.withheld_taxes.totalizer} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--brs-gray-600)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              Impostos por Apuração Mensal sobre Emissão de NFSe sem Creditamento
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'nowrap', gap: '0.55rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              <PercentField
                label="Simples Nacional"
                field={data.nfse_without_credit.simples_nacional}
                onChange={(nextField) => updateRateField('nfse_without_credit', 'simples_nacional', nextField)}
                onBlur={onAutoSave}
              />
              <div style={{ color: 'var(--brs-gray-500)', fontWeight: 900, marginBottom: '0.5rem' }}>+</div>
              <PercentField
                label="ISS"
                field={data.nfse_without_credit.iss}
                onChange={(nextField) => updateRateField('nfse_without_credit', 'iss', nextField)}
                onBlur={onAutoSave}
              />
              <div style={{ color: 'var(--brs-gray-500)', fontWeight: 900, marginBottom: '0.5rem' }}>=</div>
              <TotalField label="Total de Impostos Diretos" value={directTotal} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--brs-gray-600)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              Impostos por Apuração Mensal sobre Emissão de NFSe com Creditamento
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'nowrap', gap: '0.55rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              <PercentField
                label="PIS"
                field={data.nfse_with_credit.pis}
                onChange={(nextField) => updateRateField('nfse_with_credit', 'pis', nextField)}
                onBlur={onAutoSave}
              />
              <div style={{ color: 'var(--brs-gray-500)', fontWeight: 900, marginBottom: '0.5rem' }}>+</div>
              <PercentField
                label="COFINS"
                field={data.nfse_with_credit.cofins}
                onChange={(nextField) => updateRateField('nfse_with_credit', 'cofins', nextField)}
                onBlur={onAutoSave}
              />
              <div style={{ color: 'var(--brs-gray-500)', fontWeight: 900, marginBottom: '0.5rem' }}>+</div>
              <PercentField
                label="CBS"
                field={data.nfse_with_credit.cbs}
                onChange={(nextField) => updateRateField('nfse_with_credit', 'cbs', nextField)}
                onBlur={onAutoSave}
              />
              <div style={{ color: 'var(--brs-gray-500)', fontWeight: 900, marginBottom: '0.5rem' }}>+</div>
              <PercentField
                label="IBS"
                field={data.nfse_with_credit.ibs}
                onChange={(nextField) => updateRateField('nfse_with_credit', 'ibs', nextField)}
                onBlur={onAutoSave}
              />
              <div style={{ color: 'var(--brs-gray-500)', fontWeight: 900, marginBottom: '0.5rem' }}>=</div>
              <TotalField label="Total de Impostos com Creditamento" value={creditTotal} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
