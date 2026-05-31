import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import KpiCard from '@/components/ui/KpiCard'
import SectionHeader from '@/components/ui/SectionHeader'
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
        <KpiCard label="Revenue" value={`$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={DollarSign} iconBg="bg-emerald-50" />
        <KpiCard label="Orders" value={orders.toLocaleString()} icon={ShoppingCart} iconBg="bg-blue-50" />
        <KpiCard label="Avg Order Value" value={`$${aov.toFixed(2)}`} icon={DollarSign} iconBg="bg-indigo-50" />
        <KpiCard label="New Customers" value={newCust.toLocaleString()} subValue={`${retCust} returning`} icon={Users} iconBg="bg-violet-50" />
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package size={15} className="text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700">Top Products</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">#</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Product</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">Revenue</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">Units Sold</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">No product data for this month yet.</td>
              </tr>
            ) : topProducts.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-400 text-xs font-mono">{p.rank}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{p.productName}</td>
                <td className="px-5 py-3 text-right text-gray-700">${p.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-5 py-3 text-right text-gray-700">{p.unitsSold.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
