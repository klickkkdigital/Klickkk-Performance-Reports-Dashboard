'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@heroui/react/button'

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
      {status === 'ok' && <span className="text-xs text-[#0b0b0b]">Processing…</span>}
      {status === 'error' && <span className="text-xs text-default-600">Failed — check connections</span>}
      <Button
        onClick={handleGenerate}
        isDisabled={loading}
        size="sm"
        variant="primary"
      >
        {loading ? 'Generating…' : `Generate ${format(new Date(), 'MMM yyyy')} Report`}
      </Button>
    </div>
  )
}
