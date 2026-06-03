import Link from 'next/link'
import { buildCommercialCardLinks, type CommercialCompanyLinksProfile } from '@/lib/commercial-card'
import type { PublicCommercialCardData } from '@/lib/commercial-card-public'

type PublicCommercialCardProps = {
  slug: string
  entity: PublicCommercialCardData['entity']
  companyProfile: CommercialCompanyLinksProfile | null
  linkedUser: PublicCommercialCardData['linkedUser']
  mode?: 'card' | 'links'
}

function normalizeExternalLink(value: string) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function getRoleLabel(role: PublicCommercialCardData['entity']['role'], sex: string) {
  const female = String(sex || '').trim().toLowerCase() === 'f'
  if (role === 'superintendente') return 'Superintendente Comercial'
  if (role === 'supervisor') return female ? 'Supervisora Comercial' : 'Supervisor Comercial'
  return female ? 'Supervisora Comercial' : 'Gerente Comercial'
}

function getSocialEntries(cardData: Record<string, any>) {
  const entries = [
    { key: 'show_linkedin', label: 'LinkedIn', value: cardData.linkedin || '' },
    { key: 'show_instagram', label: 'Instagram', value: cardData.instagram || '' },
    { key: 'show_facebook', label: 'Facebook', value: cardData.facebook || '' },
    { key: 'show_tiktok', label: 'TikTok', value: cardData.tiktok || '' },
    { key: 'show_youtube', label: 'Canal do YouTube', value: cardData.youtube || '' },
    { key: 'show_community', label: 'Comunidade WhatsApp', value: cardData.community || '' },
  ]

  return entries.filter((entry) => !!cardData?.[entry.key]).map((entry) => ({
    ...entry,
    href: normalizeExternalLink(String(entry.value || '')),
  }))
}

function ActionTile({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      style={{
        minHeight: 96,
        borderRadius: 18,
        padding: '0.9rem',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        textAlign: 'center',
      }}
    >
      <div style={{ fontWeight: 800, color: '#fff' }}>{title}</div>
      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{subtitle}</div>
    </div>
  )
}

