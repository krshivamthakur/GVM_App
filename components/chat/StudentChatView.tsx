'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  Settings2,
  Sparkles,
  GraduationCap,
  Circle,
  ExternalLink,
  CheckCheck,
  Bot,
  HelpCircle,
  Hash,
  BookOpen,
  X,
  Key,
  ArrowLeft
} from 'lucide-react'
import {
  initCometChat,
  loginCometChat,
  getCometChatCredentials,
  isCometChatConfigured
} from '@/lib/cometchat'

interface ChatContact {
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

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  text: string
  time: string
  isSelf: boolean
  status?: 'sent' | 'delivered' | 'read'
  avatar?: string
}

const DEFAULT_CONTACTS: ChatContact[] = [
  {
    id: 'instructor_sarah',
    name: 'Dr. Sarah Jenkins',
    role: 'instructor',
    title: 'Lead Instructor • Next.js & React Mastery',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    status: 'online',
    unread: 2,
    lastMessage: 'Great progress on lesson 4! Have you tested the server action cache revalidation?',
    lastTime: '10:42 AM'
  },
  {
    id: 'instructor_alex',
    name: 'Prof. Alex Rivera',
    role: 'instructor',
    title: 'Senior Faculty • Full-Stack Cloud Architectures',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    status: 'online',
    unread: 0,
    lastMessage: 'Your assignment on database transactions has been reviewed with full credit.',
    lastTime: 'Yesterday'
  },
  {
    id: 'group_nextjs_cohort',
    name: '#nextjs-16-cohort',
    role: 'group',
    title: 'Student Study Channel • 48 Members',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
    status: 'online',
    unread: 5,
    lastMessage: 'Anyone collaborating on the final Capstone demo this Friday?',
    lastTime: '11:15 AM'
  },
  {
    id: 'group_shorts_creators',
    name: '#micro-learning-shorts',
    role: 'group',
    title: 'Bite-Sized Coding Shorts Discussion',
    avatar: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=120&auto=format&fit=crop&q=80',
    status: 'online',
    unread: 0,
    lastMessage: 'The new quick explanation on React Server Components was super clear!',
    lastTime: 'Sep 3'
  },
  {
    id: 'peer_emily',
    name: 'Emily Zhang',
    role: 'peer',
    title: 'Peer Student • UI/UX Track',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
    status: 'away',
    unread: 0,
    lastMessage: 'Sent you my notes for the Tailwind CSS v4 styling tokens!',
    lastTime: 'Sep 2'
  }
]

