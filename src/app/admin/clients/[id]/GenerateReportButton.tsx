'use client'
import { useState } from 'react'
import { format } from 'date-fns'

export default function GenerateReportButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  const currentMonth = format(new Date(), 'yyyy-MM')

  const handleGenerate = async () => {
    setLoading(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, month: currentMonth }),
      })
      if (res.ok) {
        setStatus('ok')
        setTimeout(() => window.location.reload(), 1200)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'ok' && <span className="text-xs text-emerald-600">Processing…</span>}
      {status === 'error' && <span className="text-xs text-red-500">Failed — check connections</span>}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
      >
        {loading ? 'Generating…' : `Generate ${format(new Date(), 'MMM yyyy')} Report`}
      </button>
    </div>
  )
}
