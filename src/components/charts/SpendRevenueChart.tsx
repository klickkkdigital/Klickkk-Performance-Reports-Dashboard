'use client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { Card } from '@heroui/react/card'

type DataPoint = { date: string; spend: number; revenue: number }

export default function SpendRevenueChart({ data }: { data: DataPoint[] }) {
  return (
    <Card className="border border-default-200/80 bg-content1/95 p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Spend vs Revenue</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0b0b0b" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#0b0b0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#babbbb" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#babbbb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), 'MMM d')}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v, name) => [`$${Number(v).toLocaleString()}`, String(name)]}
            labelFormatter={(l) => format(parseISO(l as string), 'MMM d, yyyy')}
            contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="spend" name="Spend" stroke="#0b0b0b" fill="url(#spend)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#babbbb" fill="url(#revenue)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
