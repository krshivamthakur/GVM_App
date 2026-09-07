'use client'

import React, { useState, useTransition } from 'react'
import { 
  AppNotification, 
  AdminNotificationStats, 
  NotificationType, 
  NotificationPriority, 
  NotificationTarget,
  Profile 
} from '@/types/database'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatDisplayDate } from '@/lib/utils'
import { 
  Megaphone, 
  Bell, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Flame, 
  GraduationCap, 
  BookOpen, 
  Users, 
  ShieldAlert, 
  ExternalLink,
  Sparkles,
  X,
  Copy,
  Clock
} from 'lucide-react'

interface AdminNotificationManagerProps {
  initialNotifications: AppNotification[]
  initialStats: AdminNotificationStats
  allProfiles: Profile[]
}

const TEMPLATES: {
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  target_audience: NotificationTarget
  link_url?: string
  link_label?: string
}[] = [
  {
    title: '🚀 Spring 2026 Platform Upgrade Live',
    message: 'We have enabled ultra-fast micro-lessons in Shorts Studio and interactive course playlists for all learners!',
    type: 'announcement',
    priority: 'info',
    target_audience: 'all',
    link_url: '/shorts',
    link_label: 'Explore Shorts'
  },
  {
    title: '⚠️ Scheduled System Maintenance',
    message: 'Database optimization and server maintenance will occur tonight from 02:00 AM to 02:30 AM UTC.',
    type: 'system',
    priority: 'warning',
    target_audience: 'all',
    link_url: '/admin',
    link_label: 'Status Page'
  },
  {
    title: '📚 New Advanced AI & Cloud Engineering Course',
    message: 'A brand new comprehensive curriculum on Cloud Native Architecture has just been released.',
    type: 'course',
    priority: 'success',
    target_audience: 'students',
    link_url: '/student/courses',
    link_label: 'Browse Courses'
  },
  {
    title: '🔥 Weekly Shorts Challenge: #CodingTips',
    message: 'Teachers: Upload a 45-second micro-lesson sharing your favorite syntax trick or debugger shortcut.',
    type: 'shorts',
    priority: 'info',
    target_audience: 'teachers',
    link_url: '/teacher/shorts',
    link_label: 'Open Studio'
  }
]

