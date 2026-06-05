import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { format } from 'date-fns'
import SectionHeader from '@/components/ui/SectionHeader'
import { Card } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { EmptyState } from '@heroui/react/empty-state'
import { buttonVariants } from '@heroui/react/button'
import { FileText, CheckCircle, Clock, XCircle, Loader } from 'lucide-react'

const statusIcon = {
  READY: CheckCircle,
  PENDING: Clock,
  PROCESSING: Loader,
  FAILED: XCircle,
}

const statusStyle = {
  READY: 'success',
  PENDING: 'default',
  PROCESSING: 'accent',
  FAILED: 'danger',
} as const

export default async function ReportsPage() {
  const session = await requireSession()
  const clientId = session.clientId!

  const reports = await db.report.findMany({
    where: { clientId },
    orderBy: { month: 'desc' },
  })

  return (
    <div>
      <SectionHeader title="Monthly Reports" description="Download or view your monthly performance reports." />

      <div className="space-y-3">
        {reports.length === 0 ? (
          <Card className="border border-default-200/80 bg-content1/95 p-12 text-center shadow-sm">
            <EmptyState>
              <FileText size={32} className="mx-auto mb-3 text-default-300" />
              <p className="text-sm text-default-500">No reports generated yet.</p>
            </EmptyState>
          </Card>
        ) : reports.map((r) => {
          const Icon = statusIcon[r.status]
          const style = statusStyle[r.status]
          const [year, mon] = r.month.split('-')
          const label = format(new Date(parseInt(year), parseInt(mon) - 1), 'MMMM yyyy')

          return (
            <Card key={r.id} className="flex flex-col gap-4 border border-default-200/80 bg-content1/95 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f8f8f8]">
                  <FileText size={18} className="text-[#0b0b0b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  {r.generatedAt && (
                    <p className="text-xs text-default-400">Generated {format(r.generatedAt, 'MMM d, yyyy')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Chip color={style} variant="soft" size="sm" className="gap-1.5">
                  <Icon size={11} />
                  {r.status}
                </Chip>
                {r.status === 'READY' && (
                  <a
                    href={`/reports/${r.id}/pdf`}
                    target="_blank"
                    className={buttonVariants({ variant: 'primary', size: 'sm' })}
                  >
                    Download PDF
                  </a>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
