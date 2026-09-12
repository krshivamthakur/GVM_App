'use client'

import React, { useState, useCallback } from 'react'
import {
  AttendanceClass,
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
} from '@/types/attendance'
import { LeaveRequest } from '@/types/attendance'
import {
  ClipboardList,
  CheckCircle2,
  Lock,
  Send,
  ChevronDown,
  Calendar,
  Users,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  History,
} from 'lucide-react'
import { AttendanceStatusBadge, StatusSelector } from './AttendanceStatusBadge'
import { LeaveApprovalPanel } from './LeaveApprovalPanel'
import { markBulkAttendance, getAttendanceForSession } from '@/actions/attendance-actions'

interface TeacherAttendancePanelProps {
  classes: AttendanceClass[]
  sessions: AttendanceSession[]
  leaveRequests: LeaveRequest[]
  teacherId: string
  teacherName: string
}

type Tab = 'mark' | 'sessions' | 'leaves'

export function TeacherAttendancePanel({
  classes,
  sessions: initialSessions,
  leaveRequests,
  teacherId,
  teacherName,
}: TeacherAttendancePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('mark')
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.id || '')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({})
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [sessions, setSessions] = useState<AttendanceSession[]>(initialSessions)
  const [successMsg, setSuccessMsg] = useState('')
  const [sessionFilter, setSessionFilter] = useState<'all' | 'open' | 'locked'>('all')

  const currentClass = classes.find(c => c.id === selectedClass)
  const subjects = currentClass?.subjects || []
  const currentSubject = subjects.find(s => s.id === selectedSubject) || subjects[0]
  const students = currentClass?.students || []

  const today = new Date().toISOString().slice(0, 10)

  // When class changes, reset subject
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId)
    setSelectedSubject('')
    setAttendanceMap({})
    setSubmitted(false)
  }

  // Pre-fill attendance from existing session
  const loadExistingSession = useCallback(async () => {
    if (!selectedClass || !currentSubject?.id || !selectedDate) return
    const records = await getAttendanceForSession(selectedClass, currentSubject.id, selectedDate)
    if (records.length > 0) {
      const map: Record<string, AttendanceStatus> = {}
      records.forEach(r => { map[r.studentId] = r.status })
      setAttendanceMap(map)
      setSubmitted(true)
    } else {
      setAttendanceMap({})
      setSubmitted(false)
    }
  }, [selectedClass, currentSubject?.id, selectedDate])

  React.useEffect(() => {
    loadExistingSession()
  }, [loadExistingSession])

  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = {}
    students.forEach(s => { map[s.id] = status })
    setAttendanceMap(map)
  }

  const handleSubmit = async () => {
    if (!currentClass || !currentSubject) return
    const records = students.map(s => ({
      studentId: s.id,
      status: attendanceMap[s.id] || 'absent',
      notes: notesMap[s.id],
    }))
    setLoading(true)
    try {
      const result = await markBulkAttendance(
        currentClass.id,
        currentSubject.id,
        selectedDate,
        teacherId,
        records
      )
      if (result.success) {
        setSubmitted(true)
        setSuccessMsg('Attendance submitted successfully!')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  const markedCount = Object.keys(attendanceMap).length
  const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length
  const absentCount = Object.values(attendanceMap).filter(s => s === 'absent').length

  const filteredSessions = sessions.filter(s => {
    if (sessionFilter === 'open') return s.lockStatus === 'open'
    if (sessionFilter === 'locked') return s.lockStatus === 'locked'
    return true
  })

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Success Banner */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1.5 rounded-xl bg-card border border-border shadow-sm flex-wrap">
        {([
          { id: 'mark', label: 'Mark Attendance', icon: ClipboardList },
          { id: 'sessions', label: 'My Sessions', icon: History },
          { id: 'leaves', label: `Leave Requests${pendingLeaves > 0 ? ` (${pendingLeaves})` : ''}`, icon: Calendar },
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

      {/* TAB: MARK ATTENDANCE */}
      {activeTab === 'mark' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Class */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  <Users className="w-3 h-3 inline mr-1" />Class
                </label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={e => handleClassChange(e.target.value)}
                    className="w-full px-3 py-2 pr-8 rounded-xl border border-border bg-background text-xs text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  <BookOpen className="w-3 h-3 inline mr-1" />Subject
                </label>
                <div className="relative">
                  <select
                    value={selectedSubject || currentSubject?.id || ''}
                    onChange={e => { setSelectedSubject(e.target.value); setAttendanceMap({}); setSubmitted(false) }}
                    className="w-full px-3 py-2 pr-8 rounded-xl border border-border bg-background text-xs text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  <Calendar className="w-3 h-3 inline mr-1" />Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => { setSelectedDate(e.target.value); setAttendanceMap({}); setSubmitted(false) }}
                  max={today}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Quick mark all */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border flex-wrap">
              <span className="text-[11px] font-semibold text-muted-foreground">Quick mark all:</span>
              {(['present', 'absent', 'late', 'leave'] as AttendanceStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => markAll(s)}
                  className="px-2.5 py-1 rounded-lg border border-border bg-muted/50 hover:bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors capitalize cursor-pointer"
                >
                  All {s}
                </button>
              ))}
              <button
                onClick={() => { setAttendanceMap({}); setSubmitted(false) }}
                className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          {/* Stats bar */}
          {markedCount > 0 && (
            <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-muted/40 border border-border text-xs font-semibold">
              <span className="text-muted-foreground">{markedCount}/{students.length} marked</span>
              <span className="text-emerald-600">✓ {presentCount} present</span>
              <span className="text-rose-600">✗ {absentCount} absent</span>
              {submitted && (
                <span className="ml-auto flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                </span>
              )}
            </div>
          )}

          {/* Student Roll List */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Student Roll — {currentClass?.name || 'Select Class'}
              </h3>
              <span className="text-xs text-muted-foreground">{students.length} students</span>
            </div>

            {students.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Select a class to see the student roll.</div>
            ) : (
              <div className="divide-y divide-border/60">
                {students.map((student, idx) => {
                  const status = attendanceMap[student.id] || null
                  return (
                    <div key={student.id} className="p-3.5 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                      {/* Number */}
                      <span className="text-[10px] font-bold text-muted-foreground w-5 shrink-0 mt-1">{idx + 1}</span>

                      {/* Avatar */}
                      <img
                        src={student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop'}
                        alt={student.name}
                        className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">{student.name}</span>
                          {student.rollNumber && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{student.rollNumber}</span>
                          )}
                          {status && <AttendanceStatusBadge status={status} size="sm" />}
                        </div>

                        {/* Status selector */}
                        <StatusSelector
                          value={status || 'absent'}
                          onChange={s => setAttendanceMap(prev => ({ ...prev, [student.id]: s }))}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Submit button */}
          {students.length > 0 && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-sm">
              {markedCount < students.length && (
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {students.length - markedCount} students not yet marked
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading || markedCount === 0}
                className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitted ? 'Update Attendance' : 'Submit Attendance'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB: MY SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 text-[11px] font-medium">
              {(['all', 'open', 'locked'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSessionFilter(f)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                    sessionFilter === f ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'open' ? '🔓 Open' : f === 'locked' ? '🔒 Locked' : 'All'}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-auto">{filteredSessions.length} sessions</span>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Present</th>
                    <th className="px-4 py-3">Absent</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredSessions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No sessions found.</td></tr>
                  ) : filteredSessions.slice(0, 40).map(session => (
                    <tr key={session.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{session.date}</td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-32">{session.className}</td>
                      <td className="px-4 py-3">{session.subjectName}</td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-600 font-bold">{session.presentCount}</span>
                        <span className="text-muted-foreground">/{session.totalStudents}</span>
                      </td>
                      <td className="px-4 py-3 text-rose-600 font-semibold">{session.absentCount}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LEAVE REQUESTS */}
      {activeTab === 'leaves' && (
        <LeaveApprovalPanel
          initialLeaves={leaveRequests}
          reviewerId={teacherId}
          role="teacher"
        />
      )}
    </div>
  )
}
