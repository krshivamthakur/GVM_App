import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShadcnMetricCardProps {
  title: string
  value: string | number
  subtext?: string
  trend?: {
    value: string
    isPositive?: boolean
  }
  icon: LucideIcon
  className?: string
}

export function ShadcnMetricCard({
  title,
  value,
  subtext,
  trend,
  icon: Icon,
  className
}: ShadcnMetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs transition-all hover:shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium tracking-tight text-muted-foreground">{title}</h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        {(subtext || trend) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {trend && (
              <span
                className={cn(
                  'font-medium',
                  trend.isPositive !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {trend.value}
              </span>
            )}
            {subtext && <span>{subtext}</span>}
          </p>
        )}
      </div>
    </div>
  )
}
