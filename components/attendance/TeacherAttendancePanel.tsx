'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  AttendanceClass,
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  LeaveRequest,
  AttendanceSubject,
} from '@/types/attendance'
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
  Plus,
  ArrowLeft,
  ArrowRight,
  UserPlus,
  FileText,
  Sparkles,
} from 'lucide-react'
import { AttendanceStatusBadge, StatusSelector } from './AttendanceStatusBadge'
import { LeaveApprovalPanel } from './LeaveApprovalPanel'
import { 
  markBulkAttendance, 
  getAttendanceForSession, 
  addClassStudent, 
  addClassSubject,
  syncCourseStudentsToClass 
} from '@/actions/attendance-actions'

interface TeacherAttendancePanelProps {
  classes: AttendanceClass[]
  sessions: AttendanceSession[]
  leaveRequests: LeaveRequest[]
  teacherId: string
  teacherName: string
}

type Tab = 'mark' | 'sessions' | 'leaves'

export function TeacherAttendancePanel({
  classes: initialClasses,
  sessions: initialSessions,
  leaveRequests,
  teacherId,
  teacherName,
}: TeacherAttendancePanelProps) {
  const [classes, setClasses] = useState<AttendanceClass[]>(initialClasses)
  const [activeTab, setActiveTab] = useState<Tab>('mark')
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClasses[0]?.id || '')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({})
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [sessions, setSessions] = useState<AttendanceSession[]>(initialSessions)
  const [successMsg, setSuccessMsg] = useState('')
  const [sessionFilter, setSessionFilter] = useState<'all' | 'open' | 'locked'>('all')

  // Quick subject addition state
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [newSubName, setNewSubName] = useState('')
  const [newSubCode, setNewSubCode] = useState('')

  // Quick student addition state
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [newStuName, setNewStuName] = useState('')
  const [newStuRoll, setNewStuRoll] = useState('')

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0]
  const subjects = currentClass?.subjects || []

  // Ensure an effective subject is always available even if class has no subjects created yet
  const effectiveSubject: AttendanceSubject = useMemo(() => {
    if (selectedSubjectId) {
      const found = subjects.find(s => s.id === selectedSubjectId)
      if (found) return found
    }
    if (subjects.length > 0) return subjects[0]
    return {
      id: `sub_default_${currentClass?.id || 'gen'}`,
      name: currentClass?.courseName || currentClass?.name || 'Regular Lecture',
      code: 'LEC',
      classId: currentClass?.id || ''
    }
  }, [selectedSubjectId, subjects, currentClass])

  const students = currentClass?.students || []
  const today = new Date().toISOString().slice(0, 10)

  // Handle Class Switch
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId)
    setSelectedSubjectId('')
    setAttendanceMap({})
    setSubmitted(false)
  }

  // Pre-fill attendance from existing session
  const loadExistingSession = useCallback(async () => {
    if (!currentClass?.id || !selectedDate) return
    setLoading(true)
    try {
      const records = await getAttendanceForSession(currentClass.id, effectiveSubject.id, selectedDate)
      if (records && records.length > 0) {
        const map: Record<string, AttendanceStatus> = {}
        const notes: Record<string, string> = {}
        records.forEach(r => {
          map[r.studentId] = r.status
          if (r.notes) notes[r.studentId] = r.notes
        })
        setAttendanceMap(map)
        setNotesMap(notes)
        setSubmitted(true)
      } else {
        setAttendanceMap({})
        setNotesMap({})
        setSubmitted(false)
      }
    } finally {
      setLoading(false)
    }
  }, [currentClass?.id, effectiveSubject.id, selectedDate])

  React.useEffect(() => {
    loadExistingSession()
  }, [loadExistingSession])

  // Date Shift Helpers
  const shiftDate = (offsetDays: number) => {
    const d = new Date(selectedDate || today)
    d.setDate(d.getDate() + offsetDays)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = {}
    students.forEach(s => { map[s.id] = status })
    setAttendanceMap(map)
  }

  // Submit Attendance
  const handleSubmit = async () => {
    if (!currentClass) return
    const records = students.map(s => ({
      studentId: s.id,
      status: attendanceMap[s.id] || 'absent',
      notes: notesMap[s.id],
    }))

    setLoading(true)
    try {
      const result = await markBulkAttendance(
        currentClass.id,
        effectiveSubject.id,
        selectedDate,
        teacherId,
        records
      )
      if (result.success) {
        setSubmitted(true)
        setSuccessMsg(`Attendance for ${selectedDate} saved successfully!`)
        setTimeout(() => setSuccessMsg(''), 4000)

        // Update local session list
        const updatedSessions = sessions.filter(s => s.id !== result.sessionId)
        updatedSessions.unshift({
          id: result.sessionId,
          classId: currentClass.id,
          className: currentClass.name,
          subjectId: effectiveSubject.id,
          subjectName: effectiveSubject.name,
          date: selectedDate,
          teacherId,
          teacherName: teacherName || currentClass.teacherName,
          lockStatus: 'open',
          submittedAt: new Date().toISOString(),
          totalStudents: students.length,
          presentCount: records.filter(r => r.status === 'present').length,
          absentCount: records.filter(r => r.status === 'absent').length,
          lateCount: records.filter(r => r.status === 'late').length,
          leaveCount: records.filter(r => r.status === 'leave').length,
        })
        setSessions(updatedSessions)
      }
    } finally {
      setLoading(false)
    }
  }

  // Quick Sync Students
  const handleSyncStudents = async () => {
    if (!currentClass) return
    setLoading(true)
    try {
      const res = await syncCourseStudentsToClass(currentClass.id)
      if (res.success) {
        setSuccessMsg(`Enrolled ${res.count} registered students into ${currentClass.name}!`)
        setTimeout(() => {
          setSuccessMsg('')
          window.location.reload()
        }, 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  // Add Custom Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentClass || !newStuName.trim()) return
    const newStu = {
      id: `stu_${Date.now()}`,
      name: newStuName.trim(),
      rollNumber: newStuRoll.trim() || undefined,
    }
    await addClassStudent(currentClass.id, newStu)
    setClasses(prev => prev.map(c => 
      c.id === currentClass.id ? { ...c, students: [...c.students, { ...newStu, enrolledAt: new Date().toISOString().slice(0, 10) }] } : c
    ))
    setNewStuName('')
    setNewStuRoll('')
    setShowAddStudent(false)
    setSuccessMsg(`Student "${newStu.name}" added to ${currentClass.name}!`)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  // Add Custom Subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentClass || !newSubName.trim()) return
    const sub = {
      id: `sub_${Date.now()}`,
      name: newSubName.trim(),
      code: newSubCode.trim() || newSubName.trim().slice(0, 3).toUpperCase(),
    }
    await addClassSubject(currentClass.id, sub)
    setClasses(prev => prev.map(c => 
      c.id === currentClass.id ? { ...c, subjects: [...c.subjects, { ...sub, classId: currentClass.id }] } : c
    ))
    setSelectedSubjectId(sub.id)
    setNewSubName('')
    setNewSubCode('')
    setShowAddSubject(false)
    setSuccessMsg(`Subject "${sub.name}" added!`)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const markedCount = Object.keys(attendanceMap).length
  const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length
  const absentCount = Object.values(attendanceMap).filter(s => s === 'absent').length
  const lateCount = Object.values(attendanceMap).filter(s => s === 'late').length

  const filteredSessions = sessions.filter(s => {
    if (sessionFilter === 'open') return s.lockStatus === 'open'
    if (sessionFilter === 'locked') return s.lockStatus === 'locked'
    return true
  })

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-card border border-border shadow-2xs flex-wrap">
        {([
          { id: 'mark', label: 'Mark Attendance', icon: ClipboardList },
          { id: 'sessions', label: `My Sessions (${sessions.length})`, icon: History },
          { id: 'leaves', label: `Leave Requests${pendingLeaves > 0 ? ` (${pendingLeaves})` : ''}`, icon: Calendar },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: MARK ATTENDANCE */}
      {activeTab === 'mark' && (
        <div className="space-y-4">
          {/* Main Attendance Filter Panel: Course / Class & Date Selector */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Course / Class Selection */}
              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  <Users className="w-3 h-3 inline mr-1 text-primary" />
                  Course / Assigned Class
                </label>
                <div className="relative">
                  <select
                    value={selectedClassId}
                    onChange={e => handleClassChange(e.target.value)}
                    className="w-full px-3 py-2.5 pr-8 rounded-xl border border-border bg-background text-xs font-medium text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.courseName ? `(${c.courseName})` : ''} — {c.students.length} students
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>
                {currentClass && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Course: <strong className="text-foreground">{currentClass.courseName || currentClass.name}</strong> • Instructor: {currentClass.teacherName}
                  </p>
                )}
              </div>

              {/* Subject / Module */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-foreground uppercase tracking-wider">
                    <BookOpen className="w-3 h-3 inline mr-1 text-primary" />
                    Subject / Period
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddSubject(!showAddSubject)}
                    className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Subject</span>
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={effectiveSubject.id}
                    onChange={e => {
                      setSelectedSubjectId(e.target.value)
                      setAttendanceMap({})
                      setSubmitted(false)
                    }}
                    className="w-full px-3 py-2.5 pr-8 rounded-xl border border-border bg-background text-xs font-medium text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    {subjects.length > 0 ? (
                      subjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))
                    ) : (
                      <option value={effectiveSubject.id}>
                        {effectiveSubject.name} ({effectiveSubject.code})
                      </option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>

                {/* Inline Add Subject Form */}
                {showAddSubject && (
                  <form onSubmit={handleAddSubject} className="mt-2 p-2.5 rounded-xl border border-border bg-muted/30 flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Subject Name (e.g. Physics Lab)"
                      value={newSubName}
                      onChange={e => setNewSubName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Code (e.g. LAB)"
                      value={newSubCode}
                      onChange={e => setNewSubCode(e.target.value)}
                      className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
                    >
                      Save
                    </button>
                  </form>
                )}
              </div>

              {/* Date Selector with Rapid Navigation */}
              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  <Calendar className="w-3 h-3 inline mr-1 text-primary" />
                  Date
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => shiftDate(-1)}
                    title="Previous Day"
                    className="p-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => {
                      setSelectedDate(e.target.value)
                      setAttendanceMap({})
                      setSubmitted(false)
                    }}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => shiftDate(1)}
                    title="Next Day"
                    className="p-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Date Shortcuts */}
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(today)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                      selectedDate === today
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date()
                      d.setDate(d.getDate() - 1)
                      setSelectedDate(d.toISOString().slice(0, 10))
                    }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Yesterday
                  </button>
                  {submitted && (
                    <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Saved Record
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Bulk Marking Toolbar */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-muted-foreground mr-1">Quick Mark:</span>
                {(['present', 'absent', 'late', 'leave'] as AttendanceStatus[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => markAll(s)}
                    className="px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-[11px] font-semibold text-foreground transition-colors capitalize cursor-pointer"
                  >
                    All {s}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setAttendanceMap({})
                    setNotesMap({})
                    setSubmitted(false)
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Attendance Counts */}
              {students.length > 0 && (
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <span className="text-muted-foreground">{markedCount}/{students.length} marked</span>
                  <span className="text-emerald-600">✓ {presentCount} Present</span>
                  <span className="text-rose-600">✗ {absentCount} Absent</span>
                  {lateCount > 0 && <span className="text-amber-600">⏰ {lateCount} Late</span>}
                </div>
              )}
            </div>
          </div>

          {/* Student Roll Section */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Student Roster — {currentClass?.name || 'Class'}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Date: <span className="font-semibold text-foreground">{selectedDate}</span> • Subject: <span className="font-semibold text-foreground">{effectiveSubject.name}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(!showAddStudent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-primary" />
                  <span>Add Student</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncStudents}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors cursor-pointer"
                  title="Sync registered platform students to this class roster"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sync Students</span>
                </button>
              </div>
            </div>

            {/* Inline Add Student Form */}
            {showAddStudent && (
              <form onSubmit={handleAddStudent} className="p-4 bg-muted/20 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Student Full Name"
                  value={newStuName}
                  onChange={e => setNewStuName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Roll No. (e.g. 103)"
                  value={newStuRoll}
                  onChange={e => setNewStuRoll(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xs hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Add Student
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Students List or Empty State */}
            {students.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Users className="w-10 h-10 mx-auto text-muted-foreground opacity-40" />
                <div>
                  <p className="text-sm font-bold text-foreground">No students enrolled in this class roster yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Click "Sync Students" to automatically enroll registered students (e.g. harsh, demo), or add individual students above.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncStudents}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xs hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sync Registered Students Now</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {students.map((student, idx) => {
                  const status = attendanceMap[student.id] || null
                  const note = notesMap[student.id] || ''

                  return (
                    <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/15 transition-colors">
                      {/* Left info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-6 shrink-0">{idx + 1}</span>
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-border">
                          {student.avatar ? (
                            <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            student.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground truncate">{student.name}</span>
                            {student.rollNumber && (
                              <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                #{student.rollNumber}
                              </span>
                            )}
                            {status && <AttendanceStatusBadge status={status} size="sm" />}
                          </div>
                          {/* Inline note field */}
                          <input
                            type="text"
                            placeholder="Add remark or reason (optional)..."
                            value={note}
                            onChange={e => setNotesMap(prev => ({ ...prev, [student.id]: e.target.value }))}
                            className="mt-1 w-full max-w-sm px-2 py-0.5 rounded-md border border-transparent hover:border-border focus:border-primary text-[11px] text-muted-foreground focus:text-foreground bg-transparent focus:bg-background focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      {/* Status Selector */}
                      <div className="shrink-0 pl-9 sm:pl-0">
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

            {/* Bottom Submit Bar */}
            {students.length > 0 && (
              <div className="p-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  {markedCount < students.length ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{students.length - markedCount} of {students.length} students unmarked (will default to absent)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>All {students.length} students marked!</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => markAll('present')}
                    className="px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
                  >
                    Mark All Present
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{submitted ? `Update Attendance (${selectedDate})` : `Save Attendance (${selectedDate})`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY SESSIONS (COURSE & DATE-WISE HISTORY) */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 text-[11px] font-medium">
              {(['all', 'open', 'locked'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSessionFilter(f)}
                  className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                    sessionFilter === f
                      ? 'bg-background text-foreground shadow-2xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'open' ? '🔓 Open' : f === 'locked' ? '🔒 Locked' : 'All'}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              Showing {filteredSessions.length} recorded session{filteredSessions.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Class / Course</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Attendance Rate</th>
                    <th className="px-4 py-3">Breakdown</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-foreground">No attendance records found yet</p>
                        <p className="text-[11px] mt-0.5">Switch to "Mark Attendance" to submit attendance for any date.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map(session => {
                      const pct = session.totalStudents > 0 
                        ? Math.round((session.presentCount / session.totalStudents) * 100) 
                        : 0

                      return (
                        <tr key={session.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                            {session.date}
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {session.className}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {session.subjectName}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-black ${pct >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {pct}%
                              </span>
                              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[11px]">
                            <span className="text-emerald-600 font-bold">{session.presentCount}P</span>
                            {' • '}
                            <span className="text-rose-600 font-semibold">{session.absentCount}A</span>
                            {session.lateCount > 0 && (
                              <> • <span className="text-amber-600 font-semibold">{session.lateCount}L</span></>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {session.lockStatus === 'locked' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
                                <Lock className="w-2.5 h-2.5" /> Locked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                                ● Open
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClassId(session.classId)
                                setSelectedSubjectId(session.subjectId)
                                setSelectedDate(session.date)
                                setActiveTab('mark')
                              }}
                              className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Edit / Review
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE REQUESTS */}
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
