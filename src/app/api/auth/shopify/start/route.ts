import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getBaseUrl } from '@/lib/env'
import {
  createShopifyState,
  getShopifyApiKey,
  getShopifyScopes,
  normalizeShopDomain,
} from '@/lib/shopify-auth'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  const shopParam = searchParams.get('shop')

  if (!clientId || !shopParam) {
    return NextResponse.redirect(new URL('/admin/connections?error=shopify_missing_store', req.url))
  }

  try {
    const shop = normalizeShopDomain(shopParam)
    const redirectUri = `${getBaseUrl(req.url)}/api/auth/shopify/callback`
    const state = createShopifyState(clientId, shop)
    const url = new URL(`https://${shop}/admin/oauth/authorize`)
    url.searchParams.set('client_id', getShopifyApiKey())
    url.searchParams.set('scope', getShopifyScopes())
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('state', state)
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('Shopify OAuth start error:', error)
    return NextResponse.redirect(new URL('/admin/connections?error=shopify_start_failed', req.url))
  }
}
