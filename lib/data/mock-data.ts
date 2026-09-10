import { Profile, Course, Chapter, Lecture, Note, Enrollment, LectureProgress, ShortVideo, AppNotification } from '@/types/database'

export const INITIAL_PROFILES: Profile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    full_name: 'Student User',
    email: 'student@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    bio: 'Student account',
    created_at: '2026-01-10T09:00:00Z'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    full_name: 'Prof. Ramesh Sharma',
    email: 'teacher@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'teacher',
    teacher_status: 'approved',
    bio: 'Educator account',
    created_at: '2025-11-15T10:00:00Z'
  },
  {
    id: '00000000-0000-0000-0000-788327949126',
    full_name: 'Platform Administrator',
    email: 'admin@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    bio: 'Administrator account',
    created_at: '2025-01-01T00:00:00Z'
  }
]

export const INITIAL_COURSES: Course[] = []
export const INITIAL_CHAPTERS: Chapter[] = []
export const INITIAL_LECTURES: Lecture[] = []
export const INITIAL_NOTES: Note[] = []
export const INITIAL_ENROLLMENTS: Enrollment[] = []
export const INITIAL_PROGRESS: LectureProgress[] = []
export const INITIAL_SHORTS: ShortVideo[] = []
export const INITIAL_NOTIFICATIONS: AppNotification[] = []
