import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { format } from 'date-fns'
import SectionHeader from '@/components/ui/SectionHeader'
import { FileText, CheckCircle, Clock, XCircle, Loader } from 'lucide-react'

const statusIcon = {
  READY: CheckCircle,
  PENDING: Clock,
  PROCESSING: Loader,
  FAILED: XCircle,
}

const statusStyle = {
  READY: 'text-emerald-600 bg-emerald-50',
  PENDING: 'text-gray-500 bg-gray-100',
  PROCESSING: 'text-blue-600 bg-blue-50',
  FAILED: 'text-red-500 bg-red-50',
}

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
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No reports generated yet.</p>
          </div>
        ) : reports.map((r) => {
          const Icon = statusIcon[r.status]
          const style = statusStyle[r.status]
          const [year, mon] = r.month.split('-')
          const label = format(new Date(parseInt(year), parseInt(mon) - 1), 'MMMM yyyy')

          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <FileText size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  {r.generatedAt && (
                    <p className="text-xs text-gray-400">Generated {format(r.generatedAt, 'MMM d, yyyy')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${style}`}>
                  <Icon size={11} />
                  {r.status}
                </span>
                {r.status === 'READY' && (
                  <a
                    href={`/reports/${r.id}/pdf`}
                    target="_blank"
                    className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Download PDF
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
