'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ToastContainer, toast, ToastOptions } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { 
  AppNotification, 
  NotificationPreferences, 
  NotificationType, 
  NotificationPriority, 
  NotificationTarget 
} from '@/types/database'
import {
  getUserNotifications,
  getUserUnreadCount,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  clearAllNotificationsAction,
  createBroadcastNotificationAction,
  getUserNotificationPreferencesAction,
  updateUserNotificationPreferencesAction
} from '@/actions/notification-actions'
import { useAuth } from '@/hooks/useAuth'

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  preferences: NotificationPreferences
  refreshNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  deleteNotification: (id: string) => Promise<boolean>
  clearAll: () => Promise<boolean>
  sendBroadcast: (params: {
    title: string
    message: string
    type: NotificationType
    priority: NotificationPriority
    target_audience: NotificationTarget
    link_url?: string
    link_label?: string
    user_id?: string
  }) => Promise<{ success: boolean; notification?: AppNotification; error?: string }>
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>
  showToast: (
    title: string,
    message?: string,
    priority?: NotificationPriority,
    linkUrl?: string
  ) => void
}

const defaultPreferences: NotificationPreferences = {
  email_notifications: true,
  push_notifications: true,
  course_announcements: true,
  short_interactions: true,
  system_broadcasts: true,
  sound_enabled: true
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)

  const showToast = useCallback(
    (
      title: string,
      message?: string,
      priority: NotificationPriority = 'info',
      linkUrl?: string
    ) => {
      const content = (
        <div className="flex flex-col gap-0.5 pr-2">
          <span className="font-semibold text-xs leading-tight">{title}</span>
          {message && <span className="text-[11px] opacity-90 leading-snug">{message}</span>}
          {linkUrl && (
            <a
              href={linkUrl}
              className="mt-1 text-[11px] underline font-medium hover:opacity-80 transition-opacity"
            >
              View Details &rarr;
            </a>
          )}
        </div>
      )

      const options: ToastOptions = {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored'
      }

      switch (priority) {
        case 'success':
          toast.success(content, options)
          break
        case 'warning':
          toast.warning(content, options)
          break
        case 'error':
          toast.error(content, options)
          break
        case 'info':
        default:
          toast.info(content, options)
          break
      }
    },
    []
  )

  const refreshNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const [list, count, prefs] = await Promise.all([
        getUserNotifications(),
        getUserUnreadCount(),
        getUserNotificationPreferencesAction()
      ])
      setNotifications(list)
      setUnreadCount(count)
      if (prefs) setPreferences(prefs)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications, user?.id, role])

  const markAsRead = async (id: string): Promise<boolean> => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))

    try {
      const ok = await markNotificationAsReadAction(id)
      return ok
    } catch (err) {
      console.error('Error marking read:', err)
      refreshNotifications()
      return false
    }
  }

  const markAllAsRead = async (): Promise<boolean> => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)

    try {
      const ok = await markAllNotificationsAsReadAction()
      showToast('All notifications marked as read', undefined, 'success')
      return ok
    } catch (err) {
      console.error('Error marking all read:', err)
      refreshNotifications()
      return false
    }
  }

  const deleteNotification = async (id: string): Promise<boolean> => {
    const item = notifications.find((n) => n.id === id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (item && !item.is_read) {
      setUnreadCount((c) => Math.max(0, c - 1))
    }

    try {
      const ok = await deleteNotificationAction(id)
      return ok
    } catch (err) {
      console.error('Error deleting notification:', err)
      refreshNotifications()
      return false
    }
  }

  const clearAll = async (): Promise<boolean> => {
    setNotifications([])
    setUnreadCount(0)
    try {
      const ok = await clearAllNotificationsAction()
      showToast('Cleared all notifications', undefined, 'info')
      return ok
    } catch (err) {
      console.error('Error clearing notifications:', err)
      refreshNotifications()
      return false
    }
  }

  const sendBroadcast = async (params: {
    title: string
    message: string
    type: NotificationType
    priority: NotificationPriority
    target_audience: NotificationTarget
    link_url?: string
    link_label?: string
    user_id?: string
  }) => {
    try {
      const res = await createBroadcastNotificationAction(params)
      if (res.success && res.notification) {
        showToast(
          `Notification Dispatched: ${res.notification.title}`,
          res.notification.message,
          res.notification.priority,
          res.notification.link_url || undefined
        )
        await refreshNotifications()
      } else {
        showToast('Failed to dispatch notification', res.error, 'error')
      }
      return res
    } catch (err: any) {
      showToast('Broadcast error', err.message, 'error')
      return { success: false, error: err.message }
    }
  }

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }))
    try {
      const saved = await updateUserNotificationPreferencesAction(updates)
      setPreferences(saved)
      showToast('Preferences updated', undefined, 'success')
    } catch (err) {
      console.error('Error saving notification preferences:', err)
      refreshNotifications()
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        preferences,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        sendBroadcast,
        updatePreferences,
        showToast
      }}
    >
      {children}
      {/* react-toastify Toast Container mounted at app root level */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="text-xs z-50 font-sans"
        toastClassName="shadow-lg rounded-xl border border-border backdrop-blur-md"
      />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
