import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import KpiCard from '@/components/ui/KpiCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { Users, Monitor, MousePointer2, BarChart3 } from 'lucide-react'

export default async function AnalyticsPage() {
  const session = await requireSession()
  const clientId = session.clientId!

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const agg = await db.analyticsMetric.aggregate({
    where: { clientId, date: { gte: monthStart, lte: monthEnd } },
    _sum: {
      sessions: true,
      users: true,
      newUsers: true,
      pageviews: true,
      organicSearch: true,
      paidSearch: true,
      social: true,
      direct: true,
      referral: true,
      email: true,
    },
    _avg: { bounceRate: true, avgSessionDuration: true },
  })

  const sessions = agg._sum.sessions ?? 0
  const users = agg._sum.users ?? 0
  const newUsers = agg._sum.newUsers ?? 0
  const pageviews = agg._sum.pageviews ?? 0
  const bounceRate = agg._avg.bounceRate ?? 0
  const avgDuration = agg._avg.avgSessionDuration ?? 0

  const channels = [
    { label: 'Organic Search', value: agg._sum.organicSearch ?? 0, color: 'bg-emerald-400' },
    { label: 'Paid Search', value: agg._sum.paidSearch ?? 0, color: 'bg-blue-400' },
    { label: 'Social', value: agg._sum.social ?? 0, color: 'bg-violet-400' },
    { label: 'Direct', value: agg._sum.direct ?? 0, color: 'bg-orange-400' },
    { label: 'Referral', value: agg._sum.referral ?? 0, color: 'bg-pink-400' },
    { label: 'Email', value: agg._sum.email ?? 0, color: 'bg-sky-400' },
  ].sort((a, b) => b.value - a.value)

  const totalChannelSessions = channels.reduce((s, c) => s + c.value, 0)

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return `${m}m ${s}s`
  }

  return (
    <div>
      <SectionHeader title={`Analytics — ${format(now, 'MMMM yyyy')}`} description="Google Analytics 4" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Sessions" value={sessions.toLocaleString()} icon={Monitor} iconBg="bg-blue-50" />
        <KpiCard label="Users" value={users.toLocaleString()} subValue={`${newUsers.toLocaleString()} new`} icon={Users} iconBg="bg-violet-50" />
        <KpiCard label="Bounce Rate" value={`${(bounceRate * 100).toFixed(1)}%`} icon={MousePointer2} iconBg="bg-rose-50" />
        <KpiCard label="Avg Session" value={formatDuration(avgDuration)} icon={BarChart3} iconBg="bg-emerald-50" />
      </div>

      {/* Traffic channels */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-700 mb-5">Traffic by Channel</h3>
        <div className="space-y-3">
          {channels.map((c) => {
            const pct = totalChannelSessions > 0 ? (c.value / totalChannelSessions) * 100 : 0
            return (
              <div key={c.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{c.label}</span>
                  <span className="text-sm font-medium text-gray-900">{c.value.toLocaleString()} <span className="text-gray-400 font-normal text-xs">({pct.toFixed(1)}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${c.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          {totalChannelSessions === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No analytics data for this month yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
