'use client'

import { useParams, useSearchParams } from 'next/navigation'
import PromotoraEditor from '../_components/PromotoraEditor'

export default function PromotoraDetalhePage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')

  return <PromotoraEditor promotoraId={params?.id} readOnly={mode === 'view'} />
}
