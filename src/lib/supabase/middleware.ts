import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessRoute, getRouteAccessDecision } from '@/lib/auth/permissions'
import { getEffectivePermissionsForUserId } from '@/lib/auth/effectivePermissions'

function isApiRequest(pathname: string) {
  return pathname.startsWith('/api/')
}

function isServerActionRequest(request: NextRequest) {
  return request.headers.has('next-action')
}

function forbiddenResponse(request: NextRequest) {
  if (isApiRequest(request.nextUrl.pathname)) {
    return NextResponse.json({ error: 'Sem permissao.' }, { status: 403 })
  }

  const url = request.nextUrl.clone()
  url.pathname = '/acesso-negado'
  url.searchParams.set('from', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) => name.startsWith('sb-') && name.includes('auth-token'))
}

async function getUserWithTimeout(
  supabase: ReturnType<typeof createServerClient>,
  timeoutMs = 4000,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Supabase auth timeout after ${timeoutMs}ms`))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Do not intercept internal Next.js endpoints (RSC/Flight/Server Actions)
  // so navigation does not get stuck waiting on auth checks.
  if (pathname.startsWith('/_next')) {
    return NextResponse.next({ request })
  }

  // Public routes that should stay responsive even if auth is slow or unavailable.
  const publicRoutes = [
    '/login',
    '/auth/callback',
    '/acesso-negado',
    '/cadastro-parceiro',
    '/api/lookups',
    '/api/cpfhub',
  ]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const hasSessionCookie = hasSupabaseSessionCookie(request)

  if (isPublicRoute && !hasSessionCookie) {
    return NextResponse.next({ request })
  }

  if (!hasSessionCookie) {
    if (isApiRequest(pathname)) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 })
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null

  try {
    const authResult = await getUserWithTimeout(supabase)
    user = authResult.data.user
  } catch (error) {
    console.error('Erro ao validar sessao no proxy:', error)

    if (isPublicRoute) {
      return supabaseResponse
    }

    if (isApiRequest(pathname)) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 })
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (user && !isPublicRoute && !isServerActionRequest(request)) {
    const decision = getRouteAccessDecision(pathname, request.nextUrl.searchParams)

    if (decision.type === 'deny') {
      return forbiddenResponse(request)
    }

    if (decision.type === 'permission') {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!serviceRoleKey) return forbiddenResponse(request)

      try {
        const admin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          },
        )
        const permissions = await getEffectivePermissionsForUserId(admin, user.id)
        if (!canAccessRoute(permissions, decision.rule)) {
          return forbiddenResponse(request)
        }
      } catch (error) {
        console.error('Erro ao validar permissao de rota:', error)
        return forbiddenResponse(request)
      }
    }
  }

  return supabaseResponse
}
