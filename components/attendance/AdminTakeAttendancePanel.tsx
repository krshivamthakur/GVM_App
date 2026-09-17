'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  AttendanceClass,
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  AttendanceSubject,
  AttendanceAuditLog,
} from '@/types/attendance'
import {
  ClipboardList,
  CheckCircle2,
  Lock,
  ChevronDown,
  Calendar,
  Users,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  Plus,
  ArrowLeft,
  ArrowRight,
  UserPlus,
  ShieldCheck,
  Search,
  Sparkles,
  Info,
  UserCheck,
  RefreshCw,
} from 'lucide-react'
import { AttendanceStatusBadge, StatusSelector } from './AttendanceStatusBadge'
import {
  markBulkAttendance,
  getAttendanceForSession,
  addClassStudent,
  addClassSubject,
  syncCourseStudentsToClass,
  type TeacherOption,
  type CourseOption,
} from '@/actions/attendance-actions'

interface AdminTakeAttendancePanelProps {
  classes: AttendanceClass[]
  sessions: AttendanceSession[]
  teachers: TeacherOption[]
  courses: CourseOption[]
  adminId: string
  adminName: string
  initialClassId?: string
  onSessionRecorded?: (newSession: AttendanceSession, auditEntry?: AttendanceAuditLog) => void
  onNavigateToSessions?: () => void
}

