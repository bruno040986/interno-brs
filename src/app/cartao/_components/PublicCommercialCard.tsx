import {
  ArrowRight,
  Banknote,
  BadgeInfo,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ContactRound,
  ExternalLink,
  FileText,
  Globe2,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
  Contact,
  MonitorSmartphone,
  Camera,
  Ticket,
  Search,
  FileSearch,
  Briefcase,
  Megaphone,
  FolderOpen,
  Star,
  BadgeDollarSign,
  MessageSquareMore,
  Target,
  ScanLine,
  BadgeCheck,
  X as XIcon,
  AtSign,
} from 'lucide-react'
import { normalizeExternalLink, type CommercialCompanyLinksProfile } from '@/lib/commercial-card'
import type { PublicCommercialCardData, PublicCommercialCardLink } from '@/lib/commercial-card-public'

type PublicCommercialCardProps = {
  slug: string
  entity: PublicCommercialCardData['entity']
  companyProfile: CommercialCompanyLinksProfile | null
  linkedUser: PublicCommercialCardData['linkedUser']
  cardLinks: PublicCommercialCardLink[]
  parent: PublicCommercialCardData['parent']
  superior: PublicCommercialCardData['superior']
  mode?: 'card' | 'links'
}

type SocialLinkEntry = {
  label: string
  value: string
  href: string
  icon: LucideIcon
}

type AppLinkEntry = {
  label: string
  value: string
  href: string
  icon: LucideIcon
}

function getRoleLabel(role: PublicCommercialCardData['entity']['role'], sex: string) {
  const female = String(sex || '').trim().toLowerCase() === 'f'
  if (role === 'superintendente') return 'Superintendente Comercial'
  if (role === 'supervisor') return female ? 'Supervisora Comercial' : 'Supervisor Comercial'
  return female ? 'Supervisora Comercial' : 'Gerente Comercial'
}

function getSupportRoleLabel(role: PublicCommercialCardData['entity']['role'], sex: string) {
  const female = String(sex || '').trim().toLowerCase() === 'f'
  if (role === 'superintendente') return 'Fale com o meu superintendente comercial'
  if (role === 'supervisor') return female ? 'Fale com a minha supervisora comercial' : 'Fale com o meu supervisor comercial'
  return female ? 'Fale com a minha supervisora comercial' : 'Fale com o meu supervisor comercial'
}

function getPublicCardUrl(slug?: string | null) {
  const safeSlug = String(slug || '').trim().toLowerCase()
  if (!safeSlug) return ''
  return `https://${safeSlug}.brspromotora.com.br`
}

function getWhatsAppLink(value: string) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  return `https://wa.me/55${digits}`
}

function getCardLinkIcon(iconKey: string): LucideIcon {
  const key = String(iconKey || 'link').trim().toLowerCase()
  const registry: Record<string, LucideIcon> = {
    link: Link2,
    globe: Globe2,
    mail: Mail,
    phone: Phone,
    message: MessageCircle,
    'message-square': MessageSquareMore,
    file: FileText,
    book: BadgeInfo,
    megaphone: Megaphone,
    users: Users,
    qr: QrCode,
    external: ExternalLink,
    more: ChevronDown,
    home: Sparkles,
    search: Search,
    calendar: CalendarDays,
    shield: ShieldCheck,
    bank: Banknote,
    briefcase: Briefcase,
    building: Building2,
    camera: ContactRound,
    car: MonitorSmartphone,
    check: BadgeCheck,
    clock: BadgeInfo,
    cloud: BadgeInfo,
    code: BadgeInfo,
    card: BadgeDollarSign,
    download: ArrowRight,
    folder: FolderOpen,
    gift: Star,
    heart: Star,
    image: Contact,
    info: BadgeInfo,
    key: BadgeCheck,
    lock: ShieldCheck,
    pin: MapPin,
    menu: ChevronDown,
    notebook: FileText,
    package: FolderOpen,
    palette: Sparkles,
    paperclip: Link2,
    play: ExternalLink,
    printer: FileText,
    rocket: Sparkles,
    scan: ScanLine,
    share: ExternalLink,
    settings: BadgeInfo,
    shop: Building2,
    sparkles: Sparkles,
    star: Star,
    tag: Ticket,
    target: Target,
    ticket: Ticket,
    timer: BadgeInfo,
    trend: BadgeInfo,
    user: ContactRound,
    wifi: BadgeInfo,
    wrench: BadgeInfo,
    x: XIcon,
    threads: AtSign,
    bell: BadgeInfo,
    bookmark: BadgeCheck,
    flag: BadgeInfo,
    instagram: Camera,
    facebook: Globe2,
    linkedin: Briefcase,
    youtube: MonitorSmartphone,
  }
  return registry[key] || Link2
}

