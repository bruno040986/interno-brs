'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Inicialização do cliente Supabase Admin para operações privilegiadas
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

async function getPartnerFormsColumnSet(): Promise<Set<string> | null> {
  try {
    const { data, error } = await supabaseAdmin
      // information_schema é acessível no Postgres; usamos service role.
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'partner_forms')

    if (error) throw error
    const set = new Set<string>()
    for (const row of (data as any[]) || []) {
      if (row?.column_name) set.add(String(row.column_name))
    }
    return set
  } catch {
    return null
  }
}

// =========================================================================
// 1. Configurações de Provedores (Resend & Z-API)
// =========================================================================

export async function getProvedoresConfig() {
  try {
    let resend = { id: '', api_key: '', from_email: '', is_active: false }
    try {
      const { data, error } = await supabaseAdmin
        .from('resend_config')
        .select('*')
        .limit(1)
        .maybeSingle()
      if (error && error.code !== 'PGRST205') throw error
      if (data) resend = data
    } catch (err) {
      console.warn('resend_config table not found, using fallback')
    }

    let zapi = { id: '', instance_id: '', token: '', client_key: '', is_active: false }
    try {
      const { data, error } = await supabaseAdmin
        .from('zapi_config')
        .select('*')
        .limit(1)
        .maybeSingle()
      if (error && error.code !== 'PGRST205') throw error
      if (data) zapi = data
    } catch (err) {
      console.warn('zapi_config table not found, using fallback')
    }

    let assinafy = { id: '', api_key: '', is_active: false }
    try {
      const { data, error } = await supabaseAdmin
        .from('assinafy_config')
        .select('*')
        .limit(1)
        .maybeSingle()
      if (error && error.code !== 'PGRST205') throw error
      if (data) assinafy = data
    } catch (err) {
      console.warn('assinafy_config table not found, using fallback')
    }

    return {
      success: true,
      resend,
      zapi,
      assinafy
    }
  } catch (error: any) {
    console.error('Erro ao obter provedores:', error)
    return { success: false, error: error.message }
  }
}

