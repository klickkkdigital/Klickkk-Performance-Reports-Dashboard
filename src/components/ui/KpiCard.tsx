import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Props = {
  label: string
  value: string
  subValue?: string
  icon?: LucideIcon
  trend?: number // percentage change vs prior period
  iconBg?: string
}

export default function KpiCard({ label, value, subValue, icon: Icon, trend, iconBg = 'bg-indigo-50' }: Props) {
  const trendPositive = trend !== undefined && trend > 0
  const trendNegative = trend !== undefined && trend < 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        {Icon && (
          <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center`}>
            <Icon size={16} className="text-gray-700" />
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-1.5">
        {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
        {trend !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${
              trendPositive ? 'text-emerald-600' : trendNegative ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            {trendPositive ? <TrendingUp size={11} /> : trendNegative ? <TrendingDown size={11} /> : <Minus size={11} />}
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
