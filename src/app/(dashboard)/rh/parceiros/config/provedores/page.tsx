'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/rh/parceiros/config/provedores/email')
  }, [router])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <span className="spinner" style={{ borderTopColor: 'var(--brs-navy)' }} />
    </div>
  )
}
