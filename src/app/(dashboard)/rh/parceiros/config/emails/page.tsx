'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getTemplates, saveEmailTemplate } from '../../actions'
import { Mail, Plus, Edit2, Save, Loader2, Tag, CheckCircle, AlertCircle } from 'lucide-react'

interface TemplateItem {
  id: string
  name: string
  subject: string
  body: string
}

const GLOBAL_TAGS = [
  { tag: '{{assinatura.link}}', label: 'Link de assinatura (Assinafy)' },
  { tag: '{{processo.id}}', label: 'ID do processo (instância)' },
  { tag: '{{campo.email_destino}}', label: 'E-mail destino (tag mapeada no processo)' },
]

export default function EmailTemplatesPage() {
  const [items, setItems] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedItem, setSelectedItem] = useState<Partial<TemplateItem> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const usedTags = useMemo(() => {
    const body = String(selectedItem?.body || '')
    const subject = String(selectedItem?.subject || '')
    return Array.from(new Set(`${subject}\n${body}`.match(/\{\{[^}]+\}\}/g) || []))
  }, [selectedItem?.body, selectedItem?.subject])
  const previewSubject = useMemo(() => {
    const fakeData: Record<string, string> = {
      '{{assinatura.link}}': 'https://assinafy.exemplo/link/abc123',
      '{{processo.id}}': 'PROC-000123',
      '{{campo.email_destino}}': 'parceiro@exemplo.com',
    }
    return String(selectedItem?.subject || '').replace(/\{\{[^}]+\}\}/g, (tag) => fakeData[tag] || `[${tag}]`)
  }, [selectedItem?.subject])
  const previewBody = useMemo(() => {
    const fakeData: Record<string, string> = {
      '{{assinatura.link}}': 'https://assinafy.exemplo/link/abc123',
      '{{processo.id}}': 'PROC-000123',
      '{{campo.email_destino}}': 'parceiro@exemplo.com',
    }
    return String(selectedItem?.body || '').replace(/\{\{[^}]+\}\}/g, (tag) => fakeData[tag] || `[${tag}]`)
  }, [selectedItem?.body])

  async function loadData() {
    setLoading(true)
    const res = await getTemplates()
    if (res.success && res.emails) {
      setItems(res.emails as any)
      setSelectedItem((res.emails as any[])[0] || null)
    } else {
      setMessage({ type: 'error', text: 'Erro ao carregar os modelos.' })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleNew() {
    setSelectedItem({ name: 'Novo Modelo de E-mail', subject: 'Assunto do E-mail', body: '' })
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

    const res = await saveEmailTemplate({
      id: selectedItem.id,
      name: selectedItem.name,
      subject: selectedItem.subject || 'Notificação BRS Promotora',
      body: selectedItem.body,
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
            Modelos de E-mails (SCP)
          </div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem' }}>
            Cadastre modelos genéricos. As tags específicas são mapeadas no Construtor de Processo.
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
        {/* Lista */}
        <div className="card" style={{ padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--brs-gray-800)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Mail size={18} />
            Modelos
          </div>
          {loading ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--brs-gray-600)' }}>
              <Loader2 className="spinner" size={16} />
              Carregando...
            </div>
          ) : (
            <div style={{ overflowY: 'auto', paddingRight: '0.25rem' }}>
              {items.map(item => (
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

        {/* Editor */}
        <div className="card" style={{ padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Nome do Modelo</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedItem?.name || ''}
                  onChange={e => setSelectedItem(prev => ({ ...(prev || {}), name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assunto</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedItem?.subject || ''}
                  onChange={e => setSelectedItem(prev => ({ ...(prev || {}), subject: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 0.3fr', gap: '1rem', flex: 1, minHeight: 0 }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <label className="form-label">Corpo do E-mail</label>
                <textarea
                  ref={textareaRef}
                  className="form-control"
                  style={{ flex: 1, minHeight: 0, resize: 'none' }}
                  value={selectedItem?.body || ''}
                  onChange={e => setSelectedItem(prev => ({ ...(prev || {}), body: e.target.value }))}
                />
              </div>

              <div className="card" style={{ padding: '0.75rem', border: '1px solid var(--brs-gray-100)', background: 'var(--brs-gray-50)', overflowY: 'auto' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--brs-gray-800)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Tag size={16} />
                  Tags globais
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--brs-gray-500)', marginBottom: '0.75rem' }}>
                  Tags específicas do parceiro/processo são mapeadas no Construtor de Processo.
                </div>
                {GLOBAL_TAGS.map(t => (
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
                  <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Placeholders usados</div>
                  {usedTags.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--brs-gray-500)' }}>Nenhum placeholder no texto.</div>
                  ) : (
                    usedTags.map((tag) => (
                      <div key={tag} style={{ fontSize: '0.78rem', fontFamily: 'monospace', marginBottom: '0.25rem' }}>
                        {tag}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: '0.75rem', padding: '0.75rem', border: '1px solid var(--brs-gray-100)', background: 'var(--brs-gray-50)' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Preview (dados fake)</div>
              <div style={{ fontSize: '0.78rem', marginBottom: '0.45rem' }}>
                <strong>Assunto:</strong> {previewSubject || '—'}
              </div>
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
