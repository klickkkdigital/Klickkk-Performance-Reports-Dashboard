import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getBaseUrl, getDashboardRedirect } from '@/lib/env'
import {
  createShopifyState,
  getShopifyApiKey,
  getShopifyScopes,
  normalizeShopDomain,
  SHOPIFY_PENDING_CLIENT_COOKIE,
  verifyShopifyHmac,
  verifyShopifyState,
} from '@/lib/shopify-auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const shopParam = searchParams.get('shop')

  if (!shopParam) {
    return NextResponse.redirect(getDashboardRedirect('/login', req.url))
  }

  if (searchParams.has('hmac') && !verifyShopifyHmac(searchParams)) {
    return NextResponse.redirect(getDashboardRedirect('/login?error=shopify_invalid_launch', req.url))
  }

  try {
    const shop = normalizeShopDomain(shopParam)
    const cookieStore = await cookies()
    const pendingClient = cookieStore.get(SHOPIFY_PENDING_CLIENT_COOKIE)?.value
    const pendingState = pendingClient ? verifyShopifyState(pendingClient) : null

    const redirectUri = `${getBaseUrl(req.url)}/api/auth/shopify/callback`
    const installUrl = new URL(`https://${shop}/admin/oauth/authorize`)
    installUrl.searchParams.set('client_id', getShopifyApiKey())
    installUrl.searchParams.set('scope', getShopifyScopes())
    installUrl.searchParams.set('redirect_uri', redirectUri)
    if (pendingState?.clientId) {
      installUrl.searchParams.set('state', createShopifyState(pendingState.clientId, shop))
    }

    return NextResponse.redirect(installUrl)
  } catch (error) {
    console.error('Shopify launch error:', error)
    return NextResponse.redirect(getDashboardRedirect('/login?error=shopify_launch_failed', req.url))
  }
}
