import { Profile } from './database'

export interface ShortComment {
  id: string
  short_id: string
  user_id: string
  user_name: string
  user_avatar?: string | null
  content: string
  created_at: string
  likes_count: number
}

export interface ShortVideo {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  duration: number // in seconds, e.g. 45
  teacher_id: string
  teacher?: Profile
  course_id?: string
  course_title?: string
  views_count: number
  likes_count: number
  is_liked?: boolean
  is_saved?: boolean
  tags: string[]
  created_at: string
  comments: ShortComment[]
}
