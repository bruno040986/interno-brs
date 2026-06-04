import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PublicCardPage({ params }: { params: { slug: string } }) {
  const slug = String(params.slug || '').trim().toLowerCase()
  if (!slug) {
    redirect('/cartao')
  }

  redirect(`/cartao?slug=${encodeURIComponent(slug)}`)
}
