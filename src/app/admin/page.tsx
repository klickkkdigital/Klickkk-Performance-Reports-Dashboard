import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import SectionHeader from '@/components/ui/SectionHeader'
import { Card } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { buttonVariants } from '@heroui/react/button'
import { Users, Plug, FileText } from 'lucide-react'

export default async function AdminDashboard() {
  await requireAdmin()

  const [clientCount, connectionCount, pendingReports] = await Promise.all([
    db.client.count({ where: { isActive: true } }),
    db.dataConnection.count({ where: { isActive: true } }),
    db.report.count({ where: { status: 'PENDING' } }),
  ])

  const recentClients = await db.client.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { _count: { select: { connections: true } } },
  })

  const stats = [
    { label: 'Active Clients', value: clientCount, icon: Users, href: '/admin/clients', color: 'bg-[#f8f8f8] text-[#0b0b0b]' },
    { label: 'Connections', value: connectionCount, icon: Plug, href: '/admin/connections', color: 'bg-[#f8f8f8] text-[#0b0b0b]' },
    { label: 'Pending Reports', value: pendingReports, icon: FileText, href: '/admin/clients', color: 'bg-[#f8f8f8] text-[#0b0b0b]' },
  ]

  return (
    <div>
      <SectionHeader title="Admin Dashboard" description="Operations snapshot across clients and data connections." />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="border border-default-200/80 bg-content1/95 p-5 shadow-sm transition-colors hover:border-[#babbbb]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-default-500">{s.label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-md ${s.color}`}>
                <s.icon size={15} />
                </div>
              </div>
              <p className="text-3xl font-semibold text-foreground">{s.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="overflow-hidden border border-default-200/80 bg-content1/95 shadow-sm">
        <div className="flex items-center justify-between border-b border-default-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Clients</h3>
          <Link href="/admin/clients" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>View all</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default-100 bg-default-50">
              <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Client</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-default-500">Slug</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-default-500">Connections</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-default-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentClients.map((c) => (
              <tr key={c.id} className="border-b border-default-50 hover:bg-default-50/70">
                <td className="px-5 py-3 font-medium text-foreground">{c.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-default-400">{c.slug}</td>
                <td className="px-5 py-3 text-right text-default-700">{c._count.connections}</td>
                <td className="px-5 py-3 text-right">
                  <Chip color={c.isActive ? 'success' : 'default'} variant="soft" size="sm">{c.isActive ? 'Active' : 'Inactive'}</Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
