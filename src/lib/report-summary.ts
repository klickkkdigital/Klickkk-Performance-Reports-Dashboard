import 'server-only'
import { db } from './db'
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns'

export async function generateReportSummary(clientId: string, month: string) {
  const [year, mon] = month.split('-').map(Number)
  const monthStart = startOfMonth(new Date(year, mon - 1))
  const monthEnd = endOfMonth(monthStart)

  const [metaData, shopifyData, analyticsData] = await Promise.all([
    getMetaSummary(clientId, monthStart, monthEnd),
    getShopifySummary(clientId, monthStart, monthEnd),
    getAnalyticsSummary(clientId, monthStart, monthEnd),
  ])

  return { meta: metaData, shopify: shopifyData, analytics: analyticsData, generatedAt: new Date().toISOString() }
}

async function getMetaSummary(clientId: string, start: Date, end: Date) {
  const campaigns = await db.campaign.findMany({
    where: { clientId },
    include: {
      metrics: {
        where: { date: { gte: start, lte: end } },
      },
    },
  })

  const byType = { AWARENESS: initMeta(), TRAFFIC: initMeta(), SALES: initMeta() }

  for (const c of campaigns) {
    const bucket = byType[c.type]
    for (const m of c.metrics) {
      bucket.spend += m.spend
      bucket.impressions += m.impressions
      bucket.reach += m.reach
      bucket.clicks += m.clicks
      bucket.purchases += m.purchases
      bucket.purchaseValue += m.purchaseValue
      bucket.addToCart += m.addToCart
    }
  }

  // Compute derived metrics
  for (const [, b] of Object.entries(byType)) {
    b.cpm = b.impressions > 0 ? (b.spend / b.impressions) * 1000 : 0
    b.cpc = b.clicks > 0 ? b.spend / b.clicks : 0
    b.ctr = b.impressions > 0 ? (b.clicks / b.impressions) * 100 : 0
    b.roas = b.spend > 0 ? b.purchaseValue / b.spend : 0
    b.cpa = b.purchases > 0 ? b.spend / b.purchases : 0
  }

  const totalSpend = Object.values(byType).reduce((s, b) => s + b.spend, 0)
  const totalRevenue = byType.SALES.purchaseValue
  const totalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0

  return { byType, totalSpend, totalRevenue, totalRoas }
}

function initMeta() {
  return { spend: 0, impressions: 0, reach: 0, clicks: 0, purchases: 0, purchaseValue: 0, addToCart: 0, cpm: 0, cpc: 0, ctr: 0, roas: 0, cpa: 0 }
}

async function getShopifySummary(clientId: string, start: Date, end: Date) {
  const metrics = await db.shopifyMetric.findMany({ where: { clientId, date: { gte: start, lte: end } } })

  const totals = metrics.reduce(
    (acc, m) => ({
      revenue: acc.revenue + m.totalRevenue,
      orders: acc.orders + m.totalOrders,
      newCustomers: acc.newCustomers + m.newCustomers,
      returningCustomers: acc.returningCustomers + m.returningCustomers,
      refunds: acc.refunds + m.refunds,
    }),
    { revenue: 0, orders: 0, newCustomers: 0, returningCustomers: 0, refunds: 0 },
  )

  const topProducts = await db.topProduct.findMany({
    where: { clientId, month: format(start, 'yyyy-MM') },
    orderBy: { rank: 'asc' },
    take: 5,
  })

  return {
    ...totals,
    avgOrderValue: totals.orders > 0 ? totals.revenue / totals.orders : 0,
    topProducts,
  }
}

async function getAnalyticsSummary(clientId: string, start: Date, end: Date) {
  const metrics = await db.analyticsMetric.findMany({ where: { clientId, date: { gte: start, lte: end } } })

  return metrics.reduce(
    (acc, m) => ({
      sessions: acc.sessions + m.sessions,
      users: acc.users + m.users,
      newUsers: acc.newUsers + m.newUsers,
      pageviews: acc.pageviews + m.pageviews,
      bounceRate: acc.bounceRate + m.bounceRate / (metrics.length || 1),
      organicSearch: acc.organicSearch + m.organicSearch,
      paidSearch: acc.paidSearch + m.paidSearch,
      social: acc.social + m.social,
      direct: acc.direct + m.direct,
      referral: acc.referral + m.referral,
      email: acc.email + m.email,
    }),
    { sessions: 0, users: 0, newUsers: 0, pageviews: 0, bounceRate: 0, organicSearch: 0, paidSearch: 0, social: 0, direct: 0, referral: 0, email: 0 },
  )
}
