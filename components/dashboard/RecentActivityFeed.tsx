import React from 'react'

export interface ActivityItem {
  id: string
  name: string
  email: string
  avatarUrl?: string
  action: string
  amountOrStatus?: string
  date?: string
}

interface RecentActivityFeedProps {
  title?: string
  subtitle?: string
  items: ActivityItem[]
}

export function RecentActivityFeed({
  title = 'Recent Activity',
  subtitle = 'Latest platform events and student enrollments',
  items
}: RecentActivityFeedProps) {
  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-xs p-6 flex flex-col justify-between">
      <div className="flex flex-col space-y-1.5 pb-4">
        <h3 className="font-semibold leading-none tracking-tight text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No recent activity found.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs uppercase shrink-0 overflow-hidden border border-border">
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{item.name?.slice(0, 2) || 'US'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-none text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.email}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-foreground">{item.amountOrStatus || item.action}</p>
                {item.date && <p className="text-[11px] text-muted-foreground">{item.date}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
