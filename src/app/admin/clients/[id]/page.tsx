import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import ConnectMetaButton from '@/components/connections/ConnectMetaButton'
import ConnectGoogleButton from '@/components/connections/ConnectGoogleButton'
import GenerateReportButton from './GenerateReportButton'
import DisconnectButton from './DisconnectButton'
import { Card } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { EmptyState } from '@heroui/react/empty-state'
import { buttonVariants } from '@heroui/react/button'
import { CheckCircle, XCircle, Clock, RefreshCw, ArrowLeft, Users, Plug } from 'lucide-react'

const syncStatusIcon = { SUCCESS: CheckCircle, FAILED: XCircle, NEVER: Clock, SYNCING: RefreshCw }
const syncStatusStyle = { SUCCESS: 'success', FAILED: 'danger', NEVER: 'default', SYNCING: 'accent' } as const
const platformColor = { META: 'accent', SHOPIFY: 'success', GOOGLE_ANALYTICS: 'warning' } as const
const platformLabel = { META: 'Meta Ads', SHOPIFY: 'Shopify', GOOGLE_ANALYTICS: 'Google Analytics' }

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const client = await db.client.findUnique({
    where: { id },
    include: {
      connections: { where: { isActive: true }, orderBy: { platform: 'asc' } },
      users: { orderBy: { createdAt: 'asc' } },
      reports: { orderBy: { month: 'desc' }, take: 6 },
    },
  })

  if (!client) notFound()

  const connectedPlatforms = new Set(client.connections.map((c) => c.platform))

  return (
    <div className="max-w-4xl">
      <Link href="/admin/clients" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mb-5 gap-1.5' })}>
        <ArrowLeft size={14} /> Back to clients
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold text-white shadow-sm"
            style={{ backgroundColor: client.primaryColor }}
          >
            {client.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{client.name}</h1>
            <p className="font-mono text-xs text-default-400">{client.slug}</p>
          </div>
        </div>
        <Chip color={client.isActive ? 'success' : 'default'} variant="soft" size="sm">{client.isActive ? 'Active' : 'Inactive'}</Chip>
      </div>

      <Card className="mb-5 overflow-hidden border border-default-200/80 bg-content1/95 shadow-sm">
        <div className="flex items-center justify-between border-b border-default-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Plug size={15} className="text-default-400" />
            <h2 className="text-sm font-semibold text-foreground">Platform Connections</h2>
          </div>
          <div className="flex items-center gap-2">
            {!connectedPlatforms.has('META') && <ConnectMetaButton clientId={client.id} />}
            {!connectedPlatforms.has('GOOGLE_ANALYTICS') && <ConnectGoogleButton clientId={client.id} />}
          </div>
        </div>

        {client.connections.length === 0 ? (
          <EmptyState className="px-5 py-10 text-center">
            <Plug size={28} className="mx-auto mb-3 text-default-300" />
            <p className="mb-1 text-sm text-default-400">No platforms connected yet</p>
            <p className="text-xs text-default-300">Use the buttons above to connect Meta or Google Analytics. Shopify connects from the app install flow.</p>
          </EmptyState>
        ) : (
          <div className="divide-y divide-default-50">
            {client.connections.map((conn) => {
              const Icon = syncStatusIcon[conn.lastSyncStatus]
              const style = syncStatusStyle[conn.lastSyncStatus]
              return (
                <div key={conn.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Chip color={platformColor[conn.platform]} variant="soft" size="sm">{platformLabel[conn.platform]}</Chip>
                    <div>
                      <p className="text-sm font-medium text-foreground">{conn.accountName}</p>
                      <p className="font-mono text-xs text-default-400">{conn.accountId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Chip color={style} variant="soft" size="sm">
                        <Icon size={11} />
                        {conn.lastSyncStatus}
                      </Chip>
                      {conn.lastSyncedAt && (
                        <p className="mt-0.5 text-xs text-default-300">{format(conn.lastSyncedAt, 'MMM d, h:mm a')}</p>
                      )}
                    </div>
                    <DisconnectButton connectionId={conn.id} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="mb-5 overflow-hidden border border-default-200/80 bg-content1/95 shadow-sm">
        <div className="flex items-center justify-between border-b border-default-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Reports</h2>
          <GenerateReportButton clientId={client.id} />
        </div>

        {client.reports.length === 0 ? (
          <EmptyState className="px-5 py-8 text-center text-sm text-default-400">No reports generated yet. Use the button above to generate one.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default-100 bg-default-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Month</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Generated</th>
              </tr>
            </thead>
            <tbody>
              {client.reports.map((r) => {
                const [year, mon] = r.month.split('-')
                const label = format(new Date(parseInt(year), parseInt(mon) - 1), 'MMMM yyyy')
                return (
                  <tr key={r.id} className="border-b border-default-50">
                    <td className="px-5 py-3 font-medium text-foreground">{label}</td>
                    <td className="px-5 py-3">
                      <Chip
                        color={r.status === 'READY' ? 'success' : r.status === 'PROCESSING' ? 'accent' : r.status === 'FAILED' ? 'danger' : 'default'}
                        variant="soft"
                        size="sm"
                      >
                        {r.status}
                      </Chip>
                    </td>
                    <td className="px-5 py-3 text-xs text-default-400">
                      {r.generatedAt ? format(r.generatedAt, 'MMM d, yyyy h:mm a') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="overflow-hidden border border-default-200/80 bg-content1/95 shadow-sm">
        <div className="flex items-center gap-2 border-b border-default-100 px-5 py-4">
          <Users size={15} className="text-default-400" />
          <h2 className="text-sm font-semibold text-foreground">Users</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default-100 bg-default-50">
              <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Name</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Email</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {client.users.map((u) => (
              <tr key={u.id} className="border-b border-default-50">
                <td className="px-5 py-3 font-medium text-foreground">{u.name}</td>
                <td className="px-5 py-3 text-default-500">{u.email}</td>
                <td className="px-5 py-3 text-xs text-default-400">
                  {u.lastLoginAt ? format(u.lastLoginAt, 'MMM d, yyyy h:mm a') : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