function normalizeSocialUrl(value: string) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  return normalizeExternalLink(trimmed)
}

function getSocialEntries(cardData: Record<string, any>): SocialLinkEntry[] {
  const entries = [
    { key: 'show_instagram', label: 'Instagram', value: cardData.instagram || '', icon: Camera },
    { key: 'show_facebook', label: 'Facebook', value: cardData.facebook || '', icon: Globe2 },
    { key: 'show_linkedin', label: 'LinkedIn', value: cardData.linkedin || '', icon: Briefcase },
    { key: 'show_tiktok', label: 'TikTok', value: cardData.tiktok || '', icon: MessageCircle },
    { key: 'show_threads', label: 'Threads', value: cardData.threads || '', icon: AtSign },
    { key: 'show_x', label: 'X', value: cardData.x || '', icon: XIcon },
    { key: 'show_youtube', label: 'YouTube', value: cardData.youtube || '', icon: MonitorSmartphone },
    { key: 'show_community', label: 'Comunidade WhatsApp', value: cardData.community || '', icon: MessageCircle },
  ]

  return entries
    .filter((entry) => !!cardData?.[entry.key])
    .map((entry) => ({
      label: entry.label,
      value: String(entry.value || '').trim(),
      href: normalizeSocialUrl(String(entry.value || '')),
      icon: entry.icon,
    }))
}

function getCompanySocialEntries(companyProfile: CommercialCompanyLinksProfile | null): AppLinkEntry[] {
  const data = companyProfile?.company_data || {}
  return [
    { label: 'Instagram', value: String(data.instagram || '').trim(), href: normalizeExternalLink(String(data.instagram || '')), icon: Camera },
    { label: 'Facebook', value: String(data.facebook || '').trim(), href: normalizeExternalLink(String(data.facebook || '')), icon: Globe2 },
    { label: 'LinkedIn', value: String(data.linkedin || '').trim(), href: normalizeExternalLink(String(data.linkedin || '')), icon: Briefcase },
    { label: 'TikTok', value: String(data.tiktok || '').trim(), href: normalizeExternalLink(String(data.tiktok || '')), icon: MessageCircle },
    { label: 'YouTube', value: String(data.youtube || '').trim(), href: normalizeExternalLink(String(data.youtube || '')), icon: MonitorSmartphone },
    { label: 'Comunidade WhatsApp', value: String(data.whatsapp_community || '').trim(), href: normalizeExternalLink(String(data.whatsapp_community || '')), icon: MessageCircle },
  ].filter((item) => !!item.value)
}

function getSupportEntries(companyProfile: CommercialCompanyLinksProfile | null): AppLinkEntry[] {
  const data = companyProfile?.company_data || {}
  const supportWhatsApp = String(data.whatsapp_support || '').trim()
  const supportEmail = String(data.email_support || '').trim()
  const items: AppLinkEntry[] = []

  if (supportWhatsApp) {
    items.push({
      label: 'WhatsApp Suporte',
      value: supportWhatsApp,
      href: getWhatsAppLink(supportWhatsApp) || normalizeExternalLink(supportWhatsApp),
      icon: Phone,
    })
  }

  if (supportEmail) {
    items.push({
      label: 'E-mail Suporte',
      value: supportEmail,
      href: normalizeExternalLink(`mailto:${supportEmail}`),
      icon: Mail,
    })
  }

  return items
}

function getSiteEntry(companyProfile: CommercialCompanyLinksProfile | null): AppLinkEntry | null {
  const site = String(companyProfile?.company_data?.site || '').trim()
  if (!site) return null
  return {
    label: 'Site',
    value: site,
    href: normalizeExternalLink(site),
    icon: Globe2,
  }
}

