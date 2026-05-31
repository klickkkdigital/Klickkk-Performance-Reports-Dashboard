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

type DataPoint = { date: string; spend: number; revenue: number }

export default function SpendRevenueChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Spend vs Revenue</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
          <Area type="monotone" dataKey="spend" name="Spend" stroke="#f43f5e" fill="url(#spend)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fill="url(#revenue)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
