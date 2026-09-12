'use client'

import { 
  ChatConversation, 
  ChatMessage, 
  ChatParticipant, 
  ChatReaction, 
  ModerationReport,
  ConversationType
} from '@/types/chat'
import { Profile } from '@/types/database'

const CHAT_STORAGE_VERSION = 'gvm_unified_chat_v5'
const BLOCKED_USERS_STORAGE_KEY = 'gvm_chat_blocked_users_v5'
const MUTED_USERS_STORAGE_KEY = 'gvm_chat_muted_users_v5'
const USER_STRIKES_STORAGE_KEY = 'gvm_chat_user_strikes_v5'
const REPORTS_STORAGE_KEY = 'gvm_chat_reports_v5'
const DELETED_CONVERSATIONS_KEY = 'gvm_chat_deleted_conversations_v5'

export const SYSTEM_CHANNELS: ChatConversation[] = [
  {
    id: 'conv_announcements',
    title: '#announcements-hub',
    type: 'channel',
    avatar: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80',
    is_locked: true,
    is_pinned: true,
    pinned_notice: '📢 Official academic notices, examination alerts, and masterclass schedules.',
    last_message: 'Welcome to GVM EduLMS. Check our schedule for upcoming live sessions.',
    last_message_time: '10:00 AM',
    unread_count: 0,
    status: 'online'
  },
  {
    id: 'conv_physics_cohort',
    title: '#physics-cohort-2026',
    type: 'group',
    avatar: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=120&auto=format&fit=crop&q=80',
    is_locked: false,
    pinned_notice: '⚡ Weekly discussion thread for Physics problem sets, derivations, and labs.',
    last_message: 'Has anyone finished Chapter 3 Electromagnetism numerical 14?',
    last_message_time: 'Yesterday',
    unread_count: 1,
    status: 'online'
  },
  {
    id: 'conv_java_guild',
    title: '#java-developers-guild',
    type: 'group',
    avatar: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120&auto=format&fit=crop&q=80',
    is_locked: false,
    pinned_notice: '☕ Java algorithms, OOP paradigms, JVM architecture, and coding doubts.',
    last_message: 'Checkout the new thread on Memory Management & GC logs.',
    last_message_time: '2 days ago',
    unread_count: 0,
    status: 'online'
  },
  {
    id: 'conv_support_desk',
    title: 'GVM Student Support & Helpdesk',
    type: 'support',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    is_locked: false,
    pinned_notice: '💬 24/7 Academic counselling, technical assistance, and course queries.',
    last_message: 'Hello! How can the academic support team assist you today?',
    last_message_time: 'Active',
    unread_count: 0,
    status: 'online'
  }
]

export const SEED_MESSAGES: Record<string, ChatMessage[]> = {
  conv_announcements: [
    {
      id: 'msg_ann_1',
      conversation_id: 'conv_announcements',
      sender_id: 'admin_sys',
      sender_name: 'Sumit Saurav (Admin)',
      sender_role: 'admin',
      sender_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      text: '🚀 Welcome to the new semester at GVM EduLMS! All lecture notes and micro-learning shorts have been updated in your dashboard.',
      type: 'text',
      is_pinned: true,
      status: 'read',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      reactions: [
        { emoji: '🔥', count: 12, users: ['u1', 'u2', 'u3'] },
        { emoji: '👏', count: 8, users: ['u4', 'u5'] }
      ]
    },
    {
      id: 'msg_ann_2',
      conversation_id: 'conv_announcements',
      sender_id: 'admin_sys',
      sender_name: 'Sumit Saurav (Admin)',
      sender_role: 'admin',
      sender_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      text: 'Please review the Academic Honesty Guidelines. Inappropriate language or spam in study groups will result in moderation strikes.',
      type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      reactions: [
        { emoji: '👍', count: 15, users: ['u1', 'u2'] }
      ]
    }
  ],
  conv_physics_cohort: [
    {
      id: 'msg_phy_1',
      conversation_id: 'conv_physics_cohort',
      sender_id: '00000000-0000-0000-0000-789003538483',
      sender_name: 'samir (Instructor)',
      sender_role: 'teacher',
      sender_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      text: 'Welcome Physics scholars! Today we delve into Electromagnetism and Maxwell equations. Feel free to drop queries here anytime.',
      type: 'text',
      is_pinned: true,
      status: 'read',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      reactions: [{ emoji: '⚡', count: 6, users: ['u1'] }]
    },
    {
      id: 'msg_phy_2',
      conversation_id: 'conv_physics_cohort',
      sender_id: 'student_harsh',
      sender_name: 'harsh',
      sender_role: 'student',
      text: 'Has anyone finished Chapter 3 Electromagnetism numerical 14?',
      type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      reactions: [{ emoji: '💡', count: 2, users: ['u3'] }]
    }
  ],
  conv_java_guild: [
    {
      id: 'msg_jav_1',
      conversation_id: 'conv_java_guild',
      sender_id: 'admin_sys',
      sender_name: 'Sumit Saurav (Admin)',
      sender_role: 'admin',
      text: 'Checkout the new thread on Memory Management & GC logs. Great discussion on ZGC vs G1GC!',
      type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString()
    }
  ],
  conv_support_desk: [
    {
      id: 'msg_sup_1',
      conversation_id: 'conv_support_desk',
      sender_id: 'support_agent',
      sender_name: 'GVM Support Bot',
      sender_role: 'support',
      sender_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      text: '👋 Welcome to Student & Teacher Support. Our team is available 24/7. Type your query or attach relevant screenshots.',
      type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString()
    }
  ]
}

