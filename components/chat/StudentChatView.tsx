'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
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
  Sparkles,
  GraduationCap,
  CheckCheck,
  Hash,
  X,
  Key,
  ArrowLeft,
  Trash2,
  VolumeX,
  UserCheck
} from 'lucide-react'
import {
  initCometChat,
  loginCometChat,
  getCometChatCredentials,
  isCometChatConfigured
} from '@/lib/cometchat'
import { Profile } from '@/types/database'
import { getAllUsers } from '@/actions/admin-actions'

export interface ChatContact {
  id: string
  name: string
  role: 'instructor' | 'group' | 'peer'
  title: string
  avatar: string
  status: 'online' | 'offline' | 'away'
  unread: number
  lastMessage: string
  lastTime: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  text: string
  time: string
  isSelf: boolean
  status?: 'sent' | 'delivered' | 'read'
  avatar?: string
}

const DEMO_IDS = new Set([
  'instructor_sarah',
  'instructor_alex',
  'group_nextjs_cohort',
  'group_shorts_creators',
  'peer_emily',
  'student_david',
  'student_emily',
  'student_marcus'
])

const STORAGE_MESSAGES_KEY = 'gvm_student_chat_messages_v2'
const STORAGE_DELETED_KEY = 'gvm_student_deleted_chats_v2'

interface StudentChatViewProps {
  initialUsers?: Profile[]
}

