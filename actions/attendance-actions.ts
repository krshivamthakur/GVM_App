'use server'

import {
  AttendanceRecord,
  AttendanceSession,
  AttendanceClass,
  AttendanceSummary,
  SubjectAttendanceSummary,
  MonthlyAttendanceSummary,
  LeaveRequest,
  AttendanceRule,
  AttendanceAuditLog,
  AttendanceStatus,
  LeaveStatus,
} from '@/types/attendance'

// ============================================================
// IN-MEMORY STORE (Supabase-ready stubs)
// ============================================================

const MOCK_CLASSES: AttendanceClass[] = []
const attendanceRecords: AttendanceRecord[] = []
const attendanceSessions: AttendanceSession[] = []
const leaveRequests: LeaveRequest[] = []

let attendanceRule: AttendanceRule = {
  id: 'rule_global',
  minAttendancePercentage: 75,
  lockAfterDays: 3,
  allowCorrectionByTeacher: true,
  allowCorrectionByAdmin: true,
  parentNotificationsEnabled: true,
  lowAttendanceThreshold: 60,
  autoMarkLeaveOnApproval: true,
  semesterStartDate: '2026-06-01',
  semesterEndDate: '2026-11-30',
}

const auditLog: AttendanceAuditLog[] = []

// ============================================================
// SERVER ACTIONS
// ============================================================

export async function getAllClasses(): Promise<AttendanceClass[]> {
  return MOCK_CLASSES
}

export async function getClassesByTeacher(teacherId: string): Promise<AttendanceClass[]> {
  return MOCK_CLASSES.filter(c => c.teacherId === teacherId)
}

export async function createClass(classData: Omit<AttendanceClass, 'id'>): Promise<AttendanceClass> {
  const newClass: AttendanceClass = {
    ...classData,
    id: `cls_${Date.now()}`
  }
  MOCK_CLASSES.push(newClass)
  return newClass
}

export async function addClassStudent(
  classId: string,
  student: { id: string; name: string; avatar?: string; rollNumber?: string }
): Promise<boolean> {
  const cls = MOCK_CLASSES.find(c => c.id === classId)
  if (!cls) return false
  if (!cls.students.some(s => s.id === student.id)) {
    cls.students.push({
      ...student,
      enrolledAt: new Date().toISOString().slice(0, 10)
    })
  }
  return true
}

export async function getAttendanceSessions(classId?: string, teacherId?: string): Promise<AttendanceSession[]> {
  let sessions = [...attendanceSessions]
  if (classId) sessions = sessions.filter(s => s.classId === classId)
  if (teacherId) {
    const teacherClassIds = MOCK_CLASSES.filter(c => c.teacherId === teacherId).map(c => c.id)
    sessions = sessions.filter(s => teacherClassIds.includes(s.classId))
  }
  return sessions.sort((a, b) => b.date.localeCompare(a.date))
}

export async function getAttendanceForSession(
  classId: string,
  subjectId: string,
  date: string
): Promise<AttendanceRecord[]> {
  return attendanceRecords.filter(
    r => r.classId === classId && r.subjectId === subjectId && r.date === date
  )
}

export async function markBulkAttendance(
  classId: string,
  subjectId: string,
  date: string,
  teacherId: string,
  records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>
): Promise<{ success: boolean; sessionId: string }> {
  const cls = MOCK_CLASSES.find(c => c.id === classId)
  const subject = cls?.subjects.find(s => s.id === subjectId)
  if (!cls || !subject) return { success: false, sessionId: '' }

  const sessionId = `sess_${classId}_${subjectId}_${date}`

  // Remove existing records for this session
  const toRemove = attendanceRecords.filter(r => r.sessionId === sessionId)
  toRemove.forEach(r => {
    const idx = attendanceRecords.indexOf(r)
    if (idx !== -1) attendanceRecords.splice(idx, 1)
  })

  // Add new records
  records.forEach((rec, i) => {
    const student = cls.students.find(s => s.id === rec.studentId)
    if (!student) return
    attendanceRecords.push({
      id: `rec_${Date.now()}_${i}`,
      sessionId,
      studentId: rec.studentId,
      studentName: student.name,
      studentAvatar: student.avatar,
      classId,
      subjectId,
      subjectName: subject.name,
      date,
      status: rec.status,
      notes: rec.notes,
      markedBy: teacherId,
      markedAt: new Date().toISOString(),
    })
  })

  // Update / create session summary
  const existingIdx = attendanceSessions.findIndex(s => s.id === sessionId)
  const teacherProfile = MOCK_CLASSES.find(c => c.id === classId)
  const newSession: AttendanceSession = {
    id: sessionId,
    classId,
    className: cls.name,
    subjectId,
    subjectName: subject.name,
    date,
    teacherId,
    teacherName: teacherProfile?.teacherName || 'Teacher',
    lockStatus: 'open',
    submittedAt: new Date().toISOString(),
    totalStudents: cls.students.length,
    presentCount: records.filter(r => r.status === 'present').length,
    absentCount: records.filter(r => r.status === 'absent').length,
    lateCount: records.filter(r => r.status === 'late').length,
    leaveCount: records.filter(r => r.status === 'leave').length,
  }

  if (existingIdx >= 0) {
    attendanceSessions[existingIdx] = newSession
  } else {
    attendanceSessions.push(newSession)
  }

  return { success: true, sessionId }
}

