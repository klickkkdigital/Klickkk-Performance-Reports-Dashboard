import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import KpiCard from '@/components/ui/KpiCard'
import SectionHeader from '@/components/ui/SectionHeader'
import SpendRevenueChart from '@/components/charts/SpendRevenueChart'
import CampaignTypeBreakdown from '@/components/charts/CampaignTypeBreakdown'
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react'

export default async function OverviewPage() {
  const session = await requireSession()
  const clientId = session.clientId!

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const prevMonthStart = startOfMonth(subMonths(now, 1))
  const prevMonthEnd = endOfMonth(subMonths(now, 1))

  const [shopifyThis, shopifyPrev, campaignMetrics, campaignMetricsPrev] = await Promise.all([
    db.shopifyMetric.aggregate({
      where: { clientId, date: { gte: monthStart, lte: monthEnd } },
      _sum: { totalRevenue: true, totalOrders: true },
    }),
    db.shopifyMetric.aggregate({
      where: { clientId, date: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { totalRevenue: true, totalOrders: true },
    }),
    db.campaignMetric.aggregate({
      where: {
        campaign: { clientId },
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { spend: true, purchaseValue: true, impressions: true, clicks: true },
    }),
    db.campaignMetric.aggregate({
      where: {
        campaign: { clientId },
        date: { gte: prevMonthStart, lte: prevMonthEnd },
      },
      _sum: { spend: true, purchaseValue: true },
    }),
  ])

  const revenue = shopifyThis._sum.totalRevenue ?? 0
  const prevRevenue = shopifyPrev._sum.totalRevenue ?? 0
  const orders = shopifyThis._sum.totalOrders ?? 0
  const spend = campaignMetrics._sum.spend ?? 0
  const prevSpend = campaignMetricsPrev._sum.spend ?? 0
  const roas = spend > 0 ? revenue / spend : 0
  const prevRoas = prevSpend > 0 ? (prevRevenue) / prevSpend : 0
  const impressions = campaignMetrics._sum.impressions ?? 0

  const pct = (curr: number, prev: number) => (prev > 0 ? ((curr - prev) / prev) * 100 : 0)

  // Daily spend vs revenue for chart
  const dailyData = await db.$queryRaw<Array<{ date: Date; spend: number; revenue: number }>>`
    SELECT
      s.date,
      COALESCE(SUM(m.spend), 0)::float AS spend,
      COALESCE(s."totalRevenue", 0)::float AS revenue
    FROM "ShopifyMetric" s
    LEFT JOIN "CampaignMetric" m ON m.date = s.date
    LEFT JOIN "Campaign" c ON c.id = m."campaignId" AND c."clientId" = ${clientId}
    WHERE s."clientId" = ${clientId}
      AND s.date >= ${monthStart}
      AND s.date <= ${monthEnd}
    GROUP BY s.date, s."totalRevenue"
    ORDER BY s.date
  `

  // Spend breakdown by campaign type
  const byType = await db.$queryRaw<Array<{ type: string; spend: number; impressions: number; clicks: number; roas: number }>>`
    SELECT
      c.type,
      COALESCE(SUM(m.spend), 0)::float AS spend,
      COALESCE(SUM(m.impressions), 0)::int AS impressions,
      COALESCE(SUM(m.clicks), 0)::int AS clicks,
      CASE WHEN SUM(m.spend) > 0 THEN SUM(m."purchaseValue") / SUM(m.spend) ELSE 0 END::float AS roas
    FROM "Campaign" c
    LEFT JOIN "CampaignMetric" m ON m."campaignId" = c.id
      AND m.date >= ${monthStart} AND m.date <= ${monthEnd}
    WHERE c."clientId" = ${clientId}
    GROUP BY c.type
    ORDER BY c.type
  `

  const chartData = dailyData.map((d) => ({
    date: format(d.date, 'yyyy-MM-dd'),
    spend: d.spend,
    revenue: d.revenue,
  }))

  return (
    <div>
      <SectionHeader
        title={`Overview — ${format(now, 'MMMM yyyy')}`}
        description="All platforms combined"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Revenue"
          value={`$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          iconBg="bg-emerald-50"
          trend={pct(revenue, prevRevenue)}
        />
        <KpiCard
          label="Ad Spend"
          value={`$${spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          iconBg="bg-rose-50"
          trend={pct(spend, prevSpend)}
        />
        <KpiCard
          label="ROAS"
          value={`${roas.toFixed(2)}x`}
          subValue="Return on ad spend"
          icon={TrendingUp}
          iconBg="bg-blue-50"
          trend={pct(roas, prevRoas)}
        />
        <KpiCard
          label="Orders"
          value={orders.toLocaleString()}
          icon={ShoppingCart}
          iconBg="bg-violet-50"
          trend={pct(orders, shopifyPrev._sum.totalOrders ?? 0)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SpendRevenueChart data={chartData} />
        </div>
        <CampaignTypeBreakdown data={byType} />
      </div>
    </div>
  )
}