function LinkRow({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  return (
    <div
      style={{
        padding: '0.8rem 0.9rem',
        borderRadius: 16,
        background: 'rgba(18, 223, 255, 0.08)',
        border: '1px solid rgba(18, 223, 255, 0.16)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <span style={{ fontWeight: 700 }}>{label}</span>
      {href ? (
        <a
          href={href}
          target={href.startsWith('/') ? undefined : '_blank'}
          rel={href.startsWith('/') ? undefined : 'noopener noreferrer'}
          style={{ color: '#12dfff', textDecoration: 'none', textAlign: 'right', fontSize: '0.9rem' }}
        >
          {value}
        </a>
      ) : (
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>Sem vínculo</span>
      )}
    </div>
  )
}

export default function PublicCommercialCard({
  slug,
  entity,
  companyProfile,
  linkedUser,
  mode = 'card',
}: PublicCommercialCardProps) {
  const companyLinks = buildCommercialCardLinks(companyProfile, slug)
  const cardData = (entity.card_data || {}) as Record<string, any>
  const name = String(entity.cadastral_data?.commercial_name || entity.cadastral_data?.full_name || entity.name || 'Cartão Virtual').trim()
  const role = getRoleLabel(entity.role, String(entity.cadastral_data?.sex || ''))
  const whatsapp = String(entity.cadastral_data?.phone_whatsapp || entity.phone_whatsapp || '').trim()
  const email = String(entity.cadastral_data?.email_professional || entity.email_comissao || '').trim()
  const socials = getSocialEntries(cardData)
  const companyDomain = `${slug}.brspromotora.com.br`
  const isLinksMode = mode === 'links'

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(18, 223, 255, 0.15), transparent 26%), linear-gradient(180deg, #050507 0%, #0b1018 50%, #050507 100%)',
        color: '#fff',
        padding: '24px 16px 40px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 980, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '18px',
            padding: '0 4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img
              src="/logotipos/BRS%20WORKSPACE%20FUNDO%20ESCURO%20SEM%20FUNDO.png"
              alt="BRS Workspace"
              style={{ width: 128, height: 'auto', display: 'block' }}
            />
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '0.85rem' }}>
              <div style={{ color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.12em' }}>
                BRS Promotora
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Cartão Virtual</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)' }}>Link público</div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{companyDomain}</div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isLinksMode ? '1fr' : 'minmax(0, 1fr) minmax(280px, 380px)',
            gap: '18px',
            alignItems: 'start',
          }}
        >
          {!isLinksMode ? (
            <section
              style={{
                borderRadius: 28,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.32)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '1rem 1rem 0.65rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.52)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {companyProfile?.nickname || 'BRS Promotora'}
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800 }}>Cartão virtual responsivo</div>
                  </div>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 999,
                      border: '2px solid #12dfff',
                      background: 'linear-gradient(135deg, #ff3b8b, #2d7cff)',
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.95rem' }}>
                  <div
                    style={{
                      width: 180,
                      height: 180,
                      borderRadius: 999,
                      padding: 4,
                      background: 'linear-gradient(135deg, #12dfff, #1a84ff)',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 999,
                        overflow: 'hidden',
                        background:
                          'radial-gradient(circle at top, rgba(255,255,255,0.18), transparent 40%), linear-gradient(180deg, #181c2a, #0d1017)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.88rem',
                        color: 'rgba(255,255,255,0.72)',
                        textAlign: 'center',
                        padding: '1rem',
                      }}
                    >
                      {linkedUser?.avatar_url ? (
                        <img src={linkedUser.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{(linkedUser?.name || name).slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.1 }}>{name}</div>
                  <div style={{ marginTop: '0.3rem', color: '#12dfff', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em' }}>
                    {role}
                  </div>
                  <div style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.78)', fontSize: '0.92rem' }}>
                    Cartão responsivo para bio, WhatsApp Business e envio rápido
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <a
                    href={whatsapp ? `https://wa.me/55${whatsapp.replace(/\D/g, '')}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      borderRadius: 18,
                      padding: '0.95rem 1rem',
                      background: 'linear-gradient(135deg, #12dfff, #31a8ff)',
                      color: '#02131c',
                      textDecoration: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>WhatsApp</div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.82 }}>{whatsapp || 'WhatsApp comercial'}</div>
                    </div>
                    <div style={{ fontSize: '1.1rem', opacity: 0.75 }}>→</div>
                  </a>

                  <a
                    href={email ? `mailto:${email}` : '#'}
                    style={{
                      borderRadius: 18,
                      padding: '0.95rem 1rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                      textDecoration: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>E-mail Profissional</div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>{email || 'email@brspromotora.com.br'}</div>
                    </div>
                    <div style={{ fontSize: '1.1rem', opacity: 0.75 }}>→</div>
                  </a>

                  {socials.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        borderRadius: 18,
                        padding: '0.95rem 1rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff',
                        textDecoration: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800 }}>{social.label}</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>{social.value || social.label}</div>
                      </div>
                      <div style={{ fontSize: '1.1rem', opacity: 0.75 }}>↗</div>
                    </a>
                  ))}
                </div>

                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <ActionTile title="Salvar Contato" subtitle="VCARD" />
                  <ActionTile title="Escanear Perfil" subtitle="QR Code" />
                </div>

                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    borderRadius: 18,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        BRS Promotora
                      </div>
                      <div style={{ fontWeight: 700 }}>Links uteis da empresa</div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>{companyDomain}/links</div>
                  </div>

                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {companyLinks.map(({ label, value, href }) => (
                      <LinkRow key={label} label={label} value={value || 'Sem vínculo'} href={href} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section
            style={{
              borderRadius: 28,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.24)',
              overflow: 'hidden',
              padding: '1rem',
              display: 'grid',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {isLinksMode ? 'Links da empresa' : 'Acesso rápido'}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>
                {isLinksMode ? 'Links úteis da BRS Promotora' : 'Rotas e atalhos do cartão'}
              </div>
            </div>

            {isLinksMode ? (
              <>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  {companyProfile?.nickname
                    ? `${companyProfile.nickname}.brspromotora.com.br`
                    : `${slug}.brspromotora.com.br`}
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {companyLinks.map(({ label, value, href }) => (
                    <LinkRow key={label} label={label} value={value || 'Sem vínculo'} href={href} />
                  ))}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <Link
                    href={`/cartao/${slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.9rem 1rem',
                      borderRadius: 16,
                      background: '#12dfff',
                      color: '#02131c',
                      textDecoration: 'none',
                      fontWeight: 800,
                    }}
                  >
                    Voltar ao cartão
                  </Link>
                </div>
              </>
            ) : (
              <>
                <ActionTile title="VCARD" subtitle="Salvar contato" />
                <ActionTile title="QR Code" subtitle="Escanear perfil" />
                <Link
                  href={`/${slug}/links`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.9rem 1rem',
                    borderRadius: 16,
                    background: 'rgba(18, 223, 255, 0.12)',
                    color: '#12dfff',
                    textDecoration: 'none',
                    fontWeight: 800,
                    border: '1px solid rgba(18, 223, 255, 0.18)',
                  }}
                >
                  Abrir Links Úteis
                </Link>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
