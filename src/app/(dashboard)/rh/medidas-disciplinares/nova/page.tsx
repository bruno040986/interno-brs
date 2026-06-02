import { Suspense } from 'react'
import NovaMedidaPageClient from './page-client'

export default function NovaMedidaPage() {
  return (
    <Suspense fallback={<div className="page-content text-center">Carregando...</div>}>
      <NovaMedidaPageClient />
    </Suspense>
  )
}
