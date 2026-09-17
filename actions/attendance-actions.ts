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
// ============================================================
// IN-MEMORY STORE (Cleaned of all mock/demo data, strictly reflects DB)
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
    if (!error && data) {
      return data.map(mapDbClass)
    }
  } catch (err) {
    console.warn('Supabase getAllClasses fallback:', err)
  }

  return [...MOCK_CLASSES]
}

export async function getClassesByTeacher(
  teacherId: string,
  teacherName?: string,
  teacherEmail?: string
): Promise<AttendanceClass[]> {
  try {
    const supabase = createAdminClient()

    // 1. Direct query by teacher_id
    const { data, error } = await supabase
      .from('attendance_classes')
      .select(`*, attendance_students(*), attendance_subjects(*)`)
      .eq('teacher_id', teacherId)

    if (!error && data && data.length > 0) {
      return data.map(mapDbClass)
    }

    // 2. Fallback query matching teacher name or email
    const nameOrEmail = (teacherName || teacherEmail || '').toLowerCase().trim()
    if (nameOrEmail) {
      const { data: allData, error: allErr } = await supabase
        .from('attendance_classes')
        .select(`*, attendance_students(*), attendance_subjects(*)`)

      if (!allErr && allData && allData.length > 0) {
        const matches = allData.filter((d: any) =>
          d.teacher_id === teacherId ||
          (d.teacher_name && d.teacher_name.toLowerCase().includes(nameOrEmail)) ||
          nameOrEmail.includes((d.teacher_name || '').toLowerCase())
        )
        if (matches.length > 0) {
          return matches.map(mapDbClass)
        }
      }
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
  updates: Partial<Pick<AttendanceClass, 'name' | 'teacherId' | 'teacherName' | 'courseId' | 'courseName'>>
): Promise<AttendanceClass | null> {
  let updatedClass: AttendanceClass | null = null

  try {
    const supabase = createAdminClient()
    const dbUpdates: any = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.teacherId !== undefined) dbUpdates.teacher_id = updates.teacherId
    if (updates.teacherName !== undefined) dbUpdates.teacher_name = updates.teacherName
    if (updates.courseId !== undefined) dbUpdates.course_id = updates.courseId
    if (updates.courseName !== undefined) dbUpdates.course_name = updates.courseName

    const { data, error } = await supabase
      .from('attendance_classes')
      .update(dbUpdates)
      .eq('id', classId)
      .select(`*, attendance_students(*), attendance_subjects(*)`)
      .maybeSingle()

    if (!error && data) {
      updatedClass = mapDbClass(data)
    }
  } catch (err) {
    console.warn('Supabase updateClass fallback:', err)
  }

  const cls = MOCK_CLASSES.find(c => c.id === classId)
  if (cls) {
    Object.assign(cls, updates)
    if (!updatedClass) updatedClass = cls
  }

  revalidatePath('/admin/attendance')
  revalidatePath('/teacher/attendance')
  return updatedClass
}

export async function deleteClass(classId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    await supabase.from('attendance_classes').delete().eq('id', classId)
  } catch (err) {
    console.warn('Supabase deleteClass fallback:', err)
  }

  const idx = MOCK_CLASSES.findIndex(c => c.id === classId)
  if (idx !== -1) {
    MOCK_CLASSES.splice(idx, 1)
  }

  revalidatePath('/admin/attendance')
  revalidatePath('/teacher/attendance')
  return true
}

export async function addClassSubject(
  classId: string,
  subject: { id?: string; name: string; code?: string }
): Promise<boolean> {
  const subId = subject.id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
  const code = subject.code || subject.name.slice(0, 3).toUpperCase()

  try {
    const supabase = createAdminClient()
    await supabase.from('attendance_subjects').upsert({
      id: subId,
      class_id: classId,
      name: subject.name,
      code,
    })
  } catch (err) {
    console.warn('Supabase addClassSubject fallback:', err)
  }

  const cls = MOCK_CLASSES.find(c => c.id === classId)
  if (cls) {
    if (!cls.subjects.some(s => s.id === subId)) {
      cls.subjects.push({ id: subId, name: subject.name, code, classId })
    }
  }

  revalidatePath('/admin/attendance')
  revalidatePath('/teacher/attendance')
  return true
}

export async function removeClassSubject(classId: string, subjectId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    await supabase.from('attendance_subjects').delete().eq('id', subjectId).eq('class_id', classId)
  } catch (err) {
    console.warn('Supabase removeClassSubject fallback:', err)
  }

  const cls = MOCK_CLASSES.find(c => c.id === classId)
  if (cls) {
    cls.subjects = cls.subjects.filter(s => s.id !== subjectId)
  }

  revalidatePath('/admin/attendance')
  revalidatePath('/teacher/attendance')
  return true
}

export async function addClassStudent(
  classId: string,
  student: { id: string; name: string; avatar?: string; rollNumber?: string }
): Promise<boolean> {
  const newStu = { ...student, enrolledAt: new Date().toISOString().slice(0, 10) }

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

  const cls = MOCK_CLASSES.find(c => c.id === classId)
  if (cls && !cls.students.some(s => s.id === student.id)) {
    cls.students.push(newStu)
  }

  revalidatePath('/admin/attendance')
  revalidatePath('/teacher/attendance')
  return true
}

