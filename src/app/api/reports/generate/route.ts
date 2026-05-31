import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { syncClientData } from '@/lib/sync'
import { generateReportSummary } from '@/lib/report-summary'

// POST /api/reports/generate  { clientId, month: "2025-04" }
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { clientId, month } = body

  if (!clientId || !month) {
    return NextResponse.json({ error: 'clientId and month required' }, { status: 400 })
  }

  // Create or reset the report record
  const report = await db.report.upsert({
    where: { clientId_month: { clientId, month } },
    create: { clientId, month, status: 'PROCESSING' },
    update: { status: 'PROCESSING', pdfUrl: null, generatedAt: null },
  })

  // Run sync + summary in background (don't await — return immediately)
  processReport(report.id, clientId, month).catch(async (err) => {
    console.error(`Report generation failed for ${clientId}/${month}:`, err)
    await db.report.update({ where: { id: report.id }, data: { status: 'FAILED' } })
  })

  return NextResponse.json({ reportId: report.id, status: 'PROCESSING' })
}

async function processReport(reportId: string, clientId: string, month: string) {
  // 1. Pull fresh data from all connected platforms
  await syncClientData(clientId, month)

  // 2. Compute KPI summary
  const summary = await generateReportSummary(clientId, month)

  // 3. Mark ready (PDF generation is done client-side via print or separately)
  await db.report.update({
    where: { id: reportId },
    data: { status: 'READY', summary, generatedAt: new Date() },
  })
}
