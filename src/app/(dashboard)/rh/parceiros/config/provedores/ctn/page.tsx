'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle, Edit2, FileText, Loader2, Plus, Save, X } from 'lucide-react'
import { getCtns, saveCtn, setCtnStatus } from '../../../actions'
import { formatCtnCode, normalizeCtnCodeDigits, type CtnRecord } from '@/lib/ctns'

type FeedbackMessage = {
  type: 'success' | 'error'
  text: string
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function CtnPage() {
  const [items, setItems] = useState<CtnRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<FeedbackMessage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CtnRecord | null>(null)
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const res = await getCtns()
      if (res.success) {
        setItems((res.ctns || []) as CtnRecord[])
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao carregar os CTNs.' })
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Erro ao carregar os CTNs.') })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (cancelled) return
      await loadData()
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  function openNewModal() {
    setEditingItem(null)
    setCode('')
    setDescription('')
    setIsModalOpen(true)
  }

  function openEditModal(item: CtnRecord) {
    setEditingItem(item)
    setCode(normalizeCtnCodeDigits(String(item.code || '')))
    setDescription(String(item.description || ''))
    setIsModalOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const normalizedCode = normalizeCtnCodeDigits(code)
    const normalizedDescription = String(description || '').replace(/\s+/g, ' ').trim().slice(0, 500)

    if (normalizedCode.length !== 6) {
      setMessage({ type: 'error', text: 'Informe um código CTN com 6 dígitos.' })
      return
    }
    if (!normalizedDescription) {
      setMessage({ type: 'error', text: 'Informe a descrição do CTN.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const res = await saveCtn({
        id: editingItem?.id,
        code: normalizedCode,
        description: normalizedDescription,
        is_active: editingItem?.is_active ?? true,
      })

      if (res.success) {
        setMessage({ type: 'success', text: editingItem ? 'CTN atualizado com sucesso.' : 'CTN criado com sucesso.' })
        setIsModalOpen(false)
        setEditingItem(null)
        setCode('')
        setDescription('')
        await loadData()
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao salvar o CTN.' })
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Erro ao salvar o CTN.') })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(item: CtnRecord) {
    if (!item.id) return
    setBusyId(item.id)
    setMessage(null)
    try {
      const nextActive = !item.is_active
      const res = await setCtnStatus(item.id, nextActive)
      if (res.success) {
        setMessage({
          type: 'success',
          text: nextActive ? 'CTN reativado.' : 'CTN inativado.',
        })
        await loadData()
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao alterar o status.' })
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Erro ao alterar o status.') })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brs-gray-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} />
            CTN
          </div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Cadastro dos Códigos de Tributação Nacional para utilização nos subsistemas.
          </div>
        </div>

        <button type="button" className="btn btn-primary" onClick={openNewModal}>
          <Plus size={16} />
          Novo CTN
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
                <th>CTN</th>
                <th>Descrição</th>
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
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <FileText size={48} style={{ color: 'var(--brs-gray-300)', marginBottom: '1rem' }} />
                      <h3>Nenhum CTN cadastrado</h3>
                      <p>Crie o primeiro CTN para reutilizá-lo nos demais subsistemas.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--brs-gray-800)' }}>{formatCtnCode(item.code)}</div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--brs-gray-700)' }}>{item.description}</div>
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
          <div className="modal" style={{ maxWidth: 560 }} onClick={(event) => event.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h3 className="modal-title">{editingItem ? 'Editar CTN' : 'Novo CTN'}</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)} aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body" style={{ display: 'grid', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Código CTN</label>
                  <input
                    type="text"
                    className="form-control"
                    maxLength={7}
                    inputMode="numeric"
                    value={formatCtnCode(code)}
                    onChange={(event) => setCode(normalizeCtnCodeDigits(event.target.value))}
                    placeholder="00.0000"
                    autoFocus
                  />
                  <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                    São 6 dígitos no cadastro, exibidos no formato 00.0000.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <input
                    type="text"
                    className="form-control"
                    maxLength={500}
                    value={description}
                    onChange={(event) => setDescription(event.target.value.slice(0, 500))}
                    placeholder="Ex.: Tributação sobre serviços"
                  />
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
