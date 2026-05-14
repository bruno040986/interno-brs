'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ChevronLeft, Bus, MapPin, Calculator, FileText, 
  Download, Printer, AlertTriangle, User, Calendar, Clock
} from 'lucide-react'
import { generateVTPdf } from '@/lib/utils/pdfGenerator'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function VisualizarVTPage() {
  const { id } = useParams()
  const router = useRouter()
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    
    // Buscamos o registro com TODOS os detalhes: colaborador, unidade e trechos
    const { data, error } = await supabase
      .from('vt_records')
      .select(`
        *,
        employee:employees(*),
        unit:company_units(*),
        vt_routes(*)
      `)
      .eq('id', id)
      .single()
    
    if (data) setRecord(data)
    
    // Usuário logado para o rodapé do PDF
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      const { data: profile } = await supabase.from('users').select('name').eq('id', userData.user.id).single()
      setCurrentUser(profile?.name || userData.user.email || 'Sistema')
    }
    
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return <div className="page-content text-center">Carregando registro...</div>
  if (!record) return <div className="page-content text-center">Registro não encontrado.</div>

  const isOption = record.type === 'option'

  return (
    <div className="page-content" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
              {isOption ? 'Termo de Opção' : 'Termo de Recusa'} Gerado
            </h1>
            <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              Registro ID: {record.id.slice(0, 8)} • Gerado em {format(new Date(record.generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-primary"
            onClick={() => generateVTPdf({ ...record, generatedBy: currentUser })}
          >
            <Download size={18} />
            Baixar PDF Oficial
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isOption ? '1.5fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Dados do Colaborador (Leitura) */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><User size={16} /> Dados do Colaborador</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)', textTransform: 'uppercase', fontWeight: 600 }}>Nome Completo</div>
                  <div style={{ fontWeight: 600, color: 'var(--brs-gray-800)' }}>{record.employee?.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)', textTransform: 'uppercase', fontWeight: 600 }}>CPF</div>
                  <div style={{ fontWeight: 600, color: 'var(--brs-gray-800)' }}>{record.employee?.cpf}</div>
                </div>
              </div>
            </div>
          </div>

          {isOption ? (
            <>
              {/* Unidade de Trabalho */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><MapPin size={16} /> Unidade de Trabalho</h3>
                </div>
                <div className="card-body">
                  <div style={{ fontWeight: 600, color: 'var(--brs-navy)' }}>{record.unit?.name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--brs-gray-500)', marginTop: '0.25rem' }}>
                    {record.unit?.address}, {record.unit?.number} - {record.unit?.city}/{record.unit?.state}
                  </div>
                </div>
              </div>

              {/* Trechos de Transporte */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><Bus size={16} /> Itinerário e Trechos Salvos</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Linha / Operadora</th>
                        <th style={{ textAlign: 'right' }}>Valor Unit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.vt_routes?.map((r: any) => (
                        <tr key={r.id}>
                          <td style={{ textTransform: 'capitalize' }}>{r.route_type}</td>
                          <td>{r.line_operator}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            R$ {Number(r.unit_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: 'var(--brs-gray-50)' }}>
                        <td colSpan={2} style={{ textAlign: 'right', fontWeight: 700 }}>Total Diário:</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brs-navy)' }}>
                          R$ {Number(record.daily_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Visualização de Recusa */
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><AlertTriangle size={16} /> Declaração de Recusa</h3>
              </div>
              <div className="card-body">
                <div style={{ padding: '1rem', background: 'var(--brs-gray-50)', borderRadius: 8, border: '1px solid var(--brs-gray-200)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Motivo da Recusa</div>
                  <div style={{ fontStyle: 'italic', color: 'var(--brs-gray-700)' }}>"{record.reason_refusal}"</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resumo Financeiro (Congelado) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ border: '1px solid var(--brs-navy)', background: 'rgba(27,58,107,0.02)' }}>
            <div className="card-header" style={{ background: 'var(--brs-navy)', color: '#fff' }}>
              <h3 className="card-title" style={{ color: '#fff' }}><Calculator size={16} /> Resumo Gerado</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--brs-gray-600)' }}>Dias Úteis:</span>
                  <span style={{ fontWeight: 600 }}>{record.working_days_estimate} dias</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--brs-gray-600)' }}>Total Mensal:</span>
                  <span style={{ fontWeight: 600 }}>R$ {Number(record.monthly_estimated_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ height: '1px', background: 'var(--brs-gray-200)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--brs-gray-600)' }}>Desconto 6%:</span>
                  <span style={{ fontWeight: 600, color: 'var(--brs-danger)' }}>R$ {Number(record.max_employee_discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div style={{ padding: '0.75rem', background: 'var(--brs-navy)', borderRadius: 8, marginTop: '0.5rem', color: '#fff' }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>Custeio Empresa</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>R$ {Number(record.company_estimated_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <Calendar size={14} style={{ color: 'var(--brs-gray-400)' }} />
                  <span style={{ color: 'var(--brs-gray-500)' }}>Início da Vigência:</span>
                  <span style={{ fontWeight: 600 }}>{formatDatePT(record.effective_date)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <Clock size={14} style={{ color: 'var(--brs-gray-400)' }} />
                  <span style={{ color: 'var(--brs-gray-500)' }}>Opção feita em:</span>
                  <span style={{ fontWeight: 600 }}>{formatDatePT(record.option_date)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function formatDatePT(dateStr: string) {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}
