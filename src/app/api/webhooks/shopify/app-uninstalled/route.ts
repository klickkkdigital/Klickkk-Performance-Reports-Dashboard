import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyShopifyWebhookHmac } from '@/lib/shopify-auth'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const hmac = req.headers.get('x-shopify-hmac-sha256')
  const shop = req.headers.get('x-shopify-shop-domain')

  if (!verifyShopifyWebhookHmac(body, hmac)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  if (shop) {
    await db.dataConnection.updateMany({
      where: { platform: 'SHOPIFY', accountId: shop, isActive: true },
      data: { isActive: false },
    })
  }

  return NextResponse.json({ ok: true })
}
