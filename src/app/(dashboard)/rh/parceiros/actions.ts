'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import {
  requireAnyPermission,
  requireCurrentUser,
  requirePermission as requireServerPermission,
} from '@/lib/auth/server'
import { systemConfigRouteOptions, type PermissionAction, type PermissionRequirement } from '@/lib/auth/permissions'

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

async function requireCurrentUserId() {
  const user = await requireCurrentUser()
  const userId = user.id
  if (!userId) throw new Error('Usuário não autenticado.')
  return userId
}

async function requirePermission(resourceName: string, action: PermissionAction = 'can_view') {
  const { permissions } = await requireServerPermission(resourceName, action)
  const userId = await requireCurrentUserId()
  const permsRes: { success: boolean; permissions: typeof permissions } = { success: true, permissions }
  if (!permsRes.success) throw new Error('Não foi possível validar permissões.')
  const perms = permsRes.permissions || []
  const perm = perms.find((p) => p?.resource_name === resourceName)
  if (!perm || !perm[action]) throw new Error('Sem permissão para esta ação.')
  return { userId, perms }
}

async function requireAny(requirements: PermissionRequirement[]) {
  const { user, permissions } = await requireAnyPermission(requirements)
  return { userId: user.id, perms: permissions }
}

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
    for (const row of (data as Array<{ column_name?: string | null }>) || []) {
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
    const providerAccess = await requireAny([
      { resource: 'sistema-config-email' },
      { resource: 'sistema-config-whatsapp' },
      { resource: 'sistema-config-assinatura' },
    ])
    const permsRes: { success: boolean; permissions: typeof providerAccess.perms } = {
      success: true,
      permissions: providerAccess.perms,
    }
    if (!permsRes.success) throw new Error('Não foi possível validar permissões.')
    const perms = permsRes.permissions || []
    const canViewEmail = perms.some((p) => p?.resource_name === 'sistema-config-email' && !!p?.can_view)
    const canViewWhatsapp = perms.some((p) => p?.resource_name === 'sistema-config-whatsapp' && !!p?.can_view)
    const canViewAssinatura = perms.some((p) => p?.resource_name === 'sistema-config-assinatura' && !!p?.can_view)
    const canViewAny = canViewEmail || canViewWhatsapp || canViewAssinatura

    if (!canViewAny) throw new Error('Sem permissão para visualizar configurações.')

    let resend = { id: '', api_key: '', from_email: '', is_active: false }
    if (canViewEmail) {
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
    }

    let zapi = { id: '', instance_id: '', token: '', client_key: '', is_active: false }
    if (canViewWhatsapp) {
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
    }

    let assinafy = { id: '', api_key: '', is_active: false }
    if (canViewAssinatura) {
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
    const requiredConfigPermissions: PermissionRequirement[] = []
    if (data.resend) requiredConfigPermissions.push({ resource: 'sistema-config-email', action: 'can_edit' })
    if (data.zapi) requiredConfigPermissions.push({ resource: 'sistema-config-whatsapp', action: 'can_edit' })
    if (data.assinafy) requiredConfigPermissions.push({ resource: 'sistema-config-assinatura', action: 'can_edit' })
    const providerAccess = await requireAny(requiredConfigPermissions.length ? requiredConfigPermissions : systemConfigRouteOptions)
    const permsRes: { success: boolean; permissions: typeof providerAccess.perms } = {
      success: true,
      permissions: providerAccess.perms,
    }
    if (!permsRes.success) throw new Error('Não foi possível validar permissões.')
    const perms = permsRes.permissions || []

    const canEditRoot = perms.some((p) => p?.resource_name === 'sistema-config-root' && !!p?.can_edit)
    const canEditEmail = perms.some((p) => p?.resource_name === 'sistema-config-email' && !!p?.can_edit)
    const canEditWhatsapp = perms.some((p) => p?.resource_name === 'sistema-config-whatsapp' && !!p?.can_edit)
    const canEditAssinatura = perms.some((p) => p?.resource_name === 'sistema-config-assinatura' && !!p?.can_edit)

    if (data.resend && !(canEditRoot || canEditEmail)) throw new Error('Sem permissão para salvar configurações de e-mail.')
    if (data.zapi && !(canEditRoot || canEditWhatsapp)) throw new Error('Sem permissão para salvar configurações de WhatsApp.')
    if (data.assinafy && !(canEditRoot || canEditAssinatura)) throw new Error('Sem permissão para salvar configurações de assinatura.')

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
    await requireAny([{ resource: 'comercial-agentes' }, { resource: 'comercial-estrutura' }])

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
    await requirePermission('comercial-agentes', entityData.id ? 'can_edit' : 'can_include')

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
    await requirePermission('comercial-agentes', 'can_activate_inactivate')

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
    await requirePermission('scp-construtor')

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
    await requirePermission('scp-construtor', formData.id ? 'can_edit' : 'can_include')

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
    await requirePermission('scp-construtor')

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
    await requirePermission('scp-construtor', 'can_delete')

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
    await requirePermission('scp-crm')

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
    await requirePermission('scp-crm', 'can_edit')

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
    await requireAny([{ resource: 'scp-documentos' }, { resource: 'scp-emails' }])

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

    const normalizeTemplatePlaceholders = (body: string, placeholders: any): any[] => {
      const extractedTokens = Array.from(new Set(String(body || '').match(/\{\{[^}]+\}\}/g) || []))
      const current = Array.isArray(placeholders) ? placeholders : []
      const byToken = new Map<string, any>()
      for (const item of current) {
        const token = String(item?.token || '').trim()
        if (!token) continue
        byToken.set(token, item)
      }
      return extractedTokens.map((token) => {
        const existing = byToken.get(token)
        const fallbackId = token.replace(/[{}]/g, '').replace(/[^a-zA-Z0-9_-]/g, '_')
        return {
          id: String(existing?.id || fallbackId || `ph_${Math.random().toString(36).slice(2, 8)}`),
          token,
          label: String(existing?.label || token),
          required: !!existing?.required,
        }
      })
    }

    const normalizedContracts = (contracts || []).map((contract: any) => ({
      ...contract,
      placeholders: normalizeTemplatePlaceholders(contract?.body || '', contract?.placeholders),
    }))

    return {
      success: true,
      contracts: normalizedContracts,
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
  placeholders?: Array<{ id: string; token: string; label: string; required?: boolean }>
}) {
  try {
    await requirePermission('scp-documentos', templateData.id ? 'can_edit' : 'can_include')

    const normalizedPlaceholders = (templateData.placeholders || [])
      .filter((p) => p?.token)
      .map((p) => ({
        id: String(p.id || p.token),
        token: String(p.token),
        label: String(p.label || p.token),
        required: !!p.required,
      }))

    if (templateData.id) {
      let { error } = await supabaseAdmin
        .from('contract_templates')
        .update({ name: templateData.name, body: templateData.body, placeholders: normalizedPlaceholders })
        .eq('id', templateData.id)
      if (error && String(error.message || '').includes("Could not find the 'placeholders'")) {
        const retry = await supabaseAdmin
          .from('contract_templates')
          .update({ name: templateData.name, body: templateData.body })
          .eq('id', templateData.id)
        error = retry.error
      }
      if (error) throw error
    } else {
      let { error } = await supabaseAdmin
        .from('contract_templates')
        .insert({ name: templateData.name, body: templateData.body, placeholders: normalizedPlaceholders })
      if (error && String(error.message || '').includes("Could not find the 'placeholders'")) {
        const retry = await supabaseAdmin
          .from('contract_templates')
          .insert({ name: templateData.name, body: templateData.body })
        error = retry.error
      }
      if (error) throw error
    }

    revalidatePath('/rh/parceiros/config/templates')
    revalidatePath('/rh/parceiros/config/documentos')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao salvar template de contrato:', error)
    return { success: false, error: error.message }
  }
}