export async function correctAttendanceRecord(
  recordId: string,
  newStatus: AttendanceStatus,
  adminId: string,
  adminName: string,
  notes?: string
): Promise<boolean> {
  const record = attendanceRecords.find(r => r.id === recordId)
  if (!record) return false

  const oldStatus = record.status
  record.status = newStatus
  record.correctedBy = adminId
  record.correctedAt = new Date().toISOString()
  if (notes) record.notes = notes

  auditLog.push({
    id: `audit_${Date.now()}`,
    recordId,
    action: 'corrected',
    performedBy: adminId,
    performedByName: adminName,
    oldValue: oldStatus,
    newValue: newStatus,
    timestamp: new Date().toISOString(),
    notes,
  })

  return true
}

export async function lockAttendanceSession(sessionId: string, adminId: string): Promise<boolean> {
  const session = attendanceSessions.find(s => s.id === sessionId)
  if (!session) return false
  session.lockStatus = 'locked'
  session.lockedAt = new Date().toISOString()
  auditLog.push({
    id: `audit_${Date.now()}`,
    recordId: sessionId,
    action: 'locked',
    performedBy: adminId,
    performedByName: 'Administrator',
    timestamp: new Date().toISOString(),
  })
  return true
}

export async function getStudentAttendanceSummary(
  studentId: string,
  classId?: string
): Promise<AttendanceSummary | null> {
  // Find the student across all classes
  let studentName = ''
  let studentAvatar: string | undefined
  let classes = MOCK_CLASSES

  if (classId) {
    classes = classes.filter(c => c.id === classId)
  }

  for (const cls of classes) {
    const stu = cls.students.find(s => s.id === studentId)
    if (stu) { studentName = stu.name; studentAvatar = stu.avatar; break }
  }

  const records = attendanceRecords.filter(r => r.studentId === studentId)
  if (records.length === 0) return null

  if (!studentName && records.length > 0) {
    studentName = records[0].studentName
    studentAvatar = records[0].studentAvatar
  }

  if (!studentName) return null

  const totalClasses = records.length
  const presentCount = records.filter(r => r.status === 'present').length
  const absentCount = records.filter(r => r.status === 'absent').length
  const lateCount = records.filter(r => r.status === 'late').length
  const leaveCount = records.filter(r => r.status === 'leave').length
  const halfDayCount = records.filter(r => r.status === 'half_day').length
  const excusedCount = records.filter(r => r.status === 'excused').length
  const effectivePresent = presentCount + lateCount + halfDayCount * 0.5 + excusedCount
  const overallPercentage = totalClasses > 0 ? Math.round((effectivePresent / totalClasses) * 100) : 0

  // Subject breakdown
  const subjectMap = new Map<string, { name: string; records: AttendanceRecord[] }>()
  for (const rec of records) {
    if (!subjectMap.has(rec.subjectId)) {
      subjectMap.set(rec.subjectId, { name: rec.subjectName, records: [] })
    }
    subjectMap.get(rec.subjectId)!.records.push(rec)
  }

  const subjectBreakdown: SubjectAttendanceSummary[] = Array.from(subjectMap.entries()).map(([subjectId, { name, records: sRecs }]) => {
    const sp = sRecs.filter(r => r.status === 'present').length
    const sa = sRecs.filter(r => r.status === 'absent').length
    const sl = sRecs.filter(r => r.status === 'late').length
    const slv = sRecs.filter(r => r.status === 'leave').length
    const eff = sp + sl + sRecs.filter(r => r.status === 'half_day').length * 0.5
    const pct = sRecs.length > 0 ? Math.round((eff / sRecs.length) * 100) : 0
    return {
      subjectId,
      subjectName: name,
      totalClasses: sRecs.length,
      present: sp,
      absent: sa,
      late: sl,
      leave: slv,
      percentage: pct,
      isLowAttendance: pct < attendanceRule.minAttendancePercentage,
    }
  })

  // Monthly breakdown
  const monthMap = new Map<string, { present: number; absent: number; total: number }>()
  for (const rec of records) {
    const month = rec.date.slice(0, 7)
    if (!monthMap.has(month)) monthMap.set(month, { present: 0, absent: 0, total: 0 })
    const m = monthMap.get(month)!
    m.total++
    if (rec.status === 'present' || rec.status === 'late') m.present++
    else if (rec.status === 'absent') m.absent++
  }

  const monthlyBreakdown: MonthlyAttendanceSummary[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { present, absent, total }]) => ({
      month,
      monthLabel: new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalClasses: total,
      present,
      absent,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    }))

  return {
    studentId,
    studentName,
    studentAvatar,
    overallPercentage,
    totalClasses,
    presentCount,
    absentCount,
    lateCount,
    leaveCount,
    halfDayCount,
    excusedCount,
    isLowAttendance: overallPercentage < attendanceRule.minAttendancePercentage,
    subjectBreakdown,
    monthlyBreakdown,
  }
}

