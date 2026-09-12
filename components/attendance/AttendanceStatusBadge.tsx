'use client'

import React from 'react'
import { AttendanceStatus } from '@/types/attendance'

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: string; className: string; dotClass: string }> = {
  present:  { label: 'Present',   icon: '✓', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', dotClass: 'bg-emerald-500' },
  absent:   { label: 'Absent',    icon: '✗', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',             dotClass: 'bg-rose-500' },
  late:     { label: 'Late',      icon: '⏱', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',         dotClass: 'bg-amber-500' },
  leave:    { label: 'Leave',     icon: '📋', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',           dotClass: 'bg-blue-500' },
  half_day: { label: 'Half Day',  icon: '◑', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',   dotClass: 'bg-orange-500' },
  excused:  { label: 'Excused',   icon: '∅', className: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',       dotClass: 'bg-slate-400' },
}

const SIZE_CLASS = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-xs',
}

export function AttendanceStatusBadge({ status, size = 'md', showIcon = true }: AttendanceStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${config.className} ${SIZE_CLASS[size]}`}
    >
      {showIcon && <span className="text-[10px]">{config.icon}</span>}
      {config.label}
    </span>
  )
}

export function AttendanceDot({ status }: { status: AttendanceStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${config.dotClass}`}
      title={config.label}
    />
  )
}

export function StatusSelector({
  value,
  onChange,
  disabled,
}: {
  value: AttendanceStatus
  onChange: (s: AttendanceStatus) => void
  disabled?: boolean
}) {
  const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'leave', 'half_day', 'excused']
  return (
    <div className="flex flex-wrap gap-1">
      {statuses.map((s) => {
        const config = STATUS_CONFIG[s]
        const isSelected = value === s
        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all cursor-pointer ${
              isSelected
                ? config.className + ' ring-1 ring-offset-1 ring-current scale-105'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {config.icon} {config.label}
          </button>
        )
      })}
    </div>
  )
}

export { STATUS_CONFIG }
