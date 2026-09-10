'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Profile } from '@/types/database'
import {
  MessageSquare,
  Users,
  Video,
  Phone,
  Search,
  Send,
  Paperclip,
  Smile,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  GraduationCap,
  Pin,
  Trash2,
  Lock,
  Unlock,
  VolumeX,
  Volume2,
  Plus,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Hash,
  X,
  ArrowLeft,
  Settings,
  Flame,
  CheckCheck,
  MoreVertical,
  ExternalLink,
  Filter,
  UserX,
  UserCheck
} from 'lucide-react'
import {
  initCometChat,
  loginCometChat,
  getCometChatCredentials
} from '@/lib/cometchat'

export interface AdminChatContact {
  id: string
  name: string
  role: 'group' | 'instructor' | 'student'
  title: string
  avatar: string
  status: 'online' | 'offline' | 'away'
  unread: number
  lastMessage: string
  lastTime: string
  isLocked?: boolean
  pinnedNotice?: string
  memberCount?: number
  category?: 'general' | 'cohort' | 'support' | 'faculty'
}

export interface AdminChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole?: 'admin' | 'instructor' | 'student' | 'group'
  text: string
  time: string
  isSelf: boolean
  isDeleted?: boolean
  isPinned?: boolean
  status?: 'sent' | 'delivered' | 'read'
  avatar?: string
}

export interface ModeratedUser {
  id: string
  name: string
  role: 'student' | 'teacher'
  email: string
  avatar: string
  isMuted: boolean
  muteReason?: string
  muteDuration?: string
  isBanned: boolean
  warningsCount: number
}

const INITIAL_CHANNELS: AdminChatContact[] = [
  {
    id: 'group_announcements',
    name: '#announcements-hub',
    role: 'group',
    title: 'Platform-wide Official Announcements • System Channel',
    avatar: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80',
    status: 'online',
    unread: 0,
    lastMessage: 'All systems operational.',
    lastTime: 'Active',
    isLocked: true,
    pinnedNotice: 'Important platform announcements will be broadcast here.',
    memberCount: 1,
    category: 'general'
  }
]

const INITIAL_MESSAGES: Record<string, AdminChatMessage[]> = {
  group_announcements: [
    {
      id: 'ann_1',
      senderId: 'admin_sys',
      senderName: 'System Administrator',
      senderRole: 'admin',
      text: '📢 Welcome to the GVM EduLMS official communication center. Platform announcements and broadcast notices will appear here.',
      time: '09:00 AM',
      isSelf: true,
      isPinned: true
    }
  ]
}

const INITIAL_MODERATED_USERS: ModeratedUser[] = []

const CHAT_STORAGE_KEY = 'gvm_admin_chat_state_v2'

const DEMO_CONTACT_IDS = new Set([
  'instructor_sarah',
  'instructor_alex',
  'student_marcus',
  'group_nextjs_cohort',
  'group_shorts_creators',
  'group_faculty_lounge',
  'user_david',
  'user_emily',
  'user_marcus',
  'user_sarah'
])

interface AdminChatViewProps {
  initialUsers?: Profile[]
}

