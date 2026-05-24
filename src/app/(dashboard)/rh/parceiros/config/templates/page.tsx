'use client'

import { useState, useEffect, useRef } from 'react'
import { getTemplates, saveContractTemplate, saveEmailTemplate } from '../../actions'
import { FileText, Mail, Plus, Edit2, Save, Loader2, Tag, CheckCircle, AlertCircle } from 'lucide-react'

interface TemplateItem {
  id: string
  name: string
  subject?: string
  body: string
}

const DYNAMIC_TAGS = [
  { tag: '{{name}}', label: 'Nome / Razão Social' },
  { tag: '{{fantasy_name}}', label: 'Nome Fantasia' },
  { tag: '{{cpf_cnpj}}', label: 'CPF ou CNPJ' },
  { tag: '{{email}}', label: 'E-mail Principal' },
  { tag: '{{phone_whatsapp}}', label: 'WhatsApp Celular' },
  { tag: '{{arw_code}}', label: 'Código ARW' },
  { tag: '{{temporary_password}}', label: 'Senha Provisória' },
  { tag: '{{google_drive_url}}', label: 'Pasta Google Drive' },
  { tag: '{{assinafy_signature_url}}', label: 'Link Assinatura Eletrônica' },
  { tag: '{{address_street}}', label: 'Rua do Endereço' },
  { tag: '{{address_city}}', label: 'Cidade' }
]