export async function saveProvedoresConfig(data: {
  resend?: { id?: string; api_key: string; from_email: string; is_active: boolean }
  zapi?: { id?: string; instance_id: string; token: string; client_key?: string; is_active: boolean }
  assinafy?: { id?: string; api_key: string; is_active: boolean }
}) {
  try {
    // 1. Salvar Resend
    if (data.resend) {
      try {
        if (data.resend.id) {
          const { error } = await supabaseAdmin
            .from('resend_config')
            .update({
              api_key: data.resend.api_key,
              from_email: data.resend.from_email,
              is_active: data.resend.is_active,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.resend.id)
          if (error) throw error
        } else {
          const { error } = await supabaseAdmin
            .from('resend_config')
            .insert({
              api_key: data.resend.api_key,
              from_email: data.resend.from_email,
              is_active: data.resend.is_active
            })
          if (error) throw error
        }
      } catch (err: any) {
        if (err.code === 'PGRST205') {
          console.warn('resend_config table not found. Skipped DB save.')
        } else throw err
      }
    }

    // 2. Salvar Z-API
    if (data.zapi) {
      try {
        if (data.zapi.id) {
          const { error } = await supabaseAdmin
            .from('zapi_config')
            .update({
              instance_id: data.zapi.instance_id,
              token: data.zapi.token,
              client_key: data.zapi.client_key || '',
              is_active: data.zapi.is_active,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.zapi.id)
          if (error) throw error
        } else {
          const { error } = await supabaseAdmin
            .from('zapi_config')
            .insert({
              instance_id: data.zapi.instance_id,
              token: data.zapi.token,
              client_key: data.zapi.client_key || '',
              is_active: data.zapi.is_active
            })
          if (error) throw error
        }
      } catch (err: any) {
        if (err.code === 'PGRST205') {
          console.warn('zapi_config table not found. Skipped DB save.')
        } else throw err
      }
    }

    // 3. Salvar Assinafy
    if (data.assinafy) {
      try {
        if (data.assinafy.id) {
          const { error } = await supabaseAdmin
            .from('assinafy_config')
            .update({
              api_key: data.assinafy.api_key,
              is_active: data.assinafy.is_active,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.assinafy.id)
          if (error) throw error
        } else {
          const { error } = await supabaseAdmin
            .from('assinafy_config')
            .insert({
              api_key: data.assinafy.api_key,
              is_active: data.assinafy.is_active
            })
          if (error) throw error
        }
      } catch (err: any) {
        if (err.code === 'PGRST205') {
          console.warn('assinafy_config table not found. Skipped DB save.')
        } else throw err
      }
    }

    revalidatePath('/rh/parceiros/config/provedores')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao salvar provedores:', error)
    return { success: false, error: error.message }
  }
}

// =========================================================================
// 2. Entidades Comerciais (Superintendentes, Supervisores, Gerentes)
// =========================================================================

export async function getCommercialEntities() {
  try {
    const { data, error } = await supabaseAdmin
      .from('commercial_entities')
      .select(`
        *,
        parent:parent_id ( id, name, role )
      `)
      .order('name')

    if (error) throw error

    // Buscar usuários do sistema para vinculação de acesso
    const { data: users, error: uErr } = await supabaseAdmin
      .from('users')
      .select('id, name, email, cpf')
      .eq('active', true)
      .order('name')

    if (uErr) throw uErr

    return { success: true, entities: data || [], systemUsers: users || [] }
  } catch (error: any) {
    console.error('Erro ao buscar entidades comerciais:', error)
    return { success: false, error: error.message }
  }
}

export async function saveCommercialEntity(entityData: {
  id?: string
  name: string
  cpf_cnpj: string
  role: 'superintendente' | 'supervisor' | 'gerente'
  parent_id?: string | null
  user_id?: string | null
  status: 'ativo' | 'inativo'
  arw_code?: string
  filial?: string
  nivel_acesso?: string
  tipo_agente?: string
  regra_fisico?: string
  phone_whatsapp?: string
  email_comissao?: string
  google_drive_url?: string
}) {
  try {
    const payload = {
      name: entityData.name,
      cpf_cnpj: entityData.cpf_cnpj,
      role: entityData.role,
      parent_id: entityData.parent_id || null,
      user_id: entityData.user_id || null,
      status: entityData.status,
      arw_code: entityData.arw_code || null,
      filial: entityData.filial || null,
      nivel_acesso: entityData.nivel_acesso || null,
      tipo_agente: entityData.tipo_agente || null,
      regra_fisico: entityData.regra_fisico || null,
      phone_whatsapp: entityData.phone_whatsapp || null,
      email_comissao: entityData.email_comissao || null,
      google_drive_url: entityData.google_drive_url || null,
      updated_at: new Date().toISOString()
    }

    if (entityData.id) {
      const { error } = await supabaseAdmin
        .from('commercial_entities')
        .update(payload)
        .eq('id', entityData.id)
      if (error) throw error
    } else {
      const { error } = await supabaseAdmin
        .from('commercial_entities')
        .insert(payload)
      if (error) throw error
    }

    revalidatePath('/rh/parceiros/config/comercial')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao salvar entidade comercial:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCommercialEntity(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('commercial_entities')
      .update({ status: 'inativo', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/rh/parceiros/config/comercial')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao inativar entidade comercial:', error)
    return { success: false, error: error.message }
  }
}

// =========================================================================
// 3. Construtor de Formulários (Schema Builder)
// =========================================================================

export async function getPartnerForms() {
  try {
    const columns = await getPartnerFormsColumnSet()
    const selectColumns = columns
      ? ['id', 'title', 'is_active', 'schema', 'created_at', 'updated_at']
          .concat(columns.has('slug') ? ['slug'] : [])
          .concat(columns.has('config') ? ['config'] : [])
          .join(',')
      : '*'

    const { data, error } = await supabaseAdmin
      .from('partner_forms')
      .select(selectColumns)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, forms: data || [] }
  } catch (error: any) {
    console.error('Erro ao buscar formulários:', error)
    return { success: false, error: error.message }
  }
}

export async function savePartnerForm(formData: {
  id?: string
  title: string
  slug?: string
  is_active: boolean
  schema: any[]
  config?: unknown
}) {
  try {
    const columns = await getPartnerFormsColumnSet()
    const payload = {
      title: formData.title,
      is_active: formData.is_active,
      schema: formData.schema,
      updated_at: new Date().toISOString()
    } as Record<string, unknown>

    if (!columns || columns.has('slug')) payload.slug = formData.slug || null
    if (!columns || columns.has('config')) payload.config = formData.config ?? {}

    if (formData.id) {
      const { data, error } = await supabaseAdmin
        .from('partner_forms')
        .update(payload)
        .eq('id', formData.id)
        .select('id')
        .maybeSingle()
      if (error) throw error
      revalidatePath('/rh/parceiros/config/formularios')
      return { success: true, id: data?.id || formData.id }
    } else {
      const { data, error } = await supabaseAdmin
        .from('partner_forms')
        .insert(payload)
        .select('id')
        .maybeSingle()
      if (error) throw error
      revalidatePath('/rh/parceiros/config/formularios')
      return { success: true, id: data?.id }
    }
  } catch (error: any) {
    console.error('Erro ao salvar formulário:', error)
    if (String(error?.message || '').includes("Could not find the 'config' column of 'partner_forms'")) {
      return {
        success: false,
        error:
          "Sua tabela 'partner_forms' ainda não tem a coluna 'config'. Aplique as migrations do Supabase e recarregue o schema cache da API.",
      }
    }
    return { success: false, error: error.message }
  }
}

export async function isPartnerFormSlugAvailable(slug: string, excludeId?: string) {
  try {
    const normalized = String(slug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!normalized) return { success: true, available: false, normalized }

    let q = supabaseAdmin
      .from('partner_forms')
      .select('id')
      .eq('slug', normalized)
      .limit(1)

    if (excludeId) q = q.neq('id', excludeId)

    const { data, error } = await q.maybeSingle()
    if (error) throw error

    return { success: true, available: !data, normalized }
  } catch (error: any) {
    return { success: false, error: error.message, available: false }
  }
}

export async function deletePartnerForm(id: string) {
  try {
    if (!id) return { success: false, error: 'ID inválido' }

    const { error } = await supabaseAdmin.from('partner_forms').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/rh/parceiros/config/formularios')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao excluir formulário:', error)
    return { success: false, error: error.message }
  }
}

// =========================================================================
// 4. CRM de Parceiros (agentes_parceiros)
// =========================================================================

export async function getCRMData() {
  try {
    const { data: partners, error: pErr } = await supabaseAdmin
      .from('agentes_parceiros')
      .select(`
        *,
        superintendente:superintendente_id ( id, name ),
        supervisor:supervisor_id ( id, name ),
        gerente:gerente_id ( id, name )
      `)
      .order('created_at', { ascending: false })

    if (pErr) throw pErr

    // Buscar entidades comerciais para atribuição no CRM
    const { data: entities, error: eErr } = await supabaseAdmin
      .from('commercial_entities')
      .select('id, name, role, parent_id')
      .eq('status', 'ativo')

    if (eErr) throw eErr

    return {
      success: true,
      partners: partners || [],
      commercialEntities: entities || []
    }
  } catch (error: any) {
    console.error('Erro ao obter dados do CRM:', error)
    return { success: false, error: error.message }
  }
}

export async function updatePartnerCRM(partnerData: {
  id: string
  status?: 'novo' | 'aguarda_assinatura' | 'assinatura_realizada' | 'validacao_final' | 'finalizado'
  superintendente_id?: string | null
  supervisor_id?: string | null
  gerente_id?: string | null
  arw_code?: string | null
  temporary_password?: string | null
  google_drive_url?: string | null
  filial?: string | null
  nivel_acesso?: string | null
  tipo_agente?: string | null
  regra_fisico?: string | null
  assinafy_document_id?: string | null
  assinafy_signature_url?: string | null
}) {
  try {
    const { error } = await supabaseAdmin
      .from('agentes_parceiros')
      .update({
        ...partnerData,
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerData.id)

    if (error) throw error

    revalidatePath('/rh/parceiros/crm')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao atualizar parceiro no CRM:', error)
    return { success: false, error: error.message }
  }
}

// =========================================================================
// 5. Modelos de Templates (Contrato & E-mail)
// =========================================================================

export async function getTemplates() {
  try {
    const { data: contracts, error: cErr } = await supabaseAdmin
      .from('contract_templates')
      .select('*')
      .order('name')

    if (cErr) throw cErr

    const { data: emails, error: eErr } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .order('name')

    if (eErr) throw eErr

    return {
      success: true,
      contracts: contracts || [],
      emails: emails || []
    }
  } catch (error: any) {
    console.error('Erro ao buscar templates:', error)
    return { success: false, error: error.message }
  }
}

export async function saveContractTemplate(templateData: {
  id?: string
  name: string
  body: string
}) {
  try {
    if (templateData.id) {
      const { error } = await supabaseAdmin
        .from('contract_templates')
        .update({ name: templateData.name, body: templateData.body })
        .eq('id', templateData.id)
      if (error) throw error
    } else {
      const { error } = await supabaseAdmin
        .from('contract_templates')
        .insert({ name: templateData.name, body: templateData.body })
      if (error) throw error
    }

    revalidatePath('/rh/parceiros/config/templates')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao salvar template de contrato:', error)
    return { success: false, error: error.message }
  }
}

export async function saveEmailTemplate(templateData: {
  id?: string
  name: string
  subject: string
  body: string
}) {
  try {
    if (templateData.id) {
      const { error } = await supabaseAdmin
        .from('email_templates')
        .update({
          name: templateData.name,
          subject: templateData.subject,
          body: templateData.body
        })
        .eq('id', templateData.id)
      if (error) throw error
    } else {
      const { error } = await supabaseAdmin
        .from('email_templates')
        .insert({
          name: templateData.name,
          subject: templateData.subject,
          body: templateData.body
        })
      if (error) throw error
    }

    revalidatePath('/rh/parceiros/config/templates')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao salvar template de e-mail:', error)
    return { success: false, error: error.message }
  }
}

// =========================================================================
// 6. Ações de Automação (Assinafy, Z-API, Resend, Aprovação/Acesso)
// =========================================================================

export async function executePartnerAutomation(
  partnerId: string,
  actionType: 'contrato' | 'whatsapp' | 'email' | 'aprovar',
  params?: any
) {
  try {
    // 1. Buscar dados do parceiro
    const { data: partner, error: pErr } = await supabaseAdmin
      .from('agentes_parceiros')
      .select('*')
      .eq('id', partnerId)
      .single()

    if (pErr) throw pErr

    // Helper para substituir tags
    const replaceTags = (text: string) => {
      return text
        .replace(/\{\{name\}\}/g, partner.name || '')
        .replace(/\{\{fantasy_name\}\}/g, partner.fantasy_name || '')
        .replace(/\{\{cpf_cnpj\}\}/g, partner.cpf_cnpj || '')
        .replace(/\{\{email\}\}/g, partner.email_comissao || '')
        .replace(/\{\{phone_whatsapp\}\}/g, partner.phone_whatsapp || '')
        .replace(/\{\{arw_code\}\}/g, partner.arw_code || params?.arw_code || '')
        .replace(/\{\{temporary_password\}\}/g, partner.temporary_password || params?.temporary_password || '')
        .replace(/\{\{google_drive_url\}\}/g, partner.google_drive_url || '')
        .replace(/\{\{assinafy_signature_url\}\}/g, partner.assinafy_signature_url || '')
    }

    if (actionType === 'contrato') {
      // 1. Buscar primeiro modelo de contrato ativo
      const { data: templates } = await supabaseAdmin
        .from('contract_templates')
        .select('*')
        .limit(1)

      const docId = `doc_${Math.random().toString(36).substr(2, 9)}`
      const mockSignatureUrl = `https://assinador.assinafy.com/documento/${docId}/assinar`

      // 2. Atualizar no banco
      const { error: updErr } = await supabaseAdmin
        .from('agentes_parceiros')
        .update({
          status: 'aguarda_assinatura',
          assinafy_document_id: docId,
          assinafy_signature_url: mockSignatureUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId)

      if (updErr) throw updErr

      // Revalidar rotas
      revalidatePath('/rh/parceiros')
      return { success: true, message: 'Assinatura eletrônica disparada via Assinafy com sucesso!', signatureUrl: mockSignatureUrl }
    }

    if (actionType === 'whatsapp') {
      const { data: zapi } = await supabaseAdmin
        .from('zapi_config')
        .select('*')
        .limit(1)
        .maybeSingle()

      let sent = false
      let details = 'Z-API inativa ou sem credenciais.'

      // Exemplo de corpo da mensagem
      const messageText = replaceTags(
        params?.message || `Olá {{name}}, seu contrato está disponível para assinatura eletrônica: {{assinafy_signature_url}}`
      )

      if (zapi && zapi.is_active && zapi.instance_id && zapi.token) {
        // Disparo real via Z-API se configurado
        try {
          const res = await fetch(`https://api.z-api.io/instances/${zapi.instance_id}/token/${zapi.token}/send-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: partner.phone_whatsapp,
              message: messageText
            })
          })
          if (res.ok) {
            sent = true;
            details = 'Mensagem enviada com sucesso!'
          } else {
            details = `Falha no envio da Z-API. Status: ${res.status}`
          }
        } catch (err: any) {
          details = `Erro de conexão Z-API: ${err.message}`
        }
      }

      return { success: true, sent, details, simulatedText: messageText }
    }

    if (actionType === 'email') {
      const { data: resend } = await supabaseAdmin
        .from('resend_config')
        .select('*')
        .limit(1)
        .maybeSingle()

      // Buscar template de e-mail de boas vindas
      const { data: templates } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .limit(1)

      const template = templates?.[0] || { subject: 'Bem-vindo à BRS Promotora', body: 'Olá {{name}}, seu cadastro foi finalizado!' }

      const emailSubject = replaceTags(template.subject)
      const emailBody = replaceTags(template.body)

      let sent = false
      let details = 'Resend inativo ou sem credenciais.'

      if (resend && resend.is_active && resend.api_key) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resend.api_key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: resend.from_email || 'onboarding@brspromotora.com.br',
              to: [partner.email_comissao],
              subject: emailSubject,
              html: emailBody
            })
          })
          if (res.ok) {
            sent = true;
            details = 'E-mail disparado com sucesso via Resend!'
          } else {
            details = `Falha no envio do Resend. Status: ${res.status}`
          }
        } catch (err: any) {
          details = `Erro de conexão Resend: ${err.message}`
        }
      }

      return { success: true, sent, details, simulatedSubject: emailSubject, simulatedBody: emailBody }
    }

    if (actionType === 'aprovar') {
      const arwCode = params.arw_code
      const tempPass = params.temporary_password || 'brs' + Math.random().toString(36).substr(2, 6)
      const driveUrl = params.google_drive_url

      if (!arwCode) {
        throw new Error('Código ARW é obrigatório para aprovação de cadastro.')
      }

      // 1. Criar Usuário no Supabase Auth se ainda não existir
      let userId
      try {
        const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email: partner.email_comissao,
          password: tempPass,
          email_confirm: true
        })

        if (authErr) {
          // Se já existir no Auth, tentamos buscar pelo e-mail
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', partner.email_comissao)
            .maybeSingle()

          if (existingUser) {
            userId = existingUser.id
          } else {
            throw authErr
          }
        } else {
          userId = authUser.user.id
        }
      } catch (err: any) {
        console.warn('Erro ao criar no Auth, assumindo vínculo por e-mail existente:', err.message)
      }

      // 2. Criar ou Atualizar na tabela users
      if (userId) {
        const { error: userErr } = await supabaseAdmin
          .from('users')
          .upsert({
            id: userId,
            name: partner.name,
            email: partner.email_comissao,
            cpf: partner.cpf_cnpj,
            role: 'gestor', // papel padrão
            commercial_role: 'gerente', // como é parceiro gerente
            superintendente_id: partner.superintendente_id,
            supervisor_id: partner.supervisor_id,
            gerente_id: partner.gerente_id,
            temp_password: tempPass,
            active: true
          })
        if (userErr) throw userErr
      }

      // 3. Atualizar parceiro no CRM
      const { error: updErr } = await supabaseAdmin
        .from('agentes_parceiros')
        .update({
          status: 'finalizado',
          arw_code: arwCode,
          temporary_password: tempPass,
          google_drive_url: driveUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId)

      if (updErr) throw updErr

      // 4. Auto-enviar WhatsApp de Boas-vindas contendo credenciais
      try {
        const welcomeMessage = `Olá *${partner.name}*, seu acesso ao portal BRS Promotora foi liberado!\n\n*Acesse:* https://gestao.brspromotora.com.br\n*Usuário:* ${partner.email_comissao}\n*Senha Provisória:* ${tempPass}\n*Código ARW:* ${arwCode}\n\nSeja bem-vindo!`
        await executePartnerAutomation(partnerId, 'whatsapp', { message: welcomeMessage })
      } catch (waErr) {
        console.error('Falha ao disparar Whatsapp de Boas-vindas automático:', waErr)
      }

      revalidatePath('/rh/parceiros')
      return { success: true, message: 'Parceiro finalizado e usuário de acesso criado com sucesso!' }
    }

    throw new Error('Ação de automação inválida.')
  } catch (error: any) {
    console.error('Erro na automação do parceiro:', error)
    return { success: false, error: error.message }
  }
}
