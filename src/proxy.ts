import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
