'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getTemplates, saveContractTemplate } from '../../actions'
import { FileText, Plus, Edit2, Save, Loader2, Tag, CheckCircle, AlertCircle } from 'lucide-react'

interface TemplateItem {
  id: string
  name: string
  body: string
  placeholders?: Array<{
    id: string
    token: string
    label: string
    required?: boolean
  }>
}

const GLOBAL_TAGS = [
  { tag: '{{contratante.cpf}}', label: 'CPF do contratante' },
  { tag: '{{contratante.nome}}', label: 'Nome do contratante' },
  { tag: '{{contratante.email}}', label: 'E-mail do contratante' },
  { tag: '{{contratante.whatsapp}}', label: 'WhatsApp do contratante' },
  { tag: '{{contratado.cpf}}', label: 'CPF do contratado' },
  { tag: '{{contratado.nome}}', label: 'Nome do contratado' },
  { tag: '{{contratado.email}}', label: 'E-mail do contratado' },
  { tag: '{{contratado.whatsapp}}', label: 'WhatsApp do contratado' },
  { tag: '{{test1.cpf}}', label: 'CPF da testemunha 1' },
  { tag: '{{test1.nome}}', label: 'Nome da testemunha 1' },
  { tag: '{{test1.email}}', label: 'E-mail da testemunha 1' },
  { tag: '{{test1.whatsapp}}', label: 'WhatsApp da testemunha 1' },
  { tag: '{{test2.cpf}}', label: 'CPF da testemunha 2' },
  { tag: '{{test2.nome}}', label: 'Nome da testemunha 2' },
  { tag: '{{test2.email}}', label: 'E-mail da testemunha 2' },
  { tag: '{{test2.whatsapp}}', label: 'WhatsApp da testemunha 2' },
]