export function AdminChatView({ initialUsers = [] }: AdminChatViewProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'chat' | 'channels' | 'moderation' | 'broadcast'>('chat')
  const [contacts, setContacts] = useState<AdminChatContact[]>(INITIAL_CHANNELS)
  const [activeContact, setActiveContact] = useState<AdminChatContact>(INITIAL_CHANNELS[0])
  const [messages, setMessages] = useState<Record<string, AdminChatMessage[]>>(INITIAL_MESSAGES)
  const [moderatedUsers, setModeratedUsers] = useState<ModeratedUser[]>(INITIAL_MODERATED_USERS)

  // Filters and UI state
  const [filterType, setFilterType] = useState<'all' | 'groups' | 'instructors' | 'students'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [inputText, setInputText] = useState('')
  const [isCalling, setIsCalling] = useState<'audio' | 'video' | null>(null)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [bannerAlert, setBannerAlert] = useState<string | null>(null)

  // Create Channel Modal state
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelTopic, setNewChannelTopic] = useState('')
  const [newChannelCategory, setNewChannelCategory] = useState<'general' | 'cohort' | 'support' | 'faculty'>('cohort')
  const [newChannelLocked, setNewChannelLocked] = useState(false)

  // Broadcast modal/form state
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'cohorts' | 'faculty'>('all')
  const [broadcastSuccess, setBroadcastSuccess] = useState(false)

  // Delete / Clear Chat Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [targetDeleteContact, setTargetDeleteContact] = useState<AdminChatContact | null>(null)

  // CometChat configuration check
  const [cometChatReady, setCometChatReady] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Hydrate from localStorage and sync dynamic database users
  useEffect(() => {
    let currentContacts = [...INITIAL_CHANNELS]
    let currentMessages = { ...INITIAL_MESSAGES }
    let currentModerated = [...INITIAL_MODERATED_USERS]

    // Check previously deleted chats from localStorage
    const deletedIds = new Set<string>()
    try {
      const storedDeleted = localStorage.getItem('gvm_admin_deleted_chats_v1')
      if (storedDeleted) {
        JSON.parse(storedDeleted).forEach((id: string) => deletedIds.add(id))
      }
    } catch {
      // Ignore
    }

    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.contacts) currentContacts = parsed.contacts
        if (parsed.messages) currentMessages = parsed.messages
        if (parsed.moderatedUsers) currentModerated = parsed.moderatedUsers
      }
    } catch {
      // LocalStorage fallback
    }

    // Exclude any deleted or demo contacts
    currentContacts = currentContacts.filter((c) => !deletedIds.has(c.id) && !DEMO_CONTACT_IDS.has(c.id))
    currentModerated = currentModerated.filter((u) => !DEMO_CONTACT_IDS.has(u.id))
    DEMO_CONTACT_IDS.forEach((demoId) => {
      delete currentMessages[demoId]
    })

    // Auto-create chat contacts and moderation roster entries for all registered database users
    if (initialUsers && initialUsers.length > 0) {
      const existingContactIds = new Set(currentContacts.map((c) => c.id))
      const existingUserIds = new Set(currentModerated.map((u) => u.id))

      initialUsers.forEach((u) => {
        if (!existingContactIds.has(u.id) && !deletedIds.has(u.id) && u.role !== 'admin') {
          currentContacts.push({
            id: u.id,
            name: u.full_name || u.email?.split('@')[0] || 'User',
            role: u.role === 'teacher' ? 'instructor' : 'student',
            title: `${u.role === 'teacher' ? 'Certified Instructor' : 'Enrolled Student'} • ${u.email}`,
            avatar:
              u.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
            status: 'online',
            unread: 0,
            lastMessage: 'Chat conversation initialized.',
            lastTime: 'Active now'
          })
          existingContactIds.add(u.id)
        }

        if (!existingUserIds.has(u.id) && u.role !== 'admin') {
          currentModerated.push({
            id: u.id,
            name: u.full_name || u.email?.split('@')[0] || 'User',
            role: u.role === 'teacher' ? 'teacher' : 'student',
            email: u.email || '',
            avatar:
              u.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
            isMuted: false,
            isBanned: false,
            warningsCount: 0
          })
          existingUserIds.add(u.id)
        }
      })
    }

    setContacts(currentContacts)
    setMessages(currentMessages)
    setModeratedUsers(currentModerated)
    if (currentContacts.length > 0) {
      setActiveContact(currentContacts[0])
    }

    // Check CometChat
    const creds = getCometChatCredentials()
    if (creds) {
      initCometChat().then((ok) => {
        if (ok && user) {
          loginCometChat(user).catch(() => {})
          setCometChatReady(true)
        }
      })
    }
  }, [user, initialUsers])

  // 2. Persist changes to localStorage
  const persistState = (
    newContacts = contacts,
    newMessages = messages,
    newUsers = moderatedUsers
  ) => {
    try {
      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({
          contacts: newContacts,
          messages: newMessages,
          moderatedUsers: newUsers
        })
      )
    } catch {
      // Ignore storage quota
    }
  }

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeContact.id])

  // Filtered contacts list
  const filteredContacts = contacts.filter((c) => {
    let matchType = true
    if (filterType === 'groups') matchType = c.role === 'group'
    else if (filterType === 'instructors') matchType = c.role === 'instructor'
    else if (filterType === 'students') matchType = c.role === 'student'

    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase())

    return matchType && matchSearch
  })

  const currentMessages = messages[activeContact.id] || []

  // Send message as Admin
  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const newMsg: AdminChatMessage = {
      id: 'admin_msg_' + Date.now(),
      senderId: user?.id || 'admin_current',
      senderName: user?.full_name || 'System Administrator',
      senderRole: 'admin',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      status: 'sent'
    }

    const updatedMessages = {
      ...messages,
      [activeContact.id]: [...(messages[activeContact.id] || []), newMsg]
    }
    setMessages(updatedMessages)

    const updatedContacts = contacts.map((c) =>
      c.id === activeContact.id
        ? {
            ...c,
            lastMessage: `[Admin]: ${inputText.trim()}`,
            lastTime: 'Just now'
          }
        : c
    )
    setContacts(updatedContacts)
    setInputText('')

    persistState(updatedContacts, updatedMessages, moderatedUsers)
  }

  // Moderator: Delete message
  const handleDeleteMessage = (msgId: string) => {
    const updated = {
      ...messages,
      [activeContact.id]: (messages[activeContact.id] || []).map((m) =>
        m.id === msgId
          ? {
              ...m,
              isDeleted: true,
              text: '🛡️ This message was removed by the administrator for violating platform policies.'
            }
          : m
      )
    }
    setMessages(updated)
    persistState(contacts, updated, moderatedUsers)
    setBannerAlert('Message moderated and purged.')
    setTimeout(() => setBannerAlert(null), 3000)
  }

  // Moderator: Toggle Pin message
  const handleTogglePin = (msgId: string) => {
    const updated = {
      ...messages,
      [activeContact.id]: (messages[activeContact.id] || []).map((m) =>
        m.id === msgId ? { ...m, isPinned: !m.isPinned } : m
      )
    }
    setMessages(updated)
    persistState(contacts, updated, moderatedUsers)
  }

  // Moderator: Toggle Channel Lock / Read-Only
  const handleToggleLock = (contactId: string) => {
    const updated = contacts.map((c) =>
      c.id === contactId ? { ...c, isLocked: !c.isLocked } : c
    )
    setContacts(updated)
    if (activeContact.id === contactId) {
      setActiveContact((prev) => ({ ...prev, isLocked: !prev.isLocked }))
    }
    persistState(updated, messages, moderatedUsers)
    setBannerAlert(`Channel ${contactId} lock status updated.`)
    setTimeout(() => setBannerAlert(null), 3000)
  }

  // Moderator: Delete chat entirely (remove contact from list and purge messages)
  const handleDeleteChat = (contactId: string) => {
    const contactToDelete = contacts.find((c) => c.id === contactId) || targetDeleteContact

    // 1. Remove messages for this contact
    const updatedMessages = { ...messages }
    delete updatedMessages[contactId]
    setMessages(updatedMessages)

    // 2. Remove contact from contacts list
    const updatedContacts = contacts.filter((c) => c.id !== contactId)
    setContacts(updatedContacts)

    // 3. Update active contact if the deleted contact was currently active
    if (activeContact.id === contactId) {
      if (updatedContacts.length > 0) {
        setActiveContact(updatedContacts[0])
      }
    }

    // 4. Record in deletedChatIds in localStorage so it won't be resurrected
    try {
      const stored = localStorage.getItem('gvm_admin_deleted_chats_v1')
      const deletedList: string[] = stored ? JSON.parse(stored) : []
      if (!deletedList.includes(contactId)) {
        deletedList.push(contactId)
        localStorage.setItem('gvm_admin_deleted_chats_v1', JSON.stringify(deletedList))
      }
    } catch {}

    // 5. Persist to storage
    persistState(updatedContacts, updatedMessages, moderatedUsers)

    setBannerAlert(`Chat with "${contactToDelete?.name || 'user'}" has been deleted.`)
    setShowDeleteModal(false)
    setTargetDeleteContact(null)
    setTimeout(() => setBannerAlert(null), 3000)
  }

  // Moderator: Clear all messages only (resets message history and sidebar preview)
  const handleClearMessages = (contactId: string) => {
    const contactToClear = contacts.find((c) => c.id === contactId) || targetDeleteContact

    // 1. Clear messages
    const updatedMessages = {
      ...messages,
      [contactId]: []
    }
    setMessages(updatedMessages)

    // 2. Update contact last message & unread in sidebar preview
    const updatedContacts = contacts.map((c) =>
      c.id === contactId
        ? {
            ...c,
            lastMessage: 'No messages yet in this conversation.',
            lastTime: '',
            unread: 0
          }
        : c
    )
    setContacts(updatedContacts)

    if (activeContact.id === contactId) {
      setActiveContact((prev) => ({
        ...prev,
        lastMessage: 'No messages yet in this conversation.',
        lastTime: '',
        unread: 0
      }))
    }

    // 3. Persist to storage
    persistState(updatedContacts, updatedMessages, moderatedUsers)

    setBannerAlert(`Messages cleared for "${contactToClear?.name || 'conversation'}".`)
    setShowDeleteModal(false)
    setTargetDeleteContact(null)
    setTimeout(() => setBannerAlert(null), 3000)
  }

  // Moderator: Create new channel
  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim()) return

    const formattedName = newChannelName.startsWith('#')
      ? newChannelName.trim().toLowerCase()
      : `#${newChannelName.trim().toLowerCase()}`

    const newId = `group_${Date.now()}`
    const newChan: AdminChatContact = {
      id: newId,
      name: formattedName,
      role: 'group',
      title: newChannelTopic.trim() || 'General Study Channel',
      avatar:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
      status: 'online',
      unread: 0,
      lastMessage: 'Channel created by administrator.',
      lastTime: 'Just now',
      isLocked: newChannelLocked,
      memberCount: 1,
      category: newChannelCategory
    }

    const updatedContacts = [newChan, ...contacts]
    const updatedMessages: Record<string, AdminChatMessage[]> = {
      ...messages,
      [newId]: [
        {
          id: 'welcome_' + Date.now(),
          senderId: user?.id || 'admin',
          senderName: user?.full_name || 'System Administrator',
          senderRole: 'admin',
          text: `🎉 Channel ${formattedName} created. Topic: ${newChannelTopic || 'General discussion'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: true,
          isPinned: true
        }
      ]
    }

    setContacts(updatedContacts)
    setMessages(updatedMessages)
    setActiveContact(newChan)
    setShowCreateChannelModal(false)
    setNewChannelName('')
    setNewChannelTopic('')
    persistState(updatedContacts, updatedMessages, moderatedUsers)

    setBannerAlert(`Official channel ${formattedName} created successfully!`)
    setTimeout(() => setBannerAlert(null), 3500)
  }

  // Moderator: Delete Channel
  const handleDeleteChannel = (channelId: string) => {
    const ch = contacts.find((c) => c.id === channelId)
    if (ch) {
      setTargetDeleteContact(ch)
      setShowDeleteModal(true)
    }
  }

  // Moderator: Send Global Broadcast Announcement
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastMessage.trim()) return

    const broadcastMsgObj = (cId: string): AdminChatMessage => ({
      id: `broadcast_${Date.now()}_${cId}`,
      senderId: user?.id || 'admin',
      senderName: '📢 Official LMS Broadcast',
      senderRole: 'admin',
      text: broadcastMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      isPinned: true
    })

    const updatedMessages = { ...messages }
    const updatedContacts = contacts.map((c) => {
      if (c.role === 'group') {
        if (broadcastTarget === 'cohorts' && c.category !== 'cohort') return c
        if (broadcastTarget === 'faculty' && c.category !== 'faculty') return c

        updatedMessages[c.id] = [...(updatedMessages[c.id] || []), broadcastMsgObj(c.id)]
        return {
          ...c,
          lastMessage: `📢 [Broadcast]: ${broadcastMessage.trim().slice(0, 50)}...`,
          lastTime: 'Just now',
          pinnedNotice: broadcastMessage.trim()
        }
      }
      return c
    })

    setMessages(updatedMessages)
    setContacts(updatedContacts)
    setBroadcastSuccess(true)
    setBroadcastMessage('')
    persistState(updatedContacts, updatedMessages, moderatedUsers)

    setTimeout(() => {
      setBroadcastSuccess(false)
      setActiveTab('chat')
    }, 1500)
  }

  // Moderator: Mute User
  const handleToggleMute = (userId: string) => {
    const updated = moderatedUsers.map((u) =>
      u.id === userId ? { ...u, isMuted: !u.isMuted } : u
    )
    setModeratedUsers(updated)
    persistState(contacts, messages, updated)
  }

  // Moderator: Ban User
  const handleToggleBan = (userId: string) => {
    const updated = moderatedUsers.map((u) =>
      u.id === userId ? { ...u, isBanned: !u.isBanned } : u
    )
    setModeratedUsers(updated)
    persistState(contacts, messages, updated)
  }

  // Moderator: Issue Warning
  const handleIssueWarning = (userId: string) => {
    const updated = moderatedUsers.map((u) =>
      u.id === userId ? { ...u, warningsCount: u.warningsCount + 1 } : u
    )
    setModeratedUsers(updated)
    persistState(contacts, messages, updated)
    setBannerAlert('Formal warning issued to user.')
    setTimeout(() => setBannerAlert(null), 3000)
  }

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {bannerAlert && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>{bannerAlert}</span>
          </div>
          <button onClick={() => setBannerAlert(null)} className="p-1 hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation Tabs & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl p-2.5 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Live Moderator Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'channels'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Hash className="h-3.5 w-3.5" />
            <span>Manage Channels ({contacts.filter((c) => c.role === 'group').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'moderation'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>User Moderation</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Broadcast Alert</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCreateChannelModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Channel</span>
          </button>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
              cometChatReady
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-border bg-muted/40 text-muted-foreground'
            }`}
            title={cometChatReady ? 'CometChat live SDK initialized' : 'Simulated Sandbox / Demo Mode'}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                cometChatReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-[11px] hidden md:inline">
              {cometChatReady ? 'CometChat Live' : 'Sandbox Moderation'}
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: LIVE MODERATOR CHAT */}
      {activeTab === 'chat' && (
        <div className="flex flex-col h-[calc(100dvh-13.5rem)] sm:h-[calc(100vh-11.5rem)] min-h-[560px] rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="flex flex-1 min-h-0 lg:divide-x divide-border overflow-hidden">
            {/* Left Sidebar: Conversations & Channels */}
            <div
              className={`w-full lg:w-80 xl:w-96 flex flex-col bg-sidebar shrink-0 ${
                showMobileChat ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Search Bar & Category Filters */}
              <div className="p-3 border-b border-border space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search channels, instructors, students..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {(['all', 'groups', 'instructors', 'students'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`flex-1 py-1 text-[11px] font-semibold rounded-md capitalize transition-colors ${
                        filterType === t
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {t === 'groups' ? 'Channels' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/50">
                {filteredContacts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No channels or conversations found.
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const isActive = contact.id === activeContact.id
                    return (
                      <button
                        key={contact.id}
                        onClick={() => {
                          setActiveContact(contact)
                          setShowMobileChat(true)
                          setContacts((prev) =>
                            prev.map((c) => (c.id === contact.id ? { ...c, unread: 0 } : c))
                          )
                        }}
                        className={`group w-full flex items-start gap-3 p-3 text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-primary/10 border-l-2 border-primary'
                            : 'hover:bg-muted/40'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <img
                            src={contact.avatar}
                            alt={contact.name}
                            className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
                          />
                          {contact.role === 'group' ? (
                            <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                              #
                            </div>
                          ) : (
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-background ${
                                contact.status === 'online'
                                  ? 'bg-emerald-500'
                                  : 'bg-muted-foreground'
                              }`}
                            />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-xs sm:text-sm truncate text-foreground">
                                {contact.name}
                              </span>
                              {contact.isLocked && (
                                <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {contact.lastTime}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate leading-relaxed">
                            {contact.lastMessage}
                          </p>
                        </div>

                        {contact.unread > 0 && (
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                            {contact.unread}
                          </span>
                        )}

                        {/* Quick Delete Chat button */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            setTargetDeleteContact(contact)
                            setShowDeleteModal(true)
                          }}
                          title="Delete Chat"
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all shrink-0 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {/* Admin Footer Banner */}
              <div className="p-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Admin Mode Active</p>
                    <p className="text-[10px] text-muted-foreground">Moderator Permissions Granted</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Area: Active Chat & Moderation Controls */}
            <div
              className={`flex-1 flex flex-col min-w-0 bg-background ${
                !showMobileChat ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border bg-card shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setShowMobileChat(false)}
                    className="lg:hidden inline-flex items-center gap-1 py-1 px-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div className="relative shrink-0">
                    <img
                      src={activeContact.avatar}
                      alt={activeContact.name}
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
                    />
                    {activeContact.role === 'group' ? (
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-bold">
                        #
                      </div>
                    ) : (
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background ${
                          activeContact.status === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground'
                        }`}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {activeContact.name}
                      </h3>
                      {activeContact.isLocked && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Lock className="h-2.5 w-2.5" />
                          <span>Locked</span>
                        </span>
                      )}
                      {activeContact.role === 'group' && (
                        <span className="text-[11px] text-muted-foreground">
                          ({activeContact.memberCount || 24} members)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate max-w-sm">
                      {activeContact.title}
                    </p>
                  </div>
                </div>

                {/* Moderator Header Actions */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  {/* Lock / Unlock Channel Toggle */}
                  {activeContact.role === 'group' && (
                    <button
                      type="button"
                      onClick={() => handleToggleLock(activeContact.id)}
                      title={activeContact.isLocked ? 'Unlock Channel' : 'Lock Channel (Read Only)'}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        activeContact.isLocked
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {activeContact.isLocked ? (
                        <>
                          <Unlock className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Unlock</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Lock Channel</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Call Consults (Voice / Video) */}
                  <button
                    type="button"
                    onClick={() => setIsCalling('audio')}
                    title="Audio Consultation"
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-primary" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCalling('video')}
                    title="Video Meeting"
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-xs"
                  >
                    <Video className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete or Clear Chat */}
                  <button
                    type="button"
                    onClick={() => {
                      setTargetDeleteContact(activeContact)
                      setShowDeleteModal(true)
                    }}
                    title="Delete Chat or Clear Messages"
                    aria-label="Delete Chat or Clear Messages"
                    className="p-2 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Calling Active Overlay */}
              {isCalling && (
                <div className="flex items-center justify-between gap-2 px-4 py-2 bg-primary/10 border-b border-primary/20 text-xs text-primary animate-in fade-in shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    <span className="font-semibold">
                      CometChat {isCalling === 'video' ? 'Video Conference' : 'Voice Call'} with{' '}
                      {activeContact.name} Active
                    </span>
                  </div>
                  <button
                    onClick={() => setIsCalling(null)}
                    className="px-2.5 py-1 rounded bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors"
                  >
                    End Call
                  </button>
                </div>
              )}

              {/* Pinned Notice if any */}
              {activeContact.pinnedNotice && (
                <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Pin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="font-semibold truncate">Pinned:</span>
                    <span className="truncate">{activeContact.pinnedNotice}</span>
                  </div>
                  <button
                    onClick={() => {
                      const updated = contacts.map((c) =>
                        c.id === activeContact.id ? { ...c, pinnedNotice: undefined } : c
                      )
                      setContacts(updated)
                      setActiveContact((prev) => ({ ...prev, pinnedNotice: undefined }))
                      persistState(updated, messages, moderatedUsers)
                    }}
                    className="p-1 text-amber-600 hover:text-amber-900 dark:hover:text-amber-100"
                    title="Dismiss pinned notice"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3">
                {currentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-xs font-semibold">No messages in this channel yet.</p>
                    <p className="text-[11px] mt-0.5">Send a message to start the conversation.</p>
                  </div>
                ) : (
                  currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`group relative flex items-start gap-2.5 ${
                        msg.isSelf ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <img
                        src={
                          msg.avatar ||
                          (msg.isSelf
                            ? user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'
                            : activeContact.avatar)
                        }
                        alt={msg.senderName}
                        className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-border mt-0.5"
                      />

                      {/* Message Bubble */}
                      <div className="max-w-[85%] sm:max-w-[70%]">
                        <div
                          className={`flex items-center gap-1.5 mb-1 text-[11px] ${
                            msg.isSelf ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span className="font-semibold text-foreground">{msg.senderName}</span>
                          {msg.senderRole === 'admin' && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              <ShieldCheck className="h-2.5 w-2.5" />
                              ADMIN
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                          {msg.isPinned && (
                            <Pin className="h-3 w-3 text-amber-500 inline fill-amber-500" />
                          )}
                        </div>

                        <div
                          className={`rounded-2xl px-3.5 py-2 text-xs sm:text-sm shadow-xs break-words ${
                            msg.isDeleted
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 italic'
                              : msg.isSelf
                              ? 'bg-indigo-600 text-white rounded-tr-xs'
                              : 'bg-muted/70 text-foreground border border-border/80 rounded-tl-xs'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>

                      {/* Moderator Hover Actions */}
                      {!msg.isDeleted && (
                        <div
                          className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 self-center bg-card/90 border border-border rounded-lg p-1 shadow-xs ${
                            msg.isSelf ? 'mr-1' : 'ml-1'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleTogglePin(msg.id)}
                            title={msg.isPinned ? 'Unpin message' : 'Pin message to channel'}
                            className="p-1 text-muted-foreground hover:text-amber-500 rounded transition-colors"
                          >
                            <Pin className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="Purge / Delete message"
                            className="p-1 text-muted-foreground hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-2.5 sm:p-3 border-t border-border bg-card shrink-0">
                {activeContact.isLocked && (
                  <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="h-3 w-3" />
                      Channel is locked for students. You are posting with Administrative override.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleLock(activeContact.id)}
                      className="underline font-semibold hover:text-foreground cursor-pointer"
                    >
                      Unlock Now
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 focus-within:ring-1 focus-within:ring-ring transition-shadow">
                  <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider shrink-0 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Admin</span>
                  </div>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Broadcast message to ${activeContact.name}...`}
                    className="flex-1 min-w-0 bg-transparent py-1 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE CHANNELS */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Total Channels</span>
              <div className="text-2xl font-bold text-foreground mt-1">
                {contacts.filter((c) => c.role === 'group').length}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Locked / Announcements</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {contacts.filter((c) => c.role === 'group' && c.isLocked).length}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Total Community Members</span>
              <div className="text-2xl font-bold text-foreground mt-1">
                {contacts.reduce((acc, c) => acc + (c.memberCount || 0), 0)}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Active Cohort Channels</span>
              <div className="text-2xl font-bold text-indigo-600 mt-1">
                {contacts.filter((c) => c.role === 'group' && c.category === 'cohort').length}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Official Channels Directory</h3>
                <p className="text-xs text-muted-foreground">
                  Create, lock, manage, or delete community study groups and cohort chat rooms.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateChannelModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Channel</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Channel Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Moderator Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contacts
                    .filter((c) => c.role === 'group')
                    .map((channel) => (
                      <tr key={channel.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              #
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{channel.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                                {channel.title}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                            {channel.category || 'general'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {channel.memberCount || 24} students
                        </td>
                        <td className="px-4 py-3">
                          {channel.isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <Lock className="h-3 w-3" />
                              Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Active Open
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setActiveContact(channel)
                                setActiveTab('chat')
                              }}
                              className="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground font-semibold text-[11px] transition-colors"
                            >
                              Open Chat
                            </button>
                            <button
                              onClick={() => handleToggleLock(channel.id)}
                              className={`p-1.5 rounded transition-colors ${
                                channel.isLocked
                                  ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                              title={channel.isLocked ? 'Unlock Channel' : 'Lock Channel'}
                            >
                              {channel.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteChannel(channel.id)}
                              className="p-1.5 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete Channel"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER MODERATION & PERMISSIONS */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Chat User Moderation Roster</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Restrict abusive users, mute disruptive participants, and issue official warnings.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Warnings</th>
                    <th className="px-4 py-3">Mute Status</th>
                    <th className="px-4 py-3">Chat Ban Status</th>
                    <th className="px-4 py-3 text-right">Moderator Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {moderatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{u.name}</p>
                            <p className="text-[11px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {u.warningsCount > 0 ? (
                          <span className="text-amber-600 font-bold">{u.warningsCount} Strike(s)</span>
                        ) : (
                          <span className="text-muted-foreground">0 Strikes</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.isMuted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <VolumeX className="h-3 w-3" />
                            Muted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Volume2 className="h-3 w-3" />
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <UserX className="h-3 w-3" />
                            Chat Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <UserCheck className="h-3 w-3" />
                            Clear
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleIssueWarning(u.id)}
                            className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[11px] font-bold transition-colors"
                          >
                            + Strike
                          </button>

                          <button
                            onClick={() => handleToggleMute(u.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                              u.isMuted
                                ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {u.isMuted ? 'Unmute' : 'Mute'}
                          </button>

                          <button
                            onClick={() => handleToggleBan(u.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                              u.isBanned
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                : 'bg-rose-600 text-white hover:bg-rose-500'
                            }`}
                          >
                            {u.isBanned ? 'Unban' : 'Ban Chat'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BROADCAST ALERT */}
      {activeTab === 'broadcast' && (
        <div className="max-w-2xl mx-auto rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Global Administrative Broadcast</h3>
              <p className="text-xs text-muted-foreground">
                Dispatch high-priority announcements directly to all cohort channels.
              </p>
            </div>
          </div>

          {broadcastSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Broadcast dispatched and pinned to target study channels!</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Target Audience Channels
              </label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Channels & Cohorts</option>
                <option value="cohorts">Student Study Cohorts Only</option>
                <option value="faculty">Faculty & Staff Channels Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Broadcast Announcement Text
              </label>
              <textarea
                required
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type your official announcement here (e.g. Schedule changes, exam notifications, server maintenance)..."
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setBroadcastMessage('')}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Broadcast</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE CHANNEL MODAL */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Hash className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-foreground">Create Community Channel</h3>
              </div>
              <button
                onClick={() => setShowCreateChannelModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. #fullstack-capstone"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Topic / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Student discussion & review for Capstone 2026"
                  value={newChannelTopic}
                  onChange={(e) => setNewChannelTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={newChannelCategory}
                    onChange={(e) => setNewChannelCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="cohort">Student Cohort</option>
                    <option value="general">General</option>
                    <option value="support">Support</option>
                    <option value="faculty">Faculty Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Access Mode
                  </label>
                  <select
                    value={newChannelLocked ? 'locked' : 'open'}
                    onChange={(e) => setNewChannelLocked(e.target.value === 'locked')}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="open">Open Discussion</option>
                    <option value="locked">Read-Only Announcements</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateChannelModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / CLEAR CHAT MODAL */}
      {showDeleteModal && targetDeleteContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Delete Chat Options</h3>
                  <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                    {targetDeleteContact.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setTargetDeleteContact(null)
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Choose how you want to handle the conversation with{' '}
              <strong className="text-foreground">{targetDeleteContact.name}</strong>:
            </p>

            <div className="space-y-2.5">
              {/* Option 1: Delete Entire Chat */}
              <button
                type="button"
                onClick={() => handleDeleteChat(targetDeleteContact.id)}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-left transition-colors cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors shrink-0 mt-0.5">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Delete Entire Chat
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Permanently removes this chat from your active conversations list and purges all message history.
                  </p>
                </div>
              </button>

              {/* Option 2: Clear Messages Only */}
              <button
                type="button"
                onClick={() => handleClearMessages(targetDeleteContact.id)}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-left transition-colors cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0 mt-0.5">
                  <VolumeX className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Clear Messages Only
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Keeps the contact in your list, but wipes all message history and resets the conversation.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setTargetDeleteContact(null)
                }}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
