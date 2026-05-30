import { GoogleConfigForm } from './GoogleConfigForm'
import { getGoogleConfig } from './actions'
import { googleConfig, isGoogleConfigured } from '@/lib/google/config'

export default async function GoogleConfigPage() {
  const config = await getGoogleConfig()
  const envConfigured = isGoogleConfigured()

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Configuração Google OAuth 2.0</h1>
        <p className="text-gray-600 mt-2">
          Configure as credenciais do Google Cloud Console para ativar integração com Google Calendar e Chat
        </p>
      </div>

      {envConfigured && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-900">
            ✅ <strong>Google OAuth está configurado via variáveis de ambiente.</strong>
          </p>
          <p className="text-sm text-green-800 mt-1">
            Client ID: {googleConfig.clientId.substring(0, 20)}...
          </p>
        </div>
      )}

      <GoogleConfigForm config={config} />
    </div>
  )
}