export default function DocumentTemplatesPage() {
  const [items, setItems] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedItem, setSelectedItem] = useState<Partial<TemplateItem> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const usedTags = useMemo(() => {
    const body = String(selectedItem?.body || '')
    return Array.from(new Set(body.match(/\{\{[^}]+\}\}/g) || []))
  }, [selectedItem?.body])

  const previewBody = useMemo(() => {
    const fakeData: Record<string, string> = {
      '{{contratante.cpf}}': '11.222.333/0001-44',
      '{{contratante.nome}}': 'BRS Promotora',
      '{{contratante.email}}': 'juridico@brspromotora.com.br',
      '{{contratante.whatsapp}}': '(61) 99999-0001',
      '{{contratado.cpf}}': '123.456.789-10',
      '{{contratado.nome}}': 'João da Silva',
      '{{contratado.email}}': 'joao@parceiro.com',
      '{{contratado.whatsapp}}': '(61) 99999-0002',
      '{{test1.cpf}}': '321.654.987-00',
      '{{test1.nome}}': 'Maria Empresa',
      '{{test1.email}}': 'maria@empresa.com.br',
      '{{test1.whatsapp}}': '(61) 99999-0003',
      '{{test2.cpf}}': '789.456.123-88',
      '{{test2.nome}}': 'Pedro Parceiro',
      '{{test2.email}}': 'pedro@parceiro.com',
      '{{test2.whatsapp}}': '(61) 99999-0004',
    }
    return String(selectedItem?.body || '').replace(/\{\{[^}]+\}\}/g, (token) => fakeData[token] || `[${token}]`)
  }, [selectedItem?.body])

  async function loadData() {
    setLoading(true)
    const res = await getTemplates()
    if (res.success && res.contracts) {
      setItems(res.contracts as any)
      setSelectedItem((res.contracts as any[])[0] || null)
    } else {
      setMessage({ type: 'error', text: 'Erro ao carregar os modelos.' })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setSelectedItem((prev) => {
      if (!prev) return prev
      const current = Array.isArray(prev.placeholders) ? prev.placeholders : []
      const byToken = new Map<string, any>()
      for (const item of current) {
        const token = String(item?.token || '')
        if (token) byToken.set(token, item)
      }
      const next = usedTags.map((token) => {
        const existing = byToken.get(token)
        const fallbackId = token.replace(/[{}]/g, '').replace(/[^a-zA-Z0-9_-]/g, '_')
        return {
          id: String(existing?.id || fallbackId || `ph_${Math.random().toString(36).slice(2, 8)}`),
          token,
          label: String(existing?.label || token),
          required: !!existing?.required,
        }
      })
      return { ...prev, placeholders: next }
    })
  }, [usedTags])

  function handleNew() {
    setSelectedItem({ name: 'Novo Modelo de Documento', body: '', placeholders: [] })
  }

  function insertTag(tag: string) {
    const textarea = textareaRef.current
    if (!textarea || !selectedItem) return
    const startPos = textarea.selectionStart
    const endPos = textarea.selectionEnd
    const text = selectedItem.body || ''
    const newText = text.substring(0, startPos) + tag + text.substring(endPos, text.length)
    setSelectedItem({ ...selectedItem, body: newText })
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = startPos + tag.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 50)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem?.name || !selectedItem.body) {
      setMessage({ type: 'error', text: 'Nome e corpo do modelo são obrigatórios.' })
      return
    }
    setSaving(true)
    setMessage(null)

    const res = await saveContractTemplate({
      id: selectedItem.id,
      name: selectedItem.name,
      body: selectedItem.body,
      placeholders: (selectedItem.placeholders || []).map((p) => ({
        id: String(p.id),
        token: String(p.token),
        label: String(p.label || p.token),
        required: !!p.required,
      })),
    })

    if (res.success) {
      setMessage({ type: 'success', text: 'Modelo salvo com sucesso.' })
      await loadData()
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao salvar o modelo.' })
    }

    setSaving(false)
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brs-gray-900)' }}>
            Modelos de Documentos (SCP)
          </div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem' }}>
            Use tags globais pré-envio da assinatura e placeholders genéricos para mapeamento no processo.
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleNew}>
          <Plus size={16} />
          Novo Modelo
        </button>
      </div>

      {message && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
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
          <span>{message.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '0.35fr 0.65fr', gap: '1.5rem', alignItems: 'stretch', height: 'calc(100dvh - 220px)', overflow: 'hidden' }}>
        <div className="card" style={{ padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--brs-gray-800)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <FileText size={18} />
            Modelos
          </div>
          {loading ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--brs-gray-600)' }}>
              <Loader2 className="spinner" size={16} />
              Carregando...
            </div>
          ) : (
            <div style={{ overflowY: 'auto', paddingRight: '0.25rem' }}>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setSelectedItem(item)}
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    border: '1px solid var(--brs-gray-100)',
                    marginBottom: '0.5rem',
                    background: selectedItem?.id === item.id ? 'var(--brs-primary-50)' : '#fff',
                    color: 'var(--brs-gray-800)',
                    fontWeight: selectedItem?.id === item.id ? 800 : 600,
                  }}
                >
                  <Edit2 size={14} />
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="form-group">
              <label className="form-label">Nome do Modelo</label>
              <input
                type="text"
                className="form-control"
                value={selectedItem?.name || ''}
                onChange={(e) => setSelectedItem((prev) => ({ ...(prev || {}), name: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 0.3fr', gap: '1rem', flex: 1, minHeight: 0 }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <label className="form-label">Corpo do Documento</label>
                <textarea
                  ref={textareaRef}
                  className="form-control"
                  style={{ flex: 1, minHeight: 0, resize: 'none' }}
                  value={selectedItem?.body || ''}
                  onChange={(e) => setSelectedItem((prev) => ({ ...(prev || {}), body: e.target.value }))}
                />
              </div>

              <div className="card" style={{ padding: '0.75rem', border: '1px solid var(--brs-gray-100)', background: 'var(--brs-gray-50)', overflowY: 'auto' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--brs-gray-800)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Tag size={16} />
                  Tags globais pré-envio
                </div>
                {GLOBAL_TAGS.map((t) => (
                  <button
                    key={t.tag}
                    type="button"
                    className="btn btn-outline"
                    onClick={() => insertTag(t.tag)}
                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '0.5rem' }}
                  >
                    {t.tag}
                    <span style={{ marginLeft: '0.5rem', color: 'var(--brs-gray-500)', fontWeight: 600 }}>{t.label}</span>
                  </button>
                ))}

                <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--brs-gray-200)', paddingTop: '0.75rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Placeholders genéricos</div>
                  {(selectedItem?.placeholders || []).length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--brs-gray-500)' }}>Nenhum placeholder no texto.</div>
                  ) : (
                    (selectedItem?.placeholders || []).map((placeholder, idx) => (
                      <div key={`${placeholder.id}-${idx}`} style={{ border: '1px solid var(--brs-gray-200)', borderRadius: 8, padding: '0.5rem', marginBottom: '0.4rem', background: '#fff' }}>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '0.35rem' }}>{placeholder.token}</div>
                        <input
                          className="form-control"
                          style={{ height: 34, marginBottom: '0.35rem' }}
                          placeholder="Label do placeholder"
                          value={placeholder.label || ''}
                          onChange={(e) =>
                            setSelectedItem((prev) => {
                              if (!prev) return prev
                              const list = [...(prev.placeholders || [])]
                              list[idx] = { ...list[idx], label: e.target.value }
                              return { ...prev, placeholders: list }
                            })
                          }
                        />
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
                          <input
                            type="checkbox"
                            checked={!!placeholder.required}
                            onChange={(e) =>
                              setSelectedItem((prev) => {
                                if (!prev) return prev
                                const list = [...(prev.placeholders || [])]
                                list[idx] = { ...list[idx], required: e.target.checked }
                                return { ...prev, placeholders: list }
                              })
                            }
                          />
                          Obrigatório no processo
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: '0.75rem', padding: '0.75rem', border: '1px solid var(--brs-gray-100)', background: 'var(--brs-gray-50)' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Preview (dados fake)</div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.78rem' }}>{previewBody}</pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                Salvar Modelo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

