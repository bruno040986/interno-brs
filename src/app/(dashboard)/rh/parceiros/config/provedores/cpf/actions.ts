'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/server'
import { getCpfHubConfig, saveCpfHubConfig } from '@/lib/cpfhub-config'

function getReadableErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message
  if (error && typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage
    const maybeCode = (error as { code?: unknown }).code
    if (typeof maybeCode === 'string' && maybeCode.trim()) return `${fallback} (código ${maybeCode})`
  }
  return fallback
}

export async function getCpfConfig() {
  const { permissions } = await requirePermission('sistema-config-cpf', 'can_view')
  const canEdit = permissions.some(
    (permission) =>
      permission.resource_name === 'sistema-config-cpf' &&
      Boolean(permission.can_edit),
  )

  const config = await getCpfHubConfig()
  return {
    ...config,
    can_edit: canEdit,
  }
}

export async function updateCpfConfig(formData: FormData) {
  await requirePermission('sistema-config-cpf', 'can_edit')

  const id = String(formData.get('id') || '')
  const email = String(formData.get('email') || '')
  const api_key = String(formData.get('api_key') || '')
  const plan = String(formData.get('plan') || 'gratuito') as 'gratuito' | 'pago'
  const freeQueries = Number.parseInt(String(formData.get('free_queries_per_month') || '0'), 10)

  if (!email.trim()) throw new Error('Informe o e-mail da conta CPFHub.')
  if (!id && !api_key.trim()) throw new Error('Informe a chave de API no primeiro cadastro.')
  if (!['gratuito', 'pago'].includes(plan)) throw new Error('Selecione um plano válido.')
  if (!Number.isFinite(freeQueries) || freeQueries < 0) throw new Error('Informe um número válido de consultas gratuitas por mês.')

  let result
  try {
    result = await saveCpfHubConfig({
      id: id || undefined,
      email,
      api_key,
      plan,
      free_queries_per_month: freeQueries,
    })
  } catch (error) {
    throw new Error(
      getReadableErrorMessage(
        error,
        'Nao foi possivel salvar a configuracao da API CPF.',
      ),
    )
  }

  revalidatePath('/rh/parceiros/config/provedores/cpf')
  return { success: true, id: result.id }
}
