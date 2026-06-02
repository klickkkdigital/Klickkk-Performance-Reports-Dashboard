import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/auth'
import { getDashboardRedirect } from '@/lib/env'
import {
  createPendingShopifyClient,
  getShopifyInstallUrl,
  SHOPIFY_PENDING_CLIENT_COOKIE,
  verifyShopifyState,
} from '@/lib/shopify-auth'

function hostFrom(value?: string) {
  if (!value) return null
  try {
    return new URL(value).host
  } catch {
    return null
  }
}

async function setPendingClientCookie(token: string) {
  const state = verifyShopifyState(token)
  if (!state.clientId) throw new Error('Missing Shopify client state.')

  const cookieStore = await cookies()
  cookieStore.set(SHOPIFY_PENDING_CLIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/',
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (token) {
    try {
      await setPendingClientCookie(token)
      return NextResponse.redirect(getShopifyInstallUrl())
    } catch (error) {
      console.error('Shopify install token error:', error)
      return NextResponse.redirect(getDashboardRedirect('/admin/connections?error=shopify_install_state_failed', req.url))
    }
  }

  try {
    await requireAdmin()
  } catch {
    return NextResponse.redirect(getDashboardRedirect('/login', req.url))
  }

  const clientId = searchParams.get('clientId')
  if (!clientId) {
    return NextResponse.redirect(getDashboardRedirect('/admin/connections?error=shopify_missing_client', req.url))
  }

  try {
    const pendingToken = createPendingShopifyClient(clientId, `/admin/clients/${clientId}`)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const appHost = hostFrom(appUrl)

    if (appUrl && appHost && req.nextUrl.host !== appHost) {
      const redirectUrl = new URL('/api/auth/shopify/install', appUrl)
      redirectUrl.searchParams.set('token', pendingToken)
      return NextResponse.redirect(redirectUrl)
    }

    await setPendingClientCookie(pendingToken)
    return NextResponse.redirect(getShopifyInstallUrl())
  } catch (error) {
    console.error('Shopify install launch error:', error)
    return NextResponse.redirect(getDashboardRedirect(`/admin/clients/${clientId}?error=shopify_install_link_missing`, req.url))
  }
}
