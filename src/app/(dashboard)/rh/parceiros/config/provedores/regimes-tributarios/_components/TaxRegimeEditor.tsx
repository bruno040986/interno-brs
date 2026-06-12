'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Info,
  Plus,
  Save,
  ShieldAlert,
  X,
} from 'lucide-react'
import { getTaxRegime, saveTaxRegime } from '../../../../actions'
import {
  createEmptyTaxRegime,
  createEmptyTaxRegimeVersion,
  formatPercentSequence,
  getTaxRegimeTotals,
  isTaxRegimeVersionActive,
  normalizeTaxRegimeRecord,
  normalizeTaxRegimeVersion,
  sortTaxRegimeVersions,
  type TaxRateField,
  type TaxRegimeRecord,
  type TaxRegimeVersionRecord,
} from '@/lib/tax-regimes'

type FeedbackMessage = {
  type: 'success' | 'error'
  text: string
}

type Props = {
  regimeId?: string
  isNew?: boolean
  viewOnly?: boolean
}

function deepCloneVersion(version: TaxRegimeVersionRecord) {
  return normalizeTaxRegimeVersion(JSON.parse(JSON.stringify(version)))
}

function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)' }}>{title}</div>
      {subtitle ? <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.86rem', marginTop: '0.2rem' }}>{subtitle}</div> : null}
    </div>
  )
}

