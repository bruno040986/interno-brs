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

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Não interceptar endpoints internos do Next.js (RSC/Flight/Server Actions),
  // senão podemos quebrar navegação e ações com "unexpected response from server".
  if (pathname.startsWith('/_next')) {
    return NextResponse.next({ request })
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

  const { data: { user } } = await supabase.auth.getUser()

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/login',
    '/auth/callback',
    '/acesso-negado',
    '/cadastro-parceiro',
    // APIs públicas usadas no formulário público
    '/api/lookups',
    '/api/cpfhub',
  ]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (!user && !isPublicRoute) {
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