export async function syncCourseStudentsToClass(classId: string): Promise<{ success: boolean; count: number }> {
  try {
    const supabase = createAdminClient()
    const { data: students } = await supabase
      .from('Profile')
      .select('id, full_name, email, avatar_url')
      .eq('role', 'student')

    if (students && students.length > 0) {
      const inserts = students.map((s: any, idx: number) => ({
        id: s.id,
        class_id: classId,
        name: s.full_name || s.email?.split('@')[0] || 'Student',
        avatar_url: s.avatar_url,
        roll_number: String(101 + idx),
        enrolled_at: new Date().toISOString().slice(0, 10),
      }))

      await supabase.from('attendance_students').upsert(inserts, { onConflict: 'id,class_id' })
      revalidatePath('/admin/attendance')
      revalidatePath('/teacher/attendance')
      return { success: true, count: inserts.length }
    }
  } catch (err) {
    console.warn('syncCourseStudentsToClass error:', err)
  }
  return { success: false, count: 0 }
}

export async function removeClassStudent(classId: string, studentId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    await supabase.from('attendance_students').delete().eq('class_id', classId).eq('id', studentId)
  } catch (err) {
    console.warn('Supabase removeClassStudent fallback:', err)
  }

  const cls = MOCK_CLASSES.find(c => c.id === classId)
  if (cls) {
    cls.students = cls.students.filter(s => s.id !== studentId)
  }

  revalidatePath('/admin/attendance')
  revalidatePath('/teacher/attendance')
  return true
}

export async function getAttendanceSessions(classId?: string, teacherId?: string): Promise<AttendanceSession[]> {
  try {
    const supabase = createAdminClient()
    let query = supabase.from('attendance_sessions').select('*')
    if (classId) query = query.eq('class_id', classId)
    if (teacherId) query = query.eq('teacher_id', teacherId)
    const { data, error } = await query.order('date', { ascending: false })

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        classId: d.class_id,
        className: d.class_name,
        subjectId: d.subject_id,
        subjectName: d.subject_name,
        date: d.date,
        teacherId: d.teacher_id,
        teacherName: d.teacher_name,
        lockStatus: d.lock_status,
        lockedAt: d.locked_at,
        submittedAt: d.submitted_at,
        totalStudents: d.total_students,
        presentCount: d.present_count,
        absentCount: d.absent_count,
        lateCount: d.late_count,
        leaveCount: d.leave_count,
      }))
    }
  } catch (err) {
    console.warn('Supabase getAttendanceSessions fallback:', err)
  }

  let sessions = [...attendanceSessions]
  if (classId) sessions = sessions.filter(s => s.classId === classId)
  if (teacherId) {
    const teacherClassIds = MOCK_CLASSES.filter(c => c.teacherId === teacherId).map(c => c.id)
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
  try {
    const supabase = createAdminClient()
    let query = supabase.from('attendance_records').select('*').eq('class_id', classId).eq('date', date)
    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }
    const { data, error } = await query

    if (!error && data && data.length > 0) {
      return data.map((r: any) => ({
        id: r.id,
        sessionId: r.session_id,
        studentId: r.student_id,
        studentName: r.student_name,
        studentAvatar: r.student_avatar,
        classId: r.class_id,
        subjectId: r.subject_id,
        subjectName: r.subject_name,
        date: r.date,
        status: r.status,
        notes: r.notes,
        markedBy: r.marked_by,
        markedAt: r.marked_at,
        correctedBy: r.corrected_by,
        correctedAt: r.corrected_at,
        isExcused: r.is_excused,
      }))
    }
  } catch (err) {
    console.warn('Supabase getAttendanceForSession fallback:', err)
  }

  return attendanceRecords.filter(
    r => r.classId === classId && (!subjectId || r.subjectId === subjectId) && r.date === date
  )
}

export interface MarkAttendanceOptions {
  markedByAdmin?: boolean
  adminId?: string
  adminName?: string
  overrideTeacherId?: string
  overrideTeacherName?: string
  remarks?: string
}

