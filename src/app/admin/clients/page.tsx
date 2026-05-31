import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { format } from 'date-fns'
import SectionHeader from '@/components/ui/SectionHeader'

export default async function ClientsPage() {
  await requireAdmin()

  const clients = await db.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { connections: true, users: true } },
      reports: { orderBy: { month: 'desc' }, take: 1 },
    },
  })

  return (
    <div>
      <SectionHeader
        title="Clients"
        description={`${clients.length} total`}
        action={
          <Link
            href="/admin/clients/new"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Add Client
          </Link>
        }
      />

      <div className="grid gap-4">
        {clients.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: c.primaryColor }}
                >
                  {c.name[0]}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{c.name}</h3>
                  <p className="text-xs text-gray-400 font-mono">{c.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
                <Link
                  href={`/admin/clients/${c.id}`}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Manage
                </Link>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-5 text-xs text-gray-500">
              <span>{c._count.connections} connections</span>
              <span>{c._count.users} users</span>
              {c.reports[0] && <span>Last report: {c.reports[0].month}</span>}
              <span>Added {format(c.createdAt, 'MMM d, yyyy')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
