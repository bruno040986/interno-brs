import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function PreviewRealPage() {
  redirect('/rh/parceiros/config/comercial/seletor')
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'BRS Workspace',
    description: 'Atalho interno para o seletor do cartão virtual.',
  }
}
