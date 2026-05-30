'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getVisibleEffectivePermissions, requireAnyPermission } from '@/lib/auth/server'

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

export async function saveProfile(profileData: {
  id?: string
  name: string
  permissions: any[]
  schedules?: any[]
}) {
  try {
    await requireAnyPermission([
      {
        resource: 'sistema-usuarios-perfis',
        action: profileData.id ? 'can_edit' : 'can_include',
      },
    ])

    const now = new Date().toISOString()
    let profileId = profileData.id

    // 1. Salvar ou atualizar o perfil
    if (profileId) {
      const { error } = await supabaseAdmin
        .from('access_profiles')
        .update({ name: profileData.name })
        .eq('id', profileId)
      if (error) throw error
    } else {
      const { data, error } = await supabaseAdmin
        .from('access_profiles')
        .insert({ name: profileData.name })
        .select()
        .single()
      if (error) throw error
      profileId = data.id
    }

    // 2. Salvar permissões (Upsert)
    const permsToSave = profileData.permissions.map((p: any) => {
      const { id, profile_id, user_id, ...rest } = p
      return {
        ...rest,
        // Evita violação de NOT NULL em bases onde created_at não tem default
        created_at: (rest as any).created_at ?? now,
        profile_id: profileId
      }
    })

    let { error: permErr } = await supabaseAdmin
      .from('profile_permissions')
      .upsert(permsToSave, { onConflict: 'profile_id,resource_name' })

    if (permErr && String(permErr.message || '').includes("Could not find the 'created_at' column")) {
      const withoutCreatedAt = permsToSave.map(({ created_at, ...rest }: any) => rest)
      const retry = await supabaseAdmin
        .from('profile_permissions')
        .upsert(withoutCreatedAt, { onConflict: 'profile_id,resource_name' })
      permErr = retry.error as any
    }

    if (permErr) throw permErr

    // 3. Salvar horários (Upsert)
    if (profileData.schedules && profileData.schedules.length > 0) {
      const schedulesToSave = profileData.schedules.map((s: any) => {
        const { id, profile_id, user_id, ...rest } = s
        return {
          ...rest,
          profile_id: profileId
        }
      })

      const { error: schedErr } = await supabaseAdmin
        .from('profile_schedules')
        .upsert(schedulesToSave, { onConflict: 'profile_id,day_of_week' })

      if (schedErr) throw schedErr
    }

    revalidatePath('/usuarios')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao salvar perfil:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteUser(userId: string) {
  try {
    await requireAnyPermission([
      { resource: 'sistema-usuarios-cadastro', action: 'can_activate_inactivate' },
      { resource: 'sistema-usuarios-cadastro', action: 'can_delete' },
    ])

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

export async function saveUserDirectly(userData: {
  id?: string
  name: string
  email: string
  cpf: string
  birth_date?: string
  role: string
  profile_id?: string
  session_timeout?: number
  permissions: any[]
  schedules?: any[]
  avatar_url?: string
  temp_password?: string
  commercial_role?: string | null
  superintendente_id?: string | null
  supervisor_id?: string | null
  gerente_id?: string | null
  employee_id?: string | null
}) {
  try {
    await requireAnyPermission([
      {
        resource: 'sistema-usuarios-cadastro',
        action: userData.id ? 'can_edit' : 'can_include',
      },
    ])

    const now = new Date().toISOString()
    let userId = userData.id
    
    // 1. Salvar ou atualizar dados básicos do usuário
    let finalAvatarUrl = userData.avatar_url
    
    // Se a imagem for uma string Base64 (nova imagem), fazemos o upload
    if (userData.avatar_url && userData.avatar_url.startsWith('data:image')) {
      try {
        const base64Data = userData.avatar_url.split(',')[1]
        const blob = Buffer.from(base64Data, 'base64')
        const fileName = `${userId || 'new'}-${Date.now()}.png`
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: true
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('avatars')
          .getPublicUrl(fileName)
        
        finalAvatarUrl = publicUrl
      } catch (err) {
        console.error('Erro no upload do avatar:', err)
        // Mantemos o avatar atual em caso de erro no upload
      }
    }

    if (userId) {
      // 1.1 Atualizar senha no Auth se houver temp_password
      if (userData.temp_password) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: userData.temp_password
        })
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({
          name: userData.name,
          email: userData.email,
          cpf: userData.cpf,
          birth_date: userData.birth_date || null,
          role: userData.role,
          profile_id: userData.profile_id || null,
          session_timeout: userData.session_timeout,
          avatar_url: finalAvatarUrl,
          temp_password: userData.temp_password,
          commercial_role: userData.commercial_role || null,
          superintendente_id: userData.superintendente_id || null,
          supervisor_id: userData.supervisor_id || null,
          gerente_id: userData.gerente_id || null,
          employee_id: userData.employee_id || null
        })
        .eq('id', userId)
      if (error) throw error
    } else {
      // 1.2 Criar usuário no Auth primeiro
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.temp_password || 'brs123456',
        email_confirm: true
      })

      if (authErr) throw authErr
      userId = authUser.user.id

      // 1.3 Criar registro na tabela users com o ID do Auth
      const { data: newUser, error: createErr } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          name: userData.name,
          email: userData.email,
          cpf: userData.cpf,
          birth_date: userData.birth_date || null,
          role: userData.role,
          profile_id: userData.profile_id || null,
          session_timeout: userData.session_timeout,
          avatar_url: finalAvatarUrl,
          temp_password: userData.temp_password,
          active: true,
          commercial_role: userData.commercial_role || null,
          superintendente_id: userData.superintendente_id || null,
          supervisor_id: userData.supervisor_id || null,
          gerente_id: userData.gerente_id || null,
          employee_id: userData.employee_id || null
        })
        .select()
        .single()
      
      if (createErr) throw createErr
    }

    // 2. Salvar permissões customizadas (Upsert)
    const permsToSave = userData.permissions.map((p: any) => {
      const { id, profile_id, user_id, ...rest } = p
      return {
        ...rest,
        // Evita violação de NOT NULL em bases onde created_at não tem default
        created_at: (rest as any).created_at ?? now,
        user_id: userId
      }
    })

    const { error: permErr } = await supabaseAdmin
      .from('user_permissions')
      .upsert(permsToSave, { onConflict: 'user_id,resource_name' })

    if (permErr) throw permErr

    // 3. Salvar horários customizados (Upsert)
    if (userData.schedules && userData.schedules.length > 0) {
      const schedulesToSave = userData.schedules.map((s: any) => {
        const { id, profile_id, user_id, ...rest } = s
        return {
          ...rest,
          user_id: userId
        }
      })

      const { error: schedErr } = await supabaseAdmin
        .from('user_schedules')
        .upsert(schedulesToSave, { onConflict: 'user_id,day_of_week' })

      if (schedErr) throw schedErr
    }

    revalidatePath('/usuarios')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao salvar usuário:', error)
    return { success: false, error: error.message }
  }
}

