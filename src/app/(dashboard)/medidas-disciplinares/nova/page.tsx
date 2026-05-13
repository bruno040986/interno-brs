'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  AlertTriangle, ChevronLeft, Save, Loader2, 
  User, Calendar, Search, FileText, Info
} from 'lucide-react'
import { generateVTPdf, generateDisciplinaryPdf } from '@/lib/utils/pdfGenerator'
import type { Employee, DisciplinaryReason, DisciplinaryRecord } from '@/types'

export default function NovaMedidaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const employeeIdParam = searchParams.get('employee')
  
  const [employees, setEmployees] = useState<Employee[]>([])
  const [reasons, setReasons] = useState<DisciplinaryReason[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeIdParam || '')
  const [type, setType] = useState<'verbal_warning' | 'written_warning' | 'suspension'>('written_warning')
  const [reasonId, setReasonId] = useState('')
  const [occurrenceDate, setOccurrenceDate] = useState(new Date().toISOString().split('T')[0])
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0])
  const [witness, setWitness] = useState('')
  const [supervisor, setSupervisor] = useState('')
  const [suspensionDays, setSuspensionDays] = useState(0)
  
  const [historyText, setHistoryText] = useState('')
  const [impactText, setImpactText] = useState('')
  const [recommendationText, setRecommendationText] = useState('')
  
  const [recurrenceInfo, setRecurrenceInfo] = useState({ reasonCount: 0, totalWarnings: 0, totalSuspensions: 0 })
  
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [empRes, reasonRes] = await Promise.all([
      supabase.from('employees').select('id, name, cpf, job_title, department, status').eq('status', 'active').order('name'),
      supabase.from('disciplinary_reasons').select('*').eq('active', true).order('name')
    ])
    
    if (empRes.data) setEmployees(empRes.data as Employee[])
    if (reasonRes.data) setReasons(reasonRes.data as DisciplinaryReason[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Carregar templates ao selecionar motivo
  useEffect(() => {
    if (reasonId) {
      const reason = reasons.find(r => r.id === reasonId)
      if (reason) {
        setHistoryText(reason.template_history || '')
        setImpactText(reason.template_impact || '')
        setRecommendationText(reason.template_recommendation || '')
      }
    }
  }, [reasonId, reasons])

  // Calcular reincidência ao selecionar colaborador e motivo
  useEffect(() => {
    async function checkRecurrence() {
      if (selectedEmployeeId && reasonId) {
        const [reasonRes, totalWarnRes, totalSuspRes] = await Promise.all([
          supabase.from('disciplinary_records').select('id', { count: 'exact', head: true }).eq('employee_id', selectedEmployeeId).eq('reason_id', reasonId),
          supabase.from('disciplinary_records').select('id', { count: 'exact', head: true }).eq('employee_id', selectedEmployeeId).neq('type', 'suspension'),
          supabase.from('disciplinary_records').select('id', { count: 'exact', head: true }).eq('employee_id', selectedEmployeeId).eq('type', 'suspension')
        ])
        
        setRecurrenceInfo({
          reasonCount: reasonRes.count || 0,
          totalWarnings: totalWarnRes.count || 0,
          totalSuspensions: totalSuspRes.count || 0
        })
      }
    }
    checkRecurrence()
  }, [selectedEmployeeId, reasonId, supabase])

  const measureSuggestion = useMemo(() => {
    const count = recurrenceInfo.reasonCount
    if (count === 0) return { label: '1ª Ocorrência: Advertência Escrita', class: 'badge-navy' }
    if (count === 1) return { label: '2ª Ocorrência: Advertência Escrita (Reincidência)', class: 'badge-warning' }
    if (count === 2) return { label: '3ª Ocorrência: Suspensão Disciplinar', class: 'badge-danger' }
    return { label: '4ª Ocorrência ou mais: Suspensão ou Medida Grave', class: 'badge-danger' }
  }, [recurrenceInfo])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEmployeeId || !reasonId) return
    
    setSaving(true)
    
    const { data: record, error } = await supabase
      .from('disciplinary_records')
      .insert([{
        employee_id: selectedEmployeeId,
        type,
        reason_id: reasonId,
        occurrence_date: occurrenceDate,
        application_date: applicationDate,
        witness_name: witness,
        supervisor_name: supervisor,
        suspension_days: type === 'suspension' ? suspensionDays : null,
        recurrence_number_by_reason: recurrenceInfo.reasonCount + 1,
        total_warnings_at_date: recurrenceInfo.totalWarnings + (type !== 'suspension' ? 1 : 0),
        total_suspensions_at_date: recurrenceInfo.totalSuspensions + (type === 'suspension' ? 1 : 0),
        history_text: historyText,
        impact_text: impactText,
        recommendation_text: recommendationText,
        status: 'active'
      }])
      .select()
    if (!error && record) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('users').select('name').eq('id', user?.id).single()
      const userName = profile?.name || user?.email || 'Sistema'
      
      // Log de Auditoria
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'generate_disciplinary_record',
        entity_type: 'disciplinary_records',
        entity_id: record.id,
        description: `Medida aplicada: ${type} para ${employees.find(e => e.id === selectedEmployeeId)?.name}`
      })

      // Gerar PDF imediatamente
      generateDisciplinaryPdf({
        ...record,
        employee: employees.find(e => e.id === selectedEmployeeId),
        generatedBy: userName
      })

      router.push(`/colaboradores/${selectedEmployeeId}`)
    }
    
    setSaving(false)
  }

  return (
    <div className="page-content" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            Nova Medida Disciplinar
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Registre advertências e suspensões com cálculo automático de reincidência
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Colaborador */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><User size={16} /> Colaborador</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Selecionar Colaborador <span className="required">*</span></label>
                  <select 
                    className="form-control" 
                    required 
                    value={selectedEmployeeId}
                    onChange={e => setSelectedEmployeeId(e.target.value)}
                  >
                    <option value="">Selecione um colaborador...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dados da Ocorrência */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><AlertTriangle size={16} /> Dados da Ocorrência</h3>
              </div>
              <div className="card-body">
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Tipo de Medida <span className="required">*</span></label>
                    <select 
                      className="form-control" 
                      required 
                      value={type}
                      onChange={e => setType(e.target.value as any)}
                    >
                      <option value="verbal_warning">Advertência Verbal Documentada</option>
                      <option value="written_warning">Advertência Escrita</option>
                      <option value="suspension">Suspensão Disciplinar</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Motivo Padronizado <span className="required">*</span></label>
                    <select 
                      className="form-control" 
                      required 
                      value={reasonId}
                      onChange={e => setReasonId(e.target.value)}
                    >
                      <option value="">Selecione o motivo...</option>
                      {reasons.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Data do Ocorrido <span className="required">*</span></label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required 
                      value={occurrenceDate}
                      onChange={e => setOccurrenceDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Aplicação <span className="required">*</span></label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required 
                      value={applicationDate}
                      onChange={e => setApplicationDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Supervisor Responsável</label>
                    <select 
                      className="form-control" 
                      value={supervisor}
                      onChange={e => setSupervisor(e.target.value)}
                    >
                      <option value="">Selecione o supervisor...</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.name}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Testemunha</label>
                    <select 
                      className="form-control" 
                      value={witness}
                      onChange={e => setWitness(e.target.value)}
                    >
                      <option value="">Selecione a testemunha...</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.name}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {type === 'suspension' && (
                  <div className="form-group">
                    <label className="form-label">Dias de Suspensão <span className="required">*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      min={1}
                      max={30}
                      value={suspensionDays}
                      onChange={e => setSuspensionDays(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Conteúdo do Documento */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><FileText size={16} /> Conteúdo do Documento</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Histórico do Ocorrido <span className="required">*</span></label>
                  <textarea 
                    className="form-control" 
                    required 
                    rows={4}
                    value={historyText}
                    onChange={e => setHistoryText(e.target.value)}
                  />
                  <div className="form-hint">Descreva o fato detalhadamente (data, hora, local, situação).</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Gravidade e Impactos <span className="required">*</span></label>
                  <textarea 
                    className="form-control" 
                    required 
                    rows={4}
                    value={impactText}
                    onChange={e => setImpactText(e.target.value)}
                  />
                  <div className="form-hint">Destaque por que esta conduta é prejudicial e quais cláusulas ela infringe.</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Recomendações de Melhoria <span className="required">*</span></label>
                  <textarea 
                    className="form-control" 
                    required 
                    rows={4}
                    value={recommendationText}
                    onChange={e => setRecommendationText(e.target.value)}
                  />
                  <div className="form-hint">Indique o comportamento esperado daqui em diante.</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '1.5rem' }}>
            {/* Resumo de Reincidência */}
            <div className="card" style={{ border: '1px solid var(--brs-navy)', background: 'rgba(27,58,107,0.02)' }}>
              <div className="card-header" style={{ background: 'var(--brs-navy)', color: '#fff' }}>
                <h3 className="card-title" style={{ color: '#fff' }}><Info size={16} /> Análise de Reincidência</h3>
              </div>
              <div className="card-body">
                {selectedEmployeeId && reasonId ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--brs-gray-600)' }}>Mesmo motivo:</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700 }}>{recurrenceInfo.reasonCount} vez(es)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--brs-gray-600)' }}>Total advertências:</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700 }}>{recurrenceInfo.totalWarnings}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--brs-gray-600)' }}>Total suspensões:</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700 }}>{recurrenceInfo.totalSuspensions}</span>
                    </div>
                    
                    <div style={{ padding: '0.75rem', background: '#fff', border: '1px solid var(--brs-gray-200)', borderRadius: 8, marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Medida Sugerida</div>
                      <div className={`badge ${measureSuggestion.class}`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                        {measureSuggestion.label}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--brs-gray-400)', fontSize: '0.875rem' }}>
                    Selecione o colaborador e o motivo para analisar o histórico.
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={saving || !selectedEmployeeId || !reasonId}
            >
              {saving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
              {saving ? 'Gerando Documento...' : 'Salvar e Gerar Medida'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
