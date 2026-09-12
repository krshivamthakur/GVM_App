'use client'

import React, { useState } from 'react'
import { AttendanceSummary, AttendanceRecord, AttendanceClass, LeaveRequest } from '@/types/attendance'
import { AttendanceStatusBadge } from './AttendanceStatusBadge'
import { AttendanceCalendar } from './AttendanceCalendar'
import { LeaveRequestModal } from './LeaveRequestModal'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BookOpen,
  BarChart3,
  FileText,
  Clock,
  ChevronDown,
  Plus,
} from 'lucide-react'

interface StudentAttendanceViewProps {
  summary: AttendanceSummary | null
  history: AttendanceRecord[]
  classes: AttendanceClass[]
  leaveRequests: LeaveRequest[]
  studentId: string
  studentName: string
  studentAvatar?: string
  minAttendancePercentage: number
}

type Tab = 'overview' | 'calendar' | 'semester' | 'leaves'

export function StudentAttendanceView({
  summary,
  history,
  classes,
  leaveRequests: initialLeaves,
  studentId,
  studentName,
  studentAvatar,
  minAttendancePercentage,
}: StudentAttendanceViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaves, setLeaves] = useState<LeaveRequest[]>(initialLeaves)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7))

  const classOptions = classes.map(c => ({ id: c.id, name: c.name }))

  const pct = summary?.overallPercentage || 0
  const isLow = pct < minAttendancePercentage
  const pctColor = pct >= 75 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-rose-600'
  const pctBg = pct >= 75 ? 'from-emerald-500 to-emerald-600' : pct >= 60 ? 'from-amber-500 to-amber-600' : 'from-rose-500 to-rose-600'

  const monthHistory = history.filter(r => r.date.startsWith(selectedMonth))

  return (
    <div className="space-y-4">
      {/* Low attendance alert */}
      {isLow && summary && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-xs font-semibold">
            ⚠️ Your attendance is below the minimum {minAttendancePercentage}% requirement. 
            Current: <strong>{pct}%</strong>. Please contact your teacher immediately.
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1.5 rounded-xl bg-card border border-border shadow-sm flex-wrap">
        {([
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'semester', label: 'Semester View', icon: BarChart3 },
          { id: 'leaves', label: `Leave Requests${leaves.filter(l => l.status === 'pending').length > 0 ? ` (${leaves.filter(l => l.status === 'pending').length})` : ''}`, icon: FileText },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Overall Percentage Hero */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Circular meter */}
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/40" />
                  <circle
                    cx="60" cy="60" r="50" fill="none" strokeWidth="10"
                    stroke="url(#pctGrad)"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="pctGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'} />
                      <stop offset="100%" stopColor={pct >= 75 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626'} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-black ${pctColor}`}>{pct}%</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Overall</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                {[
                  { label: 'Total Classes', value: summary?.totalClasses || 0, color: 'text-foreground' },
                  { label: 'Present', value: summary?.presentCount || 0, color: 'text-emerald-600' },
                  { label: 'Absent', value: summary?.absentCount || 0, color: 'text-rose-600' },
                  { label: 'Late', value: summary?.lateCount || 0, color: 'text-amber-600' },
                  { label: 'Leave', value: summary?.leaveCount || 0, color: 'text-blue-600' },
                  { label: 'Excused', value: summary?.excusedCount || 0, color: 'text-slate-600' },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                    <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-muted-foreground">Attendance Progress</span>
                <span className={pctColor}>{pct}% / {minAttendancePercentage}% required</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${pctBg} transition-all duration-1000`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              {pct < minAttendancePercentage && (
                <p className="text-[11px] text-rose-600 font-semibold">
                  Need {Math.ceil((minAttendancePercentage * (summary?.totalClasses || 0) - (summary?.presentCount || 0) * 100) / (100 - minAttendancePercentage))} more classes present to meet requirement
                </p>
              )}
            </div>
          </div>

          {/* Subject Breakdown */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Subject-wise Attendance</h3>
            </div>
            <div className="divide-y divide-border/60">
              {summary?.subjectBreakdown.map(subject => (
                <div key={subject.subjectId} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-semibold text-foreground truncate">{subject.subjectName}</span>
                      {subject.isLowAttendance && (
                        <span className="flex items-center gap-0.5 text-[10px] text-rose-600 font-semibold shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" /> Low
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>{subject.present}P / {subject.absent}A / {subject.late}L</span>
                      <span>Total: {subject.totalClasses}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          subject.percentage >= 75 ? 'bg-emerald-500' : subject.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${subject.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className={`text-lg font-black shrink-0 ${
                    subject.percentage >= 75 ? 'text-emerald-600' : subject.percentage >= 60 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {subject.percentage}%
                  </div>
                </div>
              ))}
              {(!summary?.subjectBreakdown?.length) && (
                <div className="p-8 text-center text-xs text-muted-foreground">No attendance records found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4">Monthly Attendance Calendar</h3>
          <AttendanceCalendar records={history} studentName={studentName} />
        </div>
      )}

      {/* TAB: SEMESTER VIEW */}
      {activeTab === 'semester' && (
        <div className="space-y-4">
          {/* Month selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-muted-foreground">View Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Monthly bar chart */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4">Monthly Breakdown</h3>
            <div className="space-y-3">
              {summary?.monthlyBreakdown.map(m => (
                <div key={m.month} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-muted-foreground">{m.monthLabel}</span>
                    <span className={m.percentage >= 75 ? 'text-emerald-600' : m.percentage >= 60 ? 'text-amber-600' : 'text-rose-600'}>
                      {m.percentage}% ({m.present}/{m.totalClasses})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        m.percentage >= 75 ? 'bg-emerald-500' : m.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${m.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {!summary?.monthlyBreakdown?.length && (
                <p className="text-xs text-muted-foreground text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Daily records table for selected month */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-3.5 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Daily Records — {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Subject</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {monthHistory.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No records for this month.</td></tr>
                  ) : monthHistory.map(r => (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium">{r.date}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.subjectName}</td>
                      <td className="px-4 py-2.5"><AttendanceStatusBadge status={r.status} size="sm" /></td>
                      <td className="px-4 py-2.5 text-muted-foreground text-[10px]">{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LEAVE MANAGEMENT */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">My Leave Requests</h3>
              <p className="text-xs text-muted-foreground">{leaves.length} total requests</p>
            </div>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Leave Request
            </button>
          </div>

          {leaves.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center rounded-xl border border-border bg-card">
              <FileText className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">No leave requests yet</p>
              <p className="text-xs text-muted-foreground">Submit a leave request when you need to miss class.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaves.map(leave => (
                <div key={leave.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">{leave.className}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        📅 {leave.fromDate} → {leave.toDate}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{leave.reason}</p>
                      {leave.reviewNote && (
                        <div className="mt-2 p-2 rounded-lg bg-muted/50 border border-border">
                          <p className="text-[10px] text-muted-foreground">Teacher response: <span className="text-foreground">{leave.reviewNote}</span></p>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {leave.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[10px] font-bold">
                          <Clock className="w-2.5 h-2.5" /> Pending
                        </span>
                      )}
                      {leave.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-bold">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Approved
                        </span>
                      )}
                      {leave.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/10 text-rose-700 border border-rose-500/20 text-[10px] font-bold">
                          ✗ Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <LeaveRequestModal
          studentId={studentId}
          studentName={studentName}
          studentAvatar={studentAvatar}
          classes={classOptions}
          onClose={() => setShowLeaveModal(false)}
          onSubmitted={leave => setLeaves(prev => [leave, ...prev])}
        />
      )}
    </div>
  )
}
