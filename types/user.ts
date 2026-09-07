import { Profile, UserRole, TeacherStatus } from './database'

export interface UserSession {
  user: Profile | null
  role: UserRole
  isAuthenticated: boolean
}

export interface TeacherApplication {
  id: string
  full_name: string
  email: string
  bio: string
  status: TeacherStatus
  applied_at: string
}

export interface StudentStats {
  enrolledCoursesCount: number
  completedLecturesCount: number
  totalWatchedHours: number
  overallProgressPercentage: number
}

export interface AdminPlatformStats {
  totalStudents: number
  totalTeachers: number
  pendingTeachers: number
  totalCourses: number
  totalLectures: number
  totalEnrollments: number
}

export type { Profile, UserRole, TeacherStatus }
