import { GoogleConfigForm } from './GoogleConfigForm'
import { getGoogleConfig } from './actions'

export default async function GoogleConfigPage() {
  const config = await getGoogleConfig()

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Configuracao Google OAuth 2.0</h1>
        <p className="text-gray-600 mt-2">
          Configure as credenciais do Google Cloud Console para ativar integracao com Google Calendar.
        </p>
      </div>

      {config?.client_id && config?.has_client_secret ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-900">
            <strong>Google OAuth configurado no banco.</strong>
          </p>
          <p className="text-sm text-green-800 mt-1">Client ID salvo no sistema.</p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-900">
            <strong>Google OAuth ainda nao configurado.</strong>
          </p>
          <p className="text-sm text-yellow-800 mt-1">
            Preencha Client ID e Client Secret e salve para ativar a integracao.
          </p>
        </div>
      )}

      <GoogleConfigForm config={config} />
    </div>
  )
}
