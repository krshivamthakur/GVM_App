'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/contexts/NotificationContext'
import { useAuth } from '@/hooks/useAuth'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Flame,
  BookOpen,
  GraduationCap,
  Trophy,
  Megaphone,
  UserCheck,
  Clock,
  Sparkles,
  Settings,
  AlertCircle
} from 'lucide-react'
import { NotificationType, NotificationPriority } from '@/types/database'
import { formatDisplayDate } from '@/lib/utils'

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return formatDisplayDate(dateStr)
  } catch {
    return 'Recently'
  }
}

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case 'shorts':
      return <Flame className="h-4 w-4 text-rose-500 fill-rose-500" />
    case 'course':
      return <BookOpen className="h-4 w-4 text-blue-500" />
    case 'enrollment':
      return <GraduationCap className="h-4 w-4 text-emerald-500" />
    case 'achievement':
      return <Trophy className="h-4 w-4 text-amber-500" />
    case 'announcement':
      return <Megaphone className="h-4 w-4 text-purple-500" />
    case 'teacher_approval':
      return <UserCheck className="h-4 w-4 text-indigo-500" />
    case 'reminder':
      return <Clock className="h-4 w-4 text-orange-500" />
    case 'system':
    default:
      return <Bell className="h-4 w-4 text-zinc-500" />
  }
}

function getPriorityBorder(priority: NotificationPriority) {
  switch (priority) {
    case 'error':
      return 'border-l-4 border-l-rose-500 bg-rose-500/5'
    case 'warning':
      return 'border-l-4 border-l-amber-500 bg-amber-500/5'
    case 'success':
      return 'border-l-4 border-l-emerald-500 bg-emerald-500/5'
    case 'info':
    default:
      return 'border-l-4 border-l-blue-500 bg-blue-500/5'
  }
}

export function NotificationBellPopover() {
  const router = useRouter()
  const { role } = useAuth()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showToast
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'announcements'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'announcements') return n.type === 'announcement' || n.target_audience === 'all'
    return true
  })

  const handleNotificationClick = async (notifId: string, linkUrl?: string | null) => {
    await markAsRead(notifId)
    if (linkUrl) {
      setIsOpen(false)
      router.push(linkUrl)
    }
  }

  const notificationHubUrl = role === 'admin' ? '/admin/notifications' : '/student/notifications'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 overflow-hidden flex flex-col max-h-[540px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                  Up to date
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  type="button"
                  title="Mark all as read"
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <Link
                href={notificationHubUrl}
                onClick={() => setIsOpen(false)}
                title="Notification Settings"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/50 bg-background/50 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('announcements')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'announcements'
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Announcements
            </button>
          </div>

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-1">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-2">
                  <Check className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">No notifications found</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px]">
                  {filter === 'unread'
                    ? "You've read everything on your radar!"
                    : "You're completely caught up with all updates."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`group relative flex items-start gap-3 p-3 rounded-xl transition-all ${
                    notif.is_read ? 'opacity-80 hover:opacity-100 hover:bg-accent/40' : 'bg-accent/60 hover:bg-accent/80'
                  } ${!notif.is_read ? getPriorityBorder(notif.priority) : ''}`}
                >
                  {/* Category / Source Icon */}
                  <div className="mt-0.5 shrink-0 rounded-lg p-1.5 bg-background border border-border/60 shadow-xs">
                    {getTypeIcon(notif.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        onClick={() => handleNotificationClick(notif.id, notif.link_url)}
                        className={`text-xs truncate cursor-pointer hover:underline ${
                          notif.is_read ? 'font-medium text-foreground' : 'font-bold text-foreground'
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0" suppressHydrationWarning>
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Action Link & Meta */}
                    <div className="flex items-center justify-between mt-2 pt-1">
                      {notif.link_url ? (
                        <button
                          onClick={() => handleNotificationClick(notif.id, notif.link_url)}
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        >
                          <span>{notif.link_label || 'View detail'}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/70 capitalize">
                          {notif.sender_name || notif.type}
                        </span>
                      )}

                      {/* Quick Read/Delete Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.is_read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            type="button"
                            title="Mark as read"
                            className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-background"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          type="button"
                          title="Dismiss notification"
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-background"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Unread indicator dot */}
                  {!notif.is_read && (
                    <span
                      onClick={() => markAsRead(notif.id)}
                      title="Click to mark read"
                      className="absolute top-3 right-2.5 h-2 w-2 rounded-full bg-primary cursor-pointer ring-2 ring-background"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/70 bg-muted/20 text-xs">
            <button
              onClick={() =>
                showToast(
                  'Test Notification',
                  'This is a real-time reactive toast demo!',
                  'info',
                  '/shorts'
                )
              }
              type="button"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium"
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Test Toast</span>
            </button>

            <Link
              href={notificationHubUrl}
              onClick={() => setIsOpen(false)}
              className="font-semibold text-[11px] text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View All Notifications</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
