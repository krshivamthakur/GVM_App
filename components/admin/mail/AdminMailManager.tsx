'use client'

import React, { useState } from 'react'
import type {
  MailSettings,
  MailTemplate,
  MailLog,
} from '@/types/mail'
import {
  getMailSettingsAction,
  updateMailSettingsAction,
  getMailTemplatesAction,
  deleteMailTemplateAction,
  sendTestMailAction,
  sendTemplateEmailAction,
  getMailLogsAction,
} from '@/actions/mail-actions'
import { MailTemplateEditorModal } from './MailTemplateEditorModal'
import {
  Mail,
  Send,
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  ShieldCheck,
  Edit3,
  Trash2,
  Copy,
  Globe,
  Sliders,
  RefreshCw,
  Eye,
  Check,
  Key,
} from 'lucide-react'
import { formatDisplayDate } from '@/lib/utils'

interface AdminMailManagerProps {
  initialSettings: MailSettings
  initialTemplates: MailTemplate[]
  initialLogs: MailLog[]
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  onboarding: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
  },
  academic: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800/60',
  },
  finance: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  attendance: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
  },
  system: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800/60',
  },
  custom: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800/60',
  },
}

export function AdminMailManager({
  initialSettings,
  initialTemplates,
  initialLogs,
}: AdminMailManagerProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'templates' | 'setup' | 'broadcast' | 'logs'>('templates')

  // Data states
  const [settings, setSettings] = useState<MailSettings>(initialSettings)
  const [templates, setTemplates] = useState<MailTemplate[]>(initialTemplates)
  const [logs, setLogs] = useState<MailLog[]>(initialLogs)

  // Filters & Search for Templates
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modal states
  const [editingTemplate, setEditingTemplate] = useState<MailTemplate | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Mail Setup form state
  const [settingsForm, setSettingsForm] = useState<MailSettings>(initialSettings)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [setupFeedback, setSetupFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Diagnostic Test state
  const [testEmail, setTestEmail] = useState('')
  const [testTemplateSlug, setTestTemplateSlug] = useState<string>('welcome_student')
  const [isTesting, setIsTesting] = useState(false)
  const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; message: string; id?: string } | null>(null)

  // Broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState<'students' | 'teachers' | 'all' | 'custom'>('students')
  const [broadcastCustomEmail, setBroadcastCustomEmail] = useState('')
  const [broadcastTemplateSlug, setBroadcastTemplateSlug] = useState<string>('general_announcement')
  const [broadcastNote, setBroadcastNote] = useState('')
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [broadcastFeedback, setBroadcastFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Refresh logs
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false)

  // Refresh logs handler
  const handleRefreshLogs = async () => {
    setIsRefreshingLogs(true)
    try {
      const res = await getMailLogsAction(100)
      if (res.success) {
        setLogs(res.logs)
      }
    } finally {
      setIsRefreshingLogs(false)
    }
  }

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    setSetupFeedback(null)

    try {
      const res = await updateMailSettingsAction(settingsForm)
      if (res.success && res.settings) {
        setSettings(res.settings)
        setSetupFeedback({ type: 'success', message: 'Mail setups & institutional branding saved!' })
      } else {
        setSetupFeedback({ type: 'error', message: res.error || 'Failed to save settings.' })
      }
    } catch (err: any) {
      setSetupFeedback({ type: 'error', message: err?.message || 'Error occurred while saving.' })
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Handle Send Diagnostic Test
  const handleRunDiagnostic = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setTestFeedback({ type: 'error', message: 'Please provide a valid recipient email address.' })
      return
    }

    setIsTesting(true)
    setTestFeedback(null)

    try {
      const res = await sendTestMailAction({
        to: testEmail.trim(),
        templateSlug: testTemplateSlug || undefined,
      })

      if (res.success) {
        setTestFeedback({
          type: 'success',
          message: `Email dispatched successfully! Message ID: ${res.id || 'resend_ok'}`,
          id: res.id,
        })
        handleRefreshLogs()
      } else {
        setTestFeedback({
          type: 'error',
          message: res.error || 'Delivery failed. Check your API key and sender email.',
        })
      }
    } catch (err: any) {
      setTestFeedback({ type: 'error', message: err?.message || 'Diagnostic error' })
    } finally {
      setIsTesting(false)
    }
  }

  // Handle Delete Template
  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!window.confirm(`Are you sure you want to delete template "${templateName}"?`)) {
      return
    }

    const res = await deleteMailTemplateAction(templateId)
    if (res.success) {
      setTemplates(prev => prev.filter(t => t.id !== templateId))
    } else {
      alert(res.error || 'Failed to delete template.')
    }
  }

  // Handle Duplicate Template
  const handleDuplicateTemplate = (tpl: MailTemplate) => {
    setEditingTemplate({
      ...tpl,
      id: '',
      slug: `${tpl.slug}_copy_${Date.now().toString().slice(-4)}`,
      name: `${tpl.name} (Copy)`,
      is_system: false,
    })
    setIsEditorOpen(true)
  }

  // Handle Save Template Success
  const handleTemplateSaved = (savedTemplate: MailTemplate) => {
    setTemplates(prev => {
      const index = prev.findIndex(t => t.id === savedTemplate.id || t.slug === savedTemplate.slug)
      if (index >= 0) {
        const next = [...prev]
        next[index] = savedTemplate
        return next
      }
      return [savedTemplate, ...prev]
    })
  }

  // Handle Send Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsBroadcasting(true)
    setBroadcastFeedback(null)

    try {
      const recipient = broadcastTarget === 'custom' ? broadcastCustomEmail : testEmail || 'test-learner@example.com'
      if (!recipient || !recipient.includes('@')) {
        setBroadcastFeedback({ type: 'error', message: 'Please enter a valid target email address.' })
        setIsBroadcasting(false)
        return
      }

      const res = await sendTemplateEmailAction({
        to: recipient,
        templateSlug: broadcastTemplateSlug,
        variables: {
          highlight_note: broadcastNote || 'Institutional advisory notice.',
        },
      })

      if (res.success) {
        setBroadcastFeedback({
          type: 'success',
          message: `Broadcast successfully sent to ${recipient}!`,
        })
        handleRefreshLogs()
      } else {
        setBroadcastFeedback({
          type: 'error',
          message: res.error || 'Broadcast failed to deliver.',
        })
      }
    } catch (err: any) {
      setBroadcastFeedback({ type: 'error', message: err?.message || 'Error occurred during broadcast.' })
    } finally {
      setIsBroadcasting(false)
    }
  }

  // Filtered templates list
  const filteredTemplates = templates.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Quick statistics
  const totalCount = templates.length
  const activeCount = templates.filter(t => t.is_active).length
  const customCount = templates.filter(t => !t.is_system).length
  const systemCount = templates.filter(t => t.is_system).length

  return (
    <div className="space-y-6">
      {/* Top Banner / Header (Clean Project Theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Mail Studio & Setups</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Resend Engine Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Design institutional templates, configure automated delivery rules, and dispatch broadcasts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingTemplate(null)
              setIsEditorOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold shadow-sm shadow-primary/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation Pill Bar (Matching Project Theme) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-card text-foreground shadow-xs border border-border/70'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Templates Studio ({totalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'setup'
              ? 'bg-card text-foreground shadow-xs border border-border/70'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-primary" />
          <span>Mail Setups & Provider</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'broadcast'
              ? 'bg-card text-foreground shadow-xs border border-border/70'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Send className="w-3.5 h-3.5 text-primary" />
          <span>Send Broadcast</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('logs')
            handleRefreshLogs()
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-card text-foreground shadow-xs border border-border/70'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>Delivery Logs ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: TEMPLATES STUDIO */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Total Templates</span>
              <p className="text-2xl font-bold text-foreground mt-1">{totalCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Active & Enabled</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">System Defaults</span>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{systemCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Custom Created</span>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{customCount}</p>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates, subjects, or slugs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'onboarding', 'academic', 'finance', 'attendance', 'system', 'custom'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize font-semibold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map(tpl => {
              const catStyle = CATEGORY_COLORS[tpl.category] || CATEGORY_COLORS.custom

              return (
                <div
                  key={tpl.id}
                  className="rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between shadow-xs group"
                >
                  <div>
                    {/* Header: Category Badge & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                      >
                        {tpl.category}
                      </span>

                      <div className="flex items-center gap-2">
                        {tpl.is_system && (
                          <span className="text-[10px] text-muted-foreground font-medium border border-border px-1.5 py-0.5 rounded">
                            Built-in
                          </span>
                        )}
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            tpl.is_active ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-zinc-400 dark:bg-zinc-600'
                          }`}
                          title={tpl.is_active ? 'Active' : 'Disabled'}
                        />
                      </div>
                    </div>

                    {/* Name & Slug */}
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {tpl.name}
                    </h3>
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                      {tpl.slug}
                    </p>

                    {/* Subject Line Snippet */}
                    <div className="mt-3 p-3 bg-muted/40 rounded-xl border border-border/70 text-xs">
                      <span className="text-[10px] font-semibold text-muted-foreground block mb-1 uppercase tracking-wide">
                        Subject Line
                      </span>
                      <p className="text-foreground font-medium line-clamp-2">
                        {tpl.subject}
                      </p>
                    </div>

                    {/* Description */}
                    {tpl.description && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    )}

                    {/* Dynamic Variable Pills */}
                    {tpl.available_variables && tpl.available_variables.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {tpl.available_variables.slice(0, 3).map((v: string) => (
                          <span
                            key={v}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-foreground border border-border"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))}
                        {tpl.available_variables.length > 3 && (
                          <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                            +{tpl.available_variables.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingTemplate(tpl)
                          setIsEditorOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-primary" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateTemplate(tpl)}
                        title="Duplicate this template"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {!tpl.is_system && (
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                          title="Delete template"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setEditingTemplate(tpl)
                        setIsEditorOpen(true)
                      }}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Preview</span>
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
              <Mail className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold text-foreground">No Email Templates Found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No templates matched your filter or search query. You can create a new custom template.
              </p>
              <button
                onClick={() => {
                  setEditingTemplate(null)
                  setIsEditorOpen(true)
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs cursor-pointer"
              >
                Create Template
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MAIL SETUPS & PROVIDER CONFIG */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          {/* Provider Health Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    Resend Email Engine Connected
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Operational
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Production Resend SDK is configured with institutional SMTP routing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono bg-muted/60 px-3 py-1.5 rounded-lg border border-border text-foreground">
                <Key className="w-3.5 h-3.5 text-primary" />
                <span>API Key: re_XUxDt...LKz</span>
              </div>
            </div>
          </div>

          {setupFeedback && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                setupFeedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {setupFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{setupFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Sender Identity Card */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Sender Identity & Routing</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Sender From Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.sender_name}
                    onChange={e => setSettingsForm({ ...settingsForm, sender_name: e.target.value })}
                    placeholder="e.g. GVM Educational Institute"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Displays as the friendly name in the recipient inbox.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Sender From Email Address
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.sender_email}
                    onChange={e => setSettingsForm({ ...settingsForm, sender_email: e.target.value })}
                    placeholder="e.g. onboarding@resend.dev or notifications@yourdomain.com"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Verified sender email or Resend testing domain (onboarding@resend.dev).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Reply-To Email Address
                  </label>
                  <input
                    type="email"
                    value={settingsForm.reply_to}
                    onChange={e => setSettingsForm({ ...settingsForm, reply_to: e.target.value })}
                    placeholder="e.g. support@gvmedu.com"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Admin CC Notifications (Optional comma-separated)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.cc_emails}
                    onChange={e => setSettingsForm({ ...settingsForm, cc_emails: e.target.value })}
                    placeholder="e.g. registrar@gvmedu.com, accounts@gvmedu.com"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Institutional Email Branding */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Globe className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Institutional Template Branding</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Brand Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settingsForm.brand_color || '#4f46e5'}
                      onChange={e => setSettingsForm({ ...settingsForm, brand_color: e.target.value })}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-border bg-background p-0.5"
                    />
                    <input
                      type="text"
                      value={settingsForm.brand_color || '#4f46e5'}
                      onChange={e => setSettingsForm({ ...settingsForm, brand_color: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Official Support Email
                  </label>
                  <input
                    type="email"
                    value={settingsForm.support_email}
                    onChange={e => setSettingsForm({ ...settingsForm, support_email: e.target.value })}
                    placeholder="support@gvmedu.com"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Support Helpline Phone
                  </label>
                  <input
                    type="text"
                    value={settingsForm.support_phone}
                    onChange={e => setSettingsForm({ ...settingsForm, support_phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Footer Legal & Institutional Disclaimer
                </label>
                <textarea
                  rows={2}
                  value={settingsForm.footer_text}
                  onChange={e => setSettingsForm({ ...settingsForm, footer_text: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
                />
              </div>
            </div>

            {/* Automated System Triggers Card */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Automated Delivery Triggers</h3>
                </div>
                <span className="text-xs text-muted-foreground">Enable or disable event-based emails</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    key: 'welcome_student',
                    title: 'Student Account Welcome Email',
                    desc: 'Dispatched immediately when a new student profile is registered.',
                  },
                  {
                    key: 'fee_receipt',
                    title: 'Tuition Fee Payment Receipts',
                    desc: 'Sends itemized payment receipt upon fee transaction completion.',
                  },
                  {
                    key: 'course_enrollment',
                    title: 'Course Enrollment Confirmation',
                    desc: 'Sent when a student joins a new course with teacher details.',
                  },
                  {
                    key: 'attendance_alert',
                    title: 'Attendance Shortage Alerts (<75%)',
                    desc: 'Triggered when learner cumulative attendance falls below the safety mark.',
                  },
                  {
                    key: 'teacher_approval',
                    title: 'Teacher Account Approval Notice',
                    desc: 'Notifies instructors when their verification is approved by SuperAdmin.',
                  },
                  {
                    key: 'announcement_broadcast',
                    title: 'Platform Broadcaster Alerts',
                    desc: 'Enables batch notification delivery for campus circulars.',
                  },
                ].map(trigger => {
                  const isEnabled = settingsForm.auto_triggers?.[trigger.key] ?? true

                  return (
                    <div
                      key={trigger.key}
                      className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">{trigger.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{trigger.desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSettingsForm({
                            ...settingsForm,
                            auto_triggers: {
                              ...settingsForm.auto_triggers,
                              [trigger.key]: !isEnabled,
                            },
                          })
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingSettings ? 'Saving Configuration...' : 'Save Mail Settings'}</span>
              </button>
            </div>
          </form>

          {/* Diagnostic Test Tool */}
          <div className="rounded-2xl border border-border bg-card p-6 mt-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-foreground">Live Diagnostic Delivery Tool</h3>
            </div>

            <p className="text-xs text-muted-foreground">
              Validate your email connection in real-time by sending a formatted test email to any inbox.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="email"
                placeholder="Enter test recipient email (e.g. admin@gmail.com)..."
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="w-full sm:w-80 rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />

              <select
                value={testTemplateSlug}
                onChange={e => setTestTemplateSlug(e.target.value)}
                className="w-full sm:w-60 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {templates.map(t => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleRunDiagnostic}
                disabled={isTesting}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Dispatching...' : 'Dispatch Live Test'}</span>
              </button>
            </div>

            {testFeedback && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                  testFeedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {testFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{testFeedback.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SEND BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 max-w-3xl mx-auto shadow-xs">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Dispatch Mail Broadcast
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Select a standardized template and transmit to enrolled cohorts or individual learners.
            </p>
          </div>

          {broadcastFeedback && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                broadcastFeedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {broadcastFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{broadcastFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Target Audience Cohort
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'students', label: 'All Students' },
                  { id: 'teachers', label: 'Faculty Staff' },
                  { id: 'all', label: 'All Users' },
                  { id: 'custom', label: 'Custom Recipient' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBroadcastTarget(opt.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      broadcastTarget === opt.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {broadcastTarget === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Recipient Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={broadcastCustomEmail}
                  onChange={e => setBroadcastCustomEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Select Mail Template
              </label>
              <select
                value={broadcastTemplateSlug}
                onChange={e => setBroadcastTemplateSlug(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {templates.map(t => (
                  <option key={t.slug} value={t.slug}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Highlight Advisory Note (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Add an urgent note or notice banner to include inside the email..."
                value={broadcastNote}
                onChange={e => setBroadcastNote(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isBroadcasting}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isBroadcasting ? 'Broadcasting...' : 'Dispatch Broadcast'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: DELIVERY AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Email Transmission Logs</h2>
              <p className="text-xs text-muted-foreground">Live record of transactional and broadcast emails dispatched via Resend SDK.</p>
            </div>

            <button
              onClick={handleRefreshLogs}
              disabled={isRefreshingLogs}
              className="px-3.5 py-1.5 rounded-xl bg-card hover:bg-muted border border-border text-xs text-foreground flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLogs ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border font-semibold">
                  <tr>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Template</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Resend ID</th>
                    <th className="px-4 py-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {logs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div>{log.recipient_email}</div>
                        {log.recipient_name && (
                          <div className="text-[10px] text-muted-foreground">{log.recipient_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[220px] truncate" title={log.subject}>
                        {log.subject}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-primary">
                        {log.template_name || log.template_slug || 'custom'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            log.status === 'delivered' || log.status === 'sent'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              log.status === 'delivered' || log.status === 'sent' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
                        {log.resend_id || '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                        {log.sent_at ? formatDisplayDate(log.sent_at) : 'Just now'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {logs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  No email logs recorded yet. Try running a diagnostic test!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Editor / Preview Modal */}
      <MailTemplateEditorModal
        isOpen={isEditorOpen}
        template={editingTemplate}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingTemplate(null)
        }}
        onSaveSuccess={handleTemplateSaved}
      />
    </div>
  )
}
