import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { Users, Plug, FileText, Activity } from 'lucide-react'

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
    { label: 'Active Clients', value: clientCount, icon: Users, href: '/admin/clients', color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Connections', value: connectionCount, icon: Plug, href: '/admin/connections', color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Reports', value: pendingReports, icon: FileText, href: '/admin/clients', color: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon size={15} />
              </div>
            </div>
            <p className="text-3xl font-semibold text-gray-900">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Recent Clients</h3>
          <Link href="/admin/clients" className="text-xs text-indigo-600 hover:text-indigo-700">View all</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Client</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Slug</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">Connections</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentClients.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-5 py-3 text-gray-400 font-mono text-xs">{c.slug}</td>
                <td className="px-5 py-3 text-right text-gray-700">{c._count.connections}</td>
                <td className="px-5 py-3 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