export async function getStudentAttendanceHistory(
  studentId: string,
  month?: string
): Promise<AttendanceRecord[]> {
  let records = attendanceRecords.filter(r => r.studentId === studentId)
  if (month) records = records.filter(r => r.date.startsWith(month))
  return records.sort((a, b) => b.date.localeCompare(a.date))
}

export async function getAllStudentsSummary(): Promise<AttendanceSummary[]> {
  const studentIds = new Set<string>()
  for (const cls of MOCK_CLASSES) {
    for (const stu of cls.students) studentIds.add(stu.id)
  }

  const summaries: AttendanceSummary[] = []
  for (const id of studentIds) {
    const s = await getStudentAttendanceSummary(id)
    if (s) summaries.push(s)
  }
  return summaries
}

// ---- Leave Requests ----

export async function submitLeaveRequest(
  studentId: string,
  studentName: string,
  studentAvatar: string | undefined,
  classId: string,
  fromDate: string,
  toDate: string,
  reason: string,
  documentUrl?: string
): Promise<LeaveRequest> {
  const cls = MOCK_CLASSES.find(c => c.id === classId)
  const newLeave: LeaveRequest = {
    id: `leave_${Date.now()}`,
    studentId,
    studentName,
    studentAvatar,
    classId,
    className: cls?.name || classId,
    fromDate,
    toDate,
    reason,
    documentUrl,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  }
  leaveRequests.push(newLeave)
  return newLeave
}

export async function getLeaveRequests(
  role: 'teacher' | 'admin' | 'student',
  userId: string
): Promise<LeaveRequest[]> {
  if (role === 'student') {
    return leaveRequests.filter(l => l.studentId === userId)
  }
  if (role === 'teacher') {
    const teacherClassIds = MOCK_CLASSES.filter(c => c.teacherId === userId).map(c => c.id)
    return leaveRequests.filter(l => teacherClassIds.includes(l.classId))
  }
  return leaveRequests // admin sees all
}

export async function reviewLeaveRequest(
  leaveId: string,
  status: LeaveStatus,
  reviewedBy: string,
  reviewNote?: string
): Promise<boolean> {
  const leave = leaveRequests.find(l => l.id === leaveId)
  if (!leave) return false

  leave.status = status
  leave.reviewedBy = reviewedBy
  leave.reviewedAt = new Date().toISOString()
  leave.reviewNote = reviewNote

  // Auto-mark attendance as 'leave' if approved and rule is enabled
  if (status === 'approved' && attendanceRule.autoMarkLeaveOnApproval) {
    const from = new Date(leave.fromDate)
    const to = new Date(leave.toDate)
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10)
      const recs = attendanceRecords.filter(
        r => r.studentId === leave.studentId && r.classId === leave.classId && r.date === dateStr
      )
      recs.forEach(r => { r.status = 'leave' })
    }
  }

  return true
}

// ---- Attendance Rules ----

export async function getAttendanceRules(): Promise<AttendanceRule> {
  return { ...attendanceRule }
}

export async function updateAttendanceRules(updates: Partial<AttendanceRule>): Promise<AttendanceRule> {
  attendanceRule = { ...attendanceRule, ...updates }
  return { ...attendanceRule }
}

// ---- Reports ----

export async function getAttendanceReport(filters: {
  classId?: string
  subjectId?: string
  studentId?: string
  fromDate?: string
  toDate?: string
}): Promise<AttendanceRecord[]> {
  let records = [...attendanceRecords]
  if (filters.classId) records = records.filter(r => r.classId === filters.classId)
  if (filters.subjectId) records = records.filter(r => r.subjectId === filters.subjectId)
  if (filters.studentId) records = records.filter(r => r.studentId === filters.studentId)
  if (filters.fromDate) records = records.filter(r => r.date >= filters.fromDate!)
  if (filters.toDate) records = records.filter(r => r.date <= filters.toDate!)
  return records.sort((a, b) => b.date.localeCompare(a.date))
}

export async function getAuditLog(): Promise<AttendanceAuditLog[]> {
  return [...auditLog].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}
