import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/auth'
import { getBaseUrl } from '@/lib/env'
import {
  getShopifyApiKey,
  getShopifyApiSecret,
  getShopifyApiVersion,
  normalizeShopDomain,
  verifyShopifyHmac,
  verifyShopifyState,
  SHOPIFY_PENDING_CLIENT_COOKIE,
} from '@/lib/shopify-auth'
import { saveShopifyConnection } from '@/actions/connections'

type TokenResponse = {
  access_token: string
  scope?: string
}

type ShopResponse = {
  shop?: {
    name?: string
    myshopify_domain?: string
  }
}

async function registerUninstallWebhook(shop: string, accessToken: string, requestUrl: string) {
  const address = `${getBaseUrl(requestUrl)}/api/webhooks/shopify/app-uninstalled`
  const res = await fetch(`https://${shop}/admin/api/${getShopifyApiVersion()}/webhooks.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      webhook: {
        topic: 'app/uninstalled',
        address,
        format: 'json',
      },
    }),
  })

  if (!res.ok && res.status !== 422) {
    console.warn(`Shopify uninstall webhook registration failed for ${shop}: ${res.status}`)
  }
}

async function fetchShopName(shop: string, accessToken: string) {
  const res = await fetch(`https://${shop}/admin/api/${getShopifyApiVersion()}/shop.json`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
  })

  if (!res.ok) return shop
  const data = (await res.json()) as ShopResponse
  return data.shop?.name || data.shop?.myshopify_domain || shop
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const shopParam = searchParams.get('shop')
  const stateParam = searchParams.get('state')

  if (!code || !shopParam || !verifyShopifyHmac(searchParams)) {
    return NextResponse.redirect(new URL('/admin/connections?error=shopify_denied', req.url))
  }

  try {
    const shop = normalizeShopDomain(shopParam)
    const cookieStore = await cookies()
    const pendingClient = cookieStore.get(SHOPIFY_PENDING_CLIENT_COOKIE)?.value
    const state = verifyShopifyState(stateParam || pendingClient || '')
    if (state.shop && state.shop !== shop) throw new Error('Shopify state shop mismatch.')

    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: getShopifyApiKey(),
        client_secret: getShopifyApiSecret(),
        code,
      }),
    })

    if (!tokenRes.ok) throw new Error(`Shopify token exchange failed: ${tokenRes.status}`)
    const token = (await tokenRes.json()) as TokenResponse
    const scopes = token.scope?.split(',').map((scope) => scope.trim()).filter(Boolean) ?? []
    const shopName = await fetchShopName(shop, token.access_token)

    await registerUninstallWebhook(shop, token.access_token, req.url)
    await saveShopifyConnection(state.clientId, shop, token.access_token, scopes, shopName)
    cookieStore.delete(SHOPIFY_PENDING_CLIENT_COOKIE)

    return NextResponse.redirect(new URL(`/admin/clients/${state.clientId}?success=shopify`, req.url))
  } catch (error) {
    console.error('Shopify OAuth callback error:', error)
    return NextResponse.redirect(new URL('/admin/connections?error=shopify_failed', req.url))
  }
}
