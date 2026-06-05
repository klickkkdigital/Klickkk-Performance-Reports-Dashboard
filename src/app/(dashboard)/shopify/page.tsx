import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import KpiCard from '@/components/ui/KpiCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { Card } from '@heroui/react/card'
import { EmptyState } from '@heroui/react/empty-state'
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react'

export default async function ShopifyPage() {
  const session = await requireSession()
  const clientId = session.clientId!

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [agg, topProducts] = await Promise.all([
    db.shopifyMetric.aggregate({
      where: { clientId, date: { gte: monthStart, lte: monthEnd } },
      _sum: { totalRevenue: true, totalOrders: true, newCustomers: true, returningCustomers: true, refunds: true },
    }),
    db.topProduct.findMany({
      where: { clientId, month: format(monthStart, 'yyyy-MM') },
      orderBy: { rank: 'asc' },
      take: 10,
    }),
  ])

  const revenue = agg._sum.totalRevenue ?? 0
  const orders = agg._sum.totalOrders ?? 0
  const aov = orders > 0 ? revenue / orders : 0
  const newCust = agg._sum.newCustomers ?? 0
  const retCust = agg._sum.returningCustomers ?? 0

  return (
    <div>
      <SectionHeader title={`Shopify — ${format(now, 'MMMM yyyy')}`} description="Store performance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Revenue" value={`$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={DollarSign} iconBg="bg-[#f8f8f8]" />
        <KpiCard label="Orders" value={orders.toLocaleString()} icon={ShoppingCart} iconBg="bg-[#f8f8f8]" />
        <KpiCard label="Avg Order Value" value={`$${aov.toFixed(2)}`} icon={DollarSign} iconBg="bg-[#f8f8f8]" />
        <KpiCard label="New Customers" value={newCust.toLocaleString()} subValue={`${retCust} returning`} icon={Users} iconBg="bg-[#f8f8f8]" />
      </div>

      {/* Top Products */}
      <Card className="overflow-hidden border border-default-200/80 bg-content1/95 shadow-sm">
        <div className="flex items-center gap-2 border-b border-default-100 px-5 py-4">
          <Package size={15} className="text-default-400" />
          <h3 className="text-sm font-semibold text-foreground">Top Products</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default-100 bg-default-50">
              <th className="px-5 py-3 text-left text-xs font-medium text-default-500">#</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Product</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-default-500">Revenue</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-default-500">Units Sold</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState className="py-8 text-center text-sm text-default-400">No product data for this month yet.</EmptyState>
                </td>
              </tr>
            ) : topProducts.map((p) => (
              <tr key={p.id} className="border-b border-default-50 hover:bg-default-50/70">
                <td className="px-5 py-3 font-mono text-xs text-default-400">{p.rank}</td>
                <td className="px-5 py-3 font-medium text-foreground">{p.productName}</td>
                <td className="px-5 py-3 text-right text-default-700">${p.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-5 py-3 text-right text-default-700">{p.unitsSold.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
