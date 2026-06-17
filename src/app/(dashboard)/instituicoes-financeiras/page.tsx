'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle, Building2, Edit2, Loader2, Plus, Save, Upload, X } from 'lucide-react'
import {
  getFinancialInstitutions,
  saveFinancialInstitution,
  setFinancialInstitutionStatus,
} from '@/app/(dashboard)/rh/parceiros/actions'
import type { FinancialInstitutionRecord } from '@/lib/financial-institutions'

type FeedbackMessage = {
  type: 'success' | 'error'
  text: string
}

function normalizeName(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function FinancialInstitutionLogoField({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const [preview, setPreview] = useState(String(value || '').trim())

  useEffect(() => {
    setPreview(String(value || '').trim())
  }, [value])

  function handleFile(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const next = String(reader.result || '')
      setPreview(next)
      onChange(next)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label">Logotipo</label>
      <input className="form-control" type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
      <div style={{ marginTop: 10, width: 96, height: 96, borderRadius: 18, border: '1px solid var(--brs-gray-200)', overflow: 'hidden', background: '#fff', display: 'grid', placeItems: 'center' }}>
        {preview ? (
          <img src={preview} alt="Logotipo da instituição financeira" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Upload size={22} color="var(--brs-gray-400)" />
        )}
      </div>
    </div>
  )
}

export default function FinancialInstitutionsPage() {
  const [items, setItems] = useState<FinancialInstitutionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<FeedbackMessage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FinancialInstitutionRecord | null>(null)
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const res = await getFinancialInstitutions()
      if (res.success) {
        setItems((res.items || []) as FinancialInstitutionRecord[])
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao carregar as instituições financeiras.' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao carregar as instituições financeiras.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openNewModal() {
    setEditingItem(null)
    setName('')
    setLogoUrl('')
    setIsModalOpen(true)
  }

  function openEditModal(item: FinancialInstitutionRecord) {
    setEditingItem(item)
    setName(String(item.name || ''))
    setLogoUrl(String(item.logo_url || ''))
    setIsModalOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const normalizedName = normalizeName(name)
    if (!normalizedName) {
      setMessage({ type: 'error', text: 'Informe o nome da instituição financeira.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const res = await saveFinancialInstitution({
        id: editingItem?.id,
        name: normalizedName,
        logo_url: String(logoUrl || '').trim(),
        is_active: editingItem?.is_active ?? true,
      })

      if (res.success) {
        setMessage({ type: 'success', text: editingItem ? 'Instituição financeira atualizada com sucesso.' : 'Instituição financeira criada com sucesso.' })
        setIsModalOpen(false)
        setEditingItem(null)
        setName('')
        setLogoUrl('')
        await loadData()
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao salvar a instituição financeira.' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao salvar a instituição financeira.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(item: FinancialInstitutionRecord) {
    if (!item.id) return
    setBusyId(item.id)
    setMessage(null)
    try {
      const nextActive = !item.is_active
      const res = await setFinancialInstitutionStatus(item.id, nextActive)
      if (res.success) {
        setMessage({
          type: 'success',
          text: nextActive ? 'Instituição financeira reativada.' : 'Instituição financeira inativada.',
        })
        await loadData()
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao alterar o status.' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao alterar o status.' })
    } finally {
      setBusyId(null)
    }
  }

  const previewItems = useMemo(() => items.slice(0, 12), [items])

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brs-gray-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={18} />
            Instituições Financeiras
          </div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Cadastre a base mínima de instituições financeiras para uso na aba Financeiro das promotoras.
          </div>
        </div>

        <button type="button" className="btn btn-primary" onClick={openNewModal}>
          <Plus size={16} />
          Nova Instituição
        </button>
      </div>

      {message && (
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
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{message.text}</span>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Logotipo</th>
                <th>Instituição Financeira</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                    <span className="spinner" style={{ borderTopColor: 'var(--brs-navy)' }} />
                  </td>
                </tr>
              ) : previewItems.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <Building2 size={48} style={{ color: 'var(--brs-gray-300)', marginBottom: '1rem' }} />
                      <h3>Nenhuma instituição financeira cadastrada</h3>
                      <p>Crie a primeira instituição para liberá-la na aba Financeiro das promotoras.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                previewItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--brs-gray-200)', background: '#fff', display: 'grid', placeItems: 'center' }}>
                        {item.logo_url ? (
                          <img src={item.logo_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Building2 size={18} color="var(--brs-gray-400)" />
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--brs-gray-800)' }}>{item.name}</div>
                    </td>
                    <td>
                      <span className={`badge ${item.is_active ? 'badge-success' : 'badge-gray'}`}>
                        {item.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEditModal(item)}>
                          <Edit2 size={16} />
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${item.is_active ? 'btn-outline' : 'btn-primary'}`}
                          onClick={() => handleToggleStatus(item)}
                          disabled={busyId === item.id}
                        >
                          {busyId === item.id ? <Loader2 size={16} className="spinner" /> : null}
                          {item.is_active ? 'Inativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={(event) => event.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h3 className="modal-title">{editingItem ? 'Editar Instituição Financeira' : 'Nova Instituição Financeira'}</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)} aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px', gap: '1rem', alignItems: 'start' }}>
                  <div className="form-group">
                    <label className="form-label">Nome</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={120}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ex.: Banco Santander"
                      autoFocus
                    />
                  </div>
                  <FinancialInstitutionLogoField value={logoUrl} onChange={setLogoUrl} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
