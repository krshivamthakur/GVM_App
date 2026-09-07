export type UserRole = 'student' | 'teacher' | 'admin'
export type TeacherStatus = 'pending' | 'approved' | 'rejected'
export type CourseStatus = 'draft' | 'published' | 'archived'

export interface Profile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  role: UserRole
  teacher_status?: TeacherStatus
  bio?: string | null
  created_at: string
}

export interface Course {
  id: string
  teacher_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  category: string | null
  status: CourseStatus
  price?: number
  created_at: string
  updated_at: string
  teacher?: Profile
  chapters?: ChapterWithLectures[]
  _count?: {
    enrollments?: number
    lectures?: number
  }
}

export interface Chapter {
  id: string
  course_id: string
  title: string
  description: string | null
  chapter_order: number
  created_at: string
  lectures?: Lecture[]
}

export interface Lecture {
  id: string
  chapter_id: string
  title: string
  description: string | null
  video_path: string | null
  duration: number | null // in seconds
  lecture_order: number
  is_published: boolean
  is_free_preview?: boolean
  created_at: string
  notes?: Note[]
}

export interface Note {
  id: string
  lecture_id: string
  title: string
  file_path: string
  file_type: string | null
  created_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  course?: Course
  student?: Profile
}

export interface LectureProgress {
  id: string
  student_id: string
  lecture_id: string
  watched_seconds: number
  completed: boolean
  last_watched_at: string
}

export interface ChapterWithLectures extends Chapter {
  lectures: (Lecture & { progress?: LectureProgress; notes?: Note[] })[]
}

export interface CourseWithCurriculum extends Course {
  chapters: ChapterWithLectures[]
  teacher: Profile
  is_enrolled?: boolean
  progress_percentage?: number
  completed_lectures_count?: number
  total_lectures_count?: number
}

export * from './short'
export * from './notification'
