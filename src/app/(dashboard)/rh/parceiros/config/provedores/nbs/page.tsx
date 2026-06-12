'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle, Edit2, FileText, Loader2, Plus, Save, X } from 'lucide-react'
import { getNbses, saveNbs, setNbsStatus } from '../../../actions'
import { formatNbsCode, normalizeNbsCodeDigits, type NbsRecord } from '@/lib/nbs'

type FeedbackMessage = {
  type: 'success' | 'error'
  text: string
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function NbsPage() {
  const [items, setItems] = useState<NbsRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<FeedbackMessage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<NbsRecord | null>(null)
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const res = await getNbses()
      if (res.success) {
        setItems((res.nbses || []) as NbsRecord[])
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao carregar os NBSs.' })
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Erro ao carregar os NBSs.') })
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

  function openEditModal(item: NbsRecord) {
    setEditingItem(item)
    setCode(normalizeNbsCodeDigits(String(item.code || '')))
    setDescription(String(item.description || ''))
    setIsModalOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const normalizedCode = normalizeNbsCodeDigits(code)
    const normalizedDescription = String(description || '').replace(/\s+/g, ' ').trim().slice(0, 500)

    if (normalizedCode.length !== 9) {
      setMessage({ type: 'error', text: 'Informe um código NBS com 9 dígitos.' })
      return
    }
    if (!normalizedDescription) {
      setMessage({ type: 'error', text: 'Informe a descrição do NBS.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const res = await saveNbs({
        id: editingItem?.id,
        code: normalizedCode,
        description: normalizedDescription,
        is_active: editingItem?.is_active ?? true,
      })

      if (res.success) {
        setMessage({ type: 'success', text: editingItem ? 'NBS atualizado com sucesso.' : 'NBS criado com sucesso.' })
        setIsModalOpen(false)
        setEditingItem(null)
        setCode('')
        setDescription('')
        await loadData()
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao salvar o NBS.' })
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Erro ao salvar o NBS.') })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(item: NbsRecord) {
    if (!item.id) return
    setBusyId(item.id)
    setMessage(null)
    try {
      const nextActive = !item.is_active
      const res = await setNbsStatus(item.id, nextActive)
      if (res.success) {
        setMessage({
          type: 'success',
          text: nextActive ? 'NBS reativado.' : 'NBS inativado.',
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
            NBS
          </div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Cadastro da Nomenclatura Brasileira de Serviços para utilização nos subsistemas para definição das alíquotas de impostos e retenções.
          </div>
        </div>

        <button type="button" className="btn btn-primary" onClick={openNewModal}>
          <Plus size={16} />
          Novo NBS
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
                <th>NBS</th>
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
                      <h3>Nenhum NBS cadastrado</h3>
                      <p>Crie o primeiro NBS para reutilizá-lo nos demais subsistemas.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--brs-gray-800)' }}>{formatNbsCode(item.code)}</div>
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
                <h3 className="modal-title">{editingItem ? 'Editar NBS' : 'Novo NBS'}</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)} aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body" style={{ display: 'grid', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Código NBS</label>
                  <input
                    type="text"
                    className="form-control"
                    maxLength={12}
                    inputMode="numeric"
                    value={formatNbsCode(code)}
                    onChange={(event) => setCode(normalizeNbsCodeDigits(event.target.value))}
                    placeholder="1.0101.10.00"
                    autoFocus
                  />
                  <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                    São 9 dígitos no cadastro, exibidos no formato 1.0101.10.00.
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
                    placeholder="Ex.: Serviços de apoio administrativo"
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
