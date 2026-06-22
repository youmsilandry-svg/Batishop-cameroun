import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { MAINTENANCE, APERCU_CODE } from './lib/config'

// Quand MAINTENANCE = true, tout le public est redirigé vers /maintenance,
// sauf les visiteurs munis du code d'aperçu (?apercu=CODE -> cookie).
export function middleware(req: NextRequest) {
  if (!MAINTENANCE) return NextResponse.next()

  const { pathname, searchParams } = req.nextUrl

  // Laisser passer la page de maintenance elle-même et les fichiers techniques
  if (
    pathname === '/maintenance' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icon') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next()
  }

  // Aperçu : ?apercu=CODE pose un cookie, puis laisse passer
  const code = searchParams.get('apercu')
  if (code && code === APERCU_CODE) {
    const res = NextResponse.next()
    res.cookies.set('apercu', code, { maxAge: 60 * 60 * 24 * 30, path: '/' })
    return res
  }
  if (req.cookies.get('apercu')?.value === APERCU_CODE) {
    return NextResponse.next()
  }

  // Sinon : afficher la page de maintenance (l'URL reste la même)
  const url = req.nextUrl.clone()
  url.pathname = '/maintenance'
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