export async function getContractTemplates() {
  try {
    await requirePermission('scp-documentos')

    const res = await getTemplates()
    if (!res.success) return { success: false, error: res.error || 'Erro ao carregar modelos de documentos.' }
    return { success: true, templates: res.contracts || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getEmailTemplates() {
  try {
    await requirePermission('scp-emails')

    const res = await getTemplates()
    if (!res.success) return { success: false, error: res.error || 'Erro ao carregar modelos de e-mail.' }
    return { success: true, templates: res.emails || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =========================================================================
// 6. Cadastro da Empresa (multi-CNPJ)
// =========================================================================

type CompanyProfileRow = {
  id?: string
  nickname: string
  is_active: boolean
  cnpj?: string | null
  company_data?: any
  partner_primary_data?: any
  partner_secondary_data?: any
  witness_data?: any
  created_at?: string
  updated_at?: string
}

function sanitizeDigits(value: any) {
  return String(value || '').replace(/\D/g, '')
}

export async function getCompanyProfiles() {
  try {
    await requirePermission('sistema-config-empresa')

    const { data, error } = await supabaseAdmin
      .from('company_profiles')
      .select('*')
      .order('nickname', { ascending: true })
    if (error) throw error
    return { success: true, companies: data || [] }
  } catch (error: any) {
    console.error('Erro ao buscar cadastro de empresas:', error)
    return { success: false, error: error.message }
  }
}

export async function saveCompanyProfile(payload: CompanyProfileRow) {
  try {
    await requirePermission('sistema-config-empresa', payload.id ? 'can_edit' : 'can_include')

    const row: any = {
      nickname: String(payload.nickname || '').trim(),
      is_active: payload.is_active !== false,
      cnpj: sanitizeDigits(payload.cnpj || '') || null,
      company_data: payload.company_data ?? {},
      partner_primary_data: payload.partner_primary_data ?? {},
      partner_secondary_data: payload.partner_secondary_data ?? {},
      witness_data: payload.witness_data ?? {},
      updated_at: new Date().toISOString(),
    }

    if (!row.nickname) {
      return { success: false, error: 'Apelido é obrigatório.' }
    }

    if (payload.id) {
      const { error } = await supabaseAdmin
        .from('company_profiles')
        .update(row)
        .eq('id', payload.id)
      if (error) throw error
    } else {
      const { error } = await supabaseAdmin
        .from('company_profiles')
        .insert(row)
      if (error) throw error
    }

    revalidatePath('/rh/parceiros/config/empresas')
    revalidatePath('/rh/parceiros/config/provedores/empresas')
    revalidatePath('/rh/parceiros/config/processos')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao salvar cadastro de empresa:', error)
    if (String(error?.message || '').includes("Could not find the 'company_profiles'")) {
      return {
        success: false,
        error:
          "A tabela 'company_profiles' ainda não existe. Aplique as migrations do Supabase (supabase/migrations/20260526020000_create_company_profiles.sql).",
      }
    }
    if ((error as any)?.code === '23505') {
      return { success: false, error: 'Já existe uma empresa cadastrada com este CNPJ.' }
    }
    return { success: false, error: error.message }
  }
}

export async function archiveCompanyProfile(id: string) {
  try {
    await requirePermission('sistema-config-empresa', 'can_activate_inactivate')

    if (!id) return { success: false, error: 'ID inválido.' }
    const { error } = await supabaseAdmin
      .from('company_profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    revalidatePath('/rh/parceiros/config/empresas')
    revalidatePath('/rh/parceiros/config/provedores/empresas')
    revalidatePath('/rh/parceiros/config/processos')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao arquivar empresa:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCompanyProfile(id: string) {
  try {
    await requirePermission('sistema-config-empresa', 'can_delete')

    if (!id) return { success: false, error: 'ID inválido.' }
    let { data: linked, error: lErr } = await supabaseAdmin
      .from('process_models')
      .select('id')
      .eq('company_profile_id', id)
      .limit(1)
      .maybeSingle()
    if (lErr && String(lErr.message || '').includes("Could not find the 'company_profile_id'")) {
      linked = null
      lErr = null as any
    }
    if (lErr) throw lErr
    if (linked) {
      return { success: false, error: 'Empresa vinculada a processo. Arquive em vez de excluir.' }
    }

    const { error } = await supabaseAdmin.from('company_profiles').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/rh/parceiros/config/empresas')
    revalidatePath('/rh/parceiros/config/provedores/empresas')
    revalidatePath('/rh/parceiros/config/processos')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao excluir empresa:', error)
    return { success: false, error: error.message }
  }
}

// =========================================================================
// 7. Construtor de Processos (Workflow / Kanban por tipo de processo)
// =========================================================================

type ProcessModelRow = {
  id: string
  name: string
  type: string
  is_active: boolean
  is_public: boolean
  public_slug?: string | null
  form_id?: string | null
  company_profile_id?: string | null
  entry_config?: any
  config?: any
  created_at?: string
  updated_at?: string
}

type StageModelRow = {
  id: string
  process_id: string
  name: string
  position: number
  color?: string | null
  bg?: string | null
  config?: any
}

function normalizeSlug(input: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function getProcessModels() {
  try {
    await requirePermission('scp-processos')

    const { data, error } = await supabaseAdmin
      .from('process_models')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, processes: data || [] }
  } catch (error: any) {
    console.error('Erro ao buscar processos:', error)
    return { success: false, error: error.message }
  }
}

export async function getProcessStages(processId: string) {
  try {
    await requirePermission('scp-processos')

    if (!processId) return { success: true, stages: [] }
    const { data, error } = await supabaseAdmin
      .from('process_stage_models')
      .select('*')
      .eq('process_id', processId)
      .order('position', { ascending: true })
    if (error) throw error
    return { success: true, stages: data || [] }
  } catch (error: any) {
    console.error('Erro ao buscar etapas do processo:', error)
    return { success: false, error: error.message }
  }
}

export async function isProcessSlugAvailable(slug: string, excludeId?: string) {
  try {
    await requirePermission('scp-processos')

    const normalized = normalizeSlug(slug)
    if (!normalized) return { success: true, available: false, normalized }

    let q = supabaseAdmin
      .from('process_models')
      .select('id')
      .eq('public_slug', normalized)
      .limit(1)

    if (excludeId) q = q.neq('id', excludeId)

    const { data, error } = await q.maybeSingle()
    if (error) throw error

    return { success: true, available: !data, normalized }
  } catch (error: any) {
    return { success: false, error: error.message, available: false }
  }
}

export async function saveProcessModel(payload: {
  id?: string
  name: string
  type: string
  is_active: boolean
  is_public: boolean
  public_slug?: string | null
  form_id?: string | null
  company_profile_id?: string | null
  entry_config?: any
  config?: any
  stages?: Array<Partial<StageModelRow> & { id?: string }>
}) {
  try {
    await requirePermission('scp-processos', payload.id ? 'can_edit' : 'can_include')

    const modelData: any = {
      name: payload.name,
      type: payload.type || 'generic',
      is_active: !!payload.is_active,
      is_public: !!payload.is_public,
      public_slug: payload.is_public ? (payload.public_slug ? normalizeSlug(payload.public_slug) : null) : null,
      form_id: payload.form_id || null,
      company_profile_id: payload.company_profile_id || null,
      entry_config: payload.entry_config ?? {},
      config: payload.config ?? {},
      updated_at: new Date().toISOString(),
    }

    let processId = payload.id

    if (payload.id) {
      let { data, error } = await supabaseAdmin
        .from('process_models')
        .update(modelData)
        .eq('id', payload.id)
        .select('id')
        .maybeSingle()
      if (error && String(error.message || '').includes("Could not find the 'company_profile_id'")) {
        const fallbackData = { ...modelData }
        delete fallbackData.company_profile_id
        const retry = await supabaseAdmin
          .from('process_models')
          .update(fallbackData)
          .eq('id', payload.id)
          .select('id')
          .maybeSingle()
        data = retry.data as any
        error = retry.error as any
      }
      if (error) throw error
      processId = data?.id || payload.id
    } else {
      let { data, error } = await supabaseAdmin
        .from('process_models')
        .insert(modelData)
        .select('id')
        .maybeSingle()
      if (error && String(error.message || '').includes("Could not find the 'company_profile_id'")) {
        const fallbackData = { ...modelData }
        delete fallbackData.company_profile_id
        const retry = await supabaseAdmin
          .from('process_models')
          .insert(fallbackData)
          .select('id')
          .maybeSingle()
        data = retry.data as any
        error = retry.error as any
      }
      if (error) throw error
      processId = data?.id
    }

    // Upsert stages (simple: delete missing + upsert provided)
    if (processId && Array.isArray(payload.stages)) {
      const { data: existing, error: sErr } = await supabaseAdmin
        .from('process_stage_models')
        .select('id')
        .eq('process_id', processId)
      if (sErr) throw sErr

      const existingIds = new Set((existing || []).map((r: any) => String(r.id)))
      const incomingIds = new Set(payload.stages.map(s => String(s.id || '')).filter(Boolean))

      const toDelete = [...existingIds].filter(id => !incomingIds.has(id))
      if (toDelete.length) {
        const { error: dErr } = await supabaseAdmin
          .from('process_stage_models')
          .delete()
          .in('id', toDelete)
        if (dErr) throw dErr
      }

      for (let i = 0; i < payload.stages.length; i++) {
        const st = payload.stages[i]
        const row: any = {
          process_id: processId,
          name: String(st.name || '').trim() || `Etapa ${i + 1}`,
          position: typeof st.position === 'number' ? st.position : i,
          color: st.color ?? null,
          bg: st.bg ?? null,
          config: st.config ?? {},
          updated_at: new Date().toISOString(),
        }
        if (st.id) {
          const { error } = await supabaseAdmin.from('process_stage_models').update(row).eq('id', st.id)
          if (error) throw error
        } else {
          const { error } = await supabaseAdmin.from('process_stage_models').insert(row)
          if (error) throw error
        }
      }
    }

    revalidatePath('/rh/parceiros/config/processos')
    return { success: true, id: processId }
  } catch (error: any) {
    console.error('Erro ao salvar processo:', error)
    if (String(error?.message || '').includes("Could not find the 'process_models'")) {
      return {
        success: false,
        error:
          "As tabelas de processos ainda não existem no banco. Aplique as migrations do Supabase (supabase/migrations/20260525000000_create_process_tables.sql) e recarregue o schema cache da API.",
      }
    }
    return { success: false, error: error.message }
  }
}

export async function deleteProcessModel(id: string) {
  try {
    await requirePermission('scp-processos', 'can_delete')

    if (!id) return { success: false, error: 'ID inválido' }
    const { error } = await supabaseAdmin.from('process_models').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/rh/parceiros/config/processos')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao excluir processo:', error)
    return { success: false, error: error.message }
  }
}

export async function archiveProcessModel(id: string) {
  try {
    await requirePermission('scp-processos', 'can_activate_inactivate')

    if (!id) return { success: false, error: 'ID inválido' }
    const { error } = await supabaseAdmin
      .from('process_models')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    revalidatePath('/rh/parceiros/config/processos')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao arquivar processo:', error)
    return { success: false, error: error.message }
  }
}

export async function duplicateProcessModel(id: string) {
  try {
    await requirePermission('scp-processos', 'can_include')

    if (!id) return { success: false, error: 'ID inválido' }

    const { data: current, error: cErr } = await supabaseAdmin
      .from('process_models')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (cErr) throw cErr
    if (!current) return { success: false, error: 'Processo não encontrado' }

    const baseSlug = normalizeSlug(String(current.public_slug || current.name || 'processo'))
    let nextSlug = baseSlug ? `${baseSlug}-copia` : null
    if (nextSlug) {
      let tries = 2
      while (tries < 50) {
        const { data: exists } = await supabaseAdmin
          .from('process_models')
          .select('id')
          .eq('public_slug', nextSlug)
          .limit(1)
          .maybeSingle()
        if (!exists) break
        nextSlug = `${baseSlug}-copia-${tries}`
        tries++
      }
    }

    const { data: inserted, error: iErr } = await supabaseAdmin
      .from('process_models')
      .insert({
        name: `${current.name} (Copia)`,
        type: current.type || 'generic',
        is_active: false,
        is_public: !!current.is_public,
        public_slug: current.is_public ? nextSlug : null,
        form_id: current.form_id || null,
        entry_config: current.entry_config || {},
        config: current.config || {},
      })
      .select('id')
      .maybeSingle()
    if (iErr) throw iErr

    const newId = inserted?.id
    if (!newId) return { success: false, error: 'Falha ao criar cópia do processo' }

    const { data: stages, error: sErr } = await supabaseAdmin
      .from('process_stage_models')
      .select('*')
      .eq('process_id', id)
      .order('position', { ascending: true })
    if (sErr) throw sErr

    if ((stages || []).length > 0) {
      const rows = (stages || []).map((s: any) => ({
        process_id: newId,
        name: s.name,
        position: s.position,
        color: s.color ?? null,
        bg: s.bg ?? null,
        config: s.config ?? {},
      }))
      const { error: insertStagesErr } = await supabaseAdmin
        .from('process_stage_models')
        .insert(rows)
      if (insertStagesErr) throw insertStagesErr
    }

    revalidatePath('/rh/parceiros/config/processos')
    return { success: true, id: newId }
  } catch (error: any) {
    console.error('Erro ao duplicar processo:', error)
    return { success: false, error: error.message }
  }
}

export async function validateProcessModel(id: string) {
  try {
    await requirePermission('scp-processos')

    if (!id) return { success: false, error: 'ID inválido', blocking: [], warnings: [] }

    const { data: process, error: pErr } = await supabaseAdmin
      .from('process_models')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (pErr) throw pErr
    if (!process) return { success: false, error: 'Processo não encontrado', blocking: [], warnings: [] }

    const { data: stages, error: sErr } = await supabaseAdmin
      .from('process_stage_models')
      .select('*')
      .eq('process_id', id)
      .order('position', { ascending: true })
    if (sErr) throw sErr

    const blocking: string[] = []
    const warnings: string[] = []
    const stageList = stages || []

    if (stageList.length === 0) blocking.push('Nenhuma etapa cadastrada no processo.')

    for (const stage of stageList) {
      const transitions = Array.isArray(stage?.config?.transitions) ? stage.config.transitions : []
      const isTerminal = !!stage?.config?.is_terminal
      if (!isTerminal && transitions.length === 0) {
        blocking.push(`Etapa "${stage.name}" sem transição de saída.`)
      }
    }

    const cfg = process.config || {}
    const docs = Array.isArray(cfg?.documents) ? cfg.documents : []
    const mails = Array.isArray(cfg?.emails) ? cfg.emails : []
    const whats = Array.isArray(cfg?.whatsapp) ? cfg.whatsapp : []
    const processFields = Array.isArray(cfg?.process_fields) ? cfg.process_fields : []
    const SIGNATURE_LINK_TRIGGER = 'signature_link_ready'

    const { data: contractTemplates } = await supabaseAdmin
      .from('contract_templates')
      .select('id, name, placeholders')

    const templateById = new Map<string, any>()
    const templateByName = new Map<string, any>()
    for (const template of contractTemplates || []) {
      if (template?.id) templateById.set(String(template.id), template)
      if (template?.name) templateByName.set(String(template.name).toLowerCase(), template)
    }

    const EMAIL_AUTOFILL_TOKENS = new Set(['{{assinatura.link}}', '{{processo.id}}', '{{campo.email_destino}}'])
    const extractTokens = (text: string) => Array.from(new Set(String(text || '').match(/\{\{[^}]+\}\}/g) || []))
    const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

    const { data: emailTemplates, error: eTplErr } = await supabaseAdmin
      .from('email_templates')
      .select('id, name, subject, body')

    if (eTplErr) throw eTplErr

    const emailById = new Map<string, any>()
    const emailByName = new Map<string, any>()
    for (const template of emailTemplates || []) {
      if (template?.id) emailById.set(String(template.id), template)
      if (template?.name) emailByName.set(String(template.name).toLowerCase(), template)
    }

    const hasSignatureAction =
      docs.some((d: any) => d?.enabled !== false) ||
      stageList.some((s: any) => {
        const actions = Array.isArray(s?.config?.actions) ? s.config.actions : []
        return actions.some((a: any) => String(a?.type || '').toLowerCase() === 'signature')
      })

    const checkTemplates = (items: any[], kind: string) => {
      for (const item of items) {
        const body = String(item?.body || item?.template_body || '')
        if (body.includes('{{assinatura.link}}') && !hasSignatureAction) {
          blocking.push(`${kind} "${item?.name || 'sem nome'}" usa {{assinatura.link}} sem ação de assinatura.`)
        }
        const recipientSource = String(item?.recipient_source || '')
        const recipientField = String(item?.recipient_field || '')
        if (recipientSource === 'tag' && !recipientField) {
          blocking.push(`${kind} "${item?.name || 'sem nome'}" possui destinatário por tag sem mapeamento.`)
        }
      }
    }

    const requireSignatureTriggerConfig = (items: any[], kind: string) => {
      for (const item of items) {
        if (String(item?.trigger || '') !== SIGNATURE_LINK_TRIGGER) continue
        if (!String(item?.signature_document_ref || '').trim()) {
          blocking.push(`${kind} "${item?.name || 'sem nome'}" precisa de documento vinculado para gatilho de link.`)
        }
        if (!String(item?.signature_signer_role || '').trim()) {
          blocking.push(`${kind} "${item?.name || 'sem nome'}" precisa de papel de assinante para gatilho de link.`)
        }
      }
    }

    checkTemplates(mails, 'E-mail')
    checkTemplates(whats, 'WhatsApp')
    requireSignatureTriggerConfig(mails, 'E-mail')
    requireSignatureTriggerConfig(whats, 'WhatsApp')

    for (const mail of mails) {
      const template =
        emailById.get(String(mail?.template_id || '')) ||
        emailByName.get(String(mail?.template_name || '').toLowerCase())

      if (!template) {
        blocking.push(`E-mail "${mail?.name || 'sem nome'}" sem modelo de e-mail selecionado.`)
        continue
      }

      const templateText = `${String(template?.subject || '')}\n${String(template?.body || '')}`
      if (templateText.includes('{{assinatura.link}}') && !hasSignatureAction) {
        blocking.push(`E-mail "${mail?.name || template?.name || 'sem nome'}" usa {{assinatura.link}} sem ação de assinatura.`)
      }

      const periodValue = Number(mail?.resend_period_value || 0)
      const periodUnit = String(mail?.resend_period_unit || '')
      const resendTrigger = String(mail?.resend_trigger || '')
      const repeatCount = Number(mail?.resend_repeat_count || 0)
      const wantsResend = !!resendTrigger || periodValue > 0 || !!periodUnit || repeatCount > 0
      if (wantsResend) {
        if (!(periodValue >= 1 && periodValue <= 60)) blocking.push(`E-mail "${mail?.name || template?.name || 'sem nome'}" com período de reenvio inválido (1 a 60).`)
        if (!['minutes', 'hours', 'days'].includes(periodUnit)) blocking.push(`E-mail "${mail?.name || template?.name || 'sem nome'}" com unidade de reenvio inválida.`)
        if (!['signature_not_finished', 'elapsed_time'].includes(resendTrigger)) blocking.push(`E-mail "${mail?.name || template?.name || 'sem nome'}" com gatilho de reenvio inválido.`)
        if (!(repeatCount >= 1)) blocking.push(`E-mail "${mail?.name || template?.name || 'sem nome'}" precisa do número de repetições do reenvio.`)
      }

      const copyRecipients = Array.isArray(mail?.copy_recipients) ? mail.copy_recipients : []
      for (const entry of copyRecipients) {
        const kind = String(entry?.type || '').trim()
        const value = String(entry?.value || '').trim()
        if (!kind || !value) {
          blocking.push(`E-mail "${mail?.name || template?.name || 'sem nome'}" possui um e-mail de cópia inválido.`)
          continue
        }
        if (kind === 'email' && !isValidEmail(value)) {
          blocking.push(`E-mail "${mail?.name || template?.name || 'sem nome'}" possui e-mail de cópia inválido: ${value}.`)
        }
      }

      const tokenMapping = mail?.token_mapping && typeof mail.token_mapping === 'object' ? mail.token_mapping : {}
      const subjectTokens = extractTokens(template?.subject || '')
      const bodyTokens = extractTokens(template?.body || '')
      const needed = [...new Set([...subjectTokens, ...bodyTokens])].filter((t) => !EMAIL_AUTOFILL_TOKENS.has(t))
      for (const token of needed) {
        const mapped = String(tokenMapping?.[token] || '').trim()
        if (!mapped) {
          blocking.push(`E-mail "${mail?.name || template?.name || 'sem nome'}" sem vínculo para tag ${token}.`)
        }
      }
    }

    for (const doc of docs) {
      const template =
        templateById.get(String(doc?.template_id || '')) ||
        templateByName.get(String(doc?.template_name || '').toLowerCase())

      if (!template) {
        blocking.push(`Documento "${doc?.name || 'sem nome'}" sem modelo válido selecionado.`)
        continue
      }

      const requiredPlaceholders = (Array.isArray(template?.placeholders) ? template.placeholders : [])
        .filter((p: any) => !!p?.required)

      const mapping = doc?.placeholder_mapping && typeof doc.placeholder_mapping === 'object' ? doc.placeholder_mapping : {}
      for (const placeholder of requiredPlaceholders) {
        const placeholderId = String(placeholder?.id || '')
        if (!placeholderId) continue
        const mapped = String(mapping?.[placeholderId] || '')
        if (!mapped) {
          blocking.push(`Documento "${doc?.name || 'sem nome'}" sem vínculo para placeholder obrigatório "${placeholder?.label || placeholderId}".`)
        }
      }
    }

    const requiredNoStage = processFields.filter((f: any) => f?.required && (!Array.isArray(f?.stages) || f.stages.length === 0))
    if (requiredNoStage.length > 0) warnings.push('Há campos obrigatórios sem etapa definida.')

    const dedupeEnabled = process.entry_config?.dedupe?.enabled !== false
    if (!dedupeEnabled) warnings.push('Dedupe está desligado.')

    const hasAnySla = stageList.some((s: any) => !!s?.config?.sla_hours || !!s?.config?.sla_days)
    if (!hasAnySla) warnings.push('Nenhum SLA configurado nas etapas.')

    return { success: true, blocking, warnings }
  } catch (error: any) {
    console.error('Erro ao validar processo:', error)
    return { success: false, error: error.message, blocking: [], warnings: [] }
  }
}

export async function getProcessCRMData(processId?: string) {
  try {
    await requirePermission('scp-crm')

    const { data: processes, error: pErr } = await supabaseAdmin
      .from('process_models')
      .select('id, name, type, is_active, is_public, public_slug, form_id, entry_config, config')
      .order('created_at', { ascending: false })
    if (pErr) throw pErr

    const selected = processId || (processes?.[0]?.id as string | undefined)
    let stages: any[] = []
    let instances: any[] = []

    if (selected) {
      const { data: st, error: sErr } = await supabaseAdmin
        .from('process_stage_models')
        .select('*')
        .eq('process_id', selected)
        .order('position', { ascending: true })
      if (sErr) throw sErr
      stages = st || []

      const { data: inst, error: iErr } = await supabaseAdmin
        .from('process_instances')
        .select(`
          *,
          partner:partner_id ( id, name, cpf_cnpj, email_comissao, phone_whatsapp, arw_code, superintendente_id, supervisor_id, gerente_id, status, additional_data )
        `)
        .eq('process_id', selected)
        .order('created_at', { ascending: false })
      if (iErr) throw iErr
      instances = inst || []
    }

    const { data: entities, error: eErr } = await supabaseAdmin
      .from('commercial_entities')
      .select('id, name, role, parent_id')
      .eq('status', 'ativo')

    if (eErr) throw eErr

    return { success: true, processes: processes || [], selectedProcessId: selected, stages, instances, commercialEntities: entities || [] }
  } catch (error: any) {
    console.error('Erro ao obter dados do CRM por processo:', error)
    return { success: false, error: error.message }
  }
}

export async function updateProcessInstance(data: {
  id: string
  current_stage_id?: string | null
  status?: 'active' | 'archived' | 'completed' | 'canceled'
}) {
  try {
    await requirePermission('scp-crm', 'can_edit')

    if (!data.id) return { success: false, error: 'ID inválido' }

    const payload: any = {
      updated_at: new Date().toISOString(),
    }
    if ('current_stage_id' in data) payload.current_stage_id = data.current_stage_id
    if ('status' in data) payload.status = data.status

    const { error } = await supabaseAdmin
      .from('process_instances')
      .update(payload)
      .eq('id', data.id)

    if (error) throw error

    revalidatePath('/rh/parceiros')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao atualizar instância do processo:', error)
    return { success: false, error: error.message }
  }
}

export async function getProcessInstanceDetail(instanceId: string) {
  try {
    await requirePermission('scp-crm')

    if (!instanceId) return { success: false, error: 'ID inválido' }

    const { data: instance, error: iErr } = await supabaseAdmin
      .from('process_instances')
      .select(`
        *,
        process:process_id ( id, name, type, config ),
        partner:partner_id ( id, name, cpf_cnpj, email_comissao, phone_whatsapp, arw_code, superintendente_id, supervisor_id, gerente_id, status, additional_data )
      `)
      .eq('id', instanceId)
      .maybeSingle()

    if (iErr) throw iErr

    const { data: snapshots, error: sErr } = await supabaseAdmin
      .from('process_instance_form_snapshots')
      .select('*')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: false })

    if (sErr) throw sErr

    const { data: events, error: eErr } = await supabaseAdmin
      .from('process_instance_events')
      .select('*')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (eErr) throw eErr

    const { data: fields, error: fErr } = await supabaseAdmin
      .from('process_instance_fields')
      .select('*')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: true })
    if (fErr) throw fErr

    const { data: validations, error: vErr } = await supabaseAdmin
      .from('process_instance_validations')
      .select(`
        *,
        validator:validated_by ( id, name, email )
      `)
      .eq('instance_id', instanceId)
      .order('validated_at', { ascending: false })
    if (vErr) throw vErr

    let stageModels: any[] = []
    const processId = instance?.process_id
    if (processId) {
      const { data: stages, error: stErr } = await supabaseAdmin
        .from('process_stage_models')
        .select('id, name, position')
        .eq('process_id', processId)
        .order('position', { ascending: true })
      if (stErr) throw stErr
      stageModels = stages || []
    }

    return {
      success: true,
      instance,
      snapshots: snapshots || [],
      events: events || [],
      fields: fields || [],
      validations: validations || [],
      stageModels,
    }
  } catch (error: any) {
    console.error('Erro ao obter detalhe da instância:', error)
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
    await requirePermission('scp-emails', templateData.id ? 'can_edit' : 'can_include')

    const normalizedName = String(templateData.name || '').trim()
    if (!normalizedName) return { success: false, error: 'Nome do modelo Ã© obrigatÃ³rio.' }

    let checkQuery = supabaseAdmin
      .from('email_templates')
      .select('id')
      .ilike('name', normalizedName)
      .limit(1)

    if (templateData.id) checkQuery = checkQuery.neq('id', templateData.id)

    const { data: existing, error: checkErr } = await checkQuery.maybeSingle()
    if (checkErr) throw checkErr
    if (existing?.id) {
      return { success: false, error: 'JÃ¡ existe um modelo de e-mail com esse nome.' }
    }

    if (templateData.id) {
      const { error } = await supabaseAdmin
        .from('email_templates')
        .update({
          name: normalizedName,
          subject: templateData.subject,
          body: templateData.body
        })
        .eq('id', templateData.id)
      if (error) throw error
    } else {
      const { error } = await supabaseAdmin
        .from('email_templates')
        .insert({
          name: normalizedName,
          subject: templateData.subject,
          body: templateData.body
        })
      if (error) throw error
    }

    revalidatePath('/rh/parceiros/config/templates')
    revalidatePath('/rh/parceiros/config/emails')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao salvar template de e-mail:', error)
    return { success: false, error: error.message }
  }
}

export async function getWhatsappTemplates() {
  try {
    await requirePermission('scp-whatsapp')

    const { data, error } = await supabaseAdmin
      .from('whatsapp_templates')
      .select('*')
      .order('name')

    if (error) throw error
    return { success: true, templates: data || [] }
  } catch (error: any) {
    console.error('Erro ao buscar templates de WhatsApp:', error)
    return { success: false, error: error.message }
  }
}

export async function saveWhatsappTemplate(templateData: {
  id?: string
  name: string
  body: string
}) {
  try {
    await requirePermission('scp-whatsapp', templateData.id ? 'can_edit' : 'can_include')

    if (templateData.id) {
      const { error } = await supabaseAdmin
        .from('whatsapp_templates')
        .update({ name: templateData.name, body: templateData.body })
        .eq('id', templateData.id)
      if (error) throw error
    } else {
      const { error } = await supabaseAdmin
        .from('whatsapp_templates')
        .insert({ name: templateData.name, body: templateData.body })
      if (error) throw error
    }

    revalidatePath('/rh/parceiros/config/whatsapp')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao salvar template de WhatsApp:', error)
    if (String(error?.message || '').includes("Could not find the 'whatsapp_templates'")) {
      return {
        success: false,
        error:
          "Sua tabela 'whatsapp_templates' ainda não existe. Aplique as migrations do Supabase e recarregue o schema cache da API.",
      }
    }
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
    await requirePermission('scp-crm', 'can_edit')

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
