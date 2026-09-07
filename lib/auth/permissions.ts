import { Profile, UserRole } from '@/types/database'

export function isStudent(profile: Profile | null | undefined): boolean {
  return profile?.role === 'student'
}

export function isTeacher(profile: Profile | null | undefined): boolean {
  return profile?.role === 'teacher' || profile?.role === 'admin'
}

export function isAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin'
}

export function canManageCourse(profile: Profile | null | undefined, courseTeacherId: string): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  return profile.role === 'teacher' && profile.id === courseTeacherId
}

export function canAccessLecture(
  profile: Profile | null | undefined,
  isEnrolled: boolean,
  isFreePreview: boolean = false,
  isCourseTeacher: boolean = false
): boolean {
  if (isCourseTeacher || profile?.role === 'admin') return true
  if (isFreePreview) return true
  return isEnrolled
}
