'use client'

import { useState, useEffect } from 'react'
import { getProvedoresConfig, saveProvedoresConfig } from '../../../actions'
import { FileText, Key, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function AssinaturaConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Assinafy State
  const [assinafyId, setAssinafyId] = useState('')
  const [assinafyApiKey, setAssinafyApiKey] = useState('')
  const [assinafyActive, setAssinafyActive] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      setLoading(true)
      const res = await getProvedoresConfig()
      if (res.success && res.assinafy) {
        setAssinafyId(res.assinafy.id || '')
        setAssinafyApiKey(res.assinafy.api_key || '')
        setAssinafyActive(res.assinafy.is_active ?? false)
      } else {
        setMessage({ type: 'error', text: 'Erro ao carregar configurações do Assinafy.' })
      }
      setLoading(false)
    }

    loadConfig()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const payload = {
      assinafy: {
        id: assinafyId || undefined,
        api_key: assinafyApiKey,
        is_active: assinafyActive
      }
    }

    const res = await saveProvedoresConfig(payload)
    if (res.success) {
      setMessage({ type: 'success', text: 'Configurações do Assinafy salvas com sucesso!' })
      if (!assinafyId) {
        const configReload = await getProvedoresConfig()
        if (configReload.success && configReload.assinafy) {
          setAssinafyId(configReload.assinafy.id || '')
        }
      }
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao salvar configurações.' })
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
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
          Configurações de API - Assinatura Eletrônica
        </h1>
        <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          Configure os provedores de assinatura eletrônica dos contratos e termos de parceria
        </p>
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

      <form onSubmit={handleSave} style={{ maxWidth: '600px' }}>
        {/* Provedor de Assinatura: Assinafy */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '0.5rem', borderRadius: '8px' }}>
              <FileText size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--brs-gray-800)' }}>Assinafy</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>Plataforma para formalização e assinatura de contratos</p>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">API Key do Assinafy</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--brs-gray-400)' }}>
                <Key size={16} />
              </span>
              <input 
                type="password" 
                className="form-control" 
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Token de acesso da API do Assinafy"
                value={assinafyApiKey}
                onChange={e => setAssinafyApiKey(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="checkbox" 
              id="assinafyActive" 
              checked={assinafyActive}
              onChange={e => setAssinafyActive(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="assinafyActive" style={{ fontSize: '0.875rem', color: 'var(--brs-gray-700)', cursor: 'pointer', userSelect: 'none' }}>
              Ativar disparos e coleta de assinaturas (Assinafy)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
              Salvar Configurações
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
