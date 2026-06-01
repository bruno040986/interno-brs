'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireCurrentUser, requirePermission } from '@/lib/auth/server'

type VTMode = 'option' | 'refusal'

type RouteInput = {
  type: 'ida' | 'volta'
  line: string
  value: number
}

export async function saveDisciplinaryReason(input: {
  id?: string
  name: string
  default_gravity?: string
  active?: boolean
}) {
  await requirePermission('rh-motivos', input.id ? 'can_edit' : 'can_include')
  const admin = await createAdminClient()

  if (input.id) {
    const { error } = await admin
      .from('disciplinary_reasons')
      .update({
        name: input.name,
        default_gravity: input.default_gravity || 'leve',
        active: input.active !== false,
      })
      .eq('id', input.id)
    if (error) throw error
    return { success: true }
  }

  const { error } = await admin.from('disciplinary_reasons').insert({
    name: input.name,
    default_gravity: input.default_gravity || 'leve',
    active: input.active !== false,
  })
  if (error) throw error
  return { success: true }
}

export async function saveCompanyUnit(input: {
  id?: string
  name: string
  active?: boolean
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
}) {
  await requirePermission('rh-unidades', input.id ? 'can_edit' : 'can_include')
  const admin = await createAdminClient()

  const payload = {
    name: input.name,
    active: input.active !== false,
    address: input.address || null,
    city: input.city || null,
    state: input.state || null,
    zip_code: input.zip_code || null,
  }

  if (input.id) {
    const { error } = await admin.from('company_units').update(payload).eq('id', input.id)
    if (error) throw error
    return { success: true }
  }

  const { error } = await admin.from('company_units').insert(payload)
  if (error) throw error
  return { success: true }
}

export async function toggleCompanyUnitStatus(id: string, active: boolean) {
  await requirePermission('rh-unidades', 'can_activate_inactivate')
  const admin = await createAdminClient()
  const { error } = await admin.from('company_units').update({ active }).eq('id', id)
  if (error) throw error
  return { success: true }
}

