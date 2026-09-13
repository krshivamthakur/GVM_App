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
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================
// IN-MEMORY STORE (with realistic seed data)
// ============================================================

const MOCK_CLASSES: AttendanceClass[] = [
  {
    id: 'cls_11_pcm',
    name: 'Class 11 — PCM',
    courseId: 'course-phy',
    courseName: 'Physics, Chemistry & Mathematics',
    teacherId: '__teacher_placeholder__',
    teacherName: 'Subject Teacher',
    subjects: [
      { id: 'sub_phy', name: 'Physics', code: 'PHY101', classId: 'cls_11_pcm' },
      { id: 'sub_chem', name: 'Chemistry', code: 'CHEM101', classId: 'cls_11_pcm' },
      { id: 'sub_math', name: 'Mathematics', code: 'MATH101', classId: 'cls_11_pcm' },
    ],
    students: [
      { id: 'stu_001', name: 'Aarav Sharma', rollNumber: 'PCM-001', enrolledAt: '2026-06-01' },
      { id: 'stu_002', name: 'Priya Patel', rollNumber: 'PCM-002', enrolledAt: '2026-06-01' },
      { id: 'stu_003', name: 'Rohan Verma', rollNumber: 'PCM-003', enrolledAt: '2026-06-01' },
      { id: 'stu_004', name: 'Sneha Gupta', rollNumber: 'PCM-004', enrolledAt: '2026-06-01' },
      { id: 'stu_005', name: 'Arjun Singh', rollNumber: 'PCM-005', enrolledAt: '2026-06-01' },
    ],
  },
  {
    id: 'cls_12_bio',
    name: 'Class 12 — Biology',
    courseId: 'course-bio',
    courseName: 'Biology & Chemistry',
    teacherId: '__teacher_placeholder__',
    teacherName: 'Subject Teacher',
    subjects: [
      { id: 'sub_bio', name: 'Biology', code: 'BIO201', classId: 'cls_12_bio' },
      { id: 'sub_chem2', name: 'Chemistry', code: 'CHEM201', classId: 'cls_12_bio' },
    ],
    students: [
      { id: 'stu_006', name: 'Kavya Nair', rollNumber: 'BIO-001', enrolledAt: '2026-06-01' },
      { id: 'stu_007', name: 'Dev Mehta', rollNumber: 'BIO-002', enrolledAt: '2026-06-01' },
      { id: 'stu_008', name: 'Ananya Rao', rollNumber: 'BIO-003', enrolledAt: '2026-06-01' },
      { id: 'stu_009', name: 'Karan Joshi', rollNumber: 'BIO-004', enrolledAt: '2026-06-01' },
    ],
  },
  {
    id: 'cls_10_sci',
    name: 'Class 10 — Science',
    courseId: 'course-sci',
    courseName: 'General Science',
    teacherId: '__teacher_placeholder__',
    teacherName: 'Subject Teacher',
    subjects: [
      { id: 'sub_sci_phy', name: 'Physics', code: 'SCI-P10', classId: 'cls_10_sci' },
      { id: 'sub_sci_chem', name: 'Chemistry', code: 'SCI-C10', classId: 'cls_10_sci' },
      { id: 'sub_sci_bio', name: 'Biology', code: 'SCI-B10', classId: 'cls_10_sci' },
      { id: 'sub_sci_math', name: 'Mathematics', code: 'SCI-M10', classId: 'cls_10_sci' },
    ],
    students: [
      { id: 'stu_010', name: 'Riya Kapoor', rollNumber: 'SCI-001', enrolledAt: '2026-06-01' },
      { id: 'stu_011', name: 'Aditya Kumar', rollNumber: 'SCI-002', enrolledAt: '2026-06-01' },
      { id: 'stu_012', name: 'Pooja Mishra', rollNumber: 'SCI-003', enrolledAt: '2026-06-01' },
      { id: 'stu_013', name: 'Nikhil Sharma', rollNumber: 'SCI-004', enrolledAt: '2026-06-01' },
      { id: 'stu_014', name: 'Swati Tiwari', rollNumber: 'SCI-005', enrolledAt: '2026-06-01' },
      { id: 'stu_015', name: 'Harsh Aggarwal', rollNumber: 'SCI-006', enrolledAt: '2026-06-01' },
    ],
  },
]

