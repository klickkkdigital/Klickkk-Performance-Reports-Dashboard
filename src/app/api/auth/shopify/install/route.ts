import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/auth'
import { createPendingShopifyClient, getShopifyInstallUrl, SHOPIFY_PENDING_CLIENT_COOKIE } from '@/lib/shopify-auth'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  if (!clientId) {
    return NextResponse.redirect(new URL('/admin/connections?error=shopify_missing_client', req.url))
  }

  try {
    const cookieStore = await cookies()
    cookieStore.set(SHOPIFY_PENDING_CLIENT_COOKIE, createPendingShopifyClient(clientId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/',
    })

    return NextResponse.redirect(getShopifyInstallUrl())
  } catch (error) {
    console.error('Shopify install launch error:', error)
    return NextResponse.redirect(new URL(`/admin/clients/${clientId}?error=shopify_install_link_missing`, req.url))
  }
}
