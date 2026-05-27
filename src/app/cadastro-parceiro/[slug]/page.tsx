import PartnerOnboarding from '../_components/PartnerOnboarding'
import type { Metadata } from 'next'
import { getFormBySlug, getPublicProcessBySlug } from '../actions'

export default function CadastroParceiroSlugPage({ params }: { params: { slug: string } }) {
  return <PartnerOnboarding slug={params.slug} />
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const procRes = await getPublicProcessBySlug(params.slug)
  const res = procRes.success && procRes.form ? { success: true, form: procRes.form } : await getFormBySlug(params.slug)
  type PartnerFormConfig = {
    intro?: { title?: string }
    branding?: { favicon_url?: string }
  }
  type PartnerFormRow = { title?: string; config?: PartnerFormConfig } | null

  const form: PartnerFormRow = res.success ? (res.form as PartnerFormRow) : null
  const config = form?.config
  const title =
    config?.intro?.title ||
    form?.title ||
    'Cadastro de Parceiro'

  const faviconUrl = config?.branding?.favicon_url
  return {
    title,
    icons: faviconUrl ? { icon: faviconUrl } : undefined,
  }
}
