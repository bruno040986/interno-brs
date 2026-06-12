import TaxRegimeEditor from '../_components/TaxRegimeEditor'

export default async function TaxRegimeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ mode?: string }>
}) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const viewOnly = String(resolvedSearchParams?.mode || '').toLowerCase() === 'view'

  return <TaxRegimeEditor regimeId={id} viewOnly={viewOnly} />
}
