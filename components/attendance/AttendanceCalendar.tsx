'use client'

import React, { useState } from 'react'
import { AttendanceRecord, AttendanceStatus } from '@/types/attendance'
import { AttendanceDot } from './AttendanceStatusBadge'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AttendanceCalendarProps {
  records: AttendanceRecord[]
  studentName?: string
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500',
  absent: 'bg-rose-500',
  late: 'bg-amber-500',
  leave: 'bg-blue-500',
  half_day: 'bg-orange-500',
  excused: 'bg-slate-400',
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  leave: 'Leave',
  half_day: 'Half Day',
  excused: 'Excused',
}

export function AttendanceCalendar({ records, studentName }: AttendanceCalendarProps) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const recordsByDate = new Map<string, AttendanceRecord[]>()
  for (const rec of records) {
    const d = rec.date.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`
      ? rec.date : null
    if (!d) continue
    if (!recordsByDate.has(d)) recordsByDate.set(d, [])
    recordsByDate.get(d)!.push(rec)
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const getDayStatus = (day: number): AttendanceStatus | null => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayRecords = recordsByDate.get(dateStr)
    if (!dayRecords || dayRecords.length === 0) return null
    // Aggregate: if any absent, show absent; else first status
    if (dayRecords.some(r => r.status === 'absent')) return 'absent'
    return dayRecords[0].status
  }

  const isToday = (day: number) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  const isWeekend = (dayOfWeek: number) => dayOfWeek === 0 || dayOfWeek === 6

  const calendarCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Stats for this month
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthRecords = records.filter(r => r.date.startsWith(monthStr))
  const presentCount = monthRecords.filter(r => r.status === 'present').length
  const absentCount = monthRecords.filter(r => r.status === 'absent').length
  const lateCount = monthRecords.filter(r => r.status === 'late').length
  const leaveCount = monthRecords.filter(r => r.status === 'leave').length
  const totalClasses = monthRecords.length
  const percentage = totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Header + navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h3 className="text-sm font-bold text-foreground">{monthLabel}</h3>
          {totalClasses > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {presentCount + lateCount}/{totalClasses} classes • <span className={percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}>{percentage}%</span>
            </p>
          )}
        </div>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
          disabled={viewDate >= new Date(today.getFullYear(), today.getMonth(), 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
          <div key={d} className={`text-[10px] font-semibold py-1 ${i === 0 || i === 6 ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />
          const dow = (firstDay + day - 1) % 7
          const status = getDayStatus(day)
          const todayHighlight = isToday(day)
          const weekend = isWeekend(dow)

          return (
            <div
              key={day}
              className={`relative flex flex-col items-center justify-center rounded-lg aspect-square text-xs font-medium transition-all
                ${todayHighlight ? 'ring-2 ring-primary ring-offset-1' : ''}
                ${weekend ? 'opacity-40' : ''}
                ${status ? 'bg-muted/30' : 'hover:bg-muted/30'}
              `}
            >
              <span className={`text-[11px] ${todayHighlight ? 'font-bold text-primary' : 'text-foreground'}`}>
                {day}
              </span>
              {status && !weekend && (
                <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status]}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
        {(Object.entries(STATUS_COLORS) as [AttendanceStatus, string][]).map(([status, colorClass]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${colorClass}`} />
            <span className="text-[10px] text-muted-foreground font-medium">{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
