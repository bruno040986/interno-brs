'use client'

import { useState } from 'react'
import { updateGoogleConfig } from './actions'

interface GoogleConfig {
  id: string
  client_id: string
  client_secret: string
}

export function GoogleConfigForm({ config }: { config: GoogleConfig | null }) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [clientId, setClientId] = useState(config?.client_id || '')
  const [clientSecret, setClientSecret] = useState(config?.client_secret || '')
  const [showSecret, setShowSecret] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('id', config?.id || '')
      formData.append('client_id', clientId)
      formData.append('client_secret', clientSecret)

      await updateGoogleConfig(formData)
      setMessage('✓ Credenciais salvas com sucesso!')
    } catch (error) {
      setMessage(`✗ Erro ao salvar: ${error instanceof Error ? error.message : 'Desconhecido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const redirectUri = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/google/callback`

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Instruções</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Configure o projeto no Google Cloud Console (ver instruções em documento anexo)</li>
          <li>Copie o <strong>Client ID</strong> e o <strong>Client Secret</strong></li>
          <li>Cole nos campos abaixo</li>
          <li>Adicione esta URI de redirecionamento no Google Cloud: <code className="bg-white px-2 py-1 rounded text-xs">{redirectUri}</code></li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border">
        <div>
          <label className="block text-sm font-medium mb-2">Client ID</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="XXXXXXXXXXXXXXXX.apps.googleusercontent.com"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Encontrado em: Google Cloud Console → Credenciais → OAuth Client ID</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Client Secret</label>
          <div className="flex gap-2">
            <input
              type={showSecret ? 'text' : 'password'}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-XXXXXXXXXXXXXXXXXX"
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="px-3 py-2 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300"
            >
              {showSecret ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Mantenha seguro! Nunca compartilhe esta chave.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Redirect URI (Apenas Leitura)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={redirectUri}
              readOnly
              className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-gray-600"
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(redirectUri)}
              className="px-3 py-2 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300"
            >
              📋
            </button>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800">
            <strong>Status:</strong> {clientId && clientSecret ? '✓ Configurado' : '⚠️ Aguardando credenciais'}
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes('✓') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !clientId || !clientSecret}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? '⏳ Salvando...' : '💾 Salvar Configurações'}
        </button>
      </form>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
        <p className="font-semibold text-amber-900 mb-2">⚠️ Importante</p>
        <ul className="text-amber-800 space-y-1 list-disc list-inside">
          <li>As credenciais são armazenadas de forma segura no banco de dados Supabase</li>
          <li>Apenas administradores com acesso a esta página podem visualizar as chaves</li>
          <li>Se suspeitar de vazamento, regenere as chaves no Google Cloud Console imediatamente</li>
        </ul>
      </div>
    </div>
  )
}