export function AdminTakeAttendancePanel({
  classes: initialClasses,
  sessions: initialSessions,
  teachers,
  courses,
  adminId,
  adminName,
  initialClassId,
  onSessionRecorded,
  onNavigateToSessions,
}: AdminTakeAttendancePanelProps) {
  const [classes, setClasses] = useState<AttendanceClass[]>(initialClasses)
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all')
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || initialClasses[0]?.id || ''
  )
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )
  const [adminRemarks, setAdminRemarks] = useState<string>('')
  const [studentSearch, setStudentSearch] = useState<string>('')

  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({})
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isExistingSession, setIsExistingSession] = useState(false)
  const [existingSessionLockStatus, setExistingSessionLockStatus] = useState<'open' | 'locked'>('open')
  const [successMsg, setSuccessMsg] = useState('')
  const [syncingStudents, setSyncingStudents] = useState(false)

  // Quick subject add state
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [newSubName, setNewSubName] = useState('')
  const [newSubCode, setNewSubCode] = useState('')

  // Quick student add state
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [newStuName, setNewStuName] = useState('')
  const [newStuRoll, setNewStuRoll] = useState('')

  // Filtered classes based on course filter
  const filteredClasses = useMemo(() => {
    if (selectedCourseFilter === 'all') return classes
    return classes.filter(
      c => c.courseId === selectedCourseFilter || c.courseName === selectedCourseFilter
    )
  }, [classes, selectedCourseFilter])

  // Current active class
  const currentClass = useMemo(() => {
    return (
      classes.find(c => c.id === selectedClassId) ||
      filteredClasses[0] ||
      classes[0]
    )
  }, [classes, filteredClasses, selectedClassId])

  // Sync selectedClassId when course filter changes if current selection is invalid
  useEffect(() => {
    if (filteredClasses.length > 0 && !filteredClasses.some(c => c.id === selectedClassId)) {
      setSelectedClassId(filteredClasses[0].id)
    }
  }, [filteredClasses, selectedClassId])

  // Available subjects for the current class
  const subjects = currentClass?.subjects || []

  // Effective subject fallback
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
      classId: currentClass?.id || '',
    }
  }, [selectedSubjectId, subjects, currentClass])

  // Current assigned teacher for class
  const assignedTeacherForClass = useMemo(() => {
    if (!currentClass) return null
    const match = teachers.find(t => t.id === currentClass.teacherId)
    return {
      id: currentClass.teacherId,
      name: currentClass.teacherName || match?.name || 'Assigned Instructor',
      email: match?.email,
      avatar: match?.avatar,
    }
  }, [currentClass, teachers])

  // Effective teacher on whose behalf attendance is being taken
  const effectiveTeacher = useMemo(() => {
    if (selectedTeacherId) {
      const found = teachers.find(t => t.id === selectedTeacherId)
      if (found) return found
    }
    return assignedTeacherForClass || { id: 'teacher_default', name: 'Assigned Teacher' }
  }, [selectedTeacherId, teachers, assignedTeacherForClass])

  // Students roster
  const students = currentClass?.students || []

  // Filtered students by search term
  const displayedStudents = useMemo(() => {
    if (!studentSearch.trim()) return students
    const q = studentSearch.toLowerCase().trim()
    return students.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
    )
  }, [students, studentSearch])

  const today = new Date().toISOString().slice(0, 10)

  // Load existing session records when class, subject, or date changes
  const loadExistingSession = useCallback(async () => {
    if (!currentClass?.id || !selectedDate) return
    setLoading(true)
    try {
      const records = await getAttendanceForSession(
        currentClass.id,
        effectiveSubject.id,
        selectedDate
      )

      // Also check session lock status from existing sessions
      const existingSess = initialSessions.find(
        s =>
          s.classId === currentClass.id &&
          s.subjectId === effectiveSubject.id &&
          s.date === selectedDate
      )
      setExistingSessionLockStatus(existingSess?.lockStatus || 'open')

      if (records && records.length > 0) {
        const map: Record<string, AttendanceStatus> = {}
        const notes: Record<string, string> = {}
        records.forEach(r => {
          map[r.studentId] = r.status
          if (r.notes) notes[r.studentId] = r.notes
        })
        setAttendanceMap(map)
        setNotesMap(notes)
        setIsExistingSession(true)
      } else {
        setAttendanceMap({})
        setNotesMap({})
        setIsExistingSession(false)
      }
    } finally {
      setLoading(false)
    }
  }, [currentClass?.id, effectiveSubject.id, selectedDate, initialSessions])

  useEffect(() => {
    loadExistingSession()
  }, [loadExistingSession])

  // Date Shift Helper
  const shiftDate = (offsetDays: number) => {
    const d = new Date(selectedDate || today)
    d.setDate(d.getDate() + offsetDays)
    setSelectedDate(d.toISOString().slice(0, 10))
    setAttendanceMap({})
    setIsExistingSession(false)
  }

  // Quick Bulk Mark
  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = {}
    students.forEach(s => {
      map[s.id] = status
    })
    setAttendanceMap(map)
  }

  // Clear marks
  const clearAllMarks = () => {
    setAttendanceMap({})
    setNotesMap({})
  }

  // Handle Sync Course Students
  const handleSyncCourseStudents = async () => {
    if (!currentClass) return
    setSyncingStudents(true)
    try {
      const res = await syncCourseStudentsToClass(currentClass.id)
      if (res.success) {
        setSuccessMsg(`Enrolled ${res.count} course students into ${currentClass.name}!`)
        setTimeout(() => setSuccessMsg(''), 4000)
      } else {
        setSuccessMsg('No additional enrolled students found to sync.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    } finally {
      setSyncingStudents(false)
    }
  }

  // Inline Quick Add Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentClass || !newStuName.trim()) return
    const newStu = {
      id: `stu_${Date.now()}`,
      name: newStuName.trim(),
      rollNumber: newStuRoll.trim() || undefined,
    }
    await addClassStudent(currentClass.id, newStu)
    setClasses(prev =>
      prev.map(c =>
        c.id === currentClass.id
          ? {
              ...c,
              students: [
                ...c.students,
                { ...newStu, enrolledAt: new Date().toISOString().slice(0, 10) },
              ],
            }
          : c
      )
    )
    setNewStuName('')
    setNewStuRoll('')
    setShowAddStudent(false)
    setSuccessMsg(`Student "${newStu.name}" added to ${currentClass.name}!`)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  // Inline Quick Add Subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentClass || !newSubName.trim()) return
    const sub = {
      id: `sub_${Date.now()}`,
      name: newSubName.trim(),
      code: newSubCode.trim() || newSubName.trim().slice(0, 3).toUpperCase(),
    }
    await addClassSubject(currentClass.id, sub)
    setClasses(prev =>
      prev.map(c =>
        c.id === currentClass.id
          ? { ...c, subjects: [...c.subjects, { ...sub, classId: currentClass.id }] }
          : c
      )
    )
    setSelectedSubjectId(sub.id)
    setNewSubName('')
    setNewSubCode('')
    setShowAddSubject(false)
    setSuccessMsg(`Subject "${sub.name}" added!`)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  // Attendance submission
  const handleSubmitAttendance = async () => {
    if (!currentClass) return
    if (students.length === 0) {
      alert('This class has no enrolled students. Please add or sync students first.')
      return
    }

    const records = students.map(s => ({
      studentId: s.id,
      status: attendanceMap[s.id] || 'absent',
      notes: notesMap[s.id],
    }))

    setSubmitting(true)
    try {
      const result = await markBulkAttendance(
        currentClass.id,
        effectiveSubject.id,
        selectedDate,
        effectiveTeacher.id,
        records,
        {
          markedByAdmin: true,
          adminId,
          adminName,
          overrideTeacherId: effectiveTeacher.id,
          overrideTeacherName: effectiveTeacher.name,
          remarks: adminRemarks.trim() || undefined,
        }
      )

      if (result.success) {
        setIsExistingSession(true)
        const pCount = records.filter(r => r.status === 'present').length
        const aCount = records.filter(r => r.status === 'absent').length
        const lCount = records.filter(r => r.status === 'late').length
        const lvCount = records.filter(r => r.status === 'leave').length

        setSuccessMsg(
          `Attendance successfully saved on behalf of ${effectiveTeacher.name}! (${pCount} Present, ${aCount} Absent, ${lCount} Late)`
        )
        setTimeout(() => setSuccessMsg(''), 6000)

        const newSessionObj: AttendanceSession = {
          id: result.sessionId,
          classId: currentClass.id,
          className: currentClass.name,
          subjectId: effectiveSubject.id,
          subjectName: effectiveSubject.name,
          date: selectedDate,
          teacherId: effectiveTeacher.id,
          teacherName: effectiveTeacher.name,
          lockStatus: 'open',
          submittedAt: new Date().toISOString(),
          totalStudents: students.length,
          presentCount: pCount,
          absentCount: aCount,
          lateCount: lCount,
          leaveCount: lvCount,
        }

        const auditEntry: AttendanceAuditLog = {
          id: `audit_${Date.now()}`,
          recordId: result.sessionId,
          action: 'proxy_marked',
          performedBy: adminId,
          performedByName: adminName,
          timestamp: new Date().toISOString(),
          notes: `Admin recorded attendance for "${currentClass.name}" (${effectiveSubject.name}) on behalf of ${effectiveTeacher.name}.${adminRemarks.trim() ? ` Reason: ${adminRemarks.trim()}` : ''}`,
        }

        if (onSessionRecorded) {
          onSessionRecorded(newSessionObj, auditEntry)
        }
      } else {
        alert(result.error || 'Failed to submit attendance.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Live Counts
  const markedCount = Object.keys(attendanceMap).length
  const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length
  const absentCount = Object.values(attendanceMap).filter(s => s === 'absent').length
  const lateCount = Object.values(attendanceMap).filter(s => s === 'late').length
  const leaveCount = Object.values(attendanceMap).filter(s => s === 'leave').length
  const unmarkedCount = Math.max(0, students.length - markedCount)

  return (
    <div className="space-y-4">
      {/* Super-User Proxy Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/5 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Administrative Proxy Mode
              </span>
              {isExistingSession && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  ● Session Exists (Edit Mode)
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
              Take Attendance on Behalf of Teacher
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              As an administrator, you can record or adjust student attendance for any course or
              batch across the institution. The session is officially assigned to the designated
              teacher, while your administrative action is logged in the permanent audit trail.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {onNavigateToSessions && (
              <button
                type="button"
                onClick={onNavigateToSessions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer shadow-2xs"
              >
                <ClipboardList className="w-3.5 h-3.5 text-primary" />
                <span>View All Sessions</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold animate-in fade-in duration-200 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* MAIN CONFIGURATION CARD */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Filter by Course */}
          <div>
            <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">
              <BookOpen className="w-3 h-3 inline mr-1 text-primary" />
              1. Filter Course / Program
            </label>
            <div className="relative">
              <select
                value={selectedCourseFilter}
                onChange={e => setSelectedCourseFilter(e.target.value)}
                className="w-full px-3 py-2.5 pr-8 rounded-xl border border-border bg-background text-xs font-medium text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              >
                <option value="all">🌐 All Courses & Programs ({courses.length})</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.category ? `(${c.category})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* 2. Select Class / Batch */}
          <div>
            <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">
              <Users className="w-3 h-3 inline mr-1 text-primary" />
              2. Target Class / Batch *
            </label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={e => {
                  setSelectedClassId(e.target.value)
                  setSelectedSubjectId('')
                  setSelectedTeacherId('')
                  setAttendanceMap({})
                  setIsExistingSession(false)
                }}
                className="w-full px-3 py-2.5 pr-8 rounded-xl border border-border bg-background text-xs font-semibold text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              >
                {filteredClasses.length === 0 ? (
                  <option value="">No classes found for filter</option>
                ) : (
                  filteredClasses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.courseName ? `• ${c.courseName}` : ''} ({c.students.length} students)
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
            {currentClass && (
              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                Course: <strong className="text-foreground">{currentClass.courseName || currentClass.name}</strong>
              </p>
            )}
          </div>

          {/* 3. On Behalf of Teacher */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-foreground uppercase tracking-wider">
                <UserCheck className="w-3 h-3 inline mr-1 text-primary" />
                3. On Behalf Of Teacher *
              </label>
              {assignedTeacherForClass && (
                <span className="text-[10px] text-primary font-semibold">
                  Default: {assignedTeacherForClass.name}
                </span>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedTeacherId || (assignedTeacherForClass?.id || '')}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="w-full px-3 py-2.5 pr-8 rounded-xl border border-border bg-background text-xs font-semibold text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              >
                {assignedTeacherForClass && (
                  <option value={assignedTeacherForClass.id}>
                    ★ {assignedTeacherForClass.name} (Assigned Instructor)
                  </option>
                )}
                {teachers
                  .filter(t => t.id !== assignedTeacherForClass?.id)
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.email ? `(${t.email})` : ''}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Attendance records will be credited to{' '}
              <strong className="text-foreground">{effectiveTeacher.name}</strong>
            </p>
          </div>

          {/* 4. Subject / Period */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-foreground uppercase tracking-wider">
                <BookOpen className="w-3 h-3 inline mr-1 text-primary" />
                4. Subject / Period
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
                  setIsExistingSession(false)
                }}
                className="w-full px-3 py-2.5 pr-8 rounded-xl border border-border bg-background text-xs font-medium text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
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
              <form
                onSubmit={handleAddSubject}
                className="mt-2 p-2.5 rounded-xl border border-border bg-muted/40 flex items-center gap-2 animate-in fade-in duration-150"
              >
                <input
                  type="text"
                  required
                  placeholder="Subject Name (e.g. Data Structures)"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Code (e.g. CS201)"
                  value={newSubCode}
                  onChange={e => setNewSubCode(e.target.value)}
                  className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold cursor-pointer hover:bg-primary/90"
                >
                  Save
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Date Selector & Administrative Reason Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
          {/* Date Picker with Prev / Next */}
          <div>
            <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">
              <Calendar className="w-3 h-3 inline mr-1 text-primary" />
              Attendance Date
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => shiftDate(-1)}
                title="Previous Day"
                className="p-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value)
                  setAttendanceMap({})
                  setIsExistingSession(false)
                }}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              />
              <button
                type="button"
                onClick={() => shiftDate(1)}
                title="Next Day"
                className="p-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Date Buttons */}
            <div className="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(today)
                  setAttendanceMap({})
                  setIsExistingSession(false)
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
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
                  setAttendanceMap({})
                  setIsExistingSession(false)
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-border text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date()
                  d.setDate(d.getDate() - 2)
                  setSelectedDate(d.toISOString().slice(0, 10))
                  setAttendanceMap({})
                  setIsExistingSession(false)
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-border text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                2 Days Ago
              </button>
            </div>
          </div>

          {/* Administrative Remarks / Reason */}
          <div>
            <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">
              <Info className="w-3 h-3 inline mr-1 text-indigo-500" />
              Administrative Proxy Remarks (Logged in Audit)
            </label>
            <input
              type="text"
              placeholder="e.g., Faculty on approved leave, Biometric terminal issue, Official workshop"
              value={adminRemarks}
              onChange={e => setAdminRemarks(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Logged as: <strong className="text-foreground">{adminName}</strong> (Administrator)
            </p>
          </div>
        </div>
      </div>

      {/* QUICK BATCH ACTIONS & STATS BAR */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
          {/* Quick Mark Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-muted-foreground mr-1 uppercase">
              Quick Mark:
            </span>
            <button
              type="button"
              onClick={() => markAll('present')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-all cursor-pointer shadow-2xs"
            >
              ✓ All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('absent')}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition-all cursor-pointer shadow-2xs"
            >
              ✗ All Absent
            </button>
            <button
              type="button"
              onClick={() => markAll('late')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-all cursor-pointer shadow-2xs"
            >
              ⏱ All Late
            </button>
            <button
              type="button"
              onClick={clearAllMarks}
              className="px-2.5 py-1.5 rounded-xl border border-border text-muted-foreground text-xs font-semibold hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Reset markings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Roster Helpers */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={syncingStudents}
              onClick={handleSyncCourseStudents}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-primary ${syncingStudents ? 'animate-spin' : ''}`} />
              <span>{syncingStudents ? 'Syncing...' : 'Sync Course Students'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddStudent(!showAddStudent)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Student</span>
            </button>
          </div>
        </div>

        {/* Inline Add Student Form */}
        {showAddStudent && (
          <form
            onSubmit={handleAddStudent}
            className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-center gap-2 animate-in fade-in duration-150"
          >
            <input
              type="text"
              required
              placeholder="Student Full Name (e.g. Priya Sharma)"
              value={newStuName}
              onChange={e => setNewStuName(e.target.value)}
              className="flex-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none"
            />
            <input
              type="text"
              placeholder="Roll No. (e.g. 104)"
              value={newStuRoll}
              onChange={e => setNewStuRoll(e.target.value)}
              className="w-full sm:w-28 px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold cursor-pointer hover:bg-primary/90"
            >
              Add to Class
            </button>
          </form>
        )}

        {/* Counters Pill Summary */}
        <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap text-xs">
          <span className="font-bold text-muted-foreground uppercase text-[10px]">Tally:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-muted font-bold text-foreground text-[11px]">
            Total: {students.length}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
            Present: {presentCount}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold text-[11px]">
            Absent: {absentCount}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
            Late: {lateCount}
          </span>
          {leaveCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold text-[11px]">
              Leave: {leaveCount}
            </span>
          )}
          {unmarkedCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-600 font-semibold text-[11px]">
              Unmarked: {unmarkedCount} (will default to absent)
            </span>
          )}
        </div>
      </div>

      {/* STUDENT ROSTER TABLE */}
      <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
        {/* Roster Header with Search */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-foreground">
              Student Attendance Roster ({displayedStudents.length} of {students.length})
            </h3>
            {loading && (
              <span className="text-[10px] text-muted-foreground animate-pulse">
                Fetching records...
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            />
          </div>
        </div>

        {/* Students Table */}
        {students.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">No students enrolled in this class</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
                Sync registered students from the course or add students manually using the buttons above.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSyncCourseStudents}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Course Students Now</span>
            </button>
          </div>
        ) : displayedStudents.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No students matching "{studentSearch}"
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {displayedStudents.map(student => {
              const currentStatus = attendanceMap[student.id] || 'absent'
              const currentNote = notesMap[student.id] || ''

              return (
                <div
                  key={student.id}
                  className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/15 transition-colors"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        student.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          student.name
                        )}`
                      }
                      alt={student.name}
                      className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground truncate">
                          {student.name}
                        </span>
                        {student.rollNumber && (
                          <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground">
                            #{student.rollNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">Status:</span>
                        <AttendanceStatusBadge status={currentStatus} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Status Buttons & Notes */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    {/* Status selector */}
                    <StatusSelector
                      value={currentStatus}
                      onChange={status =>
                        setAttendanceMap(prev => ({ ...prev, [student.id]: status }))
                      }
                    />

                    {/* Note input */}
                    <input
                      type="text"
                      placeholder="Note (optional)"
                      value={currentNote}
                      onChange={e => {
                        const val = e.target.value
                        setNotesMap(prev => ({ ...prev, [student.id]: val }))
                      }}
                      className="w-full sm:w-36 px-2.5 py-1 rounded-lg border border-border bg-background text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* BOTTOM SUBMISSION BAR */}
        {students.length > 0 && (
          <div className="p-4 border-t border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                Ready to submit for{' '}
                <strong className="text-foreground">{currentClass.name}</strong> •{' '}
                <strong className="text-foreground">{effectiveSubject.name}</strong>
              </p>
              <p className="text-[11px]">
                Date: <span className="font-semibold text-foreground">{selectedDate}</span> • On Behalf of:{' '}
                <span className="font-semibold text-primary">{effectiveTeacher.name}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={submitting || students.length === 0}
                onClick={handleSubmitAttendance}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Proxy Attendance...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>
                      {isExistingSession ? 'Update' : 'Submit'} on Behalf of {effectiveTeacher.name.split(' ')[0]}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
