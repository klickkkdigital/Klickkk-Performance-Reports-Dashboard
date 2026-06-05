import { requireSession } from '@/lib/auth'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import KpiCard from '@/components/ui/KpiCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { getLiveMetaSummary } from '@/lib/live-meta'
import { Alert } from '@heroui/react/alert'
import { Card } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { Eye, MousePointer2, ShoppingCart, DollarSign } from 'lucide-react'

export default async function MetaPage() {
  const session = await requireSession()
  const clientId = session.clientId!

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const meta = await getLiveMetaSummary(clientId, monthStart, monthEnd)
  const campaigns = meta.campaigns.sort((a, b) => a.name.localeCompare(b.name))

  const typeColors: Record<string, 'accent' | 'default' | 'success'> = {
    AWARENESS: 'accent',
    TRAFFIC: 'default',
    SALES: 'success',
  }

  return (
    <div>
      <SectionHeader title={`Meta Ads — ${format(now, 'MMMM yyyy')}`} description="Awareness, Traffic & Sales campaigns" />

      {!meta.connected && (
        <Alert status="warning" className="mb-4">
          <Alert.Content>
            <Alert.Title>Meta Ads is not connected yet.</Alert.Title>
          </Alert.Content>
        </Alert>
      )}

      {/* Sections per campaign type */}
      {['AWARENESS', 'TRAFFIC', 'SALES'].map((type) => {
        const d = meta.byType.find((b) => b.type === type)
        if (!d) return null

        return (
          <div key={type} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Chip color={typeColors[type]} variant="soft" size="sm">{type}</Chip>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <KpiCard label="Spend" value={`$${Number(d.spend).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={DollarSign} iconBg="bg-[#f8f8f8]" />
              {type === 'AWARENESS' && (
                <>
                  <KpiCard label="Impressions" value={Number(d.impressions).toLocaleString()} icon={Eye} iconBg="bg-[#f8f8f8]" />
                  <KpiCard label="Reach" value={Number(d.reach).toLocaleString()} icon={Eye} iconBg="bg-[#f8f8f8]" />
                  <KpiCard label="CPM" value={`$${Number(d.cpm).toFixed(2)}`} icon={DollarSign} iconBg="bg-gray-50" />
                </>
              )}
              {type === 'TRAFFIC' && (
                <>
                  <KpiCard label="Clicks" value={Number(d.clicks).toLocaleString()} icon={MousePointer2} iconBg="bg-[#f8f8f8]" />
                  <KpiCard label="CTR" value={`${Number(d.ctr).toFixed(2)}%`} icon={MousePointer2} iconBg="bg-[#f8f8f8]" />
                  <KpiCard label="CPC" value={`$${Number(d.cpc).toFixed(2)}`} icon={DollarSign} iconBg="bg-gray-50" />
                </>
              )}
              {type === 'SALES' && (
                <>
                  <KpiCard label="Purchases" value={Number(d.purchases).toLocaleString()} icon={ShoppingCart} iconBg="bg-[#f8f8f8]" />
                  <KpiCard label="ROAS" value={`${Number(d.roas).toFixed(2)}x`} icon={DollarSign} iconBg="bg-[#f8f8f8]" />
                  <KpiCard label="CPA" value={`$${Number(d.cpa).toFixed(2)}`} icon={DollarSign} iconBg="bg-gray-50" />
                </>
              )}
            </div>
          </div>
        )
      })}

      {/* Campaign table */}
      <Card className="overflow-hidden border border-default-200/80 bg-content1/95 shadow-sm">
        <div className="border-b border-default-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">All Campaigns</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default-100 bg-default-50">
              <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Campaign</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Type</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-default-500">Spend</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-default-500">Impressions</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-default-500">Clicks</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-default-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              return (
                <tr key={c.id} className="border-b border-default-50 hover:bg-default-50/70">
                  <td className="max-w-[240px] truncate px-5 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-5 py-3">
                    <Chip color={typeColors[c.type]} variant="soft" size="sm">{c.type}</Chip>
                  </td>
                  <td className="px-5 py-3 text-right text-default-700">${c.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="px-5 py-3 text-right text-default-700">{c.impressions.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-default-700">{c.clicks.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <Chip color={c.status === 'ACTIVE' ? 'success' : 'default'} variant="soft" size="sm">{c.status}</Chip>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
