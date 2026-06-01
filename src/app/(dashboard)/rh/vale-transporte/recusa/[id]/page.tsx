'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Save, Loader2 } from 'lucide-react'
import type { Employee } from '@/types'
import { createVtRecord } from '../../../server-actions'

export default function VTRecusaPage() {
  const { id } = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data } = await supabase.from('employees').select('*').eq('id', id).single()
    if (data) setEmployee(data as Employee)
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employee) return
    const finalReason = reason === 'outro' ? customReason : reason

    setSaving(true)
    try {
      await createVtRecord({
        employeeId: employee.id,
        mode: 'refusal',
        optionDate: new Date().toISOString().slice(0, 10),
        refusalReason: finalReason,
      })
      router.push(`/colaboradores/${employee.id}`)
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar a recusa.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-content text-center">Carregando...</div>

  return (
    <div className="page-content" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ margin: 0 }}>Recusa do Vale-Transporte</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <p><strong>Colaborador:</strong> {employee?.name}</p>
            <label className="form-label">Motivo</label>
            <select className="form-control" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Nao informado</option>
              <option value="nao necessita de transporte">Nao necessita de transporte</option>
              <option value="usa veiculo proprio">Usa veiculo proprio / carona</option>
              <option value="mora proximo">Reside proximo ao local de trabalho</option>
              <option value="outro">Outro motivo</option>
            </select>
            {reason === 'outro' && (
              <textarea className="form-control" style={{ marginTop: '0.5rem' }} value={customReason} onChange={(e) => setCustomReason(e.target.value)} required />
            )}
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />} Salvar
        </button>
      </form>
    </div>
  )
}
