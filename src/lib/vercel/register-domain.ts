type RegisterAgentDomainResult = {
  success: boolean
  alreadyExists?: boolean
  status?: number
  error?: string
}

function normalizeSlug(input: string) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function readResponseText(value: Response) {
  return value.text().catch(() => '')
}

export async function registerAgentDomain(slug: string): Promise<RegisterAgentDomainResult> {
  const normalized = normalizeSlug(slug)
  if (!normalized) {
    return { success: false, error: 'Slug invalido para registrar dominio.' }
  }

  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID

  if (!token || !projectId) {
    console.warn('[vercel-domain] VERCEL_TOKEN ou VERCEL_PROJECT_ID ausente; pulando registro de dominio.')
    return { success: false, error: 'Variaveis de ambiente da Vercel ausentes.' }
  }

  const domainName = `${normalized}.brspromotora.com.br`
  const url = new URL(`https://api.vercel.com/v10/projects/${projectId}/domains`)
  if (teamId) url.searchParams.set('teamId', teamId)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domainName }),
      cache: 'no-store',
    })

    if (response.status === 200 || response.status === 201) {
      console.log('[vercel-domain] Dominio registrado com sucesso:', domainName)
      return { success: true, status: response.status }
    }

    const bodyText = await readResponseText(response)

    if (response.status === 409) {
      console.log('[vercel-domain] Dominio ja existente:', domainName)
      return { success: true, alreadyExists: true, status: response.status }
    }

    console.error('[vercel-domain] Falha ao registrar dominio:', {
      domainName,
      status: response.status,
      bodyText,
    })
    return {
      success: false,
      status: response.status,
      error: bodyText || `Falha ao registrar dominio (${response.status}).`,
    }
  } catch (error: any) {
    console.error('[vercel-domain] Erro inesperado ao registrar dominio:', error)
    return { success: false, error: error?.message || 'Erro inesperado ao registrar dominio.' }
  }
}
