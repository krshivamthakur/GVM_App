'use client'

import React, { useState } from 'react'

interface DataPoint {
  name: string
  total: number
}

const DEFAULT_DATA: DataPoint[] = [
  { name: 'Jan', total: 1800 },
  { name: 'Feb', total: 2400 },
  { name: 'Mar', total: 3200 },
  { name: 'Apr', total: 2900 },
  { name: 'May', total: 4100 },
  { name: 'Jun', total: 4800 },
  { name: 'Jul', total: 3900 },
  { name: 'Aug', total: 5200 },
  { name: 'Sep', total: 4700 },
  { name: 'Oct', total: 5800 },
  { name: 'Nov', total: 6100 },
  { name: 'Dec', total: 6800 }
]

interface OverviewChartProps {
  data?: DataPoint[]
  title?: string
  description?: string
  valuePrefix?: string
}

export function OverviewChart({
  data = DEFAULT_DATA,
  title = 'Overview',
  description = 'Monthly platform engagement & active learning hours',
  valuePrefix = ''
}: OverviewChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const maxVal = Math.max(...data.map((d) => d.total)) * 1.15

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-xs p-6">
      <div className="flex flex-col space-y-1.5 pb-6">
        <h3 className="font-semibold leading-none tracking-tight text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="relative h-[280px] w-full pt-4">
        {/* Horizontal Background Grid Lines */}
        <div className="absolute inset-x-0 inset-y-8 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-dashed border-border w-full" />
          <div className="border-b border-dashed border-border w-full" />
          <div className="border-b border-dashed border-border w-full" />
          <div className="border-b border-dashed border-border w-full" />
        </div>

        {/* Bar Chart Columns */}
        <div className="relative h-full flex items-end justify-between gap-2 pb-6 px-2">
          {data.map((item, idx) => {
            const heightPercent = Math.max(8, Math.round((item.total / maxVal) * 100))
            const isHovered = hoveredIdx === idx

            return (
              <div
                key={item.name}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="absolute -top-4 px-2 py-1 bg-foreground text-background text-[11px] font-medium rounded-md shadow-md pointer-events-none transform -translate-y-full z-20 whitespace-nowrap">
                    {item.name}: {valuePrefix}{item.total.toLocaleString()}
                  </div>
                )}

                {/* Bar */}
                <div className="w-full max-w-[36px] bg-primary/10 rounded-t-sm overflow-hidden flex items-end h-[85%]">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isHovered
                        ? 'bg-primary'
                        : 'bg-primary/80 group-hover:bg-primary'
                    }`}
                  />
                </div>

                {/* X-Axis Label */}
                <span className="text-[11px] text-muted-foreground mt-2 font-medium">
                  {item.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