export function deduplicateMessagesList(messages: ChatMessage[]): ChatMessage[] {
  if (!messages || messages.length === 0) return []
  const seenIds = new Set<string>()
  const deduped: ChatMessage[] = []

  for (const msg of messages) {
    if (!msg || !msg.id) continue
    if (seenIds.has(msg.id)) continue

    const msgTime = new Date(msg.created_at).getTime()
    const isDup = deduped.some((prev) => {
      if (prev.id === msg.id) return true
      const sameSender = prev.sender_id === msg.sender_id || prev.sender_name === msg.sender_name
      const sameText = (prev.text || '').trim() === (msg.text || '').trim()
      const sameType = prev.type === msg.type
      const closeTime = !isNaN(msgTime) && !isNaN(new Date(prev.created_at).getTime()) 
        ? Math.abs(new Date(prev.created_at).getTime() - msgTime) < 30000
        : false
      return sameSender && sameText && sameType && closeTime
    })

    if (!isDup) {
      seenIds.add(msg.id)
      deduped.push(msg)
    }
  }

  return deduped.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export class ChatStateManager {
  private static instance: ChatStateManager

  private conversations: Map<string, ChatConversation> = new Map()
  private messages: Map<string, ChatMessage[]> = new Map()
  private blockedUserIds: Set<string> = new Set()
  private mutedUserIds: Set<string> = new Set()
  private userStrikes: Map<string, number> = new Map()
  private reports: ModerationReport[] = []
  private deletedConversationIds: Set<string> = new Set()
  private initialized: boolean = false

  private constructor() {
    this.loadFromStorage()
  }

  public static getInstance(): ChatStateManager {
    if (!ChatStateManager.instance) {
      ChatStateManager.instance = new ChatStateManager()
    }
    return ChatStateManager.instance
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return

    try {
      const rawDeleted = localStorage.getItem(DELETED_CONVERSATIONS_KEY)
      if (rawDeleted) {
        JSON.parse(rawDeleted).forEach((id: string) => this.deletedConversationIds.add(id))
      }

      // 1. Check current storage or migrate from previous storage
      const storageSources = [
        CHAT_STORAGE_VERSION,
        'gvm_unified_chat_v4',
        'gvm_unified_chat_v3'
      ]

      for (const sourceKey of storageSources) {
        const rawStored = localStorage.getItem(sourceKey)
        if (!rawStored) continue

        try {
          const parsed = JSON.parse(rawStored)
          if (parsed.conversations) {
            parsed.conversations.forEach((c: ChatConversation) => {
              if (!this.deletedConversationIds.has(c.id) && !this.conversations.has(c.id)) {
                this.conversations.set(c.id, c)
              }
            })
          }
          if (parsed.messages) {
            Object.keys(parsed.messages).forEach((convId) => {
              if (this.deletedConversationIds.has(convId)) return
              const rawMsgs = parsed.messages[convId] || []
              if (rawMsgs.length === 0) return

              // Strictly remove simulated bot/auto-reply messages
              const cleanMsgs = rawMsgs.filter((m: ChatMessage) => {
                if (!m || !m.id || !m.text) return false
                if (
                  m.text.includes('Thanks for reaching out! I am reviewing your query') ||
                  m.text.includes('Let me verify the lecture notes and share the derivation') ||
                  m.text.includes('Got it! Let me verify')
                ) {
                  return false
                }
                return true
              })

              const currentList = this.messages.get(convId) || []
              if (cleanMsgs.length > 0) {
                const merged = deduplicateMessagesList([...currentList, ...cleanMsgs])
                this.messages.set(convId, merged)
              }
            })
          }
        } catch (err) {
          console.warn('Storage parsing error for', sourceKey, err)
        }
      }

      // If a conversation has a last_message snippet (e.g. "hello test 5") but messages is currently empty, recover it!
      this.conversations.forEach((conv, convId) => {
        const existingMsgs = this.messages.get(convId) || []
        if (
          existingMsgs.length === 0 &&
          conv.last_message &&
          !conv.last_message.startsWith('Start conversation with') &&
          conv.last_message !== 'Attachment' &&
          conv.last_message !== 'Conversation established'
        ) {
          const recovered: ChatMessage = {
            id: `msg_rec_${convId}_1`,
            conversation_id: convId,
            sender_id: conv.other_user_id || 'peer',
            sender_name: conv.title || 'Participant',
            sender_role: conv.other_user_role || 'member',
            text: conv.last_message,
            type: 'text',
            status: 'delivered',
            created_at: new Date().toISOString()
          }
          this.messages.set(convId, [recovered])
        }
      })

      // Purge legacy storage keys
      localStorage.removeItem('gvm_unified_chat_v1')
      localStorage.removeItem('gvm_unified_chat_v2')

      const rawBlocked = localStorage.getItem(BLOCKED_USERS_STORAGE_KEY)
      if (rawBlocked) {
        JSON.parse(rawBlocked).forEach((id: string) => this.blockedUserIds.add(id))
      }

      const rawMuted = localStorage.getItem(MUTED_USERS_STORAGE_KEY)
      if (rawMuted) {
        JSON.parse(rawMuted).forEach((id: string) => this.mutedUserIds.add(id))
      }

      const rawStrikes = localStorage.getItem(USER_STRIKES_STORAGE_KEY)
      if (rawStrikes) {
        const obj = JSON.parse(rawStrikes)
        Object.keys(obj).forEach((k) => this.userStrikes.set(k, obj[k]))
      }

      const rawReports = localStorage.getItem(REPORTS_STORAGE_KEY)
      if (rawReports) {
        this.reports = JSON.parse(rawReports)
      }
    } catch (e) {
      console.warn('Failed to load chat from localStorage:', e)
    }

    // Ensure system channels always exist UNLESS explicitly deleted by user
    SYSTEM_CHANNELS.forEach((channel) => {
      if (this.deletedConversationIds.has(channel.id)) return
      if (!this.conversations.has(channel.id)) {
        this.conversations.set(channel.id, channel)
      }
      if (!this.messages.has(channel.id)) {
        this.messages.set(channel.id, SEED_MESSAGES[channel.id] || [])
      }
    })

    this.initialized = true
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return

    try {
      const conversationsArr = Array.from(this.conversations.values())
      const messagesObj: Record<string, ChatMessage[]> = {}
      this.messages.forEach((msgs, convId) => {
        messagesObj[convId] = msgs
      })

      localStorage.setItem(
        CHAT_STORAGE_VERSION,
        JSON.stringify({
          conversations: conversationsArr,
          messages: messagesObj
        })
      )

      localStorage.setItem(
        DELETED_CONVERSATIONS_KEY,
        JSON.stringify(Array.from(this.deletedConversationIds))
      )

      localStorage.setItem(
        BLOCKED_USERS_STORAGE_KEY,
        JSON.stringify(Array.from(this.blockedUserIds))
      )

      localStorage.setItem(
        MUTED_USERS_STORAGE_KEY,
        JSON.stringify(Array.from(this.mutedUserIds))
      )

      const strikesObj: Record<string, number> = {}
      this.userStrikes.forEach((v, k) => { strikesObj[k] = v })
      localStorage.setItem(
        USER_STRIKES_STORAGE_KEY,
        JSON.stringify(strikesObj)
      )

      localStorage.setItem(
        REPORTS_STORAGE_KEY,
        JSON.stringify(this.reports)
      )

      // Notify other views/tabs of real-time state change
      window.dispatchEvent(new CustomEvent('gvm_chat_update'))
    } catch (e) {
      console.warn('Failed to save chat to storage:', e)
    }
  }

  public syncWithProfiles(profiles: Profile[], currentUserId?: string, currentUserEmail?: string): ChatConversation[] {
    // 1. Build canonical direct conversation map for all available profiles
    const canonicalByPerson = new Map<string, string>()

    profiles.forEach((profile) => {
      if (!profile.id) return
      const isSelfProfile =
        (currentUserId && profile.id === currentUserId) ||
        (currentUserEmail && profile.email && profile.email.toLowerCase() === currentUserEmail.toLowerCase())
      
      if (!isSelfProfile) {
        const currentUserIdentifier = (currentUserEmail || currentUserId || 'user').toLowerCase().trim()
        const profileIdentifier = (profile.email || profile.id).toLowerCase().trim()
        const sorted = [currentUserIdentifier, profileIdentifier].sort()
        const canonicalId = `direct_${sorted[0]}__${sorted[1]}`

        if (profile.id) canonicalByPerson.set(profile.id.toLowerCase(), canonicalId)
        if (profile.email) {
          canonicalByPerson.set(profile.email.toLowerCase(), canonicalId)
          canonicalByPerson.set(profile.email.split('@')[0].toLowerCase(), canonicalId)
        }
        if (profile.full_name) canonicalByPerson.set(profile.full_name.toLowerCase(), canonicalId)
      }
    })

    // 2. Clean up self conversations and conversations not involving the current user
    const currentIdentifiers = [
      currentUserId?.toLowerCase(),
      currentUserEmail?.toLowerCase(),
      currentUserEmail ? currentUserEmail.split('@')[0].toLowerCase() : undefined
    ].filter(Boolean) as string[]

    Array.from(this.conversations.keys()).forEach((key) => {
      const conv = this.conversations.get(key)
      if (conv && conv.type === 'direct') {
        const isSelf =
          (currentUserId && (conv.other_user_id === currentUserId || key.includes(currentUserId))) ||
          (currentUserEmail && (
            conv.other_user_name?.toLowerCase() === currentUserEmail.toLowerCase() ||
            conv.title?.toLowerCase() === currentUserEmail.split('@')[0].toLowerCase()
          ))

        if (isSelf) {
          this.conversations.delete(key)
          this.messages.delete(key)
          return
        }

        // Privacy: Verify this direct conversation involves the logged-in user
        if (currentIdentifiers.length > 0) {
          const parts = key.replace('direct_', '').toLowerCase().split('__').map(p => p.trim())
          const involvesCurrentUser = parts.some(p =>
            currentIdentifiers.some(cid => p === cid || p.includes(cid) || cid.includes(p))
          )
          if (!involvesCurrentUser) {
            this.conversations.delete(key)
            return
          }
        }
      }
    })

    // 3. Populate or update canonical direct conversations
    profiles.forEach((profile) => {
      if (!profile.id) return

      const isSelfProfile =
        (currentUserId && profile.id === currentUserId) ||
        (currentUserEmail && profile.email && profile.email.toLowerCase() === currentUserEmail.toLowerCase())

      if (isSelfProfile) {
        return
      }

      const currentUserIdentifier = (currentUserEmail || currentUserId || 'user').toLowerCase().trim()
      const profileIdentifier = (profile.email || profile.id).toLowerCase().trim()
      const sorted = [currentUserIdentifier, profileIdentifier].sort()
      const convId = `direct_${sorted[0]}__${sorted[1]}`

      if (!this.conversations.has(convId)) {
        const directConv: ChatConversation = {
          id: convId,
          title: profile.full_name || profile.email.split('@')[0],
          type: 'direct',
          avatar:
            profile.avatar_url ||
            (profile.role === 'teacher'
              ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
              : profile.role === 'admin'
              ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'),
          other_user_id: profile.id,
          other_user_role: profile.role,
          other_user_name: profile.full_name || profile.email,
          status: profile.role === 'teacher' || profile.role === 'admin' ? 'online' : 'away',
          last_message: `Start conversation with ${profile.full_name || profile.email}...`,
          last_message_time: 'Just now',
          unread_count: 0
        }
        this.conversations.set(convId, directConv)
      } else {
        const existing = this.conversations.get(convId)!
        existing.title = profile.full_name || profile.email.split('@')[0]
        existing.other_user_id = profile.id
        existing.other_user_name = profile.full_name || profile.email
        existing.other_user_role = profile.role
      }
    })

    // 4. Final deduplication sweep: ensure each target user only has ONE direct conversation
    const seenTargets = new Set<string>()
    Array.from(this.conversations.entries()).forEach(([id, c]) => {
      if (c.type === 'direct') {
        const targetKey = (c.other_user_id || c.other_user_name || c.title || '').toLowerCase().trim()
        if (targetKey && seenTargets.has(targetKey)) {
          this.conversations.delete(id)
          this.messages.delete(id)
        } else if (targetKey) {
          seenTargets.add(targetKey)
        }
      }
    })

    this.saveToStorage()
    return Array.from(this.conversations.values())
  }

  public getConversations(): ChatConversation[] {
    return Array.from(this.conversations.values())
  }

  public getMessages(conversationId: string): ChatMessage[] {
    const list = this.messages.get(conversationId) || []
    return deduplicateMessagesList(list)
  }

  public addMessage(msg: ChatMessage): ChatMessage {
    let list = this.messages.get(msg.conversation_id) || []
    
    // Check if an identical message is already present
    const isDup = list.some((existing) => {
      if (existing.id === msg.id) return true
      const sameSender = existing.sender_id === msg.sender_id || existing.sender_name === msg.sender_name
      const sameText = (existing.text || '').trim() === (msg.text || '').trim()
      const sameType = existing.type === msg.type
      const closeTime = Math.abs(new Date(existing.created_at).getTime() - new Date(msg.created_at).getTime()) < 15000
      return sameSender && sameText && sameType && closeTime
    })

    if (!isDup) {
      list.push(msg)
      list = deduplicateMessagesList(list)
      this.messages.set(msg.conversation_id, list)
    }

    // Update conversation last message snippet
    const conv = this.conversations.get(msg.conversation_id)
    if (conv) {
      conv.last_message = msg.type === 'text' ? msg.text : `[${msg.type.toUpperCase()}] ${msg.media_name || 'Attachment'}`
      conv.last_message_time = 'Just now'
      this.conversations.set(msg.conversation_id, conv)
    }

    this.saveToStorage()
    return msg
  }

  public mergeServerMessages(data: ChatMessage[] | Record<string, ChatMessage[]>): boolean {
    let hasNew = false
    const msgList: ChatMessage[] = Array.isArray(data)
      ? data
      : Object.values(data).flat()

    msgList.forEach((m) => {
      if (!m.id || !m.conversation_id) return
      let list = this.messages.get(m.conversation_id) || []
      
      const existingIdx = list.findIndex((existing) => {
        if (existing.id === m.id) return true
        const sameSender = existing.sender_id === m.sender_id || existing.sender_name === m.sender_name
        const sameText = (existing.text || '').trim() === (m.text || '').trim()
        const sameType = existing.type === m.type
        const closeTime = Math.abs(new Date(existing.created_at).getTime() - new Date(m.created_at).getTime()) < 30000
        return sameSender && sameText && sameType && closeTime
      })

      if (existingIdx === -1) {
        list.push(m)
        hasNew = true
      } else {
        // Update optimistic/existing message with server data
        list[existingIdx] = { ...list[existingIdx], ...m, id: m.id }
      }

      list = deduplicateMessagesList(list)
      this.messages.set(m.conversation_id, list)

      const conv = this.conversations.get(m.conversation_id)
      if (conv && list.length > 0) {
        const last = list[list.length - 1]
        conv.last_message = last.text || 'Attachment'
        conv.last_message_time = 'Active'
      }
    })

    if (hasNew) {
      this.saveToStorage()
    }
    return hasNew
  }

  public editMessage(conversationId: string, messageId: string, newText: string): boolean {
    const list = this.messages.get(conversationId)
    if (!list) return false
    const target = list.find((m) => m.id === messageId)
    if (target) {
      target.text = newText
      target.is_edited = true
      target.updated_at = new Date().toISOString()
      this.saveToStorage()
      return true
    }
    return false
  }

  public deleteMessage(conversationId: string, messageId: string): boolean {
    const list = this.messages.get(conversationId)
    if (!list) return false
    const target = list.find((m) => m.id === messageId)
    if (target) {
      target.is_deleted = true
      target.text = 'This message was deleted'
      target.media_url = undefined
      this.saveToStorage()
      return true
    }
    return false
  }

  public toggleReaction(conversationId: string, messageId: string, emoji: string, userId: string): boolean {
    const list = this.messages.get(conversationId)
    if (!list) return false
    const target = list.find((m) => m.id === messageId)
    if (!target) return false

    if (!target.reactions) {
      target.reactions = []
    }

    const existingReaction = target.reactions.find((r) => r.emoji === emoji)
    if (existingReaction) {
      const idx = existingReaction.users.indexOf(userId)
      if (idx > -1) {
        // Remove reaction
        existingReaction.users.splice(idx, 1)
        existingReaction.count -= 1
        if (existingReaction.count <= 0) {
          target.reactions = target.reactions.filter((r) => r.emoji !== emoji)
        }
      } else {
        // Add user to reaction
        existingReaction.users.push(userId)
        existingReaction.count += 1
      }
    } else {
      // New reaction emoji
      target.reactions.push({
        emoji,
        count: 1,
        users: [userId],
        hasReacted: true
      })
    }

    this.saveToStorage()
    return true
  }

  public togglePinMessage(conversationId: string, messageId: string): boolean {
    const list = this.messages.get(conversationId)
    if (!list) return false
    const target = list.find((m) => m.id === messageId)
    if (target) {
      target.is_pinned = !target.is_pinned
      this.saveToStorage()
      return true
    }
    return false
  }

  public createGroup(params: {
    title: string
    type?: ConversationType
    avatar?: string
    isLocked?: boolean
    pinnedNotice?: string
    participants?: string[]
    creatorName: string
  }): ChatConversation {
    const id = `group_${Date.now()}`
    const newGroup: ChatConversation = {
      id,
      title: params.title.startsWith('#') ? params.title : `#${params.title.toLowerCase().replace(/\s+/g, '-')}`,
      type: params.type || 'group',
      avatar:
        params.avatar ||
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=120&auto=format&fit=crop&q=80',
      is_locked: !!params.isLocked,
      pinned_notice: params.pinnedNotice || `Welcome to ${params.title}!`,
      last_message: `Channel created by ${params.creatorName}`,
      last_message_time: 'Just now',
      unread_count: 0,
      status: 'online'
    }

    this.conversations.set(id, newGroup)
    this.messages.set(id, [
      {
        id: `sys_${Date.now()}`,
        conversation_id: id,
        sender_id: 'system',
        sender_name: 'System',
        sender_role: 'system',
        text: `🎉 Channel "${params.title}" was established.`,
        type: 'system',
        status: 'read',
        created_at: new Date().toISOString()
      }
    ])

    this.saveToStorage()
    return newGroup
  }

  public reportMessage(report: Omit<ModerationReport, 'id' | 'created_at' | 'status'>): ModerationReport {
    const newReport: ModerationReport = {
      ...report,
      id: `rep_${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    this.reports.unshift(newReport)
    this.saveToStorage()
    return newReport
  }

  public getReports(): ModerationReport[] {
    return [...this.reports]
  }

  public resolveReport(reportId: string, action: string): boolean {
    const rep = this.reports.find((r) => r.id === reportId)
    if (rep) {
      rep.status = 'resolved'
      rep.action_taken = action
      this.saveToStorage()
      return true
    }
    return false
  }

  public blockUser(userId: string): boolean {
    this.blockedUserIds.add(userId)
    this.saveToStorage()
    return true
  }

  public unblockUser(userId: string): boolean {
    this.blockedUserIds.delete(userId)
    this.saveToStorage()
    return true
  }

  public isUserBlocked(userId: string): boolean {
    return this.blockedUserIds.has(userId)
  }

  public isUserMuted(userId: string): boolean {
    return this.mutedUserIds.has(userId)
  }

  public toggleMute(userId: string): boolean {
    if (this.mutedUserIds.has(userId)) {
      this.mutedUserIds.delete(userId)
    } else {
      this.mutedUserIds.add(userId)
    }
    this.saveToStorage()
    return this.mutedUserIds.has(userId)
  }

  public toggleBan(userId: string): boolean {
    if (this.blockedUserIds.has(userId)) {
      this.blockedUserIds.delete(userId)
    } else {
      this.blockedUserIds.add(userId)
    }
    this.saveToStorage()
    return this.blockedUserIds.has(userId)
  }

  public addStrike(userId: string): number {
    const current = this.userStrikes.get(userId) || 0
    const updated = current + 1
    this.userStrikes.set(userId, updated)
    this.saveToStorage()
    return updated
  }

  public getUserStrikes(userId: string): number {
    return this.userStrikes.get(userId) || 0
  }

  public toggleChannelLock(conversationId: string): boolean {
    const conv = this.conversations.get(conversationId)
    if (conv) {
      conv.is_locked = !conv.is_locked
      this.saveToStorage()
      return conv.is_locked
    }
    return false
  }

  public deleteConversation(conversationId: string): boolean {
    this.deletedConversationIds.add(conversationId)
    this.conversations.delete(conversationId)
    this.messages.delete(conversationId)
    this.saveToStorage()
    return true
  }

  public updateGroup(
    conversationId: string,
    updates: {
      title?: string
      pinnedNotice?: string
      isLocked?: boolean
      avatar?: string
    }
  ): ChatConversation | null {
    const conv = this.conversations.get(conversationId)
    if (!conv) return null

    if (updates.title !== undefined && updates.title.trim()) {
      let t = updates.title.trim()
      if (!t.startsWith('#') && (conv.type === 'channel' || conv.type === 'group')) {
        t = `#${t.replace(/\s+/g, '-').toLowerCase()}`
      }
      conv.title = t
    }
    if (updates.pinnedNotice !== undefined) {
      conv.pinned_notice = updates.pinnedNotice.trim()
    }
    if (updates.isLocked !== undefined) {
      conv.is_locked = updates.isLocked
    }
    if (updates.avatar !== undefined && updates.avatar) {
      conv.avatar = updates.avatar
    }
    conv.updated_at = new Date().toISOString()
    this.saveToStorage()
    return conv
  }

  public broadcastAnnouncement(params: {
    text: string
    target?: 'all' | 'cohorts' | 'faculty'
    adminName: string
    adminAvatar?: string
    adminId?: string
  }): boolean {
    const text = params.text.trim()
    if (!text) return false

    // 1. Post to conv_announcements
    const annMsg: ChatMessage = {
      id: `broadcast_${Date.now()}_ann`,
      conversation_id: 'conv_announcements',
      sender_id: params.adminId || 'admin_sys',
      sender_name: `${params.adminName} (Official Broadcast)`,
      sender_role: 'admin',
      sender_avatar: params.adminAvatar,
      text: `📢 ${text}`,
      type: 'text',
      is_pinned: true,
      status: 'delivered',
      created_at: new Date().toISOString()
    }
    this.addMessage(annMsg)

    // 2. Also post to relevant group conversations
    this.conversations.forEach((conv) => {
      if (conv.type === 'group' || conv.type === 'channel') {
        if (conv.id === 'conv_announcements') return
        const postMsg: ChatMessage = {
          id: `broadcast_${Date.now()}_${conv.id}`,
          conversation_id: conv.id,
          sender_id: params.adminId || 'admin_sys',
          sender_name: `${params.adminName} (Broadcast)`,
          sender_role: 'admin',
          sender_avatar: params.adminAvatar,
          text: `📢 ${text}`,
          type: 'text',
          is_pinned: true,
          status: 'delivered',
          created_at: new Date().toISOString()
        }
        this.addMessage(postMsg)
      }
    })

    this.saveToStorage()
    return true
  }

  public clearChat(conversationId: string): boolean {
    this.messages.set(conversationId, [])
    const conv = this.conversations.get(conversationId)
    if (conv) {
      conv.last_message = 'Chat history cleared'
      conv.unread_count = 0
    }
    this.saveToStorage()
    return true
  }

  public resetToDefaultDiscussions(): void {
    this.deletedConversationIds.clear()
    SYSTEM_CHANNELS.forEach((channel) => {
      this.conversations.set(channel.id, channel)
      this.messages.set(channel.id, [...(SEED_MESSAGES[channel.id] || [])])
    })
    this.saveToStorage()
  }
}