function getRelationLinks(
  parent: PublicCommercialCardData['parent'],
  superior: PublicCommercialCardData['superior'],
) {
  const items: Array<{ label: string; href: string; subtitle: string; icon: LucideIcon }> = []

  const parentSlug = String(parent?.commercial_slug || '').trim()
  const parentSex = String(parent?.cadastral_data?.sex || '').trim()
  if (parentSlug) {
    items.push({
      label: getSupportRoleLabel(parent?.role || 'supervisor', parentSex),
      subtitle: parent?.name || 'Contato vinculado',
      href: getPublicCardUrl(parentSlug),
      icon: Users,
    })
  }

  const superiorSlug = String(superior?.commercial_slug || '').trim()
  const superiorSex = String(superior?.cadastral_data?.sex || '').trim()
  if (superiorSlug) {
    items.push({
      label: getSupportRoleLabel(superior?.role || 'superintendente', superiorSex),
      subtitle: superior?.name || 'Contato vinculado',
      href: getPublicCardUrl(superiorSlug),
      icon: Building2,
    })
  }

  return items
}

function AccordionSection({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      open={defaultOpen}
      style={{
        borderRadius: 24,
        background: 'rgba(255,255,255,0.88)',
        border: '1px solid rgba(45, 92, 255, 0.10)',
        boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
      }}
    >
      <summary
        style={{
          listStyle: 'none',
          cursor: 'pointer',
          padding: '1rem 1.05rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          color: '#123a77',
        }}
      >
        <div>
          <div style={{ fontSize: '0.94rem', fontWeight: 800 }}>{title}</div>
          {subtitle ? <div style={{ marginTop: 4, fontSize: '0.78rem', color: '#6b7280' }}>{subtitle}</div> : null}
        </div>
        <ChevronDown size={18} style={{ flexShrink: 0, color: '#7c8db5' }} />
      </summary>
      <div style={{ padding: '0 1rem 1rem' }}>{children}</div>
    </details>
  )
}

function LinkRow({
  label,
  value,
  href,
  icon: Icon,
  muted,
}: {
  label: string
  value: string
  href?: string
  icon: LucideIcon
  muted?: boolean
}) {
  const content = (
    <div
      style={{
        width: '100%',
        padding: '0.95rem 1rem',
        borderRadius: 18,
        background: muted ? 'rgba(239, 246, 255, 0.9)' : '#f8fbff',
        border: '1px solid rgba(46, 92, 255, 0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.85rem',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, rgba(45, 92, 255, 0.12), rgba(255, 93, 167, 0.12))',
            color: '#123a77',
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: '#123a77' }}>{label}</div>
          <div
            style={{
              marginTop: 4,
              fontSize: '0.84rem',
              color: value ? '#55627a' : '#9aa7c2',
              wordBreak: 'break-word',
            }}
          >
            {value || 'Sem vínculo'}
          </div>
        </div>
      </div>
      <ArrowRight size={16} color="#98a8c7" style={{ flexShrink: 0 }} />
    </div>
  )

  if (!href || !value) {
    return content
  }

  return (
    <a href={href} target={href.startsWith('/') ? undefined : '_blank'} rel={href.startsWith('/') ? undefined : 'noopener noreferrer'} style={{ textDecoration: 'none' }}>
      {content}
    </a>
  )
}

function QuickActionCard({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        border: '1px solid rgba(46, 92, 255, 0.10)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,248,255,0.96))',
        padding: '1rem',
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '0.55rem',
        boxShadow: '0 14px 35px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 16,
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(135deg, rgba(45, 92, 255, 0.12), rgba(255, 93, 167, 0.12))',
          color: '#123a77',
        }}
      >
        <Icon size={20} />
      </div>
      <div style={{ fontWeight: 800, color: '#123a77', fontSize: '1rem' }}>{title}</div>
      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{subtitle}</div>
    </div>
  )
}

