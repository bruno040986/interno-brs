'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Key, Loader2, Save } from 'lucide-react'
import { updateCpfConfig } from './actions'
import type { CpfHubConfigState } from '@/lib/cpfhub-config'

type FeedbackMessage = {
  type: 'success' | 'error'
  text: string
}

export function CPFConfigForm({ config }: { config: CpfHubConfigState & { can_edit?: boolean } }) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<FeedbackMessage | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [email, setEmail] = useState(config.email || '')
  const [apiKey, setApiKey] = useState('')
  const [plan, setPlan] = useState(config.plan || 'gratuito')
  const [freeQueries, setFreeQueries] = useState(String(config.free_queries_per_month ?? 0))
  const canEdit = config.can_edit !== false
  const hasSavedApiKey = Boolean(config.has_api_key)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!canEdit) {
      setMessage({ type: 'error', text: 'Sem permissao para editar esta configuracao.' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.set('id', config.id || '')
      formData.set('email', email)
      formData.set('api_key', apiKey)
      formData.set('plan', plan)
      formData.set('free_queries_per_month', freeQueries)

      await updateCpfConfig(formData)
      setApiKey('')
      setMessage({ type: 'success', text: 'Configuracao da API CPF salva com sucesso.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao salvar a configuracao.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card" style={{ padding: '1rem 1.25rem', border: '1px solid var(--brs-gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
          <div style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0284C7', padding: '0.5rem', borderRadius: 12 }}>
            <Key size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)' }}>API CPF</div>
            <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.875rem' }}>
              Credenciais da CPFHub.io para consultas de CPF e integrações similares.
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '1rem',
            padding: '0.875rem 1rem',
            borderRadius: 12,
            border: `1px solid ${hasSavedApiKey ? '#A7F3D0' : '#FDE68A'}`,
            background: hasSavedApiKey ? '#ECFDF5' : '#FFFBEB',
            color: hasSavedApiKey ? '#065F46' : '#92400E',
          }}
        >
          <strong>{hasSavedApiKey ? 'Configuração ativa.' : 'Aguardando credenciais.'}</strong>
          <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {hasSavedApiKey ? 'A chave já está salva no banco e não será exibida novamente.' : 'Preencha os campos abaixo para salvar a primeira configuração.'}
          </div>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: message.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          }}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">E-mail</label>
            <input
              type="email"
              className="form-control"
              placeholder="contato@cpfhub.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!canEdit}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Chave de API</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showApiKey ? 'text' : 'password'}
                className="form-control"
                placeholder={hasSavedApiKey ? 'Deixe em branco para manter a chave atual' : 'Cole a chave de API da CPFHub.io'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required={!hasSavedApiKey}
                disabled={!canEdit}
                style={{ paddingRight: '5.5rem' }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowApiKey((current) => !current)}
                disabled={!canEdit}
                style={{ position: 'absolute', right: 8, top: 8 }}
              >
                {showApiKey ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
              A chave atual não é exibida novamente após salvar.
            </div>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Plano</label>
              <select
                className="form-control"
                value={plan}
                onChange={(e) => setPlan(e.target.value === 'pago' ? 'pago' : 'gratuito')}
                disabled={!canEdit}
              >
                <option value="gratuito">Gratuito</option>
                <option value="pago">Pago</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Consultas gratuitas por mês</label>
              <input
                type="number"
                min={0}
                step={1}
                className="form-control"
                value={freeQueries}
                onChange={(e) => setFreeQueries(e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !canEdit}
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            >
              {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
              Salvar
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
