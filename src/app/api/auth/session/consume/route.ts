import { NextRequest, NextResponse } from 'next/server'
import { getDashboardRedirect, getDashboardUrl } from '@/lib/env'
import { createSession, verifyLoginTransferToken } from '@/lib/session'

function hostFrom(value?: string) {
  if (!value) return null
  try {
    return new URL(value).host
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const dashboardUrl = getDashboardUrl(req.url)

  if (hostFrom(dashboardUrl) && req.nextUrl.host !== hostFrom(dashboardUrl)) {
    const redirectUrl = new URL('/api/auth/session/consume', dashboardUrl)
    if (token) redirectUrl.searchParams.set('token', token)
    return NextResponse.redirect(redirectUrl)
  }

  if (!token) return NextResponse.redirect(getDashboardRedirect('/login', req.url))

  const session = await verifyLoginTransferToken(token)
  if (!session) return NextResponse.redirect(getDashboardRedirect('/login', req.url))

  await createSession(session)
  return NextResponse.redirect(getDashboardRedirect(session.role === 'SUPER_ADMIN' ? '/admin' : '/overview', req.url))
}
