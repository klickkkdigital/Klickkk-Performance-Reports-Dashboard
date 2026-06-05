import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from '@heroui/react/card'

type Props = {
  label: string
  value: string
  subValue?: string
  icon?: LucideIcon
  trend?: number // percentage change vs prior period
  iconBg?: string
}

export default function KpiCard({ label, value, subValue, icon: Icon, trend, iconBg = 'bg-[#f8f8f8]' }: Props) {
  const trendPositive = trend !== undefined && trend > 0
  const trendNegative = trend !== undefined && trend < 0

  return (
    <Card className="border border-default-200/80 bg-content1/95 p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-default-500">{label}</p>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-md ${iconBg}`}>
            <Icon size={17} className="text-default-700" />
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {subValue && <p className="text-xs text-default-400">{subValue}</p>}
        {trend !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              trendPositive ? 'bg-[#f8f8f8] text-[#0b0b0b]' : trendNegative ? 'bg-[#e6e6e6] text-[#0b0b0b]' : 'bg-default-100 text-default-500'
            }`}
          >
            {trendPositive ? <TrendingUp size={11} /> : trendNegative ? <TrendingDown size={11} /> : <Minus size={11} />}
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
    </Card>
  )
}