export default function PublicCommercialCard({
  slug,
  entity,
  companyProfile,
  linkedUser,
  cardLinks,
  parent,
  superior,
  mode = 'card',
}: PublicCommercialCardProps) {
  const cardData = (entity.card_data || {}) as Record<string, any>
  const name = String(entity.cadastral_data?.commercial_name || entity.cadastral_data?.full_name || entity.name || 'Cartao Virtual').trim()
  const role = getRoleLabel(entity.role, String(entity.cadastral_data?.sex || ''))
  const whatsapp = String(entity.cadastral_data?.phone_whatsapp || entity.phone_whatsapp || '').trim()
  const email = String(entity.cadastral_data?.email_professional || entity.email_comissao || '').trim()
  const socials = getSocialEntries(cardData)
  const supportEntries = getSupportEntries(companyProfile)
  const companySocialEntries = getCompanySocialEntries(companyProfile)
  const siteEntry = getSiteEntry(companyProfile)
  const relationEntries = getRelationLinks(parent, superior)
  const companyDomain = `${slug}.brspromotora.com.br`
  const isLinksMode = mode === 'links'
  const companyNickname = String(companyProfile?.nickname || 'BRS Promotora').trim()
  const companyLegal = '@ BRS Promotora de Vendas Ltda - CNPJ 54.303.453/0001-16. Todos os direitos reservados.'

  const heroAvatar = linkedUser?.avatar_url ? (
    <img
      src={linkedUser.avatar_url}
      alt={name}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  ) : (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        color: '#123a77',
        fontSize: '1.1rem',
        fontWeight: 900,
        background: 'linear-gradient(180deg, rgba(245,248,255,0.98), rgba(233,240,255,0.98))',
      }}
    >
      {(linkedUser?.name || name)
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')}
    </div>
  )

  return (
    <main
      style={{
        minHeight: '100vh',
        color: '#102040',
        background:
          'radial-gradient(circle at top left, rgba(45,92,255,0.12), transparent 24%), radial-gradient(circle at top right, rgba(255,93,167,0.14), transparent 20%), radial-gradient(circle at bottom left, rgba(18,223,255,0.10), transparent 26%), linear-gradient(180deg, #f7f9ff 0%, #eef3ff 50%, #f9fbff 100%)',
        padding: '24px 16px 40px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1320, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <img
              src="/logotipos/BRS%20PROMOTORA%20LOGO%20DEGRADE%20COM%20LETRA%20PRETA%20SEM%20FUNDO.png"
              alt="BRS Workspace"
              style={{ width: 220, height: 'auto', display: 'block' }}
            />
            <div
              style={{
                minHeight: 72,
                padding: '0.8rem 1rem',
                borderRadius: 22,
                background: 'rgba(255,255,255,0.78)',
                border: '1px solid rgba(45, 92, 255, 0.12)',
                boxShadow: '0 16px 32px rgba(15, 23, 42, 0.05)',
                display: 'grid',
                alignContent: 'center',
              }}
            >
              <div style={{ color: '#7c8db5', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.7rem', fontWeight: 700 }}>
                BRS Promotora
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#123a77' }}>Cartao Virtual</div>
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.82)',
              border: '1px solid rgba(45, 92, 255, 0.12)',
              boxShadow: '0 16px 32px rgba(15, 23, 42, 0.05)',
              minWidth: 240,
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#7c8db5', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
              Link publico
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#123a77', wordBreak: 'break-word' }}>{companyDomain}</div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isLinksMode ? '1fr' : 'minmax(0, 520px) minmax(0, 1fr)',
            gap: 18,
            alignItems: 'start',
          }}
        >
          {!isLinksMode ? (
            <section
              style={{
                borderRadius: 30,
                background: 'rgba(255,255,255,0.88)',
                border: '1px solid rgba(45, 92, 255, 0.12)',
                boxShadow: '0 22px 60px rgba(15, 23, 42, 0.08)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 'auto -50px -90px auto',
                  width: 200,
                  height: 200,
                  borderRadius: 999,
                  background: 'radial-gradient(circle, rgba(255,93,167,0.14), transparent 65%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '-70px auto auto -60px',
                  width: 220,
                  height: 220,
                  borderRadius: 999,
                  background: 'radial-gradient(circle, rgba(45,92,255,0.14), transparent 65%)',
                  pointerEvents: 'none',
                }}
              />

              <div style={{ padding: '1.15rem 1.15rem 1rem', borderBottom: '1px solid rgba(45, 92, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#7c8db5', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                      {companyNickname}
                    </div>
                    <div style={{ fontSize: '1.02rem', fontWeight: 900, color: '#123a77' }}>Cartao virtual responsivo</div>
                  </div>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 999,
                      background: 'linear-gradient(135deg, #2d5cff, #ff5da7 55%, #12dfff)',
                      boxShadow: '0 8px 20px rgba(45,92,255,0.22)',
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: '1.15rem', display: 'grid', gap: '1.05rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: 'min(100%, 300px)',
                      aspectRatio: '1 / 1',
                      borderRadius: 999,
                      padding: 6,
                      background: 'linear-gradient(135deg, #12dfff 0%, #2d5cff 45%, #ff5da7 100%)',
                      boxShadow: '0 18px 40px rgba(45, 92, 255, 0.12)',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 999,
                        overflow: 'hidden',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(240,244,255,0.92))',
                      }}
                    >
                      {heroAvatar}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', paddingInline: 4 }}>
                  <div style={{ fontSize: 'clamp(1.75rem, 4vw, 2.6rem)', lineHeight: 1.05, fontWeight: 900, color: '#102040' }}>
                    {name}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 999,
                      background: 'linear-gradient(135deg, rgba(45,92,255,0.12), rgba(255,93,167,0.12))',
                      color: '#2d5cff',
                      fontWeight: 900,
                      letterSpacing: '0.08em',
                      fontSize: '0.8rem',
                    }}
                  >
                    {role}
                  </div>
                  <div style={{ marginTop: 12, fontSize: '0.98rem', color: '#5b6984', lineHeight: 1.6 }}>
                    Cartao responsivo para bio, WhatsApp Business e envio rapido
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  <a
                    href={whatsapp ? getWhatsAppLink(whatsapp) : '#'}
                    target={whatsapp ? '_blank' : undefined}
                    rel={whatsapp ? 'noopener noreferrer' : undefined}
                    style={{
                      borderRadius: 22,
                      padding: '1rem 1rem',
                      background: 'linear-gradient(135deg, #12dfff 0%, #2d5cff 100%)',
                      color: '#08111f',
                      textDecoration: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.85rem',
                      boxShadow: '0 16px 35px rgba(18, 223, 255, 0.18)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 16,
                          display: 'grid',
                          placeItems: 'center',
                          background: 'rgba(255,255,255,0.22)',
                          color: '#08111f',
                          flexShrink: 0,
                        }}
                      >
                        <MessageCircle size={22} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: '1.02rem' }}>WhatsApp</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.86, wordBreak: 'break-word' }}>
                          {whatsapp || 'WhatsApp comercial'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={18} style={{ flexShrink: 0 }} />
                  </a>

                  <a
                    href={email ? `mailto:${email}` : '#'}
                    style={{
                      borderRadius: 22,
                      padding: '1rem 1rem',
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid rgba(45, 92, 255, 0.14)',
                      color: '#102040',
                      textDecoration: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.85rem',
                      boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 16,
                          display: 'grid',
                          placeItems: 'center',
                          background: 'linear-gradient(135deg, rgba(45,92,255,0.12), rgba(255,93,167,0.12))',
                          color: '#123a77',
                          flexShrink: 0,
                        }}
                      >
                        <Mail size={20} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: '1.02rem' }}>E-mail Profissional</div>
                        <div style={{ fontSize: '0.8rem', color: '#5b6984', wordBreak: 'break-word' }}>
                          {email || 'email@brspromotora.com.br'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={18} color="#9aa7c2" style={{ flexShrink: 0 }} />
                  </a>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 12,
                  }}
                >
                  {socials.map((social) => {
                    const Icon = social.icon
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          borderRadius: 20,
                          padding: '0.95rem 0.95rem',
                          background: 'rgba(255,255,255,0.96)',
                          border: '1px solid rgba(45, 92, 255, 0.10)',
                          color: '#102040',
                          textDecoration: 'none',
                          display: 'grid',
                          gap: 8,
                          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)',
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 14,
                            display: 'grid',
                            placeItems: 'center',
                            background: 'linear-gradient(135deg, rgba(45,92,255,0.12), rgba(255,93,167,0.12))',
                            color: '#123a77',
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '0.92rem' }}>{social.label}</div>
                          <div style={{ marginTop: 4, fontSize: '0.76rem', color: '#5b6984', wordBreak: 'break-word' }}>
                            {social.value || social.label}
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  <QuickActionCard icon={ContactRound} title="Salvar Contato" subtitle="VCF" />
                  <QuickActionCard icon={QrCode} title="QR Code" subtitle="Escanear perfil" />
                </div>
              </div>
            </section>
          ) : null}

          <section
            style={{
              borderRadius: 30,
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(45, 92, 255, 0.10)',
              boxShadow: '0 22px 60px rgba(15, 23, 42, 0.06)',
              padding: '1rem',
              display: 'grid',
              gap: '0.85rem',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#7c8db5', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                  {isLinksMode ? 'Links da empresa' : 'Acordions do cartão'}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#123a77' }}>
                  {isLinksMode ? 'Organização dos links do preview' : 'Seções e atalhos do cartão digital'}
                </div>
              </div>
              <div
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, rgba(45,92,255,0.12), rgba(255,93,167,0.12))',
                  color: '#2d5cff',
                  fontWeight: 900,
                  fontSize: '0.76rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Preview
              </div>
            </div>

            <AccordionSection title="Suporte Operacional" subtitle="Canal direto de atendimento" defaultOpen>
              <div style={{ display: 'grid', gap: 10 }}>
                {supportEntries.length ? (
                  supportEntries.map((entry) => (
                    <LinkRow key={entry.label} label={entry.label} value={entry.value} href={entry.href} icon={entry.icon} />
                  ))
                ) : (
                  <div style={{ padding: '0.95rem 1rem', borderRadius: 18, background: '#f8fbff', border: '1px solid rgba(46, 92, 255, 0.10)', color: '#7c8db5' }}>
                    Nenhum contato de suporte vinculado.
                  </div>
                )}
              </div>
            </AccordionSection>

            <AccordionSection title="Site" subtitle="Portal oficial da BRS Promotora">
              {siteEntry ? (
                <LinkRow label={siteEntry.label} value={siteEntry.value} href={siteEntry.href} icon={siteEntry.icon} />
              ) : (
                <div style={{ padding: '0.95rem 1rem', borderRadius: 18, background: '#f8fbff', border: '1px solid rgba(46, 92, 255, 0.10)', color: '#7c8db5' }}>
                  Site nao vinculado.
                </div>
              )}
            </AccordionSection>

            <AccordionSection title="Redes Sociais da BRS" subtitle="Perfis oficiais da empresa">
              <div style={{ display: 'grid', gap: 10 }}>
                {companySocialEntries.length ? (
                  companySocialEntries.map((entry) => (
                    <LinkRow key={entry.label} label={entry.label} value={entry.value} href={entry.href} icon={entry.icon} />
                  ))
                ) : (
                  <div style={{ padding: '0.95rem 1rem', borderRadius: 18, background: '#f8fbff', border: '1px solid rgba(46, 92, 255, 0.10)', color: '#7c8db5' }}>
                    Nenhuma rede social da empresa vinculada.
                  </div>
                )}
              </div>
            </AccordionSection>

            <AccordionSection
              title="Instituições Financeiras"
              subtitle="Em breve vamos conectar os sistemas dos bancos e fintechs"
            >
              <div style={{ padding: '1rem', borderRadius: 18, background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,248,255,0.96))', border: '1px dashed rgba(46, 92, 255, 0.18)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'linear-gradient(135deg, rgba(45,92,255,0.12), rgba(255,93,167,0.12))',
                      color: '#123a77',
                      flexShrink: 0,
                    }}
                  >
                    <BadgeInfo size={18} />
                  </div>
                  <div style={{ color: '#52617a', lineHeight: 1.7 }}>
                    Em breve o link dos sistemas de bancos, financeiras e fintechs estara aqui para facilitar o seu dia a dia.
                  </div>
                </div>
              </div>
            </AccordionSection>

            <AccordionSection title="Averbadores" subtitle="Em breve os sistemas dos averbadores">
              <div style={{ padding: '1rem', borderRadius: 18, background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,248,255,0.96))', border: '1px dashed rgba(46, 92, 255, 0.18)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'linear-gradient(135deg, rgba(45,92,255,0.12), rgba(255,93,167,0.12))',
                      color: '#123a77',
                      flexShrink: 0,
                    }}
                  >
                    <FileSearch size={18} />
                  </div>
                  <div style={{ color: '#52617a', lineHeight: 1.7 }}>
                    Em breve o link dos sistemas de averbadores estara aqui para facilitar o seu dia a dia.
                  </div>
                </div>
              </div>
            </AccordionSection>

            <AccordionSection title="Links da BRS Promotora" subtitle="Atalhos configurados no menu do subsistema">
              <div style={{ display: 'grid', gap: 10 }}>
                {cardLinks.length ? (
                  cardLinks.map((link) => {
                    const Icon = getCardLinkIcon(link.icon_key)
                    return (
                      <a
                        key={link.id}
                        href={normalizeExternalLink(link.destination_url)}
                        target={normalizeExternalLink(link.destination_url).startsWith('/') ? undefined : '_blank'}
                        rel={normalizeExternalLink(link.destination_url).startsWith('/') ? undefined : 'noopener noreferrer'}
                        style={{
                          textDecoration: 'none',
                          borderRadius: 18,
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,248,255,0.96))',
                          border: '1px solid rgba(46, 92, 255, 0.10)',
                          padding: '0.95rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 14,
                              display: 'grid',
                              placeItems: 'center',
                              background: 'linear-gradient(135deg, rgba(45,92,255,0.12), rgba(255,93,167,0.12))',
                              color: '#123a77',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 900, color: '#123a77' }}>{link.name}</div>
                            <div style={{ marginTop: 4, fontSize: '0.82rem', color: '#56637c', wordBreak: 'break-word' }}>
                              {link.destination_url}
                            </div>
                          </div>
                        </div>
                        <ExternalLink size={16} color="#98a8c7" style={{ flexShrink: 0 }} />
                      </a>
                    )
                  })
                ) : (
                  <div style={{ padding: '0.95rem 1rem', borderRadius: 18, background: '#f8fbff', border: '1px solid rgba(46, 92, 255, 0.10)', color: '#7c8db5' }}>
                    Nenhum link cadastrado ainda.
                  </div>
                )}
              </div>
            </AccordionSection>

            {relationEntries.length ? (
              <AccordionSection title="Relacionamentos Comerciais" subtitle="Acesso para supervisor e superintendente">
                <div style={{ display: 'grid', gap: 10 }}>
                  {relationEntries.map((entry) => {
                    const Icon = entry.icon
                    return (
                      <a
                        key={entry.href}
                        href={entry.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: 'none',
                          borderRadius: 18,
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,248,255,0.96))',
                          border: '1px solid rgba(46, 92, 255, 0.10)',
                          padding: '0.95rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 14,
                              display: 'grid',
                              placeItems: 'center',
                              background: 'linear-gradient(135deg, rgba(45,92,255,0.12), rgba(255,93,167,0.12))',
                              color: '#123a77',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 900, color: '#123a77' }}>{entry.label}</div>
                            <div style={{ marginTop: 4, fontSize: '0.82rem', color: '#56637c', wordBreak: 'break-word' }}>
                              {entry.subtitle}
                            </div>
                          </div>
                        </div>
                        <ExternalLink size={16} color="#98a8c7" style={{ flexShrink: 0 }} />
                      </a>
                    )
                  })}
                </div>
              </AccordionSection>
            ) : null}

            <div
              style={{
                marginTop: 4,
                padding: '1rem',
                borderRadius: 24,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,248,255,0.92))',
                border: '1px solid rgba(45, 92, 255, 0.10)',
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.04)',
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <img
                  src="/logotipos/BRS%20PROMOTORA%20LOGO%20DEGRADE%20COM%20LETRA%20PRETA%20SEM%20FUNDO.png"
                  alt="BRS Promotora"
                  style={{ width: 150, height: 'auto', display: 'block' }}
                />
                <div style={{ color: '#52617a', lineHeight: 1.7, fontSize: '0.92rem' }}>
                  {companyLegal}
                  <br />
                  Politica de Privacidade | Termos de Uso | LGPD
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#7c8db5',
                  paddingTop: 4,
                  borderTop: '1px solid rgba(45, 92, 255, 0.08)',
                }}
              >
                O layout ainda esta em refinamento visual, mas ja usa os dados reais do cadastro para validar a experiencia.
              </div>
            </div>
          </section>
        </div>

        {isLinksMode ? (
          <div
            style={{
              marginTop: 18,
              padding: '0.95rem 1rem',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(45, 92, 255, 0.10)',
              color: '#52617a',
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.04)',
            }}
          >
            A visao de links esta pronta para testes e o mesmo conjunto de dados vai alimentar o cartão definitivo quando o layout final for fechado.
          </div>
        ) : null}
      </div>
    </main>
  )
}