// Seed some historical attendance records for realism
const today = new Date()
const seedDates = [-6, -5, -4, -3, -2, -1].map(d => {
  const dt = new Date(today)
  dt.setDate(dt.getDate() + d)
  // Skip weekends
  if (dt.getDay() === 0) dt.setDate(dt.getDate() - 2)
  if (dt.getDay() === 6) dt.setDate(dt.getDate() - 1)
  return dt.toISOString().slice(0, 10)
})

const STATUS_POOL: AttendanceStatus[] = ['present', 'present', 'present', 'present', 'absent', 'late']

const attendanceRecords: AttendanceRecord[] = (() => {
  const recs: AttendanceRecord[] = []
  let idx = 0
  for (const cls of MOCK_CLASSES) {
    for (const sub of cls.subjects) {
      for (const date of seedDates) {
        const sessionId = `sess_${cls.id}_${sub.id}_${date}`
        for (const stu of cls.students) {
          const status = STATUS_POOL[Math.abs((stu.id.charCodeAt(4) + date.charCodeAt(8) + idx) % STATUS_POOL.length)]
          recs.push({
            id: `rec_seed_${idx++}`,
            sessionId,
            studentId: stu.id,
            studentName: stu.name,
            classId: cls.id,
            subjectId: sub.id,
            subjectName: sub.name,
            date,
            status,
            markedBy: cls.teacherId,
            markedAt: date + 'T09:00:00.000Z',
          })
        }
      }
    }
  }
  return recs
})()

const attendanceSessions: AttendanceSession[] = (() => {
  const sessMap = new Map<string, AttendanceSession>()
  for (const rec of attendanceRecords) {
    if (!sessMap.has(rec.sessionId)) {
      const cls = MOCK_CLASSES.find(c => c.id === rec.classId)!
      const sub = cls.subjects.find(s => s.id === rec.subjectId)!
      const classRecs = attendanceRecords.filter(r => r.sessionId === rec.sessionId)
      sessMap.set(rec.sessionId, {
        id: rec.sessionId,
        classId: rec.classId,
        className: cls.name,
        subjectId: rec.subjectId,
        subjectName: sub.name,
        date: rec.date,
        teacherId: cls.teacherId,
        teacherName: cls.teacherName,
        lockStatus: 'open',
        submittedAt: rec.date + 'T09:30:00.000Z',
        totalStudents: cls.students.length,
        presentCount: classRecs.filter(r => r.status === 'present').length,
        absentCount: classRecs.filter(r => r.status === 'absent').length,
        lateCount: classRecs.filter(r => r.status === 'late').length,
        leaveCount: classRecs.filter(r => r.status === 'leave').length,
      })
    }
  }
  return Array.from(sessMap.values())
})()

const leaveRequests: LeaveRequest[] = [
  {
    id: 'leave_001',
    studentId: 'stu_003',
    studentName: 'Rohan Verma',
    classId: 'cls_11_pcm',
    className: 'Class 11 — PCM',
    fromDate: today.toISOString().slice(0, 10),
    toDate: new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10),
    reason: 'Family function and medical checkup',
    status: 'pending',
    submittedAt: new Date(today.getTime() - 86400000).toISOString(),
  },
  {
    id: 'leave_002',
    studentId: 'stu_007',
    studentName: 'Dev Mehta',
    classId: 'cls_12_bio',
    className: 'Class 12 — Biology',
    fromDate: new Date(today.getTime() - 3 * 86400000).toISOString().slice(0, 10),
    toDate: new Date(today.getTime() - 2 * 86400000).toISOString().slice(0, 10),
    reason: 'Fever and medical treatment',
    status: 'approved',
    submittedAt: new Date(today.getTime() - 4 * 86400000).toISOString(),
    reviewedBy: 'admin',
    reviewedAt: new Date(today.getTime() - 3 * 86400000).toISOString(),
    reviewNote: 'Get well soon',
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
// HELPER: Wire real logged-in teacher's ID to MOCK_CLASSES
// ============================================================
function resolveClassesForTeacher(teacherId: string): AttendanceClass[] {
  // If any classes already belong to this real teacher id, return them
  const owned = MOCK_CLASSES.filter(c => c.teacherId === teacherId)
  if (owned.length > 0) return owned

  // Otherwise, assign all placeholder classes to this teacher (first teacher gets all)
  const placeholderClasses = MOCK_CLASSES.filter(c => c.teacherId === '__teacher_placeholder__')
  if (placeholderClasses.length > 0) {
    placeholderClasses.forEach(c => {
      c.teacherId = teacherId
    })
    return placeholderClasses
  }

  return MOCK_CLASSES.filter(c => c.teacherId === teacherId)
}

// ============================================================
// SERVER ACTIONS
// ============================================================

export async function getAllClasses(): Promise<AttendanceClass[]> {
  // Try Supabase first
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('attendance_classes')
      .select(`
        *,
        attendance_students(*),
        attendance_subjects(*)
      `)
    if (!error && data && data.length > 0) {
      return data.map(mapDbClass)
    }
  } catch (err) {
    console.warn('Supabase getAllClasses fallback:', err)
  }

  return MOCK_CLASSES
}