export default function StudentChatView() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<ChatContact[]>(DEFAULT_CONTACTS)
  const [activeContact, setActiveContact] = useState<ChatContact>(DEFAULT_CONTACTS[0])
  const [filterTab, setFilterTab] = useState<'all' | 'instructor' | 'group'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [inputText, setInputText] = useState('')
  const [isCalling, setIsCalling] = useState<'audio' | 'video' | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'live' | 'demo'>('checking')
  const [showMobileChat, setShowMobileChat] = useState(false)

  // Dynamic credentials state for the config modal
  const [appIdInput, setAppIdInput] = useState('')
  const [regionInput, setRegionInput] = useState('us')
  const [authKeyInput, setAuthKeyInput] = useState('')
  const [configSuccess, setConfigSuccess] = useState<string | null>(null)

  // Messages map per contact
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    instructor_sarah: [
      {
        id: 'm1',
        senderId: 'instructor_sarah',
        senderName: 'Dr. Sarah Jenkins',
        text: 'Hi there! Welcome to the Next.js & Supabase mentorship chat.',
        time: '10:30 AM',
        isSelf: false,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
      },
      {
        id: 'm2',
        senderId: 'self',
        senderName: 'You',
        text: 'Hello Dr. Jenkins! I had a quick question regarding server actions and optimistic UI updates.',
        time: '10:38 AM',
        isSelf: true,
        status: 'read'
      },
      {
        id: 'm3',
        senderId: 'instructor_sarah',
        senderName: 'Dr. Sarah Jenkins',
        text: 'Great progress on lesson 4! Have you tested the server action cache revalidation with revalidatePath?',
        time: '10:42 AM',
        isSelf: false,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
      }
    ],
    group_nextjs_cohort: [
      {
        id: 'c1',
        senderId: 'student_1',
        senderName: 'David Chen',
        text: 'Hey everyone, working through chapter 3 on Database Migrations.',
        time: '11:00 AM',
        isSelf: false,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
      },
      {
        id: 'c2',
        senderId: 'student_2',
        senderName: 'Emily Zhang',
        text: 'Make sure to run the seed script! It populates the shorts and sample lessons.',
        time: '11:05 AM',
        isSelf: false,
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80'
      },
      {
        id: 'c3',
        senderId: 'group_nextjs_cohort',
        senderName: 'Marcus Vance',
        text: 'Anyone collaborating on the final Capstone demo this Friday?',
        time: '11:15 AM',
        isSelf: false,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
      }
    ]
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check CometChat configuration
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
  }, [messages, activeContact.id])

  const filteredContacts = contacts.filter((c) => {
    const matchesTab = filterTab === 'all' || c.role === filterTab
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const currentMessages = messages[activeContact.id] || []

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      senderId: 'self',
      senderName: user?.full_name || 'You',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      status: 'sent'
    }

    setMessages((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMsg]
    }))

    const sentText = inputText
    setInputText('')

    // Auto update contact last message
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id
          ? {
              ...c,
              lastMessage: sentText,
              lastTime: 'Just now'
            }
          : c
      )
    )

    // If simulating contact, generate realistic reply after 1.5s
    if (activeContact.role === 'instructor') {
      setTimeout(() => {
        const replyMsg: ChatMessage = {
          id: 'reply_' + Date.now(),
          senderId: activeContact.id,
          senderName: activeContact.name,
          text: `Thanks for asking! I've noted that down. Let's also review this during our weekly student office hour, or we can start a quick video consultation!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: false,
          avatar: activeContact.avatar
        }

        setMessages((prev) => ({
          ...prev,
          [activeContact.id]: [...(prev[activeContact.id] || []), replyMsg]
        }))
      }, 1500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-13.5rem)] sm:h-[calc(100vh-10rem)] min-h-[520px] rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Main Chat Workspace Grid */}
      <div className="flex flex-1 min-h-0 lg:divide-x divide-border overflow-hidden">
        {/* Left Sidebar: Conversations & Contacts */}
        <div
          className={`w-full lg:w-80 xl:w-96 flex flex-col bg-sidebar shrink-0 ${
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
                placeholder="Search instructors or groups..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-2.5">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterTab === 'all'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterTab('instructor')}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterTab === 'instructor'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Instructors
              </button>
              <button
                onClick={() => setFilterTab('group')}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterTab === 'group'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Study Groups
              </button>
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No conversations match your search.
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
                      {contact.role === 'group' ? (
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                          #
                        </div>
                      ) : (
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-background ${
                            contact.status === 'online'
                              ? 'bg-emerald-500'
                              : contact.status === 'away'
                              ? 'bg-amber-500'
                              : 'bg-muted-foreground'
                          }`}
                        />
                      )}
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
                {user?.full_name?.charAt(0) || 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user?.full_name || 'Student Account'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  UID: {user?.id ? user.id.slice(0, 8) : 'student_demo'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              title="CometChat Settings"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Area: Active Chat Window */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-background animate-in fade-in-50 duration-150 ${
            !showMobileChat ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Back button on mobile & tablet */}
              <button
                type="button"
                onClick={() => setShowMobileChat(false)}
                className="lg:hidden inline-flex items-center gap-1.5 py-1.5 px-2 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 transition-colors shrink-0 cursor-pointer"
                aria-label="Back to contacts and groups"
                title="Back to chats"
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
                {activeContact.role !== 'group' && (
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background ${
                      activeContact.status === 'online'
                        ? 'bg-emerald-500'
                        : activeContact.status === 'away'
                        ? 'bg-amber-500'
                        : 'bg-muted-foreground'
                    }`}
                  />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {activeContact.name}
                  </h3>
                  {activeContact.role === 'instructor' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary shrink-0">
                      <GraduationCap className="h-3 w-3" />
                      <span className="hidden xs:inline">Instructor</span>
                    </span>
                  )}
                  {activeContact.role === 'group' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground shrink-0">
                      <Hash className="h-3 w-3" />
                      <span className="hidden xs:inline">Channel</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-md">
                  {activeContact.title}
                </p>
              </div>
            </div>

            {/* Calling & Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsCalling('audio')}
                title="Voice Call"
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Phone className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Voice Call</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCalling('video')}
                title="Video Consult"
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Video className="h-4 w-4" />
                <span className="hidden sm:inline">Video Consult</span>
              </button>
            </div>
          </div>

          {/* Active Call Overlay (Simulated Calling via CometChat Calls SDK) */}
          {isCalling && (
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary/10 border-b border-primary/20 text-xs text-primary animate-in fade-in duration-200 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-2 w-2 rounded-full bg-primary animate-ping shrink-0" />
                <span className="font-semibold truncate">
                  {isCalling === 'video' ? 'CometChat Video Call' : 'CometChat Audio Call'} with{' '}
                  {activeContact.name}...
                </span>
                <span className="text-muted-foreground text-[11px] hidden sm:inline shrink-0">(Call SDK Active)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCalling(null)}
                className="px-2.5 py-1 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors shrink-0"
              >
                End Call
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Introductory Badge */}
            <div className="text-center my-1 sm:my-2">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-muted/60 text-muted-foreground text-[11px] sm:text-xs border border-border max-w-full">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">End-to-End LMS Secure Session • CometChat UI Kit</span>
              </div>
            </div>

            {currentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 sm:gap-2.5 ${msg.isSelf ? 'justify-end' : 'justify-start'}`}
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
                  {!msg.isSelf && activeContact.role === 'group' && (
                    <div className="text-[11px] font-semibold text-primary mb-1">
                      {msg.senderName}
                    </div>
                  )}
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
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-2 sm:p-3 border-t border-border bg-card shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-border bg-background px-2.5 sm:px-3 py-1 sm:py-1.5 focus-within:ring-1 focus-within:ring-ring transition-shadow">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
                title="Attach course files or code snippet"
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
                className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
              >
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
            <div className="hidden sm:flex items-center justify-between mt-2 px-1 text-[11px] text-muted-foreground">
              <span>Supports real-time chat, code snippets, and direct mentor consultation.</span>
              <span>CometChat v7.1 React UI Kit</span>
            </div>
          </div>
        </div>
      </div>

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
                  <h3 className="text-base font-semibold text-foreground">
                    CometChat Cloud Keys
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Connect your live CometChat tenant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              To connect live messaging and voice/video calling directly to your CometChat account,
              grab your credentials from the{' '}
              <a
                href="https://app.cometchat.com"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline font-medium"
              >
                CometChat Dashboard
              </a>{' '}
              and add them to your <code className="bg-muted px-1 py-0.5 rounded text-[11px]">.env.local</code>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  App ID (`NEXT_PUBLIC_COMETCHAT_APP_ID`)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 257890abcdef"
                  value={appIdInput}
                  onChange={(e) => setAppIdInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Region (`NEXT_PUBLIC_COMETCHAT_REGION`)
                  </label>
                  <select
                    value={regionInput}
                    onChange={(e) => setRegionInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="us">United States (us)</option>
                    <option value="eu">Europe (eu)</option>
                    <option value="in">India (in)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Auth Key (`NEXT_PUBLIC_COMETCHAT_AUTH_KEY`)
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. 98abcde..."
                    value={authKeyInput}
                    onChange={(e) => setAuthKeyInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {configSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
                {configSuccess}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (appIdInput && authKeyInput) {
                    setConfigSuccess('Credentials configured! Add them to .env.local to persist across restarts.')
                    setTimeout(() => {
                      setShowConfigModal(false)
                      setConnectionStatus('live')
                    }, 1200)
                  } else {
                    setConfigSuccess('Sandbox mode enabled with demo instructors and study groups.')
                    setTimeout(() => setShowConfigModal(false), 1000)
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-xs"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
