'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'

type CopyableFieldShellProps = {
  label?: string
  helperText?: string
  className?: string
  labelClassName?: string
  kind?: 'text' | 'url' | 'email' | 'phone' | 'password'
  copyValue?: string
  displayValue?: string
  children: ReactNode | ((state: { reveal: boolean }) => ReactNode)
}

async function copyText(value: string) {
  const text = String(value ?? '')
  if (typeof navigator === 'undefined') return false

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    } catch {
      return false
    }
  }
}

export default function CopyableFieldShell({
  label,
  helperText,
  className,
  labelClassName,
  kind = 'text',
  copyValue,
  displayValue,
  children,
}: CopyableFieldShellProps) {
  const [reveal, setReveal] = useState(kind !== 'password')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (kind !== 'password') return
    setReveal(false)
  }, [kind])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(timer)
  }, [copied])

  const resolvedCopyValue = String(copyValue ?? displayValue ?? '')
  const renderedChild = typeof children === 'function' ? children({ reveal }) : children

  async function handleCopy() {
    const ok = await copyText(resolvedCopyValue)
    if (ok) setCopied(true)
  }

  return (
    <div className={className} style={{ display: 'grid', gap: '0.35rem' }}>
      {label ? (
        <label className={labelClassName || 'form-label'} style={labelClassName ? undefined : { marginBottom: 0 }}>
          {label}
        </label>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>{renderedChild}</div>

        <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.35rem', flexShrink: 0 }}>
          {kind === 'password' ? (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setReveal((current) => !current)}
              aria-label={reveal ? 'Ocultar senha' : 'Mostrar senha'}
              title={reveal ? 'Ocultar senha' : 'Mostrar senha'}
              style={{ minWidth: 42, paddingInline: '0.65rem' }}
            >
              {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          ) : null}

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleCopy}
            aria-label={label ? `Copiar ${label}` : 'Copiar valor'}
            title={label ? `Copiar ${label}` : 'Copiar valor'}
            style={{
              minWidth: 42,
              paddingInline: '0.65rem',
              borderColor: copied ? '#86efac' : undefined,
              background: copied ? '#ecfdf5' : undefined,
              color: copied ? '#047857' : undefined,
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {helperText ? (
        <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-500)' }}>{helperText}</div>
      ) : null}

      {copied ? (
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857' }}>Copiado</div>
      ) : null}
    </div>
  )
}
