import { Profile, Course, Chapter, Lecture, Note, Enrollment, LectureProgress, ShortVideo, AppNotification } from '@/types/database'

export const INITIAL_PROFILES: Profile[] = [
  {
    id: '00000000-0000-0000-0000-788756822521',
    full_name: 'admin',
    email: 'admin@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    bio: 'Platform Administrator',
    created_at: '2026-09-07T04:53:42.521+00:00'
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
