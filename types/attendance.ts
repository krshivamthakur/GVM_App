// Attendance Management System — Type Definitions

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'half_day' | 'excused'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type SessionLockStatus = 'open' | 'locked'

export interface AttendanceRecord {
  id: string
  sessionId: string
  studentId: string
  studentName: string
  studentAvatar?: string
  classId: string
  subjectId: string
  subjectName: string
  date: string // ISO date string YYYY-MM-DD
  status: AttendanceStatus
  notes?: string
  markedBy: string // teacherId or 'system'
  markedAt: string // ISO datetime
  correctedBy?: string
  correctedAt?: string
  isExcused?: boolean
}

export interface AttendanceSession {
  id: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  date: string
  teacherId: string
  teacherName: string
  lockStatus: SessionLockStatus
  lockedAt?: string
  submittedAt?: string
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  leaveCount: number
}

export interface AttendanceClass {
  id: string
  name: string
  courseId: string
  courseName: string
  teacherId: string
  teacherName: string
  students: AttendanceStudent[]
  subjects: AttendanceSubject[]
}

export interface AttendanceStudent {
  id: string
  name: string
  avatar?: string
  rollNumber?: string
  enrolledAt: string
}

export interface AttendanceSubject {
  id: string
  name: string
  code: string
  classId: string
}

export interface AttendanceSummary {
  studentId: string
  studentName: string
  studentAvatar?: string
  overallPercentage: number
  totalClasses: number
  presentCount: number
  absentCount: number
  lateCount: number
  leaveCount: number
  halfDayCount: number
  excusedCount: number
  isLowAttendance: boolean
  subjectBreakdown: SubjectAttendanceSummary[]
  monthlyBreakdown: MonthlyAttendanceSummary[]
}

export interface SubjectAttendanceSummary {
  subjectId: string
  subjectName: string
  totalClasses: number
  present: number
  absent: number
  late: number
  leave: number
  percentage: number
  isLowAttendance: boolean
}

export interface MonthlyAttendanceSummary {
  month: string // 'YYYY-MM'
  monthLabel: string
  totalClasses: number
  present: number
  absent: number
  percentage: number
}

export interface LeaveRequest {
  id: string
  studentId: string
  studentName: string
  studentAvatar?: string
  classId: string
  className: string
  fromDate: string
  toDate: string
  reason: string
  documentUrl?: string
  status: LeaveStatus
  submittedAt: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNote?: string
}

export interface AttendanceRule {
  id: string
  minAttendancePercentage: number
  lockAfterDays: number
  allowCorrectionByTeacher: boolean
  allowCorrectionByAdmin: boolean
  parentNotificationsEnabled: boolean
  lowAttendanceThreshold: number
  autoMarkLeaveOnApproval: boolean
  semesterStartDate: string
  semesterEndDate: string
}

export interface AttendanceNotification {
  id: string
  type: 'absence' | 'low_attendance' | 'leave_approved' | 'leave_rejected' | 'reminder'
  studentId: string
  message: string
  createdAt: string
  isRead: boolean
}

export interface AttendanceAuditLog {
  id: string
  recordId: string
  action: 'created' | 'corrected' | 'deleted' | 'locked'
  performedBy: string
  performedByName: string
  oldValue?: AttendanceStatus
  newValue?: AttendanceStatus
  timestamp: string
  notes?: string
}
