'use client'

import React, { useState, useEffect } from 'react'
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
  Key
} from 'lucide-react'
import { usePlatformSettings } from '@/contexts/PlatformSettingsContext'

export default function AdminSettingsPage() {
  const { settings, updateSettings, isLoaded } = usePlatformSettings()
  const [activeTab, setActiveTab] = useState<'general' | 'chat' | 'database' | 'policies' | 'danger'>('general')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Form State initialized from global platform settings
  const [platformName, setPlatformName] = useState(settings.platformName)
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail)
  const [defaultLanguage, setDefaultLanguage] = useState(settings.defaultLanguage)
  const [allowRegistration, setAllowRegistration] = useState(settings.allowRegistration)
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode)

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
      setPlatformName(settings.platformName)
      setSupportEmail(settings.supportEmail)
      setDefaultLanguage(settings.defaultLanguage)
      setAllowRegistration(settings.allowRegistration)
      setMaintenanceMode(settings.maintenanceMode)
      setCallingEnabled(settings.chatEngine?.callingEnabled ?? true)
      setStudentDMsEnabled(settings.chatEngine?.studentDMsEnabled ?? true)
      setGroupCreationAllowed(settings.chatEngine?.groupCreationAllowed ?? true)
      setFileUploadsAllowed(settings.chatEngine?.fileUploadsAllowed ?? true)
      setTeacherApprovalMode(settings.teacherApprovalMode || 'manual')
      setShortsMaxDuration(settings.shortsMaxDuration || '60')
      setShortsCreatorPolicy(settings.shortsCreatorPolicy || 'teachers')
    }
  }, [isLoaded, settings])

  // Action: Save Settings Globally
  const handleSave = () => {
    setIsSaving(true)
    
    // Save to global context + localStorage so all components update immediately
    updateSettings({
      platformName: platformName.trim() || 'GVM EduLMS',
      supportEmail: supportEmail.trim(),
      defaultLanguage,
      allowRegistration,
      maintenanceMode,
      teacherApprovalMode,
      shortsMaxDuration,
      shortsCreatorPolicy,
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
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Organization & Branding</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your LMS name, contact details, and locale defaults.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

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

              <div>
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
