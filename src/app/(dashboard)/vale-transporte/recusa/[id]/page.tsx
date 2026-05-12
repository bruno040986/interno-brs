'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Bus, ChevronLeft, Save, Loader2, 
  User, AlertCircle, FileText, XCircle
} from 'lucide-react'
import type { Employee } from '@/types'

export default function VTRecusaPage() {
  const { id } = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form State
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()
    
    if (data) setEmployee(data as Employee)
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employee) return
    
    setSaving(true)
    
    const finalReason = reason === 'outro' ? customReason : reason
    
    // 1. Criar registro de VT
    const { data: vtRecord, error: vtError } = await supabase
      .from('vt_records')
      .insert([{
        employee_id: employee.id,
        type: 'refusal',
        reason_refusal: finalReason,
        status: 'active'
      }])
      .select()
      .single()
      
    if (!vtError && vtRecord) {
      // 2. Atualizar status do colaborador
      await supabase
        .from('employees')
        .update({ vt_status: 'recusou' })
        .eq('id', employee.id)
        
      // 3. Auditoria
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'generate_vt_refusal',
        entity_type: 'vt_records',
        entity_id: vtRecord.id,
        description: `Termo de recusa gerado para ${employee.name}`
      })
      
      router.push(`/colaboradores/${employee.id}`)
    }
    
    setSaving(false)
  }

  if (loading) return <div className="page-content text-center">Carregando...</div>

  return (
    <div className="page-content" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            Recusa do Vale-Transporte
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Documente a renúncia livre e espontânea do benefício
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title"><User size={16} /> Dados do Colaborador</h3>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div>
                <label className="form-label">Nome</label>
                <div style={{ fontWeight: 600 }}>{employee?.name}</div>
              </div>
              <div>
                <label className="form-label">CPF</label>
                <div style={{ fontWeight: 600 }}>{employee?.cpf}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title"><XCircle size={16} /> Motivo da Recusa</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Selecione o motivo principal (opcional)</label>
              <select 
                className="form-control" 
                value={reason}
                onChange={e => setReason(e.target.value)}
              >
                <option value="">Não informado</option>
                <option value="não necessita de transporte">Não necessita de transporte</option>
                <option value="usa veículo próprio">Usa veículo próprio / carona</option>
                <option value="mora próximo">Reside próximo ao local de trabalho</option>
                <option value="desconto de 6% supera o valor utilizado">O desconto de 6% supera o valor do transporte utilizado</option>
                <option value="outro">Outro motivo...</option>
              </select>
            </div>
            
            {reason === 'outro' && (
              <div className="form-group">
                <label className="form-label">Especifique o motivo</label>
                <textarea 
                  className="form-control" 
                  placeholder="Descreva o motivo da recusa..."
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Declaração de Ciência:</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                  Ao gerar este termo, o colaborador declara ter ciência de que o Vale-Transporte é um direito legal e que a decisão de não recebê-lo é tomada por vontade própria, isentando a empresa de responsabilidade.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="button" className="btn btn-outline btn-lg" style={{ flex: 1 }} onClick={() => router.back()}>
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ flex: 2, justifyContent: 'center' }}
            disabled={saving}
          >
            {saving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
            {saving ? 'Gerando Documento...' : 'Confirmar e Gerar Termo de Recusa'}
          </button>
        </div>
      </form>
    </div>
  )
}
