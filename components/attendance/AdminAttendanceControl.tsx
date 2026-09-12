'use client'

import React, { useState } from 'react'
import {
  AttendanceSummary,
  AttendanceSession,
  AttendanceClass,
  AttendanceRule,
  AttendanceAuditLog,
  LeaveRequest,
  AttendanceRecord,
  AttendanceStatus,
} from '@/types/attendance'
import { AttendanceStatusBadge } from './AttendanceStatusBadge'
import { LeaveApprovalPanel } from './LeaveApprovalPanel'
import {
  ShieldCheck,
  BarChart3,
  Users,
  Lock,
  Unlock,
  Settings,
  History,
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  Save,
  QrCode,
  Fingerprint,
  MapPin,
  Camera,
  Cpu,
  FileText,
  TrendingDown,
  ClipboardList,
} from 'lucide-react'
import {
  updateAttendanceRules,
  lockAttendanceSession,
  correctAttendanceRecord,
  getAttendanceReport,
} from '@/actions/attendance-actions'

interface AdminAttendanceControlProps {
  allSummaries: AttendanceSummary[]
  sessions: AttendanceSession[]
  classes: AttendanceClass[]
  rule: AttendanceRule
  auditLog: AttendanceAuditLog[]
  leaveRequests: LeaveRequest[]
  adminId: string
  adminName: string
}

type Tab = 'overview' | 'sessions' | 'leaves' | 'rules' | 'advanced'

