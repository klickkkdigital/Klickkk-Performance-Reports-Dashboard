import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import SectionHeader from '@/components/ui/SectionHeader'
import ConnectMetaButton from '@/components/connections/ConnectMetaButton'
import ConnectGoogleButton from '@/components/connections/ConnectGoogleButton'
import { Alert } from '@heroui/react/alert'
import { Card } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { BarChart3, CheckCircle, Clock, Megaphone, ShoppingBag } from 'lucide-react'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const session = await requireSession()
  const params = await searchParams
  const connections = session.clientId
    ? await db.dataConnection.findMany({
        where: { clientId: session.clientId, isActive: true },
        orderBy: { platform: 'asc' },
      })
    : []
  const connectedPlatforms = new Set(connections.map((connection) => connection.platform))

  return (
    <div>
      <SectionHeader title="Settings" description="Account and preferences" />

      {params.success && (
        <Alert status="success" className="mb-4">
          <Alert.Content><Alert.Title>Connection saved.</Alert.Title></Alert.Content>
        </Alert>
      )}

      {params.error && (
        <Alert status="danger" className="mb-4">
          <Alert.Content><Alert.Title>Connection failed: {params.error}</Alert.Title></Alert.Content>
        </Alert>
      )}

      <Card className="max-w-lg border border-default-200/80 bg-content1/95 p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-default-500">Role</p>
            <p className="text-sm capitalize text-foreground">{session.role.replace('_', ' ').toLowerCase()}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-default-500">Account</p>
            <p className="text-sm text-foreground">{session.clientSlug ?? 'Admin'}</p>
          </div>
        </div>
      </Card>

      {session.clientId && (
        <Card className="mt-6 max-w-3xl border border-default-200/80 bg-content1/95 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Platform Connections</h2>
              <p className="mt-1 text-xs text-default-400">Connect reporting sources for this dashboard.</p>
            </div>
            <div className="flex items-center gap-2">
              {!connectedPlatforms.has('META') && <ConnectMetaButton clientId={session.clientId} />}
              {!connectedPlatforms.has('GOOGLE_ANALYTICS') && <ConnectGoogleButton clientId={session.clientId} />}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-default-100">
            {[
              { platform: 'META', label: 'Meta Ads', icon: Megaphone },
              { platform: 'GOOGLE_ANALYTICS', label: 'Google Analytics', icon: BarChart3 },
              { platform: 'SHOPIFY', label: 'Shopify', icon: ShoppingBag },
            ].map((item) => {
              const connection = connections.find((conn) => conn.platform === item.platform)
              const Icon = item.icon
              return (
                <div key={item.platform} className="flex items-center justify-between border-b border-default-50 px-4 py-3 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f8f8f8] text-[#0b0b0b]">
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-default-400">{connection?.accountName ?? 'Not connected'}</p>
                    </div>
                  </div>
                  {connection ? (
                    <Chip color="success" variant="soft" size="sm">
                      <CheckCircle size={14} />
                      Connected
                    </Chip>
                  ) : (
                    <Chip color="default" variant="soft" size="sm">
                      <Clock size={14} />
                      Pending
                    </Chip>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
