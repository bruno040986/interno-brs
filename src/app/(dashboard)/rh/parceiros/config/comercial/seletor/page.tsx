import type { Metadata } from 'next'
import { getPublicCommercialPreviewCards } from '@/lib/commercial-card-public'
import SeletorCartaoClient from '@/app/(dashboard)/seletor/seletor-client'

export const dynamic = 'force-dynamic'

const CARTAO_BASE_URL = 'https://workspace.brspromotora.com.br/cartao'

export default async function SeletorPreviewPage() {
  const cards = await getPublicCommercialPreviewCards()
  const activeCards = cards.filter((card) => String(card.entity.commercial_slug || '').trim())

  return <SeletorCartaoClient cards={activeCards} cartaoBaseUrl={CARTAO_BASE_URL} />
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'BRS Workspace',
    description: 'Selecione uma entidade comercial e abra o cartão virtual público em nova aba.',
  }
}
