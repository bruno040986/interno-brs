import { CPFConfigForm } from './CPFConfigForm'
import { getCpfConfig } from './actions'

export default async function CpfConfigPage() {
  const config = await getCpfConfig()

  return (
    <div className="page-content">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
          Configurações de API - CPF
        </h1>
        <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          Configure o acesso à CPFHub.io para consultas de CPF e outros consumos de integração.
        </p>
      </div>

      <CPFConfigForm config={config} />
    </div>
  )
}
