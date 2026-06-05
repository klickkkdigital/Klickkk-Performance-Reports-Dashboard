'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card } from '@heroui/react/card'

type Props = {
  data: Array<{ type: string; spend: number; impressions: number; clicks: number; roas: number }>
}

const COLORS: Record<string, string> = {
  AWARENESS: '#0b0b0b',
  TRAFFIC: '#777777',
  SALES: '#babbbb',
}

export default function CampaignTypeBreakdown({ data }: Props) {
  return (
    <Card className="border border-default-200/80 bg-content1/95 p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Spend by Campaign Type</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Spend']}
            contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.type} fill={COLORS[d.type] ?? '#0b0b0b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {data.map((d) => (
          <div key={d.type} className="text-center">
            <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[d.type] }} />
            <p className="text-xs capitalize text-default-500">{d.type.toLowerCase()}</p>
            {d.type === 'SALES' && (
              <p className="text-xs font-medium text-foreground">ROAS {d.roas.toFixed(2)}x</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
