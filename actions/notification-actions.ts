'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { dataStore } from '@/lib/data/store'
import { 
  AppNotification, 
  NotificationPreferences, 
  AdminNotificationStats, 
  NotificationType, 
  NotificationPriority, 
  NotificationTarget 
} from '@/types/database'

export async function getUserNotifications(options?: {
  unreadOnly?: boolean
  type?: string
  limit?: number
}): Promise<AppNotification[]> {
  const activeUser = dataStore.getActiveUser()
  if (!activeUser) return []

  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (activeUser.role !== 'admin') {
      query = query.or(`user_id.eq.${activeUser.id},target_audience.eq.all,target_audience.eq.${activeUser.role}s`)
    }

    if (options?.unreadOnly) {
      query = query.eq('is_read', false)
    }

    if (options?.type && options.type !== 'all') {
      query = query.eq('type', options.type)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query
    if (!error && data && data.length > 0) {
      return data as AppNotification[]
    }
  } catch (err) {
    // Fallback to dataStore
  }

  return dataStore.getNotificationsForUser(activeUser.id, activeUser.role, options)
}

export async function getUserUnreadCount(): Promise<number> {
  const activeUser = dataStore.getActiveUser()
  if (!activeUser) return 0

  return dataStore.getUnreadCount(activeUser.id, activeUser.role)
}

export async function markNotificationAsReadAction(notificationId: string): Promise<boolean> {
  const activeUser = dataStore.getActiveUser()
  if (!activeUser) return false

  try {
    const supabase = createAdminClient()
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
  } catch (err) {
    // Fallback to store
  }

  const success = dataStore.markNotificationAsRead(notificationId, activeUser.id)
  revalidatePath('/', 'layout')
  return success
}

export async function markAllNotificationsAsReadAction(): Promise<boolean> {
  const activeUser = dataStore.getActiveUser()
  if (!activeUser) return false

  try {
    const supabase = createAdminClient()
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .or(`user_id.eq.${activeUser.id},target_audience.eq.all,target_audience.eq.${activeUser.role}s`)
  } catch (err) {
    // Fallback to store
  }

  const success = dataStore.markAllNotificationsAsRead(activeUser.id, activeUser.role)
  revalidatePath('/', 'layout')
  return success
}

export async function deleteNotificationAction(notificationId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    await supabase.from('notifications').delete().eq('id', notificationId)
  } catch (err) {
    // Fallback to store
  }

  const success = dataStore.deleteNotification(notificationId)
  revalidatePath('/', 'layout')
  return success
}

export async function clearAllNotificationsAction(): Promise<boolean> {
  const activeUser = dataStore.getActiveUser()
  if (!activeUser) return false

  const success = dataStore.clearAllNotificationsForUser(activeUser.id, activeUser.role)
  revalidatePath('/', 'layout')
  return success
}

export async function createBroadcastNotificationAction(params: {
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  target_audience: NotificationTarget
  link_url?: string
  link_label?: string
  user_id?: string
}): Promise<{ success: boolean; notification?: AppNotification; error?: string }> {
  if (!params.title?.trim() || !params.message?.trim()) {
    return { success: false, error: 'Title and message are required.' }
  }

  const activeUser = dataStore.getActiveUser()

  const payload: Omit<AppNotification, 'id' | 'created_at' | 'is_read'> = {
    title: params.title.trim(),
    message: params.message.trim(),
    type: params.type || 'system',
    priority: params.priority || 'info',
    target_audience: params.target_audience || 'all',
    link_url: params.link_url?.trim() || null,
    link_label: params.link_label?.trim() || null,
    user_id: params.target_audience === 'user' ? (params.user_id || null) : null,
    sender_id: activeUser.id,
    sender_name: activeUser.full_name || 'System Administrator',
    sender_avatar: activeUser.avatar_url || null,
    metadata: {}
  }

  try {
    const supabase = createAdminClient()
    const { data: inserted, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .maybeSingle()

    if (!error && inserted) {
      const created = dataStore.createNotification(inserted)
      revalidatePath('/', 'layout')
      return { success: true, notification: created }
    }
  } catch (err) {
    // Continue with dataStore fallback
  }

  const created = dataStore.createNotification(payload)
  revalidatePath('/', 'layout')
  return { success: true, notification: created }
}

export async function getAdminNotificationStatsAction(): Promise<AdminNotificationStats> {
  return dataStore.getAdminNotificationStats()
}

export async function getAdminNotificationsAction(filter?: {
  search?: string
  type?: string
  audience?: string
}): Promise<AppNotification[]> {
  return dataStore.getAllNotificationsAdmin(filter)
}

export async function getUserNotificationPreferencesAction(): Promise<NotificationPreferences> {
  const activeUser = dataStore.getActiveUser()
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', activeUser.id)
      .maybeSingle()

    if (!error && data) {
      return data as NotificationPreferences
    }
  } catch (err) {
    // Fallback to dataStore
  }
  return dataStore.getNotificationPreferences(activeUser.id)
}

export async function updateUserNotificationPreferencesAction(
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const activeUser = dataStore.getActiveUser()
  try {
    const supabase = createAdminClient()
    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: activeUser.id,
        email_notifications: true,
        push_notifications: true,
        course_announcements: true,
        short_interactions: true,
        system_broadcasts: true,
        sound_enabled: true,
        ...updates,
        updated_at: new Date().toISOString()
      })
  } catch (err) {
    // Fallback
  }
  const saved = dataStore.updateNotificationPreferences(activeUser.id, updates)
  revalidatePath('/', 'layout')
  return saved
}
