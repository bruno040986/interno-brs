import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PublicCommercialCard from '../_components/PublicCommercialCard'
import { getPublicCommercialCardBySlug } from '@/lib/commercial-card-public'

export const dynamic = 'force-dynamic'

export default async function PublicCardPage({ params }: { params: { slug: string } }) {
  const data = await getPublicCommercialCardBySlug(params.slug)
  if (!data) notFound()

  return (
    <PublicCommercialCard
      slug={String(params.slug || '').trim().toLowerCase()}
      entity={data.entity}
      companyProfile={data.companyProfile}
      linkedUser={data.linkedUser}
      mode="card"
    />
  )
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const data = await getPublicCommercialCardBySlug(params.slug)
    if (!data) {
      return { title: 'Cartão Virtual | BRS Promotora' }
    }

    const name = String(data.entity.cadastral_data?.commercial_name || data.entity.cadastral_data?.full_name || data.entity.name || 'Cartão Virtual').trim()
    return {
      title: `${name} | Cartão Virtual`,
      description: 'Cartão virtual público da BRS Promotora.',
    }
  } catch {
    return { title: 'Cartão Virtual | BRS Promotora' }
  }
}