export function AdminNotificationManager({
  initialNotifications,
  initialStats,
  allProfiles
}: AdminNotificationManagerProps) {
  const { sendBroadcast, deleteNotification, showToast } = useNotifications()
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications)
  const [stats, setStats] = useState<AdminNotificationStats>(initialStats)
  const [isPending, startTransition] = useTransition()

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAudience, setSelectedAudience] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Composer State
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [formData, setFormData] = useState<{
    title: string
    message: string
    type: NotificationType
    priority: NotificationPriority
    target_audience: NotificationTarget
    link_url: string
    link_label: string
    user_id: string
  }>({
    title: '',
    message: '',
    type: 'announcement',
    priority: 'info',
    target_audience: 'all',
    link_url: '',
    link_label: '',
    user_id: ''
  })

  // Apply template
  const applyTemplate = (template: (typeof TEMPLATES)[0]) => {
    setFormData({
      title: template.title,
      message: template.message,
      type: template.type,
      priority: template.priority,
      target_audience: template.target_audience,
      link_url: template.link_url || '',
      link_label: template.link_label || '',
      user_id: ''
    })
  }

  // Handle Form Submit
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.message.trim()) {
      showToast('Validation Error', 'Title and message are required', 'error')
      return
    }

    startTransition(async () => {
      const res = await sendBroadcast({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        target_audience: formData.target_audience,
        link_url: formData.link_url || undefined,
        link_label: formData.link_label || undefined,
        user_id: formData.target_audience === 'user' ? formData.user_id : undefined
      })

      if (res.success && res.notification) {
        setNotifications((prev) => [res.notification!, ...prev])
        setStats((prev) => ({
          ...prev,
          totalSent: prev.totalSent + 1,
          activeBroadcasts:
            formData.target_audience !== 'user' ? prev.activeBroadcasts + 1 : prev.activeBroadcasts
        }))
        setIsComposerOpen(false)
        setFormData({
          title: '',
          message: '',
          type: 'announcement',
          priority: 'info',
          target_audience: 'all',
          link_url: '',
          link_label: '',
          user_id: ''
        })
      }
    })
  }

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return

    await deleteNotification(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setStats((prev) => ({
      ...prev,
      totalSent: Math.max(0, prev.totalSent - 1)
    }))
  }

  // Filter list
  const filteredList = notifications.filter((item) => {
    if (selectedAudience !== 'all' && item.target_audience !== selectedAudience) return false
    if (selectedType !== 'all' && item.type !== selectedType) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        (item.sender_name && item.sender_name.toLowerCase().includes(q))
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Megaphone className="h-6 w-6" />
            </span>
            Notification Management System
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dispatch announcements, target student or teacher cohorts, manage system alerts, and track delivery rates.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsComposerOpen(true)}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Compose Broadcast</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total Dispatched</span>
            <Bell className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground mt-2">{stats.totalSent}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Platform notifications</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Read Through Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground mt-2">{stats.readRate}%</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Active user engagement</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Active Broadcasts</span>
            <Megaphone className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground mt-2">{stats.activeBroadcasts}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Audience wide messages</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Audience Reach</span>
            <Users className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground mt-2">
            {stats.studentReach + stats.teacherReach}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {stats.studentReach} students, {stats.teacherReach} instructors
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, message, or sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Audience Filter */}
          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
          >
            <option value="all">All Audiences</option>
            <option value="students">Students Only</option>
            <option value="teachers">Teachers Only</option>
            <option value="admins">Admins Only</option>
            <option value="user">Direct Users</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="announcement">Announcements</option>
            <option value="system">System Alerts</option>
            <option value="course">Course Updates</option>
            <option value="shorts">Shorts</option>
            <option value="enrollment">Enrollments</option>
            <option value="achievement">Achievements</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedAudience('all')
              setSelectedType('all')
            }}
            type="button"
            className="h-9 px-3 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Notification Details</th>
                <th className="py-3 px-4">Target Audience</th>
                <th className="py-3 px-4">Type & Priority</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Bell className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-foreground">No notifications match your filters</p>
                      <p className="text-[11px]">Try adjusting your search keywords or filter options.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((notif) => (
                  <tr key={notif.id} className="hover:bg-accent/40 transition-colors">
                    <td className="py-3 px-4 max-w-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground truncate">{notif.title}</span>
                        <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {notif.message}
                        </span>
                        {notif.link_url && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-primary">
                            <ExternalLink className="h-2.5 w-2.5" />
                            <span className="truncate">{notif.link_label || notif.link_url}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border">
                        {notif.target_audience === 'all' && <Users className="h-3 w-3" />}
                        {notif.target_audience === 'students' && <GraduationCap className="h-3 w-3" />}
                        {notif.target_audience === 'teachers' && <BookOpen className="h-3 w-3" />}
                        {notif.target_audience === 'admins' && <ShieldAlert className="h-3 w-3" />}
                        {notif.target_audience}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            notif.priority === 'error'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : notif.priority === 'warning'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : notif.priority === 'success'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {notif.priority}
                        </span>
                        <span className="text-[11px] text-muted-foreground capitalize">{notif.type}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3" />
                        <span suppressHydrationWarning>{formatDisplayDate(notif.created_at)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() =>
                            showToast(
                              `[Preview] ${notif.title}`,
                              notif.message,
                              notif.priority,
                              notif.link_url || undefined
                            )
                          }
                          type="button"
                          title="Preview Live Toast"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-background transition-colors"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(notif.id)}
                          type="button"
                          title="Delete notification"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-background transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Compose Broadcast Notification</h2>
                  <p className="text-xs text-muted-foreground">
                    Send real-time alerts and toast notifications across user portals.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsComposerOpen(false)}
                type="button"
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Template Selector */}
            <div className="py-3 border-b border-border">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">QUICK PRESETS</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(tmpl)}
                    className="shrink-0 px-2.5 py-1 rounded-lg border border-border bg-muted/30 hover:bg-muted text-[11px] text-foreground font-medium transition-colors"
                  >
                    {tmpl.title.split(' ')[0]} {tmpl.title.split(' ')[1]}...
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4 pt-4">
              {/* Target Audience */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Target Audience
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(
                    [
                      { id: 'all', label: 'All Users', icon: Users },
                      { id: 'students', label: 'Students', icon: GraduationCap },
                      { id: 'teachers', label: 'Teachers', icon: BookOpen },
                      { id: 'admins', label: 'Admins', icon: ShieldAlert },
                      { id: 'user', label: 'Specific User', icon: Info }
                    ] as const
                  ).map((aud) => {
                    const Icon = aud.icon
                    const isSelected = formData.target_audience === aud.id
                    return (
                      <button
                        key={aud.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, target_audience: aud.id })}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span>{aud.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Specific user selector if 'user' */}
              {formData.target_audience === 'user' && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Select Target User
                  </label>
                  <select
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  >
                    <option value="">-- Choose User --</option>
                    {allProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.email}) - {p.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category and Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Notification Category
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as NotificationType })
                    }
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                  >
                    <option value="announcement">Announcement (General)</option>
                    <option value="system">System / Maintenance</option>
                    <option value="course">Course Curriculum</option>
                    <option value="shorts">Shorts Video</option>
                    <option value="achievement">Achievement & Certificate</option>
                    <option value="reminder">Study Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Priority / Severity
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 h-9">
                    {(['info', 'success', 'warning', 'error'] as const).map((pri) => (
                      <button
                        key={pri}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: pri })}
                        className={`capitalize rounded-lg text-xs font-semibold border transition-all ${
                          formData.priority === pri
                            ? pri === 'error'
                              ? 'border-rose-500 bg-rose-500 text-white'
                              : pri === 'warning'
                              ? 'border-amber-500 bg-amber-500 text-white'
                              : pri === 'success'
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-blue-500 bg-blue-500 text-white'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {pri}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. 🚀 Spring 2026 Platform Upgrade Live"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Message Content
                </label>
                <textarea
                  rows={3}
                  placeholder="Type the message body to be shown in the notification popover and live toast..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </div>

              {/* Action Button & Link (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Action Destination Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /shorts or /student/courses"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Action Button Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Watch Now or View Details"
                    value={formData.link_label}
                    onChange={(e) => setFormData({ ...formData, link_label: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isPending ? 'Dispatching...' : 'Dispatch Broadcast Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
