export type NotificationType = 
  | 'system'
  | 'announcement'
  | 'course'
  | 'enrollment'
  | 'shorts'
  | 'teacher_approval'
  | 'achievement'
  | 'reminder'

export type NotificationPriority = 'info' | 'success' | 'warning' | 'error'

export type NotificationTarget = 'all' | 'students' | 'teachers' | 'admins' | 'user'

export interface AppNotification {
  id: string
  user_id?: string | null // null if broadcast to target_audience
  target_audience: NotificationTarget
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  link_url?: string | null
  link_label?: string | null
  sender_id?: string | null
  sender_name?: string | null
  sender_avatar?: string | null
  is_read: boolean
  read_at?: string | null
  created_at: string
  metadata?: Record<string, any>
}

export interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  course_announcements: boolean
  short_interactions: boolean
  system_broadcasts: boolean
  sound_enabled: boolean
}

export interface AdminNotificationStats {
  totalSent: number
  totalRead: number
  readRate: number
  activeBroadcasts: number
  studentReach: number
  teacherReach: number
}
