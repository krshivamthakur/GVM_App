import { Lecture, Chapter, Note, LectureProgress } from './database'

export interface LectureFormData {
  chapter_id: string
  title: string
  description?: string
  video_path?: string
  duration?: number
  lecture_order?: number
  is_published?: boolean
  is_free_preview?: boolean
}

export interface ChapterFormData {
  course_id: string
  title: string
  description?: string
  chapter_order?: number
}

export interface NoteFormData {
  lecture_id: string
  title: string
  file_path: string
  file_type?: string
}

export interface LectureNavigation {
  previousLectureId: string | null
  nextLectureId: string | null
  currentLecture: Lecture & { notes?: Note[]; progress?: LectureProgress }
  courseId: string
  courseTitle: string
}

export type { Lecture, Chapter, Note, LectureProgress }
