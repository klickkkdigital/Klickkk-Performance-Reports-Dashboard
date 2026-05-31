'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Props = {
  data: Array<{ type: string; spend: number; impressions: number; clicks: number; roas: number }>
}

const COLORS: Record<string, string> = {
  AWARENESS: '#8b5cf6',
  TRAFFIC: '#3b82f6',
  SALES: '#10b981',
}

export default function CampaignTypeBreakdown({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Spend by Campaign Type</h3>
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
              <Cell key={d.type} fill={COLORS[d.type] ?? '#6366f1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {data.map((d) => (
          <div key={d.type} className="text-center">
            <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[d.type] }} />
            <p className="text-xs text-gray-500 capitalize">{d.type.toLowerCase()}</p>
            {d.type === 'SALES' && (
              <p className="text-xs font-medium text-gray-900">ROAS {d.roas.toFixed(2)}x</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