export default function StudentChatView({ initialUsers = [] }: StudentChatViewProps) {
  const { user } = useAuth()
  const [dbUsers, setDbUsers] = useState<Profile[]>(initialUsers)
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [activeContact, setActiveContact] = useState<ChatContact | null>(null)
  const [filterTab, setFilterTab] = useState<'all' | 'instructor' | 'peer'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [inputText, setInputText] = useState('')
  const [isCalling, setIsCalling] = useState<'audio' | 'video' | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'live' | 'demo'>('checking')
  const [showMobileChat, setShowMobileChat] = useState(false)

  // Delete / Clear Chat Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [targetDeleteContact, setTargetDeleteContact] = useState<ChatContact | null>(null)

  // Dynamic credentials state for the config modal
  const [appIdInput, setAppIdInput] = useState('')
  const [regionInput, setRegionInput] = useState('us')
  const [authKeyInput, setAuthKeyInput] = useState('')
  const [configSuccess, setConfigSuccess] = useState<string | null>(null)

  // Real messages stored per contact ID (starts EMPTY, no demo messages)
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Fetch real users if not provided
  useEffect(() => {
    if (!initialUsers || initialUsers.length === 0) {
      getAllUsers('all')
        .then((fetched) => {
          if (fetched && fetched.length > 0) {
            setDbUsers(fetched)
          }
        })
        .catch(() => {})
    } else {
      setDbUsers(initialUsers)
    }
  }, [initialUsers])

  // 2. Build real contacts list from database users (excluding current user and demo data)
  useEffect(() => {
    const deletedIds = new Set<string>()
    try {
      const storedDeleted = localStorage.getItem(STORAGE_DELETED_KEY)
      if (storedDeleted) {
        JSON.parse(storedDeleted).forEach((id: string) => deletedIds.add(id))
      }
    } catch {}

    // Load saved messages from localStorage
    let savedMessages: Record<string, ChatMessage[]> = {}
    try {
      const stored = localStorage.getItem(STORAGE_MESSAGES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Clean out demo contacts
        Object.keys(parsed).forEach((key) => {
          if (!DEMO_IDS.has(key)) {
            savedMessages[key] = parsed[key]
          }
        })
      }
    } catch {}
    setMessages(savedMessages)

    const currentUserId = user?.id
    const currentUserEmail = user?.email?.toLowerCase()

    const realContacts: ChatContact[] = dbUsers
      .filter((u) => {
        if (!u.id) return false
        if (DEMO_IDS.has(u.id)) return false
        if (deletedIds.has(u.id)) return false
        // Exclude self
        if (currentUserId && u.id === currentUserId) return false
        if (currentUserEmail && u.email?.toLowerCase() === currentUserEmail) return false
        return true
      })
      .map((u) => {
        const isTeacher = u.role === 'teacher'
        const isAdmin = u.role === 'admin'
        const role: 'instructor' | 'peer' = isTeacher || isAdmin ? 'instructor' : 'peer'

        let title = 'Enrolled Student'
        let name = u.full_name || u.email?.split('@')[0] || 'User'
        if (isAdmin) {
          title = 'Platform Administrator & Support'
          name = `${u.full_name || 'Admin'} (Support)`
        } else if (isTeacher) {
          title = u.bio ? u.bio.split('\n')[0] : 'Certified Course Instructor'
        } else {
          title = `Student • ${u.email || ''}`
        }

        const userMsgs = savedMessages[u.id] || []
        const lastMsg = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1] : null

        return {
          id: u.id,
          name,
          role,
          title,
          avatar:
            u.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          status: 'online' as const,
          unread: 0,
          lastMessage: lastMsg ? lastMsg.text : 'Chat conversation initialized.',
          lastTime: lastMsg ? lastMsg.time : 'Active now'
        }
      })

    setContacts(realContacts)

    if (realContacts.length > 0) {
      setActiveContact((prev) => {
        if (prev && realContacts.some((c) => c.id === prev.id)) {
          return realContacts.find((c) => c.id === prev.id) || realContacts[0]
        }
        return realContacts[0]
      })
    } else {
      setActiveContact(null)
    }
  }, [dbUsers, user])

  // CometChat Initialization
  useEffect(() => {
    const creds = getCometChatCredentials()
    if (creds) {
      setIsConfigured(true)
      setIsInitializing(true)
      initCometChat()
        .then((ok) => {
          if (ok) {
            setConnectionStatus('live')
            if (user) {
              loginCometChat(user).catch(() => {})
            }
          } else {
            setConnectionStatus('demo')
          }
        })
        .finally(() => setIsInitializing(false))
    } else {
      setIsConfigured(false)
      setConnectionStatus('demo')
    }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeContact?.id])

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesTab = filterTab === 'all' || c.role === filterTab
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesTab && matchesSearch
    })
  }, [contacts, filterTab, searchQuery])

  const currentMessages = activeContact ? messages[activeContact.id] || [] : []

  // Send message
  const handleSendMessage = () => {
    if (!inputText.trim() || !activeContact) return

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      senderId: user?.id || 'self',
      senderName: user?.full_name || 'You',
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
            lastMessage: inputText.trim(),
            lastTime: 'Just now'
          }
        : c
    )
    setContacts(updatedContacts)
    setInputText('')

    try {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(updatedMessages))
    } catch {}
  }

  // Delete Entire Chat
  const handleDeleteChat = (contactId: string) => {
    const updatedMessages = { ...messages }
    delete updatedMessages[contactId]
    setMessages(updatedMessages)

    const updatedContacts = contacts.filter((c) => c.id !== contactId)
    setContacts(updatedContacts)

    if (activeContact?.id === contactId) {
      setActiveContact(updatedContacts.length > 0 ? updatedContacts[0] : null)
    }

    try {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(updatedMessages))
      const stored = localStorage.getItem(STORAGE_DELETED_KEY)
      const deletedList: string[] = stored ? JSON.parse(stored) : []
      if (!deletedList.includes(contactId)) {
        deletedList.push(contactId)
        localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(deletedList))
      }
    } catch {}

    setShowDeleteModal(false)
    setTargetDeleteContact(null)
  }

  // Clear Messages Only
  const handleClearMessages = (contactId: string) => {
    const updatedMessages = {
      ...messages,
      [contactId]: []
    }
    setMessages(updatedMessages)

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

    try {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(updatedMessages))
    } catch {}

    setShowDeleteModal(false)
    setTargetDeleteContact(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner: Real LMS Session */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Community Chat & Mentorship</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Hub
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect directly with course instructors, study peers, and platform support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConfigured ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
              <span>CometChat Connected</span>
            </div>
          ) : (
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-xs"
            >
              <Key className="h-3.5 w-3.5 text-primary" />
              <span>Configure CometChat</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex h-[calc(100vh-14rem)] min-h-[520px] max-h-[760px] rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {/* Left Sidebar: Contacts */}
        <div
          className={`w-full lg:w-80 sm:border-r border-border flex flex-col bg-card shrink-0 ${
            showMobileChat ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search bar */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search instructors or peers..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-2.5">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterTab('instructor')}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  filterTab === 'instructor'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Instructors
              </button>
              <button
                onClick={() => setFilterTab('peer')}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  filterTab === 'peer'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Peers
              </button>
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center h-full">
                <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-foreground">No contacts found</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {contacts.length === 0
                    ? 'No other users registered in the platform yet.'
                    : 'No users match your filter.'}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isActive = activeContact?.id === contact.id
                return (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setActiveContact(contact)
                      setShowMobileChat(true)
                    }}
                    className={`w-full flex items-start gap-3 p-3 text-left transition-colors cursor-pointer ${
                      isActive ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/40'
                    }`}
                  >
                    {/* Avatar with Status badge */}
                    <div className="relative shrink-0">
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-background bg-emerald-500" />
                    </div>

                    {/* Contact Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-sm truncate text-foreground">
                          {contact.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {contact.lastTime}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate leading-relaxed">
                        {contact.lastMessage}
                      </p>
                    </div>

                    {contact.unread > 0 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {contact.unread}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* User info footer */}
          <div className="p-3 border-t border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user?.full_name || user?.email?.split('@')[0] || 'Logged In User'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user?.email || 'User Account'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Area: Active Chat Window */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-background animate-in fade-in-50 duration-150 ${
            !showMobileChat ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeContact ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border bg-card shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Back button on mobile */}
                  <button
                    type="button"
                    onClick={() => setShowMobileChat(false)}
                    className="lg:hidden inline-flex items-center gap-1.5 py-1.5 px-2 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 transition-colors shrink-0 cursor-pointer"
                  >
                    <ArrowLeft className="h-5 w-5 text-foreground" />
                    <span className="text-xs font-semibold hidden xs:inline">Chats</span>
                  </button>

                  <div className="relative shrink-0">
                    <img
                      src={activeContact.avatar}
                      alt={activeContact.name}
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover ring-1 ring-border"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background bg-emerald-500" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {activeContact.name}
                      </h3>
                      {activeContact.role === 'instructor' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary shrink-0">
                          <GraduationCap className="h-3 w-3" />
                          <span>Instructor</span>
                        </span>
                      )}
                      {activeContact.role === 'peer' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground shrink-0">
                          <UserCheck className="h-3 w-3" />
                          <span>Peer</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-md">
                      {activeContact.title}
                    </p>
                  </div>
                </div>

                {/* Calling & Delete Actions */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCalling('audio')}
                    title="Voice Call"
                    className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="hidden sm:inline">Voice Call</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalling('video')}
                    title="Video Consult"
                    className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                  >
                    <Video className="h-4 w-4" />
                    <span className="hidden sm:inline">Video Consult</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetDeleteContact(activeContact)
                      setShowDeleteModal(true)
                    }}
                    title="Delete Chat or Clear History"
                    aria-label="Delete Chat or Clear History"
                    className="p-2 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Active Call Overlay */}
              {isCalling && (
                <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary/10 border-b border-primary/20 text-xs text-primary animate-in fade-in duration-200 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-primary animate-ping shrink-0" />
                    <span className="font-semibold truncate">
                      CometChat {isCalling === 'video' ? 'Video Consult' : 'Voice Call'} with{' '}
                      {activeContact.name}...
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCalling(null)}
                    className="px-2.5 py-1 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors shrink-0 cursor-pointer"
                  >
                    End Call
                  </button>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="text-center my-1 sm:my-2">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-muted/60 text-muted-foreground text-[11px] sm:text-xs border border-border max-w-full">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">LMS Secure Real-Time Session</span>
                  </div>
                </div>

                {currentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <div className="p-3.5 rounded-2xl bg-muted/60 text-muted-foreground mb-3">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Send a message below to start your conversation with {activeContact.name}.
                    </p>
                  </div>
                ) : (
                  currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 sm:gap-2.5 ${
                        msg.isSelf ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {!msg.isSelf && (
                        <img
                          src={msg.avatar || activeContact.avatar}
                          alt={msg.senderName}
                          className="h-7 w-7 rounded-full object-cover shrink-0 ring-1 ring-border"
                        />
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm shadow-xs break-words ${
                          msg.isSelf
                            ? 'bg-primary text-primary-foreground rounded-br-xs'
                            : 'bg-muted/70 text-foreground border border-border/80 rounded-bl-xs'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
                            msg.isSelf ? 'text-primary-foreground/75' : 'text-muted-foreground'
                          }`}
                        >
                          <span>{msg.time}</span>
                          {msg.isSelf && <CheckCheck className="h-3 w-3 inline" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Box */}
              <div className="p-2 sm:p-3 border-t border-border bg-card shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-border bg-background px-2.5 sm:px-3 py-1 sm:py-1.5 focus-within:ring-1 focus-within:ring-ring transition-shadow">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
                    title="Attach course files or notes"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeContact.name}...`}
                    className="flex-1 min-w-0 bg-transparent py-1 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />

                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
                    title="Insert emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
                <div className="hidden sm:flex items-center justify-between mt-2 px-1 text-[11px] text-muted-foreground">
                  <span>Direct real-time messaging with course mentors and classmates.</span>
                  <span>CometChat Powered</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="p-4 rounded-full bg-muted/50 mb-3 text-muted-foreground">
                <MessageSquare className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold text-foreground">Select a conversation</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Choose an instructor or classmate from the left sidebar to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete / Clear Chat Modal */}
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
                    Removes this conversation from your chats list and purges all message history.
                  </p>
                </div>
              </button>

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
                    Keeps the contact in your list, but clears all messages in the thread.
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

      {/* CometChat Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">CometChat Cloud Keys</h3>
                  <p className="text-xs text-muted-foreground">Connect your live CometChat tenant</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Your CometChat App ID and credentials can be updated by platform administrators in{' '}
              <strong className="text-foreground">Admin &gt; Settings &gt; CometChat Cloud</strong>.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
