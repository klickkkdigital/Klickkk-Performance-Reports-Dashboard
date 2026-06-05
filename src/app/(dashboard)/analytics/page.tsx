import { requireSession } from '@/lib/auth'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import KpiCard from '@/components/ui/KpiCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { getLiveGA4Summary } from '@/lib/live-google-analytics'
import { Alert } from '@heroui/react/alert'
import { Card } from '@heroui/react/card'
import { ProgressBar } from '@heroui/react/progress-bar'
import { Users, Monitor, MousePointer2, BarChart3 } from 'lucide-react'

export default async function AnalyticsPage() {
  const session = await requireSession()
  const clientId = session.clientId!

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const analytics = await getLiveGA4Summary(clientId, monthStart, monthEnd)
  const sessions = analytics.sessions
  const users = analytics.users
  const newUsers = analytics.newUsers
  const bounceRate = analytics.bounceRate
  const avgDuration = analytics.avgSessionDuration

  const channels = [
    { label: 'Organic Search', value: analytics.organicSearch },
    { label: 'Paid Search', value: analytics.paidSearch },
    { label: 'Social', value: analytics.social },
    { label: 'Direct', value: analytics.direct },
    { label: 'Referral', value: analytics.referral },
    { label: 'Email', value: analytics.email },
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

      {!analytics.connected && (
        <Alert status="warning" className="mb-4">
          <Alert.Content>
            <Alert.Title>Google Analytics is not connected yet.</Alert.Title>
          </Alert.Content>
        </Alert>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Sessions" value={sessions.toLocaleString()} icon={Monitor} iconBg="bg-[#f8f8f8]" />
        <KpiCard label="Users" value={users.toLocaleString()} subValue={`${newUsers.toLocaleString()} new`} icon={Users} iconBg="bg-[#f8f8f8]" />
        <KpiCard label="Bounce Rate" value={`${(bounceRate * 100).toFixed(1)}%`} icon={MousePointer2} iconBg="bg-[#f8f8f8]" />
        <KpiCard label="Avg Session" value={formatDuration(avgDuration)} icon={BarChart3} iconBg="bg-[#f8f8f8]" />
      </div>

      {/* Traffic channels */}
      <Card className="border border-default-200/80 bg-content1/95 p-5 shadow-sm">
        <h3 className="mb-5 text-sm font-semibold text-foreground">Traffic by Channel</h3>
        <div className="space-y-3">
          {channels.map((c) => {
            const pct = totalChannelSessions > 0 ? (c.value / totalChannelSessions) * 100 : 0
            return (
              <div key={c.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-default-600">{c.label}</span>
                  <span className="text-sm font-medium text-foreground">{c.value.toLocaleString()} <span className="text-xs font-normal text-default-400">({pct.toFixed(1)}%)</span></span>
                </div>
                <ProgressBar aria-label={c.label} value={pct} className="[&_[data-slot=fill]]:bg-[#0b0b0b]" />
              </div>
            )
          })}
          {totalChannelSessions === 0 && (
            <p className="py-4 text-center text-sm text-default-400">No analytics data for this month yet.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