export async function deleteLatestVtRecord(employeeId: string, recordId: string) {
  await requirePermission('rh-vale-transporte', 'can_delete')
  const admin = await createAdminClient()

  const { data: latest, error: latestErr } = await admin
    .from('vt_records')
    .select('id')
    .eq('employee_id', employeeId)
    .order('option_date', { ascending: false })
    .limit(1)
    .single()
  if (latestErr) throw latestErr
  if (latest?.id !== recordId) {
    throw new Error('Somente o ultimo registro pode ser excluido.')
  }

  const { error: delErr } = await admin.from('vt_records').delete().eq('id', recordId)
  if (delErr) throw delErr

  const { data: prev } = await admin
    .from('vt_records')
    .select('type')
    .eq('employee_id', employeeId)
    .order('option_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const newStatus = prev ? (prev.type === 'option' ? 'optante' : 'recusou') : 'pendente'
  const { error: employeeErr } = await admin
    .from('employees')
    .update({ vt_status: newStatus })
    .eq('id', employeeId)
  if (employeeErr) throw employeeErr

  return { success: true }
}

export async function createVtRecord(input: {
  employeeId: string
  mode: VTMode
  optionDate: string
  effectiveDate?: string
  selectedUnit?: string
  routes?: RouteInput[]
  workingDays?: number
  dailyTotal?: number
  monthlyTotal?: number
  maxDiscount?: number
  companyCost?: number
  refusalReason?: string
  closePreviousActive?: boolean
}) {
  await requirePermission('rh-vale-transporte', 'can_include')
  const user = await requireCurrentUser()
  const admin = await createAdminClient()

  if (input.closePreviousActive && input.effectiveDate) {
    const { data: prevActive } = await admin
      .from('vt_records')
      .select('id')
      .eq('employee_id', input.employeeId)
      .eq('status', 'active')
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (prevActive?.id) {
      const newEffDate = new Date(`${input.effectiveDate}T12:00:00`)
      const endDate = new Date(newEffDate)
      endDate.setDate(endDate.getDate() - 1)
      const endDateStr = endDate.toISOString().slice(0, 10)
      await admin.from('vt_records').update({ end_date: endDateStr }).eq('id', prevActive.id)
    }
  }

  const { data: vtRecord, error: vtError } = await admin
    .from('vt_records')
    .insert({
      employee_id: input.employeeId,
      type: input.mode,
      unit_id: input.mode === 'option' ? input.selectedUnit || null : null,
      daily_total: input.mode === 'option' ? Number(input.dailyTotal || 0) : 0,
      working_days_estimate: Number(input.workingDays || 0),
      monthly_estimated_total: input.mode === 'option' ? Number(input.monthlyTotal || 0) : 0,
      max_employee_discount: input.mode === 'option' ? Number(input.maxDiscount || 0) : 0,
      company_estimated_cost: input.mode === 'option' ? Number(input.companyCost || 0) : 0,
      reason_refusal: input.mode === 'refusal' ? input.refusalReason || null : null,
      option_date: input.optionDate,
      effective_date: input.effectiveDate || null,
      status: 'active',
    })
    .select('id')
    .single()
  if (vtError) throw vtError

  if (input.mode === 'option' && (input.routes || []).length > 0) {
    const routeRows = (input.routes || []).map((route) => ({
      vt_record_id: vtRecord.id,
      route_type: route.type,
      line_operator: route.line,
      unit_value: Number(route.value || 0),
    }))
    const { error: routeErr } = await admin.from('vt_routes').insert(routeRows)
    if (routeErr) throw routeErr
  }

  const nextStatus = input.mode === 'option' ? 'optante' : 'recusou'
  const { error: employeeErr } = await admin
    .from('employees')
    .update({ vt_status: nextStatus })
    .eq('id', input.employeeId)
  if (employeeErr) throw employeeErr

  const { error: auditErr } = await admin.from('audit_logs').insert({
    user_id: user.id,
    action: input.mode === 'option' ? 'generate_vt_option' : 'generate_vt_refusal',
    entity_type: 'vt_records',
    entity_id: vtRecord.id,
    description: `Termo de ${input.mode === 'option' ? 'opcao' : 'recusa'} gerado`,
  })
  if (auditErr) throw auditErr

  return { success: true, id: vtRecord.id }
}

export async function createDisciplinaryRecord(input: {
  employeeId: string
  type: 'verbal_warning' | 'written_warning' | 'suspension'
  reasonId: string
  occurrenceDate: string
  applicationDate: string
  witness?: string
  supervisor?: string
  suspensionDays?: number | null
  recurrenceByReason: number
  totalWarnings: number
  totalSuspensions: number
  historyText?: string
  impactText?: string
  recommendationText?: string
}) {
  await requirePermission('rh-medidas-disciplinares', 'can_include')
  const user = await requireCurrentUser()
  const admin = await createAdminClient()

  const { data: record, error } = await admin
    .from('disciplinary_records')
    .insert({
      employee_id: input.employeeId,
      type: input.type,
      reason_id: input.reasonId,
      occurrence_date: input.occurrenceDate,
      application_date: input.applicationDate,
      witness_name: input.witness || null,
      supervisor_name: input.supervisor || null,
      suspension_days: input.type === 'suspension' ? input.suspensionDays || 0 : null,
      recurrence_number_by_reason: input.recurrenceByReason,
      total_warnings_at_date: input.totalWarnings,
      total_suspensions_at_date: input.totalSuspensions,
      history_text: input.historyText || null,
      impact_text: input.impactText || null,
      recommendation_text: input.recommendationText || null,
      status: 'active',
    })
    .select('id')
    .single()
  if (error) throw error

  const { error: auditErr } = await admin.from('audit_logs').insert({
    user_id: user.id,
    action: 'generate_disciplinary_record',
    entity_type: 'disciplinary_records',
    entity_id: record.id,
    description: `Medida aplicada: ${input.type}`,
  })
  if (auditErr) throw auditErr

  return { success: true, id: record.id }
}
