const API_VERSION = '2024-04'

export function shopifyClient(storeDomain: string, accessToken: string) {
  const base = `https://${storeDomain}/admin/api/${API_VERSION}`
  const headers = { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' }

  async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${base}${path}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    const res = await fetch(url.toString(), { headers })
    if (!res.ok) throw new Error(`Shopify ${path} failed: ${res.status}`)
    return res.json()
  }

  return { get }
}

export async function fetchShopifyOrdersForRange(
  storeDomain: string,
  accessToken: string,
  dateStart: string,
  dateEnd: string,
) {
  const client = shopifyClient(storeDomain, accessToken)

  const data = await client.get<{ orders: ShopifyOrder[] }>('/orders.json', {
    status: 'any',
    created_at_min: `${dateStart}T00:00:00Z`,
    created_at_max: `${dateEnd}T23:59:59Z`,
    limit: '250',
    fields: 'id,created_at,total_price,subtotal_price,customer,financial_status,refunds',
  })

  return data.orders
}

export async function fetchTopProducts(
  storeDomain: string,
  accessToken: string,
  dateStart: string,
  dateEnd: string,
): Promise<TopProduct[]> {
  // Use Shopify's reports endpoint for accurate product sales
  const client = shopifyClient(storeDomain, accessToken)

  // Fallback: aggregate from order line items
  const data = await client.get<{ orders: ShopifyOrder[] }>('/orders.json', {
    status: 'any',
    created_at_min: `${dateStart}T00:00:00Z`,
    created_at_max: `${dateEnd}T23:59:59Z`,
    limit: '250',
    fields: 'line_items',
  })

  const productMap = new Map<string, TopProduct>()
  for (const order of data.orders) {
    for (const item of order.line_items ?? []) {
      const key = item.product_id.toString()
      const existing = productMap.get(key)
      if (existing) {
        existing.revenue += parseFloat(item.price) * item.quantity
        existing.unitsSold += item.quantity
      } else {
        productMap.set(key, {
          productId: key,
          productName: item.title,
          imageUrl: null,
          revenue: parseFloat(item.price) * item.quantity,
          unitsSold: item.quantity,
          rank: 0,
        })
      }
    }
  }

  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((p, i) => ({ ...p, rank: i + 1 }))
}

export type ShopifyOrder = {
  id: number
  created_at: string
  total_price: string
  subtotal_price: string
  financial_status: string
  customer?: { id: number; orders_count: number }
  refunds?: Array<{ id: number }>
  line_items?: Array<{ product_id: number; title: string; price: string; quantity: number }>
}

export type TopProduct = {
  productId: string
  productName: string
  imageUrl: string | null
  revenue: number
  unitsSold: number
  rank: number
}
