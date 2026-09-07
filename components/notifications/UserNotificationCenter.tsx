'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/contexts/NotificationContext'
import { useAuth } from '@/hooks/useAuth'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Search, 
  Sliders, 
  ExternalLink, 
  Flame, 
  BookOpen, 
  GraduationCap, 
  Trophy, 
  Megaphone, 
  UserCheck, 
  Clock, 
  ShieldAlert,
  Sparkles,
  Volume2,
  Mail,
  Smartphone,
  Radio
} from 'lucide-react'
import { NotificationType, NotificationPriority } from '@/types/database'
import { formatDisplayDate } from '@/lib/utils'

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
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

export function UserNotificationCenter() {
  const router = useRouter()
  const { user, role } = useAuth()
  const {
    notifications,
    unreadCount,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    showToast
  } = useNotifications()

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'learning' | 'shorts' | 'system' | 'settings'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleNotificationClick = async (notifId: string, linkUrl?: string | null) => {
    await markAsRead(notifId)
    if (linkUrl) {
      router.push(linkUrl)
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read
    if (activeTab === 'learning') return n.type === 'course' || n.type === 'enrollment' || n.type === 'achievement'
    if (activeTab === 'shorts') return n.type === 'shorts'
    if (activeTab === 'system') return n.type === 'system' || n.type === 'announcement'
    return true
  }).filter((n) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      n.title.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q) ||
      (n.sender_name && n.sender_name.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Bell className="h-6 w-6" />
            </span>
            Notifications Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with your courses, micro-lessons, system notices, and achievement milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-accent text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              <CheckCheck className="h-4 w-4 text-emerald-500" />
              <span>Mark All Read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all your notifications?')) {
                  clearAll()
                }
              }}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-destructive/10 hover:text-destructive text-xs font-semibold text-muted-foreground transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            All Updates ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
              activeTab === 'unread'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
              activeTab === 'learning'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Courses & Study
          </button>
          <button
            onClick={() => setActiveTab('shorts')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
              activeTab === 'shorts'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Shorts
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
              activeTab === 'system'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            System
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 flex items-center gap-1 ${
              activeTab === 'settings'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Sliders className="h-3 w-3" />
            <span>Preferences</span>
          </button>
        </div>

        {/* Search input (when not in settings) */}
        {activeTab !== 'settings' && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'settings' ? (
        /* Notification Preferences Panel */
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs max-w-2xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-foreground">Notification Preferences</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize how and when you receive notifications from the platform.
            </p>
          </div>

          <div className="divide-y divide-border/60">
            {/* Sound effects */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Notification Sounds</p>
                  <p className="text-[11px] text-muted-foreground">Play alert sound when toasts arrive.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.sound_enabled}
                onChange={(e) => updatePreferences({ sound_enabled: e.target.checked })}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </div>

            {/* Email notifications */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Email Digests</p>
                  <p className="text-[11px] text-muted-foreground">Receive weekly summary and urgent announcements by email.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.email_notifications}
                onChange={(e) => updatePreferences({ email_notifications: e.target.checked })}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </div>

            {/* Push notifications */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">In-App Popups & Push</p>
                  <p className="text-[11px] text-muted-foreground">Display react-toastify alerts on new releases.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.push_notifications}
                onChange={(e) => updatePreferences({ push_notifications: e.target.checked })}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </div>

            {/* Course announcements */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Course Updates & Lectures</p>
                  <p className="text-[11px] text-muted-foreground">Alerts when teachers publish new chapters or lecture notes.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.course_announcements}
                onChange={(e) => updatePreferences({ course_announcements: e.target.checked })}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </div>

            {/* Shorts interactions */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Shorts & Micro-Lessons</p>
                  <p className="text-[11px] text-muted-foreground">Notify when followed teachers upload new video shorts.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.short_interactions}
                onChange={(e) => updatePreferences({ short_interactions: e.target.checked })}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </div>

            {/* System broadcasts */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">System Maintenance Alerts</p>
                  <p className="text-[11px] text-muted-foreground">Critical notifications about maintenance and security.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.system_broadcasts}
                onChange={(e) => updatePreferences({ system_broadcasts: e.target.checked })}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Notifications Feed */
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto mb-3">
                <Bell className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-foreground">No notifications in this view</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No updates matching "${searchQuery}". Try different keywords.`
                  : "You're completely caught up! New updates from your courses and teachers will show up here."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                  notif.is_read
                    ? 'border-border bg-card/60 hover:bg-card'
                    : 'border-primary/30 bg-primary/5 hover:bg-primary/10 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="shrink-0 p-2.5 rounded-xl bg-background border border-border shadow-xs mt-0.5">
                    {getTypeIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        onClick={() => handleNotificationClick(notif.id, notif.link_url)}
                        className={`text-sm cursor-pointer hover:underline ${
                          notif.is_read ? 'font-medium text-foreground' : 'font-bold text-foreground'
                        }`}
                      >
                        {notif.title}
                      </h3>
                      {!notif.is_read && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground uppercase tracking-wider">
                          New
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.2 rounded-md text-[10px] font-bold uppercase ${
                          notif.priority === 'error'
                            ? 'bg-rose-500/10 text-rose-600'
                            : notif.priority === 'warning'
                            ? 'bg-amber-500/10 text-amber-600'
                            : notif.priority === 'success'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-blue-500/10 text-blue-600'
                        }`}
                      >
                        {notif.priority}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span suppressHydrationWarning>{formatRelativeTime(notif.created_at)}</span>
                      <span>•</span>
                      <span className="capitalize">{notif.sender_name || notif.type}</span>
                      {notif.link_url && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => handleNotificationClick(notif.id, notif.link_url)}
                            type="button"
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                          >
                            <span>{notif.link_label || 'Go to resource'}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {!notif.is_read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      type="button"
                      title="Mark as read"
                      className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    type="button"
                    title="Dismiss"
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
