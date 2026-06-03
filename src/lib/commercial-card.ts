export type CommercialCompanyLinksProfile = {
  nickname?: string | null
  company_data?: {
    site?: string | null
    instagram?: string | null
    facebook?: string | null
    tiktok?: string | null
    youtube?: string | null
    whatsapp_support?: string | null
    whatsapp_community?: string | null
    linkedin?: string | null
  } | null
}

export type CommercialCardLink = {
  label: string
  href: string
  value: string
}

export function normalizeExternalLink(value: string) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function buildCommercialCardLinks(companyProfile?: CommercialCompanyLinksProfile | null, cardSlug?: string) {
  const data = companyProfile?.company_data || {}
  const safeSlug = String(cardSlug || companyProfile?.nickname || '').trim().toLowerCase()

  return [
    { label: 'Comunidade WhatsApp', value: String(data.whatsapp_community || ''), href: normalizeExternalLink(String(data.whatsapp_community || '')) },
    { label: 'Instagram', value: String(data.instagram || ''), href: normalizeExternalLink(String(data.instagram || '')) },
    { label: 'LinkedIn', value: String(data.linkedin || ''), href: normalizeExternalLink(String(data.linkedin || '')) },
    { label: 'YouTube', value: String(data.youtube || ''), href: normalizeExternalLink(String(data.youtube || '')) },
    { label: 'Facebook', value: String(data.facebook || ''), href: normalizeExternalLink(String(data.facebook || '')) },
    { label: 'TikTok', value: String(data.tiktok || ''), href: normalizeExternalLink(String(data.tiktok || '')) },
    { label: 'Site', value: String(data.site || ''), href: normalizeExternalLink(String(data.site || '')) },
    {
      label: 'WhatsApp Suporte',
      value: String(data.whatsapp_support || ''),
      href: String(data.whatsapp_support || '').replace(/\D/g, '').length >= 10 ? `https://wa.me/55${String(data.whatsapp_support || '').replace(/\D/g, '')}` : normalizeExternalLink(String(data.whatsapp_support || '')),
    },
    {
      label: 'Links Uteis',
      value: safeSlug ? `${safeSlug}.brspromotora.com.br/links` : '/links',
      href: safeSlug ? `https://${safeSlug}.brspromotora.com.br/links` : '/links',
    },
  ]
}
