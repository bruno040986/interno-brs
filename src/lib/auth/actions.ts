'use server'

import { getCurrentUserEffectivePermissions } from './server'

export async function getMyEffectivePermissions() {
  try {
    const permissions = await getCurrentUserEffectivePermissions()
    return { success: true, permissions }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Nao foi possivel validar permissoes.',
    }
  }
}
