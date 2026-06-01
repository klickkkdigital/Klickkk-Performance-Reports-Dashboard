import { NextResponse, type NextRequest } from 'next/server'

function hostnameFrom(value?: string) {
  if (!value) return null
  try {
    return new URL(value).hostname
  } catch {
    return null
  }
}

export function proxy(request: NextRequest) {
  const appHost = hostnameFrom(process.env.NEXT_PUBLIC_APP_URL)
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL
  const dashboardHost = hostnameFrom(dashboardUrl)
  const requestHost = request.nextUrl.hostname

  if (!appHost || !dashboardUrl || !dashboardHost || requestHost !== appHost) {
    return NextResponse.next()
  }

  if (request.nextUrl.searchParams.has('shop')) {
    const launchUrl = new URL('/api/auth/shopify/launch', request.url)
    launchUrl.search = request.nextUrl.search
    return NextResponse.redirect(launchUrl)
  }

  const redirectUrl = new URL(request.nextUrl.pathname, dashboardUrl)
  redirectUrl.search = request.nextUrl.search
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