function TotalField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 108, width: '108px', maxWidth: '100%' }}>
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          className="form-control"
          readOnly
          value={value}
          style={{ width: '100%', boxSizing: 'border-box', paddingRight: '1.55rem', background: '#EFF6FF', borderColor: '#93C5FD', fontWeight: 800, textAlign: 'right' }}
        />
        <span
          style={{
            position: 'absolute',
            right: '0.55rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--brs-gray-500)',
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

function RateField({
  label,
  field,
  disabled,
  onChange,
}: {
  label: string
  field: TaxRateField
  disabled: boolean
  onChange: (next: TaxRateField) => void
}) {
  function emit(nextSeq: string) {
    onChange({
      ...field,
      value: String(nextSeq || '').replace(/\D/g, '').slice(0, 4),
    })
  }

  return (
    <div
      style={{
        minWidth: 92,
        width: 'fit-content',
        maxWidth: '100%',
        display: 'grid',
        gap: '0.35rem',
      }}
    >
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          color: 'var(--brs-gray-700)',
          fontSize: '0.88rem',
          fontWeight: 700,
          minHeight: 24,
          lineHeight: 1.2,
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
        }}
      >
        <input
          type="checkbox"
          disabled={disabled}
          checked={field.enabled}
          onChange={(e) => onChange({ ...field, enabled: e.target.checked })}
        />
        <span>{label}</span>
      </label>
      <div style={{ position: 'relative', width: '92px', maxWidth: '100%' }}>
        <input
          className="form-control"
          inputMode="numeric"
          disabled={disabled || !field.enabled}
          value={formatPercentSequence(field.value)}
          onKeyDown={(e) => {
            if (disabled || !field.enabled) return
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
            if (disabled || !field.enabled) return
            const digits = e.clipboardData.getData('text').replace(/\D/g, '')
            if (!digits) return
            e.preventDefault()
            emit(`${field.value}${digits}`.slice(0, 4))
          }}
          onChange={(e) => {
            if (disabled || !field.enabled) return
            emit(e.target.value)
          }}
          style={{ width: '92px', maxWidth: '100%', boxSizing: 'border-box', paddingRight: '1.55rem', fontWeight: 700, textAlign: 'right' }}
        />
        <span
          style={{
            position: 'absolute',
            right: '0.55rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: disabled || !field.enabled ? 'var(--brs-gray-400)' : 'var(--brs-gray-500)',
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

function VersionCard({
  version,
  disabled,
  title,
  onChange,
}: {
  version: TaxRegimeVersionRecord
  disabled: boolean
  title: string
  onChange: (next: TaxRegimeVersionRecord) => void
}) {
  const totals = useMemo(() => getTaxRegimeTotals(version.config), [version.config])
  const locked = !!version.locked_at
  const active = isTaxRegimeVersionActive(version)
  const readOnly = disabled || locked || !active

  return (
    <div className="card" style={{ padding: '1rem', border: '1px solid var(--brs-gray-100)', display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)' }}>{title}</div>
            <span className={`badge ${active ? 'badge-success' : 'badge-gray'}`}>{active ? 'Ativa' : 'Inativa'}</span>
            {locked ? <span className="badge badge-gray">Bloqueada</span> : null}
          </div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.86rem', marginTop: '0.25rem' }}>
            {title === 'Nova vigência'
              ? 'Nova configuração pronta para ser salva como vigência futura.'
              : active
                ? 'Esta é a vigência atualmente em uso.'
                : 'Versão histórica disponível apenas para consulta.'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '0.75rem' }}>
        <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
          <label className="form-label">Vigência inicial</label>
          <input
            type="date"
            className="form-control"
            value={version.effective_from || ''}
            disabled={readOnly}
            onChange={(e) => onChange({ ...version, effective_from: e.target.value })}
          />
        </div>
        <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
          <label className="form-label">Vigência final</label>
          <input
            type="date"
            className="form-control"
            value={version.effective_to || ''}
            disabled
            readOnly
            style={{ background: '#F8FAFC' }}
          />
        </div>
        <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
          <label className="form-label">Status</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: 42, flexWrap: 'wrap' }}>
            <span className={`badge ${active ? 'badge-success' : 'badge-gray'}`}>{active ? 'Ativa' : 'Inativa'}</span>
            {locked ? <span className="badge badge-gray">Bloqueada</span> : null}
            <span className="badge badge-gray">{title}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0.95rem', border: '1px solid var(--brs-gray-100)', background: '#fff' }}>
        <SectionLabel
          title="Seção 1. Alíquotas Fixas Sobre a Emissão de NFSe"
          subtitle="Somente um dos campos pode ser habilitado de acordo com a legislação do regime tributário."
        />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          <RateField
            label="Simples Nacional"
            field={version.config.section_1.simples_nacional}
            disabled={readOnly}
            onChange={(nextField) =>
              onChange({
                ...version,
                config: {
                  ...version.config,
                  section_1: {
                    ...version.config.section_1,
                    simples_nacional: nextField,
                    iss: nextField.enabled ? { ...version.config.section_1.iss, enabled: false } : version.config.section_1.iss,
                  },
                },
              })
            }
          />
          <RateField
            label="ISS"
            field={version.config.section_1.iss}
            disabled={readOnly}
            onChange={(nextField) =>
              onChange({
                ...version,
                config: {
                  ...version.config,
                  section_1: {
                    ...version.config.section_1,
                    simples_nacional: nextField.enabled ? { ...version.config.section_1.simples_nacional, enabled: false } : version.config.section_1.simples_nacional,
                    iss: nextField,
                  },
                },
              })
            }
          />
        </div>
      </div>

      <div className="card" style={{ padding: '0.95rem', border: '1px solid var(--brs-gray-100)', background: '#fff' }}>
        <SectionLabel
          title="Seção 2. Alíquotas Federais Fixas Sobre a Emissão de NFSe"
          subtitle="As alíquotas de PIS e COFINS incidem sobre as NFs emitidas e podem ou não ter creditamento de acordo com o regime tributário vigente."
        />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          <RateField
            label="PIS"
            field={version.config.section_2.pis}
            disabled={readOnly}
            onChange={(nextField) =>
              onChange({
                ...version,
                config: {
                  ...version.config,
                  section_2: {
                    ...version.config.section_2,
                    pis: nextField,
                  },
                },
              })
            }
          />
          <div style={{ paddingBottom: '0.9rem', color: 'var(--brs-gray-400)', fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>
            +
          </div>
          <RateField
            label="COFINS"
            field={version.config.section_2.cofins}
            disabled={readOnly}
            onChange={(nextField) =>
              onChange({
                ...version,
                config: {
                  ...version.config,
                  section_2: {
                    ...version.config.section_2,
                    cofins: nextField,
                  },
                },
              })
            }
          />
          <div style={{ paddingBottom: '0.9rem', color: 'var(--brs-gray-400)', fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>
            =
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <TotalField label="Totalizador" value={totals.section_2} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ minWidth: 112 }}>
              <label className="form-label">Aceita creditamento?</label>
              <select
                className="form-control"
                disabled={readOnly}
                value={version.config.section_2.accepts_credit ? 'sim' : 'nao'}
                onChange={(e) =>
                  onChange({
                    ...version,
                    config: {
                      ...version.config,
                      section_2: {
                        ...version.config.section_2,
                        accepts_credit: e.target.value === 'sim',
                      },
                    },
                  })
                }
              >
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0.95rem', border: '1px solid var(--brs-gray-100)', background: '#fff' }}>
        <SectionLabel
          title="Seção 3. Tributos com Creditamento Pleno"
          subtitle="As alíquotas de IBS e CBS incidem sobre as NFs emitidas e têm creditamento pleno de acordo com a legislação, quando aplicáveis."
        />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          <RateField
            label="IBS"
            field={version.config.section_3.ibs}
            disabled={readOnly}
            onChange={(nextField) =>
              onChange({
                ...version,
                config: {
                  ...version.config,
                  section_3: {
                    ...version.config.section_3,
                    ibs: nextField,
                  },
                },
              })
            }
          />
          <div style={{ paddingBottom: '0.9rem', color: 'var(--brs-gray-400)', fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>
            +
          </div>
          <RateField
            label="CBS"
            field={version.config.section_3.cbs}
            disabled={readOnly}
            onChange={(nextField) =>
              onChange({
                ...version,
                config: {
                  ...version.config,
                  section_3: {
                    ...version.config.section_3,
                    cbs: nextField,
                  },
                },
              })
            }
          />
          <div style={{ paddingBottom: '0.9rem', color: 'var(--brs-gray-400)', fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>
            =
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <TotalField label="Totalizador" value={totals.section_3} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0.95rem', border: '1px solid var(--brs-gray-100)', background: '#fff' }}>
        <SectionLabel
          title="Seção 4. Impostos Passíveis de Retenção pelo Tomador do Serviço"
          subtitle="Alíquotas máximas para o IRPJ e as CSRF que podem ser retidos pelo tomador do serviço, com base no CNAE, CTN e NBS do serviço prestado."
        />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          <RateField
            label="IRPJ"
            field={version.config.section_4.irpj}
            disabled={readOnly}
            onChange={(nextField) =>
              onChange({
                ...version,
                config: {
                  ...version.config,
                  section_4: {
                    ...version.config.section_4,
                    irpj: nextField,
                  },
                },
              })
            }
          />
          <div style={{ paddingBottom: '0.9rem', color: 'var(--brs-gray-400)', fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>
            +
          </div>
          <RateField
            label="CSLL"
            field={version.config.section_4.csll}
            disabled={readOnly}
            onChange={(nextField) =>
              onChange({
                ...version,
                config: {
                  ...version.config,
                  section_4: {
                    ...version.config.section_4,
                    csll: nextField,
                  },
                },
              })
            }
          />
          <div style={{ paddingBottom: '0.9rem', color: 'var(--brs-gray-400)', fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>
            +
          </div>
          <RateField
            label="PIS"
            field={version.config.section_4.pis}
            disabled={readOnly}
            onChange={(nextField) =>
              onChange({
                ...version,
                config: {
                  ...version.config,
                  section_4: {
                    ...version.config.section_4,
                    pis: nextField,
                  },
                },
              })
            }
          />
          <div style={{ paddingBottom: '0.9rem', color: 'var(--brs-gray-400)', fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>
            +
          </div>
          <RateField
            label="COFINS"
            field={version.config.section_4.cofins}
            disabled={readOnly}
            onChange={(nextField) =>
              onChange({
                ...version,
                config: {
                  ...version.config,
                  section_4: {
                    ...version.config.section_4,
                    cofins: nextField,
                  },
                },
              })
            }
          />
          <div style={{ paddingBottom: '0.9rem', color: 'var(--brs-gray-400)', fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>
            +
          </div>
          <RateField
            label="IBS"
            field={version.config.section_4.ibs}
            disabled={readOnly}
            onChange={(nextField) =>
              onChange({
                ...version,
                config: {
                  ...version.config,
                  section_4: {
                    ...version.config.section_4,
                    ibs: nextField,
                  },
                },
              })
            }
          />
          <div style={{ paddingBottom: '0.9rem', color: 'var(--brs-gray-400)', fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>
            +
          </div>
          <RateField
            label="CBS"
            field={version.config.section_4.cbs}
            disabled={readOnly}
            onChange={(nextField) =>
              onChange({
                ...version,
                config: {
                  ...version.config,
                  section_4: {
                    ...version.config.section_4,
                    cbs: nextField,
                  },
                },
              })
            }
          />
          <div style={{ paddingBottom: '0.9rem', color: 'var(--brs-gray-400)', fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>
            =
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <TotalField label="Totalizador" value={totals.section_4} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TaxRegimeEditor({ regimeId, isNew, viewOnly }: Props) {
  const router = useRouter()
  const [regime, setRegime] = useState<TaxRegimeRecord | null>(isNew ? createEmptyTaxRegime() : null)
  const [name, setName] = useState('')
  const [versions, setVersions] = useState<TaxRegimeVersionRecord[]>(isNew ? [createEmptyTaxRegimeVersion()] : [])
  const [draftVersion, setDraftVersion] = useState<TaxRegimeVersionRecord | null>(isNew ? createEmptyTaxRegimeVersion() : null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<FeedbackMessage | null>(null)

  const activeVersion = useMemo(() => versions.find((version) => isTaxRegimeVersionActive(version)) || null, [versions])
  const historicalVersions = useMemo(() => versions.filter((version) => !isTaxRegimeVersionActive(version)), [versions])
  const currentEditableVersion = draftVersion || activeVersion || (isNew ? createEmptyTaxRegimeVersion() : null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (isNew) return
      setLoading(true)
      try {
        const res = await getTaxRegime(String(regimeId || ''))
        if (cancelled) return
        if (res.success) {
          const nextRegime = res.regime ? normalizeTaxRegimeRecord(res.regime) : null
          setRegime(nextRegime)
          setName(nextRegime?.name || '')
          setVersions(nextRegime?.versions ? sortTaxRegimeVersions(nextRegime.versions) : [])
        } else {
          setMessage({ type: 'error', text: res.error || 'Erro ao carregar o regime tributário.' })
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao carregar o regime tributário.' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [isNew, regimeId])

  function updateVersion(nextVersion: TaxRegimeVersionRecord) {
    if (draftVersion && nextVersion.id === draftVersion.id) {
      setDraftVersion(nextVersion)
      return
    }
    setVersions((current) => current.map((version) => (version.id === nextVersion.id ? nextVersion : version)))
  }

  function createDraftFromActive() {
    if (viewOnly || isNew) return
    const base = draftVersion || activeVersion
    if (base) {
      setDraftVersion({
        ...deepCloneVersion(base),
        id: undefined,
        effective_from: '',
        effective_to: null,
        locked_at: null,
        config: JSON.parse(JSON.stringify(base.config)),
      })
    } else {
      setDraftVersion(createEmptyTaxRegimeVersion())
    }
    setMessage(null)
  }

  function cancelDraft() {
    if (isNew) {
      setDraftVersion(createEmptyTaxRegimeVersion())
      return
    }
    setDraftVersion(null)
    setMessage(null)
  }

  async function handleSave(version: TaxRegimeVersionRecord, createNewVersion = false) {
    if (viewOnly) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await saveTaxRegime({
        id: regime?.id,
        name,
        version,
        create_new_version: createNewVersion,
      })
      if (res.success) {
        const nextId = String(res.id || regime?.id || '')
        setMessage({
          type: 'success',
          text: createNewVersion
            ? 'Nova vigência salva com sucesso.'
            : regime?.id
              ? 'Regime tributário atualizado com sucesso.'
              : 'Regime tributário criado com sucesso.',
        })
        setDraftVersion(isNew ? createEmptyTaxRegimeVersion() : null)
        if (!regime?.id && nextId) {
          router.replace(`/rh/parceiros/config/provedores/regimes-tributarios/${nextId}`)
        }
        await Promise.resolve()
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao salvar o regime tributário.' })
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao salvar o regime tributário.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Link href="/rh/parceiros/config/provedores/regimes-tributarios" className="btn btn-ghost btn-sm">
              <ArrowLeft size={16} />
              Voltar
            </Link>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brs-gray-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} />
              {isNew ? 'Novo Regime Tributário' : 'Regime Tributário'}
            </div>
          </div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Cadastre o nome do regime e as vigências históricas com as alíquotas que serão reaproveitadas pelos demais módulos.
          </div>
        </div>

        {!viewOnly && currentEditableVersion ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving}
            onClick={() => handleSave(currentEditableVersion, !!draftVersion && !!regime?.id && !isNew)}
          >
            <Save size={16} />
            {draftVersion ? 'Salvar nova vigência' : regime?.id || !isNew ? 'Salvar regime' : 'Criar regime'}
          </button>
        ) : null}
      </div>

      {message ? (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.875rem 1rem',
            borderRadius: 10,
            border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: message.type === 'success' ? '#065F46' : '#991B1B',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{message.text}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'var(--brs-navy)' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem', border: '1px solid var(--brs-gray-100)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 320px' }}>
                <label className="form-label">Nome do Regime Tributário</label>
                <input
                className="form-control"
                maxLength={120}
                value={name}
                disabled={viewOnly}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lucro Real, Lucro Presumido e Simples Nacional"
              />
            </div>
              <div style={{ flex: '0 0 auto', alignSelf: 'end' }}>
                <div style={{ padding: '0.85rem 1rem', borderRadius: 12, background: '#F8FAFC', border: '1px solid var(--brs-gray-100)', minWidth: 280 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--brs-gray-700)', fontWeight: 700 }}>
                    <Info size={16} />
                    Controle de vigência
                  </div>
                  <div style={{ marginTop: '0.35rem', color: 'var(--brs-gray-500)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                    A vigência ativa fica sem data final. Ao criar uma nova vigência, a anterior será encerrada automaticamente no dia anterior.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!viewOnly && !draftVersion && activeVersion ? (
            <div className="card" style={{ padding: '1rem', border: '1px dashed var(--brs-gray-200)', background: '#fff', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <CalendarDays size={18} color="var(--brs-gray-500)" />
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)' }}>Vigência ativa disponível para nova versão</div>
                  <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem' }}>
                    Clique para criar uma nova vigência. A versão atual será encerrada no dia anterior ao início da próxima.
                  </div>
                </div>
              </div>
              <button type="button" className="btn btn-outline" onClick={createDraftFromActive}>
                <Plus size={16} />
                Nova vigência
              </button>
            </div>
          ) : null}

          {!viewOnly && !draftVersion && !activeVersion ? (
            <div className="card" style={{ padding: '1rem', border: '1px dashed var(--brs-gray-200)', background: '#fff', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <CalendarDays size={18} color="var(--brs-gray-500)" />
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)' }}>Nenhuma vigência ativa cadastrada</div>
                  <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem' }}>
                    Inicie a configuração criando a primeira vigência deste regime tributário.
                  </div>
                </div>
              </div>
              <button type="button" className="btn btn-outline" onClick={createDraftFromActive}>
                <Plus size={16} />
                Nova vigência
              </button>
            </div>
          ) : null}

          {draftVersion ? <VersionCard title="Nova vigência" version={draftVersion} disabled={!!viewOnly} onChange={(next) => setDraftVersion(next)} /> : null}

          {!draftVersion && activeVersion ? <VersionCard title="Vigência ativa" version={activeVersion} disabled={!!viewOnly} onChange={(next) => updateVersion(next)} /> : null}

          {historicalVersions.length ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {historicalVersions.map((version) => (
                <VersionCard key={version.id} title="Vigência histórica" version={version} disabled onChange={() => undefined} />
              ))}
            </div>
          ) : null}

          {!currentEditableVersion && !historicalVersions.length ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <Clock3 size={42} style={{ color: 'var(--brs-gray-300)', marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)' }}>Nenhuma vigência cadastrada ainda</div>
              <div style={{ color: 'var(--brs-gray-500)', marginTop: '0.35rem' }}>
                Clique em <strong>Nova vigência</strong> para começar o histórico deste regime.
              </div>
            </div>
          ) : null}

          {!viewOnly && draftVersion ? (
            <div className="card" style={{ padding: '1rem', border: '1px solid var(--brs-gray-100)', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)' }}>Nova vigência em edição</div>
                <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem' }}>
                  A versão ativa ficará com data final automática após o salvamento.
                </div>
              </div>
              <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-outline" onClick={createDraftFromActive}>
                  <Plus size={16} />
                  Recarregar da ativa
                </button>
                <button type="button" className="btn btn-ghost" onClick={cancelDraft}>
                  <X size={16} />
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}

          {viewOnly ? (
            <div className="card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', background: '#F8FAFC' }}>
              <ShieldAlert size={18} color="var(--brs-gray-500)" />
              <div style={{ color: 'var(--brs-gray-600)', fontSize: '0.9rem' }}>
                Modo de visualização: as vigências históricas aparecem somente para consulta, sem opção de edição.
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
