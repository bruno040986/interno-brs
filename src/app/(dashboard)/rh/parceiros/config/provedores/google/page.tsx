import { GoogleConfigForm } from './GoogleConfigForm'
import { getGoogleConfig } from './actions'

export default async function GoogleConfigPage() {
  const config = await getGoogleConfig()

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Configuração Google OAuth 2.0</h1>
        <p className="text-gray-600 mt-2">
          Configure as credenciais do Google Cloud Console para ativar integração com Google Calendar e Chat
        </p>
      </div>

      <GoogleConfigForm config={config} />
    </div>
  )
}
