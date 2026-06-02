'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Save, Loader2 } from 'lucide-react'
import type { Employee, DisciplinaryReason } from '@/types'
import { createDisciplinaryRecord } from '../../server-actions'

export default function NovaMedidaPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const employeeIdParam = searchParams.get('employee')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [reasons, setReasons] = useState<DisciplinaryReason[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      supabase.from('employees').select('id, name, cpf, status').eq('status', 'active').order('name'),
      supabase.from('disciplinary_reasons').select('*').eq('active', true).order('name'),
    ])
    if (empRes.data) setEmployees(empRes.data as Employee[])
    if (reasonRes.data) setReasons(reasonRes.data as DisciplinaryReason[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    async function checkRecurrence() {
      if (!selectedEmployeeId || !reasonId) return
      const [reasonRes, totalWarnRes, totalSuspRes] = await Promise.all([
        supabase.from('disciplinary_records').select('id', { count: 'exact', head: true }).eq('employee_id', selectedEmployeeId).eq('reason_id', reasonId),
        supabase.from('disciplinary_records').select('id', { count: 'exact', head: true }).eq('employee_id', selectedEmployeeId).neq('type', 'suspension'),
        supabase.from('disciplinary_records').select('id', { count: 'exact', head: true }).eq('employee_id', selectedEmployeeId).eq('type', 'suspension'),
      ])
      setRecurrenceInfo({
        reasonCount: reasonRes.count || 0,
        totalWarnings: totalWarnRes.count || 0,
        totalSuspensions: totalSuspRes.count || 0,
      })
    }
    checkRecurrence()
  }, [selectedEmployeeId, reasonId, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEmployeeId || !reasonId) return

    setSaving(true)
    try {
      await createDisciplinaryRecord({
        employeeId: selectedEmployeeId,
        type,
        reasonId,
        occurrenceDate,
        applicationDate,
        witness,
        supervisor,
        suspensionDays: type === 'suspension' ? suspensionDays : null,
        recurrenceByReason: recurrenceInfo.reasonCount + 1,
        totalWarnings: recurrenceInfo.totalWarnings + (type !== 'suspension' ? 1 : 0),
        totalSuspensions: recurrenceInfo.totalSuspensions + (type === 'suspension' ? 1 : 0),
        historyText,
        impactText,
        recommendationText,
      })
      router.push(`/colaboradores/${selectedEmployeeId}`)
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar medida disciplinar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-content text-center">Carregando...</div>

  return (
    <div className="page-content" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ margin: 0 }}>Nova Medida Disciplinar</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <label className="form-label">Colaborador</label>
            <select className="form-control" required value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
              <option value="">Selecione...</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <label className="form-label" style={{ marginTop: '0.5rem' }}>Tipo</label>
            <select className="form-control" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="verbal_warning">Advertencia verbal</option>
              <option value="written_warning">Advertencia escrita</option>
              <option value="suspension">Suspensao</option>
            </select>
            <label className="form-label" style={{ marginTop: '0.5rem' }}>Motivo</label>
            <select className="form-control" required value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
              <option value="">Selecione...</option>
              {reasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <label className="form-label">Data do ocorrido</label>
            <input type="date" className="form-control" value={occurrenceDate} onChange={(e) => setOccurrenceDate(e.target.value)} />
            <label className="form-label" style={{ marginTop: '0.5rem' }}>Data da aplicacao</label>
            <input type="date" className="form-control" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} />
            <label className="form-label" style={{ marginTop: '0.5rem' }}>Supervisor</label>
            <select className="form-control" value={supervisor} onChange={(e) => setSupervisor(e.target.value)}>
              <option value="">Selecione...</option>
              {employees.map((e) => <option key={`sup-${e.id}`} value={e.name}>{e.name}</option>)}
            </select>
            <label className="form-label" style={{ marginTop: '0.5rem' }}>Testemunha</label>
            <select className="form-control" value={witness} onChange={(e) => setWitness(e.target.value)}>
              <option value="">Selecione...</option>
              {employees.map((e) => <option key={`wit-${e.id}`} value={e.name}>{e.name}</option>)}
            </select>
            {type === 'suspension' && (
              <>
                <label className="form-label" style={{ marginTop: '0.5rem' }}>Dias de suspensao</label>
                <input type="number" min={1} className="form-control" value={suspensionDays} onChange={(e) => setSuspensionDays(Number(e.target.value || 0))} />
              </>
            )}
            <label className="form-label" style={{ marginTop: '0.5rem' }}>Historico</label>
            <textarea className="form-control" rows={3} value={historyText} onChange={(e) => setHistoryText(e.target.value)} />
            <label className="form-label" style={{ marginTop: '0.5rem' }}>Impacto</label>
            <textarea className="form-control" rows={3} value={impactText} onChange={(e) => setImpactText(e.target.value)} />
            <label className="form-label" style={{ marginTop: '0.5rem' }}>Recomendacao</label>
            <textarea className="form-control" rows={3} value={recommendationText} onChange={(e) => setRecommendationText(e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving || !selectedEmployeeId || !reasonId}>
          {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />} Salvar
        </button>
      </form>
    </div>
  )
}
