import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?error=${error}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url))
  }

  try {
    const supabase = await createClient()

    // Buscar credenciais do banco
    const { data: config } = await supabase
      .from('system_google_config')
      .select('client_id, client_secret')
      .single()

    if (!config?.client_id || !config?.client_secret) {
      throw new Error('Google credentials not configured')
    }

    // Trocar o código por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.client_id,
        client_secret: config.client_secret,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`)
    }

    const tokens = await tokenResponse.json()

    // Buscar informações do usuário do Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const googleUser = await userResponse.json()

    // Buscar o usuário atual do Supabase
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Salvar ou atualizar os tokens do usuário
    const expiryDate = new Date()
    expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in)

    const { error: upsertError } = await supabase
      .from('user_google_auth')
      .upsert(
        {
          user_id: currentUser.id,
          email_vinculado: googleUser.email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: expiryDate.toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) {
      throw new Error(`Failed to save tokens: ${upsertError.message}`)
    }

    // Redirecionar para a Dashboard com sucesso
    return NextResponse.redirect(
      new URL('/dashboard?google_auth=success', request.url)
    )
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(`/dashboard?error=auth_failed`, request.url)
    )
  }
}
