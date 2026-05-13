'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Criamos um cliente com a Service Role para operações administrativas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function inviteUser(formData: {
  email: string
  name: string
  role: string
  department?: string
}) {
  try {
    // 1. Convidar usuário via Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      formData.email,
      {
        data: { full_name: formData.name },
        // Redireciona o usuário para o sistema após ele confirmar o e-mail
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    )

    if (authError) throw authError

    // 2. Criar ou atualizar perfil na tabela 'users'
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          department: formData.department,
          active: true,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      // Se falhar ao criar o perfil, removemos o usuário do Auth para não gerar inconsistência
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    revalidatePath('/usuarios')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao convidar usuário:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteUser(userId: string) {
  try {
    // Desativa no Auth e remove do perfil (ou apenas inativa conforme regra de negócio)
    // Aqui vamos apenas inativar para manter histórico de auditoria
    const { error } = await supabaseAdmin
      .from('users')
      .update({ active: false })
      .eq('id', userId)

    if (error) throw error
    
    revalidatePath('/usuarios')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
