'use client'

import { useSearchParams } from 'next/navigation'
import { Info, HelpCircle } from 'lucide-react'

const apiNames: Record<string, string> = {
  Google: 'Google API (Drive, Calendário e Contatos)',
  QuarkRH: 'API QuarkRH (Integração de Funcionários CLT)',
  ContaAzul: 'API Conta Azul (Sincronização Financeira e NFs)',
  ARW: 'API Sistema ARW (Acessos e Regras Físicas)',
  Instituicoes: 'API de Instituições Financeiras (Bancos & Promotoras)',
  CRM: 'API de CRM (Integração SCP / CRM Comercial)'
}

export default function BrevePage() {
  const searchParams = useSearchParams()
  const apiParam = searchParams.get('api') || 'Geral'
  const apiLabel = apiNames[apiParam] || apiParam

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div 
        className="card" 
        style={{ 
          maxWidth: '500px', 
          padding: '2.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '1rem',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ backgroundColor: 'rgba(212, 163, 89, 0.1)', color: 'var(--brs-gold)', padding: '1rem', borderRadius: '50%', marginBottom: '0.5rem' }}>
          <Info size={40} />
        </div>
        
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brs-navy)', margin: 0 }}>
          Implantação em Breve
        </h2>
        
        <div style={{ fontSize: '0.925rem', color: 'var(--brs-gray-600)', lineHeight: '1.5', margin: '0.5rem 0' }}>
          As configurações de integração com a <strong>{apiLabel}</strong> estão em fase de homologação pela equipe de desenvolvimento.
        </div>
        
        <div 
          style={{ 
            fontSize: '0.75rem', 
            color: 'var(--brs-gray-400)', 
            backgroundColor: 'var(--brs-gray-50)', 
            padding: '0.75rem 1rem', 
            borderRadius: '8px', 
            border: '1px dashed var(--brs-gray-200)',
            width: '100%'
          }}
        >
          Seu ambiente BRS Gestão está pronto para receber esta funcionalidade automaticamente assim que os testes forem concluídos.
        </div>
      </div>
    </div>
  )
}
