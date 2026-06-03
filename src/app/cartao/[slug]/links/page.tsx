import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PublicCommercialCard from '../../_components/PublicCommercialCard'
import { getPublicCommercialCardBySlug } from '@/lib/commercial-card-public'

export const dynamic = 'force-dynamic'

export default async function PublicCardLinksPage({ params }: { params: { slug: string } }) {
  const data = await getPublicCommercialCardBySlug(params.slug)
  if (!data) notFound()

  return (
    <PublicCommercialCard
      slug={String(params.slug || '').trim().toLowerCase()}
      entity={data.entity}
      companyProfile={data.companyProfile}
      linkedUser={data.linkedUser}
      mode="links"
    />
  )
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const data = await getPublicCommercialCardBySlug(params.slug)
    if (!data) {
      return { title: 'Links Uteis | BRS Promotora' }
    }

    const name = String(data.companyProfile?.nickname || data.entity.cadastral_data?.commercial_name || data.entity.name || 'Links Uteis').trim()
    return {
      title: `${name} | Links Úteis`,
      description: 'Links úteis da BRS Promotora vinculados ao cartão virtual.',
    }
  } catch {
    return { title: 'Links Uteis | BRS Promotora' }
  }
}
