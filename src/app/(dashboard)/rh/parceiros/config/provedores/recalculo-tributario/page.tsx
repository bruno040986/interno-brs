import { ArrowLeftCircle, CalendarClock, FileClock, Info } from 'lucide-react'
import Link from 'next/link'

export default function RecalculoTributarioPage() {
  return (
    <div className="page-content" style={{ display: 'grid', placeItems: 'center', minHeight: '68vh' }}>
      <div className="card" style={{ maxWidth: 860, width: '100%', padding: '2rem', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(39, 64, 132, 0.08)', color: 'var(--brs-navy)', display: 'grid', placeItems: 'center' }}>
            <FileClock size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brs-gray-900)' }}>Recálculo Tributário</div>
            <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.92rem', marginTop: '0.2rem' }}>
              Funcionalidade em breve para reaplicar regras tributárias sobre períodos já emitidos.
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem 1.1rem', borderRadius: 14, border: '1px solid var(--brs-gray-200)', background: '#F8FAFC', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
          <Info size={18} style={{ marginTop: '0.15rem', flex: '0 0 auto', color: 'var(--brs-navy)' }} />
          <div style={{ color: 'var(--brs-gray-700)', lineHeight: 1.6, fontSize: '0.94rem' }}>
            Este menu será usado para selecionar um período de vigência, recalcular os tributos com a configuração nova, gerar um novo registro histórico
            para o período recalculado e manter o vínculo com os regimes tributários aplicados nas entidades finais, como Promotoras e Instituições Financeiras.
          </div>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', color: 'var(--brs-gray-700)' }}>
            <CalendarClock size={18} />
            <span>Seleção de período inicial e final para o recálculo.</span>
          </div>
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', color: 'var(--brs-gray-700)' }}>
            <CalendarClock size={18} />
            <span>Aplicação da nova alíquota sem sobrescrever o histórico já emitido.</span>
          </div>
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', color: 'var(--brs-gray-700)' }}>
            <CalendarClock size={18} />
            <span>Geração de novo registro histórico para manter rastreabilidade fiscal.</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.25rem' }}>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.88rem' }}>
            A tela final será implementada após a criação dos cadastros de Promotoras e Instituições Financeiras.
          </div>
          <Link href="/rh/parceiros/config/provedores" className="btn btn-outline">
            <ArrowLeftCircle size={16} />
            Voltar às Configurações
          </Link>
        </div>
      </div>
    </div>
  )
}
