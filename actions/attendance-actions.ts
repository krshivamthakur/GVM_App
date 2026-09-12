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

const MOCK_CLASSES: AttendanceClass[] = [
  {
    id: 'cls_java',
    name: 'Java Programming Masterclass',
    courseId: '11111111-1111-1111-1111-111111111111',
    courseName: 'Java Programming Complete Masterclass',
    teacherId: '00000000-0000-0000-0000-000000000002',
    teacherName: 'Prof. Ramesh Sharma',
    subjects: [
      { id: 'sub_java_core', name: 'Core Java', code: 'JAVA101', classId: 'cls_java' },
      { id: 'sub_java_oop', name: 'OOP & Design Patterns', code: 'JAVA102', classId: 'cls_java' },
      { id: 'sub_java_adv', name: 'Advanced Java & JVM', code: 'JAVA103', classId: 'cls_java' },
    ],
    students: [
      { id: 'stu_001', name: 'Arjun Mehta', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop', rollNumber: 'CSE2024001', enrolledAt: '2026-06-01' },
      { id: 'stu_002', name: 'Priya Sharma', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop', rollNumber: 'CSE2024002', enrolledAt: '2026-06-01' },
      { id: 'stu_003', name: 'Rohan Verma', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop', rollNumber: 'CSE2024003', enrolledAt: '2026-06-01' },
      { id: 'stu_004', name: 'Sneha Patel', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop', rollNumber: 'CSE2024004', enrolledAt: '2026-06-02' },
      { id: 'stu_005', name: 'Vikram Singh', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&auto=format&fit=crop', rollNumber: 'CSE2024005', enrolledAt: '2026-06-02' },
      { id: 'stu_006', name: 'Anjali Rao', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop', rollNumber: 'CSE2024006', enrolledAt: '2026-06-03' },
    ],
  },
  {
    id: 'cls_physics',
    name: 'Physics — Electromagnetism & Optics',
    courseId: '22222222-2222-2222-2222-222222222222',
    courseName: 'Physics Class 12 & JEE',
    teacherId: '00000000-0000-0000-0000-000000000003',
    teacherName: 'Dr. Emily Watson',
    subjects: [
      { id: 'sub_phy_em', name: 'Electromagnetism', code: 'PHY201', classId: 'cls_physics' },
      { id: 'sub_phy_optics', name: 'Wave Optics', code: 'PHY202', classId: 'cls_physics' },
      { id: 'sub_phy_modern', name: 'Modern Physics', code: 'PHY203', classId: 'cls_physics' },
    ],
    students: [
      { id: 'stu_007', name: 'Kavya Nair', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c4?w=80&auto=format&fit=crop', rollNumber: 'SCI2024001', enrolledAt: '2026-06-01' },
      { id: 'stu_008', name: 'Aditya Kumar', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop', rollNumber: 'SCI2024002', enrolledAt: '2026-06-01' },
      { id: 'stu_009', name: 'Meera Joshi', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&auto=format&fit=crop', rollNumber: 'SCI2024003', enrolledAt: '2026-06-02' },
      { id: 'stu_010', name: 'Rahul Das', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop', rollNumber: 'SCI2024004', enrolledAt: '2026-06-02' },
    ],
  },
  {
    id: 'cls_chem',
    name: 'Organic Chemistry — NEET Preparation',
    courseId: '33333333-3333-3333-3333-333333333333',
    courseName: 'Organic Chemistry: Reactions & Mechanisms',
    teacherId: '00000000-0000-0000-0000-000000000002',
    teacherName: 'Prof. Ramesh Sharma',
    subjects: [
      { id: 'sub_chem_orgo', name: 'Reaction Mechanisms', code: 'CHEM301', classId: 'cls_chem' },
      { id: 'sub_chem_hydro', name: 'Hydrocarbons', code: 'CHEM302', classId: 'cls_chem' },
      { id: 'sub_chem_bio', name: 'Biomolecules', code: 'CHEM303', classId: 'cls_chem' },
    ],
    students: [
      { id: 'stu_011', name: 'Ishaan Chopra', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&auto=format&fit=crop', rollNumber: 'MED2024001', enrolledAt: '2026-06-01' },
      { id: 'stu_012', name: 'Pooja Reddy', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c4?w=80&auto=format&fit=crop', rollNumber: 'MED2024002', enrolledAt: '2026-06-01' },
      { id: 'stu_013', name: 'Akash Gupta', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop', rollNumber: 'MED2024003', enrolledAt: '2026-06-02' },
    ],
  },
]

// Seed attendance records for the past 30 days
function generateSeedRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const statuses: AttendanceStatus[] = ['present', 'present', 'present', 'present', 'absent', 'late', 'present', 'present', 'present', 'leave']
  let idCounter = 1

  for (const cls of MOCK_CLASSES) {
    for (const subject of cls.subjects) {
      // Generate for last 25 weekdays
      let classDay = 0
      for (let daysBack = 1; daysBack <= 60 && classDay < 25; daysBack++) {
        const d = new Date()
        d.setDate(d.getDate() - daysBack)
        const dow = d.getDay()
        if (dow === 0 || dow === 6) continue // skip weekends
        classDay++
        const dateStr = d.toISOString().slice(0, 10)

        for (const student of cls.students) {
          const status = statuses[(idCounter + parseInt(student.id.replace('stu_', ''))) % statuses.length]
          const sessionId = `sess_${cls.id}_${subject.id}_${dateStr}`
          records.push({
            id: `rec_${idCounter++}`,
            sessionId,
            studentId: student.id,
            studentName: student.name,
            studentAvatar: student.avatar,
            classId: cls.id,
            subjectId: subject.id,
            subjectName: subject.name,
            date: dateStr,
            status,
            markedBy: cls.teacherId,
            markedAt: new Date(d.getTime() + 3600000).toISOString(),
          })
        }
      }
    }
  }
  return records
}

function generateSeedSessions(): AttendanceSession[] {
  const sessions: AttendanceSession[] = []
  for (const cls of MOCK_CLASSES) {
    for (const subject of cls.subjects) {
      let classDay = 0
      for (let daysBack = 1; daysBack <= 60 && classDay < 25; daysBack++) {
        const d = new Date()
        d.setDate(d.getDate() - daysBack)
        const dow = d.getDay()
        if (dow === 0 || dow === 6) continue
        classDay++
        const dateStr = d.toISOString().slice(0, 10)
        const sessionId = `sess_${cls.id}_${subject.id}_${dateStr}`

        const recs = attendanceRecords.filter(r => r.sessionId === sessionId)
        const presentCount = recs.filter(r => r.status === 'present').length
        const absentCount = recs.filter(r => r.status === 'absent').length
        const lateCount = recs.filter(r => r.status === 'late').length
        const leaveCount = recs.filter(r => r.status === 'leave').length

        sessions.push({
          id: sessionId,
          classId: cls.id,
          className: cls.name,
          subjectId: subject.id,
          subjectName: subject.name,
          date: dateStr,
          teacherId: cls.teacherId,
          teacherName: cls.teacherName,
          lockStatus: daysBack > 3 ? 'locked' : 'open',
          submittedAt: new Date(d.getTime() + 3600000).toISOString(),
          totalStudents: cls.students.length,
          presentCount,
          absentCount,
          lateCount,
          leaveCount,
        })
      }
    }
  }
  return sessions
}

const attendanceRecords: AttendanceRecord[] = generateSeedRecords()
const attendanceSessions: AttendanceSession[] = generateSeedSessions()

const leaveRequests: LeaveRequest[] = [
  {
    id: 'leave_001',
    studentId: 'stu_001',
    studentName: 'Arjun Mehta',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop',
    classId: 'cls_java',
    className: 'Java Programming Masterclass',
    fromDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    toDate: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    reason: 'Medical appointment — follow-up checkup for fever',
    status: 'pending',
    submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'leave_002',
    studentId: 'stu_004',
    studentName: 'Sneha Patel',
    studentAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop',
    classId: 'cls_java',
    className: 'Java Programming Masterclass',
    fromDate: new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10),
    toDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    reason: 'Family wedding ceremony — travelling out of state',
    status: 'approved',
    submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    reviewedBy: '00000000-0000-0000-0000-000000000002',
    reviewedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    reviewNote: 'Approved. Please submit notes for missed sessions.',
  },
  {
    id: 'leave_003',
    studentId: 'stu_007',
    studentName: 'Kavya Nair',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c4?w=80&auto=format&fit=crop',
    classId: 'cls_physics',
    className: 'Physics — Electromagnetism & Optics',
    fromDate: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    toDate: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    reason: 'Severe migraine — unable to attend',
    status: 'rejected',
    submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    reviewedBy: '00000000-0000-0000-0000-000000000003',
    reviewedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    reviewNote: 'Please provide medical certificate. Resubmit with documentation.',
  },
]

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

  for (const cls of MOCK_CLASSES) {
    const stu = cls.students.find(s => s.id === studentId)
    if (stu) { studentName = stu.name; studentAvatar = stu.avatar; break }
  }

  if (!studentName) return null

  const records = attendanceRecords.filter(r => r.studentId === studentId)
  if (records.length === 0) return null

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
