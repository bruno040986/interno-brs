import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { loadComunicadosCatalog } from '@/lib/comunicados-service'
import { requirePermission } from '@/lib/auth/server'

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return fallback
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('sistema-comunicados', 'can_activate_inactivate')
    const admin = await createAdminClient()
    const { id } = await params
    const body = await request.json()
    const nextStatus = String(body.status || '') === 'inativo' ? 'inativo' : 'ativo'

    const { error } = await admin
      .from('comunicados')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw error

    const items = await loadComunicadosCatalog(admin)
    return NextResponse.json({ success: true, items })
  } catch (error) {
    const message = getErrorMessage(error, 'Falha ao alterar status.')
    console.error('Erro ao alterar status do comunicado:', error)
    return NextResponse.json({ error: message }, { status: message.includes('permissao') ? 403 : 500 })
  }
}
