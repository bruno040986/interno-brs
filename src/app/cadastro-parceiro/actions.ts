'use server'

import { createClient } from '@supabase/supabase-js'

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

// =========================================================================
// 1. Obter Formulário Ativo
// =========================================================================

export async function getActiveForm() {
  try {
    const { data, error } = await supabaseAdmin
      .from('partner_forms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { success: true, form: data }
  } catch (error: any) {
    console.error('Erro ao buscar formulário ativo:', error)
    return { success: false, error: error.message }
  }
}

export async function getFormBySlug(slug: string) {
  try {
    const normalized = String(slug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!normalized) return { success: true, form: null }

    const { data, error } = await supabaseAdmin
      .from('partner_forms')
      .select('*')
      .eq('slug', normalized)
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { success: true, form: data }
  } catch (error: any) {
    console.error('Erro ao buscar formulÃ¡rio por slug:', error)
    return { success: false, error: error.message }
  }
}

// =========================================================================
// 2. Fazer Upload de Arquivo
// =========================================================================

async function ensureBucketExists(bucketName: string) {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const exists = buckets?.some(b => b.name === bucketName)
    if (!exists) {
      const { error } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      })
      if (error) console.error('Erro ao criar bucket:', error)
    }
  } catch (err) {
    console.error('Erro ao verificar/criar bucket:', err)
  }
}

export async function uploadPartnerFile(
  cpfCnpj: string,
  fileName: string,
  base64Data: string
) {
  try {
    const bucketName = 'partner-documents'
    await ensureBucketExists(bucketName)

    const buffer = Buffer.from(base64Data, 'base64')
    const cleanedCpfCnpj = cpfCnpj.replace(/\D/g, '')
    const filePath = `${cleanedCpfCnpj}/${Date.now()}_${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: getMimeType(fileName),
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return { success: true, publicUrl }
  } catch (error: any) {
    console.error('Erro no upload do arquivo do parceiro:', error)
    return { success: false, error: error.message }
  }
}

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf': return 'application/pdf'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'png': return 'image/png'
    default: return 'application/octet-stream'
  }
}

// =========================================================================
// 3. Enviar Registro de Parceiro
// =========================================================================

export async function submitPartnerRegistration(payload: {
  form_id: string
  person_type: 'PF' | 'PJ'
  cpf_cnpj: string
  name: string
  fantasy_name?: string
  representante_legal?: string
  rg?: string
  rg_expedition_date?: string
  rg_issuer?: string
  rg_state?: string
  birth_date?: string
  
  // Endereço
  cep?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  
  // Contatos
  phone_whatsapp: string
  phone_whatsapp_financeiro?: string
  phone_commercial?: string
  phone_residential?: string
  phone_support?: string
  email_comissao: string
  email_informe?: string
  email_formalizacao?: string
  email_proposta?: string
  email_mesa_liberacao?: string
  email_juridico?: string
  email_proprio_cunho?: string
  
  // Dados Bancários
  commission_receive_type?: string
  bank_code?: string
  bank_name?: string
  bank_agency?: string
  bank_account?: string
  bank_account_type?: string
  pix_type?: string
  pix_key?: string
  
  // Respostas Dinâmicas Extras
  additional_data?: any
}) {
  try {
    // Insere o parceiro com status inicial 'novo'
    const { data, error } = await supabaseAdmin
      .from('agentes_parceiros')
      .insert({
        ...payload,
        status: 'novo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Enviar notificação opcional para WhatsApp / E-mail se configurados
    // (Faremos essa lógica na fase de automações)

    return { success: true, partner: data }
  } catch (error: any) {
    console.error('Erro ao salvar cadastro do parceiro:', error)
    return { success: false, error: error.message }
  }
}
