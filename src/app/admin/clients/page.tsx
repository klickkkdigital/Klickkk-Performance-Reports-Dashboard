import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { format } from 'date-fns'
import SectionHeader from '@/components/ui/SectionHeader'
import { Card } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { buttonVariants } from '@heroui/react/button'

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
            className={buttonVariants({ variant: 'primary', size: 'md' })}
          >
            + Add Client
          </Link>
        }
      />

      <div className="grid gap-4">
        {clients.map((c) => (
          <Card key={c.id} className="border border-default-200/80 bg-content1/95 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
                  style={{ backgroundColor: c.primaryColor }}
                >
                  {c.name[0]}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{c.name}</h3>
                  <p className="font-mono text-xs text-default-400">{c.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Chip color={c.isActive ? 'success' : 'default'} variant="soft" size="sm">{c.isActive ? 'Active' : 'Inactive'}</Chip>
                <Link
                  href={`/admin/clients/${c.id}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Manage
                </Link>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-default-500">
              <span>{c._count.connections} connections</span>
              <span>{c._count.users} users</span>
              {c.reports[0] && <span>Last report: {c.reports[0].month}</span>}
              <span>Added {format(c.createdAt, 'MMM d, yyyy')}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
