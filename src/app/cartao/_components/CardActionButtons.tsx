"use client"

import { useMemo, useState } from 'react'
import { ContactRound, QrCode, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

function sanitizePhone(value: string) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

function buildVCard({
  fullName,
  phone,
  email,
  url,
}: {
  fullName: string
  phone?: string
  email?: string
  url?: string
}) {
  const name = String(fullName || '').trim()
  const parts = name.split(/\s+/).filter(Boolean)
  const familyName = parts.length > 1 ? parts[parts.length - 1] : ''
  const givenName = parts.length > 1 ? parts.slice(0, -1).join(' ') : name
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${familyName};${givenName};;;`,
    `FN:${name}`,
  ]

  const formattedPhone = sanitizePhone(phone || '')
  if (formattedPhone) {
    lines.push(`TEL;TYPE=CELL:+${formattedPhone}`)
  }

  const safeEmail = String(email || '').trim()
  if (safeEmail) {
    lines.push(`EMAIL;TYPE=INTERNET:${safeEmail}`)
  }

  const safeUrl = String(url || '').trim()
  if (safeUrl) {
    lines.push(`URL:${safeUrl}`)
  }

  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export function CardActionButtons({
  fullName,
  phone,
  email,
  cardUrl,
}: {
  fullName: string
  phone?: string
  email?: string
  cardUrl: string
}) {
  const [qrOpen, setQrOpen] = useState(false)

  const vCardText = useMemo(
    () =>
      buildVCard({
        fullName,
        phone,
        email,
        url: cardUrl,
      }),
    [cardUrl, email, fullName, phone],
  )

  const saveContact = () => {
    const blob = new Blob([vCardText], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${String(fullName || 'contato').trim().toLowerCase().replace(/\s+/g, '-')}.vcf`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <button
          type="button"
          onClick={saveContact}
          style={{
            borderRadius: 14,
            border: '1px solid rgba(45, 92, 255, 0.12)',
            background: 'rgba(255,255,255,0.88)',
            padding: '0.85rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: '0 10px 22px rgba(15, 23, 42, 0.05)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, rgba(170, 94, 199, 0.14), rgba(255, 93, 167, 0.14))',
                color: '#9d59c8',
                flexShrink: 0,
              }}
            >
              <ContactRound size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: '#111', fontSize: '0.9rem', lineHeight: 1.1 }}>Salvar Contato</div>
              <div style={{ marginTop: 2, fontSize: '0.72rem', color: '#666' }}>VCF</div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setQrOpen(true)}
          style={{
            borderRadius: 14,
            border: '1px solid rgba(45, 92, 255, 0.12)',
            background: 'rgba(255,255,255,0.88)',
            padding: '0.85rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: '0 10px 22px rgba(15, 23, 42, 0.05)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, rgba(170, 94, 199, 0.14), rgba(255, 93, 167, 0.14))',
                color: '#9d59c8',
                flexShrink: 0,
              }}
            >
              <QrCode size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: '#111', fontSize: '0.9rem', lineHeight: 1.1 }}>QR Code</div>
              <div style={{ marginTop: 2, fontSize: '0.72rem', color: '#666' }}>Escanear cartão</div>
            </div>
          </div>
        </button>
      </div>

      {qrOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setQrOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 200,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(92vw, 420px)',
              borderRadius: 22,
              background: '#fff',
              boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
              padding: 20,
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              aria-label="Fechar QR Code"
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 34,
                height: 34,
                borderRadius: 999,
                border: '1px solid rgba(0,0,0,0.12)',
                background: '#fff',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#111', marginBottom: 4 }}>QR Code</div>
            <div style={{ fontSize: '0.82rem', color: '#666', marginBottom: 16 }}>Aponte a câmera para abrir o cartão.</div>

            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                padding: 18,
                borderRadius: 20,
                background: 'linear-gradient(180deg, rgba(229,240,255,0.8), rgba(247,249,255,0.95))',
                border: '1px solid rgba(45, 92, 255, 0.12)',
              }}
            >
              <div style={{ background: '#fff', padding: 12, borderRadius: 18, boxShadow: '0 12px 30px rgba(15,23,42,0.12)' }}>
                <QRCodeSVG value={cardUrl} size={240} includeMargin level="M" fgColor="#111111" />
              </div>
            </div>

            <div style={{ marginTop: 14, fontSize: '0.8rem', color: '#555', textAlign: 'center', wordBreak: 'break-all' }}>
              {cardUrl}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