export async function getAccessData() {
  try {
    await requireAnyPermission([
      { resource: 'sistema-usuarios-root', action: 'can_view' },
      { resource: 'sistema-usuarios-cadastro', action: 'can_view' },
      { resource: 'sistema-usuarios-perfis', action: 'can_view' },
    ])

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from('access_profiles')
      .select('*')
      .order('name')
    if (pErr) throw pErr

    const { data: users, error: uErr } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        access_profiles ( name )
      `)
      .order('name')
    if (uErr) throw uErr

    let entities: any[] = []
    try {
      const { data, error: eErr } = await supabaseAdmin
        .from('commercial_entities')
        .select('id, name, role, parent_id')
        .eq('status', 'ativo')
      
      // Se der erro de tabela não encontrada (PGRST205), ignoramos e usamos array vazio
      if (eErr && eErr.code !== 'PGRST205') throw eErr
      if (data) entities = data
    } catch (err) {
      console.warn('commercial_entities não existe ou não pôde ser carregado:', err)
    }

    const { data: employees, error: empErr } = await supabaseAdmin
      .from('employees')
      .select('id, name, cpf, birth_date')
      .order('name')
    if (empErr) throw empErr

    return { 
      success: true, 
      profiles: profiles || [], 
      users: users || [],
      commercialEntities: entities,
      employees: employees || []
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getProfilePermissions(profileId: string) {
  try {
    await requireAnyPermission([
      { resource: 'sistema-usuarios-root', action: 'can_view' },
      { resource: 'sistema-usuarios-perfis', action: 'can_view' },
    ])

    // Buscar permissões
    const { data: perms, error: pErr } = await supabaseAdmin
      .from('profile_permissions')
      .select('*')
      .eq('profile_id', profileId)
    if (pErr) throw pErr

    // Buscar horários
    const { data: schedules, error: sErr } = await supabaseAdmin
      .from('profile_schedules')
      .select('*')
      .eq('profile_id', profileId)
    if (sErr) throw sErr

    return { 
      success: true, 
      permissions: perms || [],
      schedules: schedules || []
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getUserPermissions(userId: string) {
  try {
    await requireAnyPermission([
      { resource: 'sistema-usuarios-root', action: 'can_view' },
      { resource: 'sistema-usuarios-cadastro', action: 'can_view' },
    ])

    // Buscar permissões
    const { data: perms, error: pErr } = await supabaseAdmin
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
    if (pErr) throw pErr

    // Buscar horários
    const { data: schedules, error: sErr } = await supabaseAdmin
      .from('user_schedules')
      .select('*')
      .eq('user_id', userId)
    if (sErr) throw sErr

    return { 
      success: true, 
      permissions: perms || [],
      schedules: schedules || []
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getEffectivePermissions(userId: string) {
  try {
    const finalPerms = await getVisibleEffectivePermissions(userId)

    return {
      success: true,
      permissions: finalPerms
    }
  } catch (error: any) {
    console.error('Erro ao obter permissões efetivas:', error)
    return { success: false, error: error.message }
  }
}
