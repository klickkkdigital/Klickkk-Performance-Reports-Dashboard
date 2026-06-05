import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { format } from 'date-fns'
import SectionHeader from '@/components/ui/SectionHeader'
import ConnectMetaButton from '@/components/connections/ConnectMetaButton'
import ConnectGoogleButton from '@/components/connections/ConnectGoogleButton'
import { Alert } from '@heroui/react/alert'
import { Card } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { EmptyState } from '@heroui/react/empty-state'
import { BarChart3, CheckCircle, Clock, Megaphone, RefreshCw, ShoppingBag, XCircle } from 'lucide-react'

const syncStatusIcon = {
  SUCCESS: CheckCircle,
  FAILED: XCircle,
  NEVER: Clock,
  SYNCING: RefreshCw,
}

const syncStatusStyle = {
  SUCCESS: 'success',
  FAILED: 'danger',
  NEVER: 'default',
  SYNCING: 'accent',
} as const

const platformIcon = {
  META: Megaphone,
  GOOGLE_ANALYTICS: BarChart3,
  SHOPIFY: ShoppingBag,
} as const

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; clientId?: string }>
}) {
  await requireAdmin()
  const params = await searchParams

  const clients = await db.client.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      connections: { where: { isActive: true }, orderBy: { platform: 'asc' } },
    },
  })

  return (
    <div>
      <SectionHeader title="Data Connections" description="Connect Meta and Google Analytics for each client. Shopify stores connect from the Shopify app install flow." />

      {params.error && (
        <Alert status="danger" className="mb-4">
          <Alert.Content><Alert.Title>Connection failed: {params.error.replace(/_/g, ' ')}</Alert.Title></Alert.Content>
        </Alert>
      )}
      {params.success && (
        <Alert status="success" className="mb-4">
          <Alert.Content><Alert.Title>{params.success === 'meta' ? 'Meta' : params.success === 'shopify' ? 'Shopify' : 'Google Analytics'} connected successfully!</Alert.Title></Alert.Content>
        </Alert>
      )}

      <div className="space-y-6">
        {clients.map((client) => (
          <Card key={client.id} className="overflow-hidden border border-default-200/80 bg-content1/95 shadow-sm">
            <div className="flex items-center justify-between border-b border-default-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: client.primaryColor }}
                >
                  {client.name[0]}
                </div>
                <span className="font-medium text-foreground">{client.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <ConnectMetaButton clientId={client.id} />
                <ConnectGoogleButton clientId={client.id} />
              </div>
            </div>

            {client.connections.length === 0 ? (
              <EmptyState className="px-5 py-8 text-center text-sm text-default-400">No connections yet. Shopify stores appear here after the Shopify app is installed.</EmptyState>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default-100 bg-default-50">
                    <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Platform</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Account</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Last Sync</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {client.connections.map((conn) => {
                    const Icon = syncStatusIcon[conn.lastSyncStatus]
                    const PlatformIcon = platformIcon[conn.platform]
                    const style = syncStatusStyle[conn.lastSyncStatus]
                    return (
                      <tr key={conn.id} className="border-b border-default-50">
                        <td className="px-5 py-3 font-medium text-foreground">
                          <span className="inline-flex items-center gap-2">
                            <PlatformIcon size={15} />
                            {conn.platform}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-default-600">{conn.accountName}</td>
                        <td className="px-5 py-3 text-xs text-default-400">
                          {conn.lastSyncedAt ? format(conn.lastSyncedAt, 'MMM d, h:mm a') : 'Never'}
                        </td>
                        <td className="px-5 py-3">
                          <Chip color={style} variant="soft" size="sm">
                            <Icon size={12} />
                            {conn.lastSyncStatus}
                          </Chip>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