export async function markBulkAttendance(
  classId: string,
  subjectId: string,
  date: string,
  teacherId: string,
  records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>,
  options?: MarkAttendanceOptions
): Promise<{ success: boolean; sessionId: string; error?: string }> {
  // Fetch class either from Supabase or memory
  let cls: AttendanceClass | undefined = MOCK_CLASSES.find(c => c.id === classId)
  if (!cls) {
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('attendance_classes')
        .select(`*, attendance_students(*), attendance_subjects(*)`)
        .eq('id', classId)
        .maybeSingle()
      if (data) {
        cls = mapDbClass(data)
      }
    } catch (e) {}
  }

  if (!cls) {
    return { success: false, sessionId: '', error: 'Class not found.' }
  }

  const subject = cls.subjects.find(s => s.id === subjectId) || {
    id: subjectId || `sub_gen_${classId}`,
    name: cls.courseName || cls.name || 'Regular Class',
    code: 'REG',
    classId
  }

  const sessionId = `sess_${classId}_${subject.id}_${date}`

  const effectiveTeacherId = options?.overrideTeacherId || teacherId || cls.teacherId || 'teacher'
  const effectiveTeacherName = options?.overrideTeacherName || cls.teacherName || 'Assigned Teacher'
  const markedByLabel = options?.markedByAdmin
    ? `Admin: ${options.adminName || 'Admin'} (proxy for ${effectiveTeacherName})`
    : teacherId

  const newRecords: AttendanceRecord[] = records.map((rec, i) => {
    const student = cls!.students.find(s => s.id === rec.studentId)
    return {
      id: `rec_${Date.now()}_${i}`,
      sessionId,
      studentId: rec.studentId,
      studentName: student?.name || 'Student',
      studentAvatar: student?.avatar,
      classId,
      subjectId: subject.id,
      subjectName: subject.name,
      date,
      status: rec.status,
      notes: rec.notes,
      markedBy: markedByLabel,
      markedAt: new Date().toISOString(),
    }
  })

  const newSession: AttendanceSession = {
    id: sessionId,
    classId,
    className: cls.name,
    subjectId: subject.id,
    subjectName: subject.name,
    date,
    teacherId: effectiveTeacherId,
    teacherName: effectiveTeacherName,
    lockStatus: 'open',
    submittedAt: new Date().toISOString(),
    totalStudents: records.length || cls.students.length,
    presentCount: records.filter(r => r.status === 'present').length,
    absentCount: records.filter(r => r.status === 'absent').length,
    lateCount: records.filter(r => r.status === 'late').length,
    leaveCount: records.filter(r => r.status === 'leave').length,
  }

  // 1. Persist to Supabase
  try {
    const supabase = createAdminClient()

    // Upsert session
    await supabase.from('attendance_sessions').upsert({
      id: sessionId,
      class_id: classId,
      class_name: cls.name,
      subject_id: subject.id,
      subject_name: subject.name,
      date,
      teacher_id: effectiveTeacherId,
      teacher_name: effectiveTeacherName,
      lock_status: 'open',
      submitted_at: newSession.submittedAt,
      total_students: newSession.totalStudents,
      present_count: newSession.presentCount,
      absent_count: newSession.absentCount,
      late_count: newSession.lateCount,
      leave_count: newSession.leaveCount,
    }, { onConflict: 'class_id,subject_id,date' })

    // Upsert individual records
    if (newRecords.length > 0) {
      const dbInserts = newRecords.map(r => ({
        session_id: sessionId,
        student_id: r.studentId,
        student_name: r.studentName,
        student_avatar: r.studentAvatar,
        class_id: classId,
        subject_id: subject.id,
        subject_name: subject.name,
        date,
        status: r.status,
        notes: r.notes || null,
        marked_by: markedByLabel,
        marked_at: r.markedAt,
      }))

      await supabase.from('attendance_records').upsert(dbInserts, { onConflict: 'session_id,student_id' })
    }
  } catch (err) {
    console.warn('Supabase markBulkAttendance fallback:', err)
  }

  // 2. Persist in memory fallback
  const toRemoveIdxs: number[] = []
  attendanceRecords.forEach((r, i) => {
    if (r.sessionId === sessionId) toRemoveIdxs.push(i)
  })
  toRemoveIdxs.reverse().forEach(i => attendanceRecords.splice(i, 1))
  newRecords.forEach(r => attendanceRecords.push(r))

  const existingIdx = attendanceSessions.findIndex(s => s.id === sessionId)
  if (existingIdx >= 0) {
    attendanceSessions[existingIdx] = newSession
  } else {
    attendanceSessions.push(newSession)
  }

  // 3. Log administrative proxy action in audit log if marked by admin
  if (options?.markedByAdmin) {
    auditLog.push({
      id: `audit_${Date.now()}`,
      recordId: sessionId,
      action: 'proxy_marked',
      performedBy: options.adminId || 'admin',
      performedByName: options.adminName || 'Administrator',
      timestamp: new Date().toISOString(),
      notes: `Admin recorded attendance for "${cls.name}" (${subject.name}) on behalf of teacher ${effectiveTeacherName}.${options.remarks ? ` Reason: ${options.remarks}` : ''}`,
    })
  }

  revalidatePath('/teacher/attendance')
  revalidatePath('/admin/attendance')
  revalidatePath('/student/attendance')
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
  let classes = await getAllClasses()

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

  if (!studentName) {
    try {
      const supabase = createAdminClient()
      const { data: p } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', studentId).single()
      if (p) {
        studentName = p.full_name || 'Student'
        studentAvatar = p.avatar_url
      }
    } catch {
      // ignore
    }
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
  const classes = await getAllClasses()
  const studentIds = new Set<string>()
  for (const cls of classes) {
    for (const stu of cls.students) studentIds.add(stu.id)
  }

  try {
    const supabase = createAdminClient()
    const { data: dbStudents } = await supabase.from('profiles').select('id').eq('role', 'student')
    if (dbStudents) {
      for (const s of dbStudents) studentIds.add(s.id)
    }
  } catch (err) {
    console.warn('getAllStudentsSummary error:', err)
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