export default function TemplatesConfigPage() {
  const [contracts, setContracts] = useState<TemplateItem[]>([])
  const [emails, setEmails] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Editor State
  const [activeTab, setActiveTab] = useState<'contrato' | 'email'>('contrato')
  const [selectedItem, setSelectedItem] = useState<Partial<TemplateItem> | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function loadData() {
    setLoading(true)
    const res = await getTemplates()
    if (res.success && res.contracts && res.emails) {
      setContracts(res.contracts as TemplateItem[])
      setEmails(res.emails as TemplateItem[])
      
      // Auto seleciona o primeiro se houver
      if (activeTab === 'contrato' && res.contracts.length > 0) {
        setSelectedItem(res.contracts[0])
      } else if (activeTab === 'email' && res.emails.length > 0) {
        setSelectedItem(res.emails[0])
      } else {
        setSelectedItem(null)
      }
    } else {
      setMessage({ type: 'error', text: 'Erro ao carregar os modelos.' })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [activeTab])

  function handleNew() {
    setSelectedItem({
      name: activeTab === 'contrato' ? 'Novo Modelo de Contrato' : 'Novo Modelo de E-mail',
      subject: activeTab === 'email' ? 'Assunto do E-mail' : undefined,
      body: ''
    })
  }

  function insertTag(tag: string) {
    const textarea = textareaRef.current
    if (!textarea || !selectedItem) return

    const startPos = textarea.selectionStart
    const endPos = textarea.selectionEnd
    const text = selectedItem.body || ''
    
    const newText = text.substring(0, startPos) + tag + text.substring(endPos, text.length)
    
    setSelectedItem({
      ...selectedItem,
      body: newText
    })

    // Retorna o foco para o textarea e posiciona o cursor após a tag
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = startPos + tag.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 50)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem?.name || !selectedItem.body) {
      setMessage({ type: 'error', text: 'Nome e Corpo do modelo são obrigatórios.' })
      return
    }

    setSaving(true)
    setMessage(null)

    let res
    if (activeTab === 'contrato') {
      res = await saveContractTemplate({
        id: selectedItem.id,
        name: selectedItem.name,
        body: selectedItem.body
      })
    } else {
      res = await saveEmailTemplate({
        id: selectedItem.id,
        name: selectedItem.name,
        subject: selectedItem.subject || 'Notificação BRS Promotora',
        body: selectedItem.body
      })
    }

    if (res.success) {
      setMessage({ type: 'success', text: 'Modelo salvo com sucesso!' })
      loadData()
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao salvar modelo.' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <span className="spinner" style={{ borderTopColor: 'var(--brs-navy)' }} />
      </div>
    )
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            Modelos de Contratos e E-mails (SCP)
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Configure o teor dos contratos para assinatura eletrônica e os e-mails disparados ao parceiro
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <Plus size={16} />
          {activeTab === 'contrato' ? 'Novo Contrato' : 'Novo E-mail'}
        </button>
      </div>

      {message && (
        <div 
          style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: message.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`
          }}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--brs-gray-200)', marginBottom: '1.5rem', paddingBottom: '1px' }}>
        <button 
          className={`btn ${activeTab === 'contrato' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setActiveTab('contrato'); setSelectedItem(null) }}
          style={{ borderRadius: '8px 8px 0 0', margin: 0 }}
        >
          <FileText size={16} style={{ marginRight: '0.5rem' }} />
          Contratos (Assinafy)
        </button>
        <button 
          className={`btn ${activeTab === 'email' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setActiveTab('email'); setSelectedItem(null) }}
          style={{ borderRadius: '8px 8px 0 0', margin: 0 }}
        >
          <Mail size={16} style={{ marginRight: '0.5rem' }} />
          E-mails (Resend)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Lado Esquerdo: Lista de Modelos Cadastrados */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--brs-gray-800)', marginBottom: '0.75rem', padding: '0.25rem' }}>
            Modelos Disponíveis
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activeTab === 'contrato' ? (
              contracts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--brs-gray-400)', fontSize: '0.875rem' }}>
                  Nenhum contrato cadastrado.
                </div>
              ) : (
                contracts.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedItem(c)}
                    className="sidebar-link"
                    style={{ 
                      cursor: 'pointer',
                      background: selectedItem?.id === c.id ? 'var(--brs-gray-100)' : 'transparent',
                      fontWeight: selectedItem?.id === c.id ? 600 : 400,
                      color: selectedItem?.id === c.id ? 'var(--brs-navy)' : 'var(--brs-gray-600)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FileText size={16} />
                    <span>{c.name}</span>
                  </div>
                ))
              )
            ) : (
              emails.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--brs-gray-400)', fontSize: '0.875rem' }}>
                  Nenhum e-mail cadastrado.
                </div>
              ) : (
                emails.map(e => (
                  <div 
                    key={e.id}
                    onClick={() => setSelectedItem(e)}
                    className="sidebar-link"
                    style={{ 
                      cursor: 'pointer',
                      background: selectedItem?.id === e.id ? 'var(--brs-gray-100)' : 'transparent',
                      fontWeight: selectedItem?.id === e.id ? 600 : 400,
                      color: selectedItem?.id === e.id ? 'var(--brs-navy)' : 'var(--brs-gray-600)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Mail size={16} />
                    <span>{e.name}</span>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Lado Direito: Editor */}
        <div className="card" style={{ padding: '1.5rem' }}>
          {selectedItem ? (
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--brs-gray-800)' }}>
                  {selectedItem.id ? 'Editar Modelo' : 'Criar Modelo'}
                </h3>
              </div>

              {/* Nome */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Nome do Modelo</label>
                <input 
                  type="text" 
                  className="form-control"
                  required
                  placeholder="Ex: Contrato de Corretagem PJ"
                  value={selectedItem.name || ''}
                  onChange={e => setSelectedItem({ ...selectedItem, name: e.target.value })}
                />
              </div>

              {/* Assunto (apenas e-mail) */}
              {activeTab === 'email' && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Assunto do E-mail</label>
                  <input 
                    type="text" 
                    className="form-control"
                    required
                    placeholder="Ex: Bem-vindo à BRS Promotora! Seu acesso está liberado."
                    value={selectedItem.subject || ''}
                    onChange={e => setSelectedItem({ ...selectedItem, subject: e.target.value })}
                  />
                </div>
              )}

              {/* Tags Dinâmicas */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  <Tag size={14} />
                  Inserir Tags Dinâmicas (Clique para inserir no texto)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {DYNAMIC_TAGS.map(t => (
                    <button
                      key={t.tag}
                      type="button"
                      onClick={() => insertTag(t.tag)}
                      style={{ 
                        border: '1px solid var(--brs-gray-200)', 
                        background: '#fff', 
                        color: 'var(--brs-gray-700)', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--brs-navy)'; e.currentTarget.style.color = 'var(--brs-navy)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--brs-gray-200)'; e.currentTarget.style.color = 'var(--brs-gray-700)' }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corpo (Textarea) */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Conteúdo do Modelo (HTML / Texto)</label>
                <textarea 
                  ref={textareaRef}
                  className="form-control"
                  required
                  placeholder="Escreva ou cole seu modelo aqui. Utilize as tags acima para preenchimento dinâmico..."
                  style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.5' }}
                  value={selectedItem.body || ''}
                  onChange={e => setSelectedItem({ ...selectedItem, body: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                  Salvar Modelo
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--brs-gray-400)', fontSize: '0.875rem' }}>
              Selecione um modelo à esquerda ou clique em "Novo" para começar a editar.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
