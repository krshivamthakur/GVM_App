import { Course, ChapterWithLectures, Profile, CourseStatus } from './database'

export interface CourseFormData {
  title: string
  description: string
  category: string
  thumbnail_url?: string
  status: CourseStatus
  price?: number
}

export interface CourseFilterParams {
  category?: string
  search?: string
  status?: CourseStatus
  teacher_id?: string
}

export interface CourseStats {
  total_courses: number
  total_students: number
  total_lectures: number
  completion_rate: number
}

export type { Course, ChapterWithLectures, CourseStatus }