export async function getClassesByTeacher(teacherId: string): Promise<AttendanceClass[]> {
  // Try Supabase first
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('attendance_classes')
      .select(`*, attendance_students(*), attendance_subjects(*)`)
      .eq('teacher_id', teacherId)
    if (!error && data && data.length > 0) {
      return data.map(mapDbClass)
    }
  } catch (err) {
    console.warn('Supabase getClassesByTeacher fallback:', err)
  }

  return resolveClassesForTeacher(teacherId)
}

export async function createClass(classData: Omit<AttendanceClass, 'id'>): Promise<AttendanceClass> {
  const newClass: AttendanceClass = {
    ...classData,
    id: `cls_${Date.now()}`
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('attendance_classes').insert({
      id: newClass.id,
      name: newClass.name,
      course_id: newClass.courseId,
      course_name: newClass.courseName,
      teacher_id: newClass.teacherId,
      teacher_name: newClass.teacherName,
    }).select().single()

    if (!error && data) {
      // Insert subjects
      if (newClass.subjects.length > 0) {
        await supabase.from('attendance_subjects').insert(
          newClass.subjects.map(s => ({
            id: s.id || `sub_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
            name: s.name,
            code: s.code,
            class_id: newClass.id,
          }))
        )
      }
    }
  } catch (err) {
    console.warn('Supabase createClass fallback:', err)
  }

  MOCK_CLASSES.push(newClass)
  revalidatePath('/admin/attendance')
  revalidatePath('/teacher/attendance')
  return newClass
}

export async function updateClass(
  classId: string,
  updates: Partial<Pick<AttendanceClass, 'name' | 'teacherId' | 'teacherName'>>
): Promise<AttendanceClass | null> {
  const cls = MOCK_CLASSES.find(c => c.id === classId)
  if (!cls) return null
  Object.assign(cls, updates)

  try {
    const supabase = createAdminClient()
    await supabase.from('attendance_classes').update({
      name: updates.name,
      teacher_id: updates.teacherId,
      teacher_name: updates.teacherName,
    }).eq('id', classId)
  } catch (err) {
    console.warn('Supabase updateClass fallback:', err)
  }

  revalidatePath('/admin/attendance')
  revalidatePath('/teacher/attendance')
  return cls
}

export async function deleteClass(classId: string): Promise<boolean> {
  const idx = MOCK_CLASSES.findIndex(c => c.id === classId)
  if (idx === -1) return false
  MOCK_CLASSES.splice(idx, 1)

  try {
    const supabase = createAdminClient()
    await supabase.from('attendance_classes').delete().eq('id', classId)
  } catch (err) {
    console.warn('Supabase deleteClass fallback:', err)
  }

  revalidatePath('/admin/attendance')
  revalidatePath('/teacher/attendance')
  return true
}

export async function addClassStudent(
  classId: string,
  student: { id: string; name: string; avatar?: string; rollNumber?: string }
): Promise<boolean> {
  const cls = MOCK_CLASSES.find(c => c.id === classId)
  if (!cls) return false
  if (!cls.students.some(s => s.id === student.id)) {
    const newStu = { ...student, enrolledAt: new Date().toISOString().slice(0, 10) }
    cls.students.push(newStu)

    try {
      const supabase = createAdminClient()
      await supabase.from('attendance_students').upsert({
        id: student.id,
        class_id: classId,
        name: student.name,
        avatar_url: student.avatar,
        roll_number: student.rollNumber,
        enrolled_at: newStu.enrolledAt,
      })
    } catch (err) {
      console.warn('Supabase addClassStudent fallback:', err)
    }
  }
  return true
}

export async function removeClassStudent(classId: string, studentId: string): Promise<boolean> {
  const cls = MOCK_CLASSES.find(c => c.id === classId)
  if (!cls) return false
  cls.students = cls.students.filter(s => s.id !== studentId)

  try {
    const supabase = createAdminClient()
    await supabase.from('attendance_students').delete().eq('class_id', classId).eq('id', studentId)
  } catch (err) {
    console.warn('Supabase removeClassStudent fallback:', err)
  }

  return true
}

export async function getAttendanceSessions(classId?: string, teacherId?: string): Promise<AttendanceSession[]> {
  let sessions = [...attendanceSessions]
  if (classId) sessions = sessions.filter(s => s.classId === classId)
  if (teacherId) {
    const teacherClassIds = MOCK_CLASSES.filter(c => c.teacherId === teacherId).map(c => c.id)
    // Also include sessions from placeholder-resolved classes
    const resolvedIds = resolveClassesForTeacher(teacherId).map(c => c.id)
    const allIds = new Set([...teacherClassIds, ...resolvedIds])
    sessions = sessions.filter(s => allIds.has(s.classId))
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
  const toRemoveIdxs: number[] = []
  attendanceRecords.forEach((r, i) => {
    if (r.sessionId === sessionId) toRemoveIdxs.push(i)
  })
  toRemoveIdxs.reverse().forEach(i => attendanceRecords.splice(i, 1))

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
  const newSession: AttendanceSession = {
    id: sessionId,
    classId,
    className: cls.name,
    subjectId,
    subjectName: subject.name,
    date,
    teacherId,
    teacherName: cls.teacherName,
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
    // Resolve teacher classes (including placeholder assignment)
    const teacherClassIds = resolveClassesForTeacher(userId).map(c => c.id)
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

// ---- DB Mapper (for Supabase integration) ----

function mapDbClass(row: Record<string, unknown>): AttendanceClass {
  const students = (row.attendance_students as Record<string, unknown>[] || []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: s.name as string,
    avatar: s.avatar_url as string | undefined,
    rollNumber: s.roll_number as string | undefined,
    enrolledAt: s.enrolled_at as string,
  }))

  const subjects = (row.attendance_subjects as Record<string, unknown>[] || []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: s.name as string,
    code: s.code as string,
    classId: s.class_id as string,
  }))

  return {
    id: row.id as string,
    name: row.name as string,
    courseId: row.course_id as string,
    courseName: row.course_name as string,
    teacherId: row.teacher_id as string,
    teacherName: row.teacher_name as string,
    students,
    subjects,
  }
}

// ============================================================
// DROPDOWN DATA HELPERS
// ============================================================

export interface TeacherOption {
  id: string
  name: string
  email?: string
  avatar?: string
}

export interface CourseOption {
  id: string
  title: string
  category?: string
}

export async function getTeachersForDropdown(): Promise<TeacherOption[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('role', ['teacher', 'admin'])
      .order('full_name', { ascending: true })

    if (!error && data && data.length > 0) {
      return data.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: (p.full_name as string) || 'Unnamed',
        email: p.email as string | undefined,
        avatar: p.avatar_url as string | undefined,
      }))
    }

    // Try capital-P 'Profile' table (some setups)
    const { data: data2, error: err2 } = await supabase
      .from('Profile')
      .select('id, full_name, email, avatar_url')
      .in('role', ['teacher', 'admin'])
      .order('full_name', { ascending: true })

    if (!err2 && data2 && data2.length > 0) {
      return data2.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: (p.full_name as string) || 'Unnamed',
        email: p.email as string | undefined,
        avatar: p.avatar_url as string | undefined,
      }))
    }
  } catch (err) {
    console.warn('getTeachersForDropdown fallback:', err)
  }

  // Fallback: return teachers derived from existing classes
  const teacherMap = new Map<string, TeacherOption>()
  for (const cls of MOCK_CLASSES) {
    if (cls.teacherId && cls.teacherId !== '__teacher_placeholder__') {
      teacherMap.set(cls.teacherId, { id: cls.teacherId, name: cls.teacherName })
    }
  }
  return Array.from(teacherMap.values())
}

export async function getCoursesForDropdown(): Promise<CourseOption[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, category')
      .order('title', { ascending: true })

    if (!error && data && data.length > 0) {
      return data.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        title: c.title as string,
        category: c.category as string | undefined,
      }))
    }
  } catch (err) {
    console.warn('getCoursesForDropdown fallback:', err)
  }

  // Fallback: derive from existing attendance classes
  const seen = new Set<string>()
  return MOCK_CLASSES
    .filter(c => { const k = c.courseName; if (seen.has(k)) return false; seen.add(k); return true })
    .map(c => ({ id: c.courseId, title: c.courseName }))
}

