import { Profile, Course, Chapter, Lecture, Note, Enrollment, LectureProgress, ShortVideo, AppNotification } from '@/types/database'

export const INITIAL_PROFILES: Profile[] = [
  {
    id: '00000000-0000-0000-0000-788327949126',
    full_name: 'Carla Peter',
    email: 'admin@example.com',
    role: 'admin',
    teacher_status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Platform Administrator',
    created_at: new Date().toISOString()
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