export function AdminAttendanceControl({
  allSummaries,
  sessions: initialSessions,
  classes,
  rule: initialRule,
  auditLog: initialAuditLog,
  leaveRequests,
  adminId,
  adminName,
}: AdminAttendanceControlProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [sessions, setSessions] = useState<AttendanceSession[]>(initialSessions)
  const [rule, setRule] = useState<AttendanceRule>(initialRule)
  const [ruleEdits, setRuleEdits] = useState<AttendanceRule>(initialRule)
  const [savingRule, setSavingRule] = useState(false)
  const [ruleSaved, setRuleSaved] = useState(false)
  const [auditLog, setAuditLog] = useState<AttendanceAuditLog[]>(initialAuditLog)
  const [sessionFilter, setSessionFilter] = useState<'all' | 'open' | 'locked'>('all')
  const [correctingId, setCorrectingId] = useState<string | null>(null)

  const lowAttendance = allSummaries.filter(s => s.isLowAttendance)
  const totalStudents = allSummaries.length
  const avgAttendance = totalStudents > 0
    ? Math.round(allSummaries.reduce((acc, s) => acc + s.overallPercentage, 0) / totalStudents)
    : 0
  const lockedSessions = sessions.filter(s => s.lockStatus === 'locked').length
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length

  const handleSaveRules = async () => {
    setSavingRule(true)
    const updated = await updateAttendanceRules(ruleEdits)
    setRule(updated)
    setRuleEdits(updated)
    setSavingRule(false)
    setRuleSaved(true)
    setTimeout(() => setRuleSaved(false), 2500)
  }

  const handleLockSession = async (sessionId: string) => {
    await lockAttendanceSession(sessionId, adminId)
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, lockStatus: 'locked', lockedAt: new Date().toISOString() } : s
    ))
  }

  const filteredSessions = sessions.filter(s => {
    if (sessionFilter === 'open') return s.lockStatus === 'open'
    if (sessionFilter === 'locked') return s.lockStatus === 'locked'
    return true
  })

  const exportCSV = (data: unknown[], filename: string) => {
    if (!data.length) return
    const keys = Object.keys(data[0] as object)
    const csv = [keys.join(','), ...data.map(row =>
      keys.map(k => JSON.stringify((row as Record<string, unknown>)[k] ?? '')).join(',')
    )].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
  }

  return (
    <div className="space-y-4">
      {/* Success banner */}
      {ruleSaved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" /> Attendance rules updated successfully.
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1.5 rounded-xl bg-card border border-border shadow-sm flex-wrap">
        {([
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'sessions', label: 'Manage Sessions', icon: ClipboardList },
          { id: 'leaves', label: `Leave Approvals${pendingLeaves > 0 ? ` (${pendingLeaves})` : ''}`, icon: FileText },
          { id: 'rules', label: 'Rules & Audit', icon: Settings },
          { id: 'advanced', label: 'Advanced', icon: Cpu },
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
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Avg. Attendance', value: `${avgAttendance}%`, icon: TrendingDown, color: avgAttendance >= 75 ? 'text-emerald-600' : 'text-rose-600', bg: 'bg-emerald-500/10' },
              { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
              { label: 'Low Attendance', value: lowAttendance.length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-500/10' },
              { label: 'Pending Leaves', value: pendingLeaves, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-500/10' },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${kpi.bg} shrink-0`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div>
                  <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-[11px] text-muted-foreground font-medium">{kpi.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Low Attendance Alert List */}
          {lowAttendance.length > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-card overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border flex items-center justify-between bg-rose-500/5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-foreground">Low Attendance Students</h3>
                </div>
                <button
                  onClick={() => exportCSV(lowAttendance, 'low_attendance.csv')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Student</th>
                      <th className="px-4 py-2.5">Overall %</th>
                      <th className="px-4 py-2.5">Present</th>
                      <th className="px-4 py-2.5">Absent</th>
                      <th className="px-4 py-2.5">Classes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {lowAttendance.map(s => (
                      <tr key={s.studentId} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <img src={s.studentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop'} alt={s.studentName} className="w-7 h-7 rounded-full object-cover border border-border" />
                            <span className="font-semibold text-foreground">{s.studentName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-black text-rose-600">{s.overallPercentage}%</td>
                        <td className="px-4 py-2.5 text-emerald-600 font-semibold">{s.presentCount}</td>
                        <td className="px-4 py-2.5 text-rose-600 font-semibold">{s.absentCount}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{s.totalClasses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Students Summary */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">All Students Attendance</h3>
              <button
                onClick={() => exportCSV(allSummaries, 'attendance_summary.csv')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5">Overall %</th>
                    <th className="px-4 py-2.5">Present</th>
                    <th className="px-4 py-2.5">Absent</th>
                    <th className="px-4 py-2.5">Late</th>
                    <th className="px-4 py-2.5">Leave</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {allSummaries.map(s => (
                    <tr key={s.studentId} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <img src={s.studentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop'} alt={s.studentName} className="w-7 h-7 rounded-full object-cover border border-border" />
                          <span className="font-semibold text-foreground">{s.studentName}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-2.5 font-black ${s.overallPercentage >= 75 ? 'text-emerald-600' : s.overallPercentage >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {s.overallPercentage}%
                      </td>
                      <td className="px-4 py-2.5 text-emerald-600 font-semibold">{s.presentCount}</td>
                      <td className="px-4 py-2.5 text-rose-600 font-semibold">{s.absentCount}</td>
                      <td className="px-4 py-2.5 text-amber-600 font-semibold">{s.lateCount}</td>
                      <td className="px-4 py-2.5 text-blue-600 font-semibold">{s.leaveCount}</td>
                      <td className="px-4 py-2.5">
                        {s.isLowAttendance ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] font-bold">
                            <AlertTriangle className="w-2.5 h-2.5" /> Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Good
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 text-[11px] font-medium">
              {(['all', 'open', 'locked'] as const).map(f => (
                <button key={f} onClick={() => setSessionFilter(f)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                    sessionFilter === f ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'open' ? '🔓 Open' : f === 'locked' ? '🔒 Locked' : 'All'}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{filteredSessions.length} sessions</span>
            <button
              onClick={() => exportCSV(filteredSessions, 'sessions_report.csv')}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" /> Export
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Teacher</th>
                    <th className="px-4 py-3">Present</th>
                    <th className="px-4 py-3">Absent</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredSessions.slice(0, 50).map(session => (
                    <tr key={session.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{session.date}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-28 truncate">{session.className}</td>
                      <td className="px-4 py-3">{session.subjectName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{session.teacherName}</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">{session.presentCount}</td>
                      <td className="px-4 py-3 text-rose-600 font-bold">{session.absentCount}</td>
                      <td className="px-4 py-3">
                        {session.lockStatus === 'locked' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold">
                            ● Open
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {session.lockStatus === 'open' && (
                          <button
                            onClick={() => handleLockSession(session.id)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                            title="Lock this session"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LEAVE APPROVALS */}
      {activeTab === 'leaves' && (
        <LeaveApprovalPanel
          initialLeaves={leaveRequests}
          reviewerId={adminId}
          role="admin"
        />
      )}

      {/* TAB: RULES & AUDIT */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Rules Editor */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Settings className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Attendance Rules</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Minimum Attendance % Required
                  </label>
                  <input
                    type="number" min={0} max={100}
                    value={ruleEdits.minAttendancePercentage}
                    onChange={e => setRuleEdits(prev => ({ ...prev, minAttendancePercentage: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Low Attendance Alert Threshold (%)
                  </label>
                  <input
                    type="number" min={0} max={100}
                    value={ruleEdits.lowAttendanceThreshold}
                    onChange={e => setRuleEdits(prev => ({ ...prev, lowAttendanceThreshold: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Lock Attendance After (days)
                  </label>
                  <input
                    type="number" min={1} max={30}
                    value={ruleEdits.lockAfterDays}
                    onChange={e => setRuleEdits(prev => ({ ...prev, lockAfterDays: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'allowCorrectionByTeacher', label: 'Allow Teacher to Correct Records' },
                    { key: 'allowCorrectionByAdmin', label: 'Allow Admin to Correct Records' },
                    { key: 'parentNotificationsEnabled', label: 'Enable Parent Notifications' },
                    { key: 'autoMarkLeaveOnApproval', label: 'Auto-mark Leave on Approval' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={ruleEdits[key as keyof AttendanceRule] as boolean}
                          onChange={e => setRuleEdits(prev => ({ ...prev, [key]: e.target.checked }))}
                        />
                        <div className={`w-10 h-5 rounded-full transition-colors ${
                          ruleEdits[key as keyof AttendanceRule] ? 'bg-primary' : 'bg-muted'
                        }`} />
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          ruleEdits[key as keyof AttendanceRule] ? 'translate-x-5' : ''
                        }`} />
                      </div>
                      <span className="text-xs font-medium text-foreground">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Semester Start</label>
                    <input
                      type="date" value={ruleEdits.semesterStartDate}
                      onChange={e => setRuleEdits(prev => ({ ...prev, semesterStartDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Semester End</label>
                    <input
                      type="date" value={ruleEdits.semesterEndDate}
                      onChange={e => setRuleEdits(prev => ({ ...prev, semesterEndDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveRules}
                  disabled={savingRule}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                >
                  {savingRule ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingRule ? 'Saving...' : 'Save Rules'}
                </button>
              </div>
            </div>

            {/* Audit Log */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-bold text-foreground">Audit Log</h3>
                </div>
                <span className="text-xs text-muted-foreground">{auditLog.length} entries</span>
              </div>
              <div className="divide-y divide-border/60 max-h-80 overflow-y-auto">
                {auditLog.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">No audit entries yet.</div>
                ) : auditLog.map(log => (
                  <div key={log.id} className="px-4 py-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground capitalize">{log.action}</span>
                      <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">
                      By: {log.performedByName}
                      {log.oldValue && log.newValue && (
                        <> · Changed: <AttendanceStatusBadge status={log.oldValue} size="sm" /> → <AttendanceStatusBadge status={log.newValue} size="sm" /></>
                      )}
                    </p>
                    {log.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{log.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ADVANCED */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-1">Advanced Attendance Methods</h3>
            <p className="text-xs text-muted-foreground">Premium attendance capture integrations available for upgrade.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: QrCode, label: 'QR Code Attendance', desc: 'Students scan a session-specific QR code to mark attendance automatically.', color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
              { icon: Fingerprint, label: 'Biometric Integration', desc: 'Fingerprint scanner integration for secure and fast attendance capture.', color: 'text-violet-600', bg: 'bg-violet-500/10' },
              { icon: Cpu, label: 'RFID Attendance', desc: 'RFID card tap system for instant attendance recording at entry points.', color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
              { icon: MapPin, label: 'GPS / Location Based', desc: 'Geo-fence based attendance — students must be on-campus to mark present.', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
              { icon: Camera, label: 'Face Recognition', desc: 'AI-powered facial recognition for contactless and secure attendance.', color: 'text-amber-600', bg: 'bg-amber-500/10' },
              { icon: ShieldCheck, label: 'Automatic Sync', desc: 'Real-time synchronization across all devices, classes, and admin panels.', color: 'text-rose-600', bg: 'bg-rose-500/10' },
            ].map(method => (
              <div key={method.label} className="rounded-xl border border-dashed border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/30 hover:bg-primary/5 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${method.bg}`}>
                    <method.icon className={`w-5 h-5 ${method.color}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{method.label}</h4>
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{method.desc}</p>
                <button
                  disabled
                  className="w-full py-1.5 rounded-xl border border-border text-[11px] font-semibold text-muted-foreground cursor-not-allowed opacity-50"
                >
                  Configure Integration
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
