'use client'

import React, { useState } from 'react'
import {
  AttendanceSummary,
  AttendanceSession,
  AttendanceClass,
  AttendanceSubject,
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
  Settings,
  History,
  AlertTriangle,
  CheckCircle2,
  Download,
  Save,
  QrCode,
  Fingerprint,
  MapPin,
  Camera,
  Cpu,
  FileText,
  TrendingDown,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  UserPlus,
  X,
  GraduationCap,
  UserCheck,
} from 'lucide-react'
import { AdminTakeAttendancePanel } from './AdminTakeAttendancePanel'
import {
  updateAttendanceRules,
  lockAttendanceSession,
  correctAttendanceRecord,
  getAttendanceReport,
  createClass,
  updateClass,
  deleteClass,
  addClassStudent,
  removeClassStudent,
  addClassSubject,
  type TeacherOption,
  type CourseOption,
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
  teachers?: TeacherOption[]
  courses?: CourseOption[]
}

type Tab = 'overview' | 'classes' | 'take_attendance' | 'sessions' | 'leaves' | 'rules' | 'advanced'

export function AdminAttendanceControl({
  allSummaries,
  sessions: initialSessions,
  classes: initialClasses,
  rule: initialRule,
  auditLog: initialAuditLog,
  leaveRequests,
  adminId,
  adminName,
  teachers = [],
  courses = [],
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
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<string | undefined>(undefined)

  // Classes management state
  const [classes, setClasses] = useState<AttendanceClass[]>(initialClasses)
  const [classFormOpen, setClassFormOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null)
  const [classForm, setClassForm] = useState({ name: '', courseName: '', courseId: '', teacherName: '', teacherId: '' })
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '' })
  const [studentForm, setStudentForm] = useState({ name: '', rollNumber: '' })
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  const [classActionLoading, setClassActionLoading] = useState(false)

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
          { id: 'classes', label: `Manage Classes (${classes.length})`, icon: GraduationCap },
          { id: 'take_attendance', label: 'Take Attendance (Proxy)', icon: UserCheck },
          { id: 'sessions', label: `Sessions (${sessions.length})`, icon: ClipboardList },
          { id: 'leaves', label: `Leaves${pendingLeaves > 0 ? ` (${pendingLeaves})` : ''}`, icon: FileText },
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
          {/* Quick Proxy Attendance Action Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/15 text-primary shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Proxy Attendance Control</h4>
                <p className="text-[11px] text-muted-foreground">Admin override: Record, review, or adjust attendance for any course on behalf of teachers.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('take_attendance')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 transition-colors cursor-pointer shrink-0 self-start sm:self-center"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Take Attendance on Behalf</span>
            </button>
          </div>

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
                  {allSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                        No student attendance records found.
                      </td>
                    </tr>
                  ) : allSummaries.map(s => (
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

      {/* TAB: CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Class Management</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Create and manage classes, subjects, and student roster.</p>
            </div>
            <button
              onClick={() => {
                setEditingClass(null)
                setClassForm({ name: '', courseName: '', courseId: '', teacherName: '', teacherId: '' })
                setClassFormOpen(true)
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Class
            </button>
          </div>

          {/* Create/Edit Class Modal */}
          {classFormOpen && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-foreground">{editingClass ? 'Edit Class' : 'Create New Class'}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Class Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">Class Name *</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g., Class 11 — PCM"
                    value={classForm.name}
                    onChange={e => setClassForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>

                {/* Course dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">Course / Program</label>
                  {courses.length > 0 ? (
                    <>
                      <select
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
                        value={classForm.courseId}
                        onChange={e => {
                          const selected = courses.find(c => c.id === e.target.value)
                          setClassForm(p => ({
                            ...p,
                            courseId: e.target.value,
                            courseName: selected?.title || '',
                          }))
                        }}
                      >
                        <option value="">— Select a course —</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.title}{c.category ? ` (${c.category})` : ''}
                          </option>
                        ))}
                        <option value="__custom__">✏️ Type custom name…</option>
                      </select>
                      {classForm.courseId === '__custom__' && (
                        <input
                          className="mt-1.5 w-full px-3 py-2 rounded-xl border border-primary/40 bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Enter course / program name"
                          value={classForm.courseName}
                          onChange={e => setClassForm(p => ({ ...p, courseName: e.target.value }))}
                          autoFocus
                        />
                      )}
                    </>
                  ) : (
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g., Physics, Chemistry & Math"
                      value={classForm.courseName}
                      onChange={e => setClassForm(p => ({ ...p, courseName: e.target.value }))}
                    />
                  )}
                </div>

                {/* Teacher dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">Assigned Teacher</label>
                  {teachers.length > 0 ? (
                    <>
                      <select
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
                        value={classForm.teacherId}
                        onChange={e => {
                          const selected = teachers.find(t => t.id === e.target.value)
                          setClassForm(p => ({
                            ...p,
                            teacherId: e.target.value,
                            teacherName: selected?.name || '',
                          }))
                        }}
                      >
                        <option value="">— Select a teacher —</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}{t.email ? ` — ${t.email}` : ''}
                          </option>
                        ))}
                        <option value="__custom__">✏️ Type custom name…</option>
                      </select>
                      {classForm.teacherId === '__custom__' && (
                        <input
                          className="mt-1.5 w-full px-3 py-2 rounded-xl border border-primary/40 bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Enter teacher name"
                          value={classForm.teacherName}
                          onChange={e => setClassForm(p => ({ ...p, teacherName: e.target.value }))}
                          autoFocus
                        />
                      )}
                    </>
                  ) : (
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Teacher name"
                      value={classForm.teacherName}
                      onChange={e => setClassForm(p => ({ ...p, teacherName: e.target.value }))}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={!classForm.name.trim() || classActionLoading}
                  onClick={async () => {
                    if (!classForm.name.trim()) return
                    setClassActionLoading(true)
                    const resolvedTeacherId = classForm.teacherId && classForm.teacherId !== '__custom__' ? classForm.teacherId : adminId
                    const resolvedTeacherName = classForm.teacherName || adminName
                    const resolvedCourseId = classForm.courseId && classForm.courseId !== '__custom__' ? classForm.courseId : `course_${Date.now()}`
                    const resolvedCourseName = classForm.courseName || classForm.name
                    if (editingClass) {
                      await updateClass(editingClass.id, {
                        name: classForm.name,
                        courseId: resolvedCourseId,
                        courseName: resolvedCourseName,
                        teacherId: resolvedTeacherId,
                        teacherName: resolvedTeacherName,
                      })
                      setClasses(prev => prev.map(c =>
                        c.id === editingClass.id ? { ...c, name: classForm.name, teacherName: resolvedTeacherName, teacherId: resolvedTeacherId, courseName: resolvedCourseName, courseId: resolvedCourseId } : c
                      ))
                    } else {
                      const newCls = await createClass({
                        name: classForm.name,
                        courseId: resolvedCourseId,
                        courseName: resolvedCourseName,
                        teacherId: resolvedTeacherId,
                        teacherName: resolvedTeacherName,
                        students: [],
                        subjects: [],
                      })
                      setClasses(prev => [...prev, newCls])
                    }
                    setClassFormOpen(false)
                    setClassActionLoading(false)
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {classActionLoading ? 'Saving...' : editingClass ? 'Save Changes' : 'Create Class'}
                </button>
                <button
                  onClick={() => setClassFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Class List */}
          {classes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center rounded-2xl border border-dashed border-border bg-card">
              <div className="p-4 rounded-full bg-muted">
                <GraduationCap className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">No classes created yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click "New Class" to get started.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map(cls => (
                <div key={cls.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  {/* Class header */}
                  <div className="flex items-center gap-3 p-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{cls.name}</h4>
                      <p className="text-[11px] text-muted-foreground">{cls.courseName} · {cls.students.length} students · Teacher: {cls.teacherName}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedClassForAttendance(cls.id)
                          setActiveTab('take_attendance')
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                        title="Take attendance for this class on behalf of teacher"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Take Attendance</span>
                      </button>
                      <button
                        onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}
                        className="p-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Manage students & subjects"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingClass(cls)
                          setClassForm({
                            name: cls.name,
                            courseName: cls.courseName,
                            courseId: cls.courseId || '',
                            teacherName: cls.teacherName,
                            teacherId: cls.teacherId || '',
                          })
                          setClassFormOpen(true)
                        }}
                        className="p-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                        title="Edit class"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete "${cls.name}"? This cannot be undone.`)) return
                          await deleteClass(cls.id)
                          setClasses(prev => prev.filter(c => c.id !== cls.id))
                        }}
                        className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Subjects & Students */}
                  {expandedClass === cls.id && (
                    <div className="border-t border-border bg-muted/20 px-4 pb-4 pt-3 space-y-4">
                      {/* Subjects */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Subjects ({cls.subjects.length})</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {cls.subjects.map(sub => (
                            <span key={sub.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-[11px] font-semibold text-foreground">
                              {sub.name} <span className="text-muted-foreground">({sub.code})</span>
                            </span>
                          ))}
                          {cls.subjects.length === 0 && <span className="text-[11px] text-muted-foreground">No subjects yet.</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Subject name"
                            value={subjectForm.name}
                            onChange={e => setSubjectForm(p => ({ ...p, name: e.target.value }))}
                          />
                          <input
                            className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Code"
                            value={subjectForm.code}
                            onChange={e => setSubjectForm(p => ({ ...p, code: e.target.value }))}
                          />
                          <button
                            disabled={!subjectForm.name.trim()}
                            onClick={async () => {
                              if (!subjectForm.name.trim()) return
                              const newSub: AttendanceSubject = {
                                id: `sub_${Date.now()}`,
                                name: subjectForm.name,
                                code: subjectForm.code || subjectForm.name.slice(0,3).toUpperCase(),
                                classId: cls.id,
                              }
                              await addClassSubject(cls.id, newSub)
                              setClasses(prev => prev.map(c =>
                                c.id === cls.id ? { ...c, subjects: [...c.subjects, newSub] } : c
                              ))
                              setSubjectForm({ name: '', code: '' })
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Students */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Students ({cls.students.length})</p>
                        </div>
                        <div className="space-y-1 mb-2 max-h-40 overflow-y-auto">
                          {cls.students.map(stu => (
                            <div key={stu.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted/50">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-black text-primary">{stu.name.charAt(0)}</span>
                              </div>
                              <span className="text-xs font-medium text-foreground flex-1">{stu.name}</span>
                              {stu.rollNumber && <span className="text-[10px] text-muted-foreground">#{stu.rollNumber}</span>}
                              <button
                                onClick={async () => {
                                  await removeClassStudent(cls.id, stu.id)
                                  setClasses(prev => prev.map(c =>
                                    c.id === cls.id ? { ...c, students: c.students.filter(s => s.id !== stu.id) } : c
                                  ))
                                }}
                                className="p-0.5 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {cls.students.length === 0 && <p className="text-[11px] text-muted-foreground px-1">No students enrolled.</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Student name"
                            value={studentForm.name}
                            onChange={e => setStudentForm(p => ({ ...p, name: e.target.value }))}
                          />
                          <input
                            className="w-28 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Roll No."
                            value={studentForm.rollNumber}
                            onChange={e => setStudentForm(p => ({ ...p, rollNumber: e.target.value }))}
                          />
                          <button
                            disabled={!studentForm.name.trim()}
                            onClick={async () => {
                              if (!studentForm.name.trim()) return
                              const newStu = {
                                id: `stu_${Date.now()}`,
                                name: studentForm.name,
                                rollNumber: studentForm.rollNumber || undefined,
                              }
                              await addClassStudent(cls.id, newStu)
                              setClasses(prev => prev.map(c =>
                                c.id === cls.id ? { ...c, students: [...c.students, { ...newStu, enrolledAt: new Date().toISOString().slice(0,10) }] } : c
                              ))
                              setStudentForm({ name: '', rollNumber: '' })
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: TAKE ATTENDANCE (PROXY MODE) */}
      {activeTab === 'take_attendance' && (
        <AdminTakeAttendancePanel
          classes={classes}
          sessions={sessions}
          teachers={teachers}
          courses={courses}
          adminId={adminId}
          adminName={adminName}
          initialClassId={selectedClassForAttendance}
          onSessionRecorded={(newSession, auditEntry) => {
            setSessions(prev => {
              const filtered = prev.filter(s => s.id !== newSession.id)
              return [newSession, ...filtered]
            })
            if (auditEntry) {
              setAuditLog(prev => [auditEntry, ...prev])
            }
          }}
          onNavigateToSessions={() => setActiveTab('sessions')}
        />
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
              onClick={() => setActiveTab('take_attendance')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>+ Take Attendance on Behalf</span>
            </button>
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
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
                        No attendance sessions found.
                      </td>
                    </tr>
                  ) : filteredSessions.slice(0, 50).map(session => (
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
                    <div className="flex items-center justify-between gap-2">
                      {log.action === 'proxy_marked' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                          <UserCheck className="w-3 h-3 text-indigo-600" /> Admin Proxy Attendance
                        </span>
                      ) : (
                        <span className="font-semibold text-foreground capitalize">{log.action}</span>
                      )}
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
