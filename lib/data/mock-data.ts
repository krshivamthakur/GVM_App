import { Profile, Course, Chapter, Lecture, Note, Enrollment, LectureProgress, ShortVideo, AppNotification } from '@/types/database'

export const INITIAL_PROFILES: Profile[] = [
  {
    id: '00000000-0000-0000-0000-789002199687',
    full_name: 'Sumit Saurav',
    email: 'sumit@example.com',
    role: 'admin',
    teacher_status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    bio: 'Platform Administrator',
    created_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: '00000000-0000-0000-0000-789003538483',
    full_name: 'samir',
    email: 'samir@example.com',
    role: 'teacher',
    teacher_status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Instructor',
    created_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: '00000000-0000-0000-0000-789003609732',
    full_name: 'harsh',
    email: 'harsh@example.com',
    role: 'student',
    teacher_status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    bio: 'Student',
    created_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: '00000000-0000-0000-0000-789011391300',
    full_name: 'demo',
    email: 'demo@example.com',
    role: 'student',
    teacher_status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Student',
    created_at: '2026-09-01T00:00:00.000Z'
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
