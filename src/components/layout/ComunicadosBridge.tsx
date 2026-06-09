'use client'

import { useEffect, useState } from 'react'

type ComunicadosOpenPayload = {
  id: string
  titulo: string
  texto_html: string
}

export function ComunicadosBridge() {
  const [active, setActive] = useState<ComunicadosOpenPayload | null>(null)
  const [markingRead, setMarkingRead] = useState(false)

  useEffect(() => {
    const onOpen = (event: Event) => {
      const payload = (event as CustomEvent<ComunicadosOpenPayload>).detail
      if (!payload?.id) return
      setActive(payload)
    }

    window.addEventListener('comunicados:open', onOpen as EventListener)
    return () => window.removeEventListener('comunicados:open', onOpen as EventListener)
  }, [])

  async function markRead() {
    if (!active || markingRead) return
    setMarkingRead(true)
    try {
      await fetch(`/api/comunicados/${active.id}/read`, { method: 'POST' })
      window.dispatchEvent(new Event('comunicados:refresh'))
      setActive(null)
    } finally {
      setMarkingRead(false)
    }
  }

  if (!active) return null

  return (
    <div className="comunicado-overlay" role="dialog" aria-modal="true" aria-label={active.titulo}>
      <div className="comunicado-postit">
        <div className="comunicado-postit-title">{active.titulo}</div>
        <div
          className="comunicado-postit-body"
          dangerouslySetInnerHTML={{ __html: active.texto_html }}
        />
        <div className="comunicado-postit-footer">
          <button className="btn btn-primary" onClick={() => void markRead()} disabled={markingRead}>
            {markingRead ? 'Registrando...' : 'Lido'}
          </button>
        </div>
      </div>
    </div>
  )
}

