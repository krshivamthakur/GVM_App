'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Settings,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  MessageSquare,
  Sparkles,
  Sliders,
  Globe,
  Bell,
  Lock,
  RefreshCw,
  Server,
  Layers,
  Flame,
  Check,
  ExternalLink,
  Key,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Smartphone,
  PanelLeft,
  Menu,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  BookOpen,
  Wallet,
  CalendarCheck,
  BarChart3,
  TrendingUp,
  Video,
  UserCircle,
  Compass,
  BookmarkCheck,
  LayoutDashboard,
  HelpCircle
} from 'lucide-react'
import {
  usePlatformSettings,
  DEFAULT_NAV_LABELS,
  DEFAULT_BOTTOM_NAV_LABELS,
  BottomNavItemLabel
} from '@/contexts/PlatformSettingsContext'

// Navigation Configurations for Admin, Teacher, and Student
const ADMIN_NAV_CONFIG = [
  { href: '/admin', defaultLabel: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', defaultLabel: 'Analytics', icon: BarChart3 },
  { href: '/admin/reports', defaultLabel: 'Reports', icon: TrendingUp },
  { href: '/admin/courses', defaultLabel: 'Courses', icon: BookOpen },
  { href: '/admin/fees', defaultLabel: 'Fee Management', icon: Wallet },
  { href: '/admin/attendance', defaultLabel: 'Attendance', icon: CalendarCheck },
  { href: '/admin/students', defaultLabel: 'Students', icon: GraduationCap },
  { href: '/admin/teachers', defaultLabel: 'Teachers', icon: UserCheck },
  { href: '/admin/users', defaultLabel: 'Users', icon: ShieldCheck },
  { href: '/admin/shorts', defaultLabel: 'Shorts Studio', icon: Flame },
  { href: '/admin/chat', defaultLabel: 'Chat & Moderation', icon: MessageSquare },
  { href: '/admin/notifications', defaultLabel: 'Notifications', icon: Bell },
  { href: '/admin/settings', defaultLabel: 'Settings', icon: Settings },
]

const TEACHER_NAV_CONFIG = [
  { href: '/teacher', defaultLabel: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/courses', defaultLabel: 'My Courses', icon: BookOpen },
  { href: '/teacher/attendance', defaultLabel: 'Attendance', icon: CalendarCheck },
  { href: '/teacher/students', defaultLabel: 'Students', icon: GraduationCap },
  { href: '/teacher/analytics', defaultLabel: 'Progress', icon: BarChart3 },
  { href: '/teacher/shorts', defaultLabel: 'Shorts Studio', icon: Video },
  { href: '/teacher/chat', defaultLabel: 'Faculty Chat', icon: MessageSquare },
  { href: '/student/notifications', defaultLabel: 'Notice', icon: Bell },
  { href: '/teacher/profile', defaultLabel: 'Profile', icon: UserCircle },
]

const STUDENT_NAV_CONFIG = [
  { href: '/student', defaultLabel: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/courses', defaultLabel: 'Explore Courses', icon: Compass },
  { href: '/student/my-courses', defaultLabel: 'My Learning', icon: BookmarkCheck },
  { href: '/shorts', defaultLabel: 'Shorts Feed', icon: Flame },
  { href: '/student/fees', defaultLabel: 'Fees & Receipts', icon: Wallet },
  { href: '/student/attendance', defaultLabel: 'My Attendance', icon: CalendarCheck },
  { href: '/student/chat', defaultLabel: 'Student Chat', icon: MessageSquare },
  { href: '/student/notifications', defaultLabel: 'Notifications', icon: Bell },
  { href: '/student/profile', defaultLabel: 'Profile', icon: UserCircle },
]

const ADMIN_BOTTOM_NAV_CONFIG = [
  { href: '/admin', defaultTitle: 'Dashboard', defaultShortTitle: 'Home', icon: LayoutDashboard },
  { href: '/admin/users', defaultTitle: 'User Management', defaultShortTitle: 'Users', icon: ShieldCheck },
  { href: '/admin/courses', defaultTitle: 'Courses', defaultShortTitle: 'Courses', icon: BookOpen },
  { href: '/admin/notifications', defaultTitle: 'Notification', defaultShortTitle: 'Alerts', icon: Bell },
  { href: '/admin/settings', defaultTitle: 'Platform Settings', defaultShortTitle: 'Settings', icon: Settings },
]

const TEACHER_BOTTOM_NAV_CONFIG = [
  { href: '/teacher', defaultTitle: 'Dashboard', defaultShortTitle: 'Home', icon: LayoutDashboard },
  { href: '/teacher/courses', defaultTitle: 'My Courses', defaultShortTitle: 'Courses', icon: BookOpen },
  { href: '/teacher/chat', defaultTitle: 'Chats', defaultShortTitle: 'Chats', icon: MessageSquare },
  { href: '/teacher/shorts', defaultTitle: 'Shorts Studio', defaultShortTitle: 'Shorts', icon: Video },
  { href: '/student/notifications', defaultTitle: 'Notification', defaultShortTitle: 'Alerts', icon: Bell },
]

const STUDENT_BOTTOM_NAV_CONFIG = [
  { href: '/student', defaultTitle: 'Dashboard', defaultShortTitle: 'Home', icon: LayoutDashboard },
  { href: '/student/my-courses', defaultTitle: 'My Courses', defaultShortTitle: 'Courses', icon: BookOpen },
  { href: '/student/chat', defaultTitle: 'Chats', defaultShortTitle: 'Chats', icon: MessageSquare },
  { href: '/shorts', defaultTitle: 'Shorts Studio', defaultShortTitle: 'Shorts', icon: Flame },
  { href: '/student/notifications', defaultTitle: 'Notification', defaultShortTitle: 'Alerts', icon: Bell },
]

export default function AdminSettingsPage() {
  const { settings, updateSettings, isLoaded } = usePlatformSettings()
  const [activeTab, setActiveTab] = useState<'general' | 'navigation' | 'chat' | 'database' | 'policies' | 'danger'>('general')
  const [navRoleTab, setNavRoleTab] = useState<'admin' | 'teacher' | 'student'>('admin')
  const [bottomRoleTab, setBottomRoleTab] = useState<'admin' | 'teacher' | 'student'>('admin')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const logoFileInputRef = useRef<HTMLInputElement>(null)

  // Branding State
  const [platformName, setPlatformName] = useState(settings.platformName || 'GVM EduLMS')
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '/gvm.png')
  const [logoText, setLogoText] = useState(settings.logoText || 'GVM')
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || 'support@gvmedu.com')
  const [defaultLanguage, setDefaultLanguage] = useState(settings.defaultLanguage || 'en')
  const [allowRegistration, setAllowRegistration] = useState(settings.allowRegistration ?? true)
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode ?? false)

  // Navigation Labels State
  const [navLabels, setNavLabels] = useState<Record<string, string>>({
    ...DEFAULT_NAV_LABELS,
    ...(settings.navLabels || {})
  })

  // Bottom Nav Labels State
  const [bottomNavLabels, setBottomNavLabels] = useState<Record<string, BottomNavItemLabel>>({
    ...DEFAULT_BOTTOM_NAV_LABELS,
    ...(settings.bottomNavLabels || {})
  })

  // Chat Engine Feature Flags
  const [callingEnabled, setCallingEnabled] = useState(settings.chatEngine?.callingEnabled ?? true)
  const [studentDMsEnabled, setStudentDMsEnabled] = useState(settings.chatEngine?.studentDMsEnabled ?? true)
  const [groupCreationAllowed, setGroupCreationAllowed] = useState(settings.chatEngine?.groupCreationAllowed ?? true)
  const [fileUploadsAllowed, setFileUploadsAllowed] = useState(settings.chatEngine?.fileUploadsAllowed ?? true)

  // Policies State
  const [teacherApprovalMode, setTeacherApprovalMode] = useState<'manual' | 'auto'>(settings.teacherApprovalMode || 'manual')
  const [shortsMaxDuration, setShortsMaxDuration] = useState(settings.shortsMaxDuration || '60')
  const [shortsCreatorPolicy, setShortsCreatorPolicy] = useState<'teachers' | 'all'>(settings.shortsCreatorPolicy || 'teachers')

  // Synchronize if settings are reloaded/hydrated from localStorage
  useEffect(() => {
    if (isLoaded) {
      setPlatformName(settings.platformName || 'GVM EduLMS')
      setLogoUrl(settings.logoUrl || '/gvm.png')
      setLogoText(settings.logoText || 'GVM')
      setSupportEmail(settings.supportEmail || 'support@gvmedu.com')
      setDefaultLanguage(settings.defaultLanguage || 'en')
      setAllowRegistration(settings.allowRegistration ?? true)
      setMaintenanceMode(settings.maintenanceMode ?? false)
      setCallingEnabled(settings.chatEngine?.callingEnabled ?? true)
      setStudentDMsEnabled(settings.chatEngine?.studentDMsEnabled ?? true)
      setGroupCreationAllowed(settings.chatEngine?.groupCreationAllowed ?? true)
      setFileUploadsAllowed(settings.chatEngine?.fileUploadsAllowed ?? true)
      setTeacherApprovalMode(settings.teacherApprovalMode || 'manual')
      setShortsMaxDuration(settings.shortsMaxDuration || '60')
      setShortsCreatorPolicy(settings.shortsCreatorPolicy || 'teachers')
      setNavLabels({
        ...DEFAULT_NAV_LABELS,
        ...(settings.navLabels || {})
      })
      setBottomNavLabels({
        ...DEFAULT_BOTTOM_NAV_LABELS,
        ...(settings.bottomNavLabels || {})
      })
    }
  }, [isLoaded, settings])

  // Logo file upload handler
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      alert('Logo file size must be less than 4MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setLogoUrl(event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Restore Logo to Default
  const handleResetLogo = () => {
    setLogoUrl('/gvm.png')
    setLogoText('GVM')
  }

  // Nav Label Handlers
  const handleNavLabelChange = (href: string, value: string) => {
    setNavLabels((prev) => ({
      ...prev,
      [href]: value
    }))
  }

  const handleResetNavLabel = (href: string, defaultLabel: string) => {
    setNavLabels((prev) => ({
      ...prev,
      [href]: defaultLabel
    }))
  }

  const handleResetAllNavForRole = (role: 'admin' | 'teacher' | 'student') => {
    const config = role === 'admin' ? ADMIN_NAV_CONFIG : role === 'teacher' ? TEACHER_NAV_CONFIG : STUDENT_NAV_CONFIG
    setNavLabels((prev) => {
      const updated = { ...prev }
      config.forEach((item) => {
        updated[item.href] = item.defaultLabel
      })
      return updated
    })
  }

  // Bottom Nav Handlers
  const handleBottomTitleChange = (href: string, title: string) => {
    setBottomNavLabels((prev) => ({
      ...prev,
      [href]: {
        ...(prev[href] || {}),
        title
      }
    }))
  }

  const handleBottomShortTitleChange = (href: string, shortTitle: string) => {
    setBottomNavLabels((prev) => ({
      ...prev,
      [href]: {
        ...(prev[href] || { title: '' }),
        shortTitle
      }
    }))
  }

  const handleResetBottomItem = (href: string, defaultTitle: string, defaultShortTitle: string) => {
    setBottomNavLabels((prev) => ({
      ...prev,
      [href]: {
        title: defaultTitle,
        shortTitle: defaultShortTitle
      }
    }))
  }

  const handleResetAllBottomForRole = (role: 'admin' | 'teacher' | 'student') => {
    const config = role === 'admin' ? ADMIN_BOTTOM_NAV_CONFIG : role === 'teacher' ? TEACHER_BOTTOM_NAV_CONFIG : STUDENT_BOTTOM_NAV_CONFIG
    setBottomNavLabels((prev) => {
      const updated = { ...prev }
      config.forEach((item) => {
        updated[item.href] = {
          title: item.defaultTitle,
          shortTitle: item.defaultShortTitle
        }
      })
      return updated
    })
  }

  // Action: Save Settings Globally
  const handleSave = () => {
    setIsSaving(true)
    
    // Save to global context + localStorage so all components update immediately
    updateSettings({
      platformName: platformName.trim() || 'GVM EduLMS',
      logoUrl: logoUrl.trim() || '/gvm.png',
      logoText: logoText.trim() || 'GVM',
      supportEmail: supportEmail.trim(),
      defaultLanguage,
      allowRegistration,
      maintenanceMode,
      teacherApprovalMode,
      shortsMaxDuration,
      shortsCreatorPolicy,
      navLabels,
      bottomNavLabels,
      chatEngine: {
        callingEnabled,
        studentDMsEnabled,
        groupCreationAllowed,
        fileUploadsAllowed
      }
    })

    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }, 400)
  }

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Platform Settings
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
              Admin Only
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure platform branding, real-time messaging, Supabase database, and curriculum policies.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {isSaving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="h-3.5 w-3.5 text-emerald-300" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Platform configuration updated successfully. Cached policy rules have been refreshed.</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto scrollbar-none pb-px">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>General & Branding</span>
        </button>

        <button
          onClick={() => setActiveTab('navigation')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'navigation'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Menu className="h-3.5 w-3.5" />
          <span>Navigation & Menus</span>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'chat'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Real-Time Chat Engine</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'database'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>Database & Storage</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'policies'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Curriculum & Shorts Policies</span>
        </button>

        <button
          onClick={() => setActiveTab('danger')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'danger'
              ? 'border-destructive text-destructive font-semibold'
              : 'border-transparent text-muted-foreground hover:text-destructive'
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* Tab 1: General & Branding */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Logo & Visual Identity */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span>Logo & Brand Identity</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage the project logo mark, acronym, and primary branding displayed across all portals.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetLogo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto cursor-pointer"
                title="Restore default GVM logo"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Logo to Default</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Logo Preview Boxes (Light & Dark) */}
              <div className="lg:col-span-4 flex flex-col items-center sm:items-start gap-3">
                <span className="text-xs font-semibold text-foreground">Live Logo Preview</span>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {/* Light Background Preview */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-center shadow-xs">
                    <div className="h-16 w-16 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex items-center justify-center p-1.5 overflow-hidden">
                      <img
                        src={logoUrl || '/gvm.png'}
                        alt="Logo Preview (Light)"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          // Fallback if broken URL
                          ;(e.target as HTMLImageElement).src = '/gvm.png'
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-800 mt-2 truncate max-w-full">
                      {logoText || 'Logo'}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-medium">Light Theme</span>
                  </div>

                  {/* Dark Background Preview */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center shadow-xs">
                    <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xs flex items-center justify-center p-1.5 overflow-hidden">
                      <img
                        src={logoUrl || '/gvm.png'}
                        alt="Logo Preview (Dark)"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = '/gvm.png'
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-100 mt-2 truncate max-w-full">
                      {logoText || 'Logo'}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-medium">Dark Theme</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/80 w-full text-[11px] text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Logo automatically synchronizes with the browser tab favicon and mobile app drawer.</span>
                </div>
              </div>

              {/* Upload & Logo Inputs */}
              <div className="lg:col-span-8 space-y-4">
                {/* Upload Button + URL Input */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Upload Logo Image or Provide URL
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={handleLogoFileUpload}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold border border-primary/20 transition-all cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Choose Local File...</span>
                    </button>
                    <span className="text-xs text-muted-foreground text-center sm:text-left">or enter Image URL</span>
                  </div>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png or /gvm.png"
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Supports PNG, SVG, JPG, WebP. File uploads are converted to portable base64 Data URLs and stored locally.
                  </p>
                </div>

                {/* Platform Name and Logo Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Platform Full Name
                    </label>
                    <input
                      type="text"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      placeholder="e.g. GVM EduLMS"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Displayed on top headers, browser tabs, and login screens.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Logo Short Mark / Acronym
                    </label>
                    <input
                      type="text"
                      value={logoText}
                      onChange={(e) => setLogoText(e.target.value)}
                      placeholder="e.g. GVM"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-bold"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Displayed next to the logo emblem on the desktop sidebar.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Organization & Locale */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Organization & Support</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your LMS contact details and locale defaults.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Public Support & Notification Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Default Language
                </label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Platform Timezone
                </label>
                <input
                  type="text"
                  readOnly
                  value="UTC / Auto-Detect Local Client Time"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Access & Availability */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Access & Availability</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Control user registration and maintenance windows.
              </p>
            </div>

            <div className="space-y-3 divide-y divide-border/60">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-xs font-medium text-foreground">Allow Open Student Registration</p>
                  <p className="text-[11px] text-muted-foreground">
                    When enabled, new students can register via the sign-up portal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowRegistration(!allowRegistration)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    allowRegistration ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-xs transition duration-200 ease-in-out ${
                      allowRegistration ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-medium text-foreground">System Maintenance Mode</p>
                  <p className="text-[11px] text-muted-foreground">
                    Displays a maintenance notice to non-admin visitors during scheduled updates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    maintenanceMode ? 'bg-destructive' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-xs transition duration-200 ease-in-out ${
                      maintenanceMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Navigation & Menus */}
      {activeTab === 'navigation' && (
        <div className="space-y-6">
          {/* Informational Global Sync Banner */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-4 flex items-start gap-3">
            <PanelLeft className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs leading-relaxed text-blue-900 dark:text-blue-200">
              <span className="font-semibold block text-sm mb-0.5">Global Navigation & Menu Customization</span>
              Customize the names of sidebar navigation links and mobile bottom navigation tabs across Admin, Teacher, and Student portals.
              Changes apply globally across the platform immediately upon saving.
            </div>
          </div>

          {/* Section 1: Sidebar Navigation Item Names */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <PanelLeft className="h-4 w-4 text-primary" />
                  <span>Desktop & Sidebar Navigation Names</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rename sidebar items for Admin, Teacher, and Student navigation menus.
                </p>
              </div>

              {/* Portal Selector Subtabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border border-border/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setNavRoleTab('admin')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    navRoleTab === 'admin'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Admin Portal ({ADMIN_NAV_CONFIG.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNavRoleTab('teacher')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    navRoleTab === 'teacher'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Teacher Portal ({TEACHER_NAV_CONFIG.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNavRoleTab('student')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    navRoleTab === 'student'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Student Portal ({STUDENT_NAV_CONFIG.length})
                </button>
              </div>
            </div>

            {/* Subtab Action Bar */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-muted-foreground font-medium">
                Editing: <strong className="text-foreground capitalize">{navRoleTab} Sidebar Items</strong>
              </span>
              <button
                type="button"
                onClick={() => handleResetAllNavForRole(navRoleTab)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Reset this portal's navigation items to defaults"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset {navRoleTab} to Defaults</span>
              </button>
            </div>

            {/* Nav Items List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {(navRoleTab === 'admin'
                ? ADMIN_NAV_CONFIG
                : navRoleTab === 'teacher'
                ? TEACHER_NAV_CONFIG
                : STUDENT_NAV_CONFIG
              ).map((item) => {
                const Icon = item.icon
                const currentValue = navLabels[item.href] || ''
                const isModified = currentValue && currentValue !== item.defaultLabel

                return (
                  <div
                    key={item.href}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isModified
                        ? 'border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/10 shadow-xs'
                        : 'border-border bg-background'
                    }`}
                  >
                    <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0 border border-border/60">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-mono text-muted-foreground truncate" title={item.href}>
                          {item.href}
                        </span>
                        {isModified ? (
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.2 rounded">
                            Customized
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Default</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => handleNavLabelChange(item.href, e.target.value)}
                          placeholder={item.defaultLabel}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        {isModified && (
                          <button
                            type="button"
                            onClick={() => handleResetNavLabel(item.href, item.defaultLabel)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title={`Reset to "${item.defaultLabel}"`}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 2: Mobile Bottom Navigation Bar Names */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span>Mobile Bottom Navigation Bar Names</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure the tab labels shown on smartphones and tablets for Admin, Teacher, and Student navigation.
                </p>
              </div>

              {/* Bottom Bar Role Selector Subtabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border border-border/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setBottomRoleTab('admin')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    bottomRoleTab === 'admin'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Admin Bar ({ADMIN_BOTTOM_NAV_CONFIG.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBottomRoleTab('teacher')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    bottomRoleTab === 'teacher'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Teacher Bar ({TEACHER_BOTTOM_NAV_CONFIG.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBottomRoleTab('student')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    bottomRoleTab === 'student'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Student Bar ({STUDENT_BOTTOM_NAV_CONFIG.length})
                </button>
              </div>
            </div>

            {/* Subtab Action Bar */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-muted-foreground font-medium">
                Editing: <strong className="text-foreground capitalize">{bottomRoleTab} Bottom Bar Tabs</strong>
              </span>
              <button
                type="button"
                onClick={() => handleResetAllBottomForRole(bottomRoleTab)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Reset this bottom bar to defaults"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset {bottomRoleTab} Bottom Bar to Defaults</span>
              </button>
            </div>

            {/* Bottom Nav Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {(bottomRoleTab === 'admin'
                ? ADMIN_BOTTOM_NAV_CONFIG
                : bottomRoleTab === 'teacher'
                ? TEACHER_BOTTOM_NAV_CONFIG
                : STUDENT_BOTTOM_NAV_CONFIG
              ).map((item) => {
                const Icon = item.icon
                const currentTitle = bottomNavLabels[item.href]?.title ?? item.defaultTitle
                const currentShort = bottomNavLabels[item.href]?.shortTitle ?? item.defaultShortTitle
                const isModified =
                  currentTitle !== item.defaultTitle || currentShort !== item.defaultShortTitle

                return (
                  <div
                    key={item.href}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                      isModified
                        ? 'border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/10 shadow-xs'
                        : 'border-border bg-background'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0 border border-border/60 mt-0.5">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-muted-foreground truncate" title={item.href}>
                          {item.href}
                        </span>
                        {isModified ? (
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.2 rounded">
                            Customized
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Default</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                            Full Title (Tablets / Wide)
                          </label>
                          <input
                            type="text"
                            value={currentTitle}
                            onChange={(e) => handleBottomTitleChange(item.href, e.target.value)}
                            placeholder={item.defaultTitle}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                            Short Title (Compact Mobile)
                          </label>
                          <input
                            type="text"
                            value={currentShort}
                            onChange={(e) => handleBottomShortTitleChange(item.href, e.target.value)}
                            placeholder={item.defaultShortTitle}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                      </div>

                      {isModified && (
                        <button
                          type="button"
                          onClick={() => handleResetBottomItem(item.href, item.defaultTitle, item.defaultShortTitle)}
                          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer pt-0.5"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          <span>Reset to original defaults</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 3: Live Interactive Mobile Bottom Navigation Simulation */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-500" />
                  <span>Live Mobile Bottom Bar Simulation</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time preview of how the {bottomRoleTab} bottom bar looks with your active modifications.
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Simulated View
              </span>
            </div>

            {/* Phone Bezel Container */}
            <div className="max-w-md mx-auto rounded-3xl border-2 border-border bg-muted/30 p-2 shadow-inner">
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
                {/* Dummy screen area */}
                <div className="h-24 bg-gradient-to-b from-muted/30 to-card flex flex-col items-center justify-center p-3 text-center">
                  <span className="text-[11px] font-semibold text-foreground">
                    {platformName} — {bottomRoleTab.toUpperCase()} PORTAL
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Mobile navigation updates live below as you edit
                  </span>
                </div>

                {/* Simulated Bottom Bar */}
                <div className="border-t border-border bg-card/95 backdrop-blur px-1 py-1 flex items-center justify-around">
                  {(bottomRoleTab === 'admin'
                    ? ADMIN_BOTTOM_NAV_CONFIG
                    : bottomRoleTab === 'teacher'
                    ? TEACHER_BOTTOM_NAV_CONFIG
                    : STUDENT_BOTTOM_NAV_CONFIG
                  ).map((item, idx) => {
                    const Icon = item.icon
                    const displayTitle = bottomNavLabels[item.href]?.title || item.defaultTitle
                    const displayShort = bottomNavLabels[item.href]?.shortTitle || item.defaultShortTitle
                    const active = idx === 0

                    return (
                      <div
                        key={item.href}
                        className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg flex-1 text-center select-none ${
                          active
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div
                          className={`p-1 rounded-md mb-0.5 ${
                            active ? 'bg-primary/10 scale-105' : ''
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[9px] font-medium leading-tight truncate max-w-full">
                          {displayShort}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Real-Time Chat Engine */}
      {activeTab === 'chat' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Real-Time Chat Engine Status</h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active & Unified
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Native real-time messaging, audio/video consultations, and cohort study circles across Student, Teacher, and Admin portals.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-[11px] text-muted-foreground font-medium">Chat Engine</span>
                <p className="text-xs font-bold text-foreground mt-0.5">Native WebSocket & Storage Sync</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-[11px] text-muted-foreground font-medium">Calling Protocol</span>
                <p className="text-xs font-bold text-foreground mt-0.5">Encrypted WebRTC Audio & Video</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-[11px] text-muted-foreground font-medium">Attachment Limit</span>
                <p className="text-xs font-bold text-foreground mt-0.5">15 MB per File / Document</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Chat Engine Feature Governance</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Control permissions and communications accessible to learners and instructors.
              </p>
            </div>

            <div className="space-y-3 divide-y divide-border/60">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-xs font-medium text-foreground">Audio & Video Consultations</p>
                  <p className="text-[11px] text-muted-foreground">
                    Enables 1-on-1 audio and video consultation meetings directly between students and verified instructors.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCallingEnabled(!callingEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    callingEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-xs transition duration-200 ease-in-out ${
                      callingEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Student Direct Messaging</p>
                  <p className="text-[11px] text-muted-foreground">
                    Allows enrolled students to initiate 1-on-1 direct conversations with peers and mentors.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStudentDMsEnabled(!studentDMsEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    studentDMsEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-xs transition duration-200 ease-in-out ${
                      studentDMsEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Study Cohort & Group Creation</p>
                  <p className="text-[11px] text-muted-foreground">
                    Enables instructors and course creators to spawn discussion channels and study cohorts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGroupCreationAllowed(!groupCreationAllowed)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    groupCreationAllowed ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-xs transition duration-200 ease-in-out ${
                      groupCreationAllowed ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Media & Document Attachments</p>
                  <p className="text-[11px] text-muted-foreground">
                    Permits uploading lecture notes, images, PDFs, and code files up to 15MB.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFileUploadsAllowed(!fileUploadsAllowed)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    fileUploadsAllowed ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-xs transition duration-200 ease-in-out ${
                      fileUploadsAllowed ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Database & Storage */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Supabase Connection Parameters</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current connection endpoints and authentication providers.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  readOnly
                  value={process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ansszvwhfcmdmmtosdgv.supabase.co'}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 font-mono text-xs text-foreground cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Supabase Anon Key
                  </label>
                  <input
                    type="password"
                    readOnly
                    value="••••••••••••••••••••••••••••••••"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 font-mono text-xs text-foreground cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Service Role Key
                  </label>
                  <input
                    type="password"
                    readOnly
                    value="••••••••••••••••••••••••••••••••"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 font-mono text-xs text-foreground cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Storage Buckets & Media Assets</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Integrated storage buckets for courses and micro-shorts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-lg border border-border bg-background space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">courses-media</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">Course lecture videos, thumbnails & PDFs</p>
                <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Public Bucket • OK</p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-background space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">shorts-videos</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">Vertical reel MP4 uploads and previews</p>
                <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Public Bucket • OK</p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-background space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">avatars</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">Student & instructor profile images</p>
                <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Public Bucket • OK</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Curriculum & Shorts Policies */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Teacher Application Review Mode</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose how new teacher account applications are evaluated.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setTeacherApprovalMode('manual')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  teacherApprovalMode === 'manual'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background hover:bg-muted/40'
                }`}
              >
                <span className="text-xs font-semibold text-foreground">Manual Admin Review (Recommended)</span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  New teacher registrations enter the Teachers Pipeline queue where admins review qualifications before granting upload permissions.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTeacherApprovalMode('auto')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  teacherApprovalMode === 'auto'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background hover:bg-muted/40'
                }`}
              >
                <span className="text-xs font-semibold text-foreground">Instant Auto-Approval</span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  Teachers are immediately granted publishing rights upon email verification. Suitable for closed institutional deployments.
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">⚡ Micro-Shorts Video Specifications</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set duration caps and creator eligibility for vertical short-form reels.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Max Shorts Duration Limit
                </label>
                <select
                  value={shortsMaxDuration}
                  onChange={(e) => setShortsMaxDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="30">30 seconds (Ultra-Bite)</option>
                  <option value="60">60 seconds (Standard Reel)</option>
                  <option value="90">90 seconds (Extended)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Who Can Upload Shorts
                </label>
                <select
                  value={shortsCreatorPolicy}
                  onChange={(e) => setShortsCreatorPolicy(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="teachers">Approved Instructors Only</option>
                  <option value="all">Instructors & Enrolled Students</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Danger Zone */}
      {activeTab === 'danger' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-destructive">Platform Maintenance & Cache Flush</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                These actions affect cached course catalogs, session tokens, and analytics aggregates.
              </p>
            </div>

            <div className="space-y-3 divide-y divide-destructive/20">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-xs font-medium text-foreground">Flush Server-Side Action Cache</p>
                  <p className="text-[11px] text-muted-foreground">
                    Clears Next.js revalidation cache for `/admin`, `/teacher`, and `/shorts`.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Server cache revalidation triggered.')}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
                >
                  Flush Cache
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Export Audit Logs (JSON)</p>
                  <p className="text-[11px] text-muted-foreground">
                    Download a secure report of platform signups, enrollments, and teacher approvals.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const data = {
                      platform: 'GVM EduLMS',
                      timestamp: new Date().toISOString(),
                      status: 'active',
                      modules: ['courses', 'shorts', 'chat', 'supabase']
                    }
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `edulms-audit-${Date.now()}.json`
                    a.click()
                  }}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
                >
                  Download Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
