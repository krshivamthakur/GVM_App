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
    id: 'conv_physics_cohort',
    title: '#pcm-class-11th',
    type: 'group',
    avatar: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=120&auto=format&fit=crop&q=80',
    is_locked: false,
    pinned_notice: '⚡ Weekly discussion thread for Physics problem sets, derivations, and labs.',
    last_message: 'Active',
    last_message_time: 'Active',
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
    last_message: 'Active',
    last_message_time: 'Active',
    unread_count: 0,
    status: 'online'
  },
  {
    id: 'conv_1789209625779',
    title: '#pcb-class-12th',
    type: 'group',
    avatar: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=120&auto=format&fit=crop&q=80',
    is_locked: false,
    pinned_notice: 'About class 12th stream pcb notification and class',
    last_message: 'Active',
    last_message_time: 'Active',
    unread_count: 0,
    status: 'online'
  }
]

export const SEED_MESSAGES: Record<string, ChatMessage[]> = {}

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

      const DEMO_MSG_IDS = new Set([
        'msg_ann_1',
        'msg_ann_2',
        'msg_phy_1',
        'msg_phy_2',
        'msg_jav_1',
        'msg_sup_1',
        'ann_1'
      ])

      const DEMO_CONV_IDS = new Set([
        'conv_announcements',
        'conv_java_guild',
        'group_announcements',
        'conv_1789192947216',
        'conv_1789313077873'
      ])

      for (const sourceKey of storageSources) {
        const rawStored = localStorage.getItem(sourceKey)
        if (!rawStored) continue

        try {
          const parsed = JSON.parse(rawStored)
          if (parsed.conversations) {
            parsed.conversations.forEach((c: ChatConversation) => {
              if (
                !this.deletedConversationIds.has(c.id) &&
                !DEMO_CONV_IDS.has(c.id) &&
                !this.conversations.has(c.id)
              ) {
                this.conversations.set(c.id, c)
              }
            })
          }
          if (parsed.messages) {
            Object.keys(parsed.messages).forEach((convId) => {
              if (this.deletedConversationIds.has(convId) || DEMO_CONV_IDS.has(convId)) return
              const rawMsgs = parsed.messages[convId] || []
              if (rawMsgs.length === 0) return

              // Strictly remove simulated and demo messages
              const cleanMsgs = rawMsgs.filter((m: ChatMessage) => {
                if (!m || !m.id || !m.text) return false
                if (DEMO_MSG_IDS.has(m.id) || m.id.startsWith('msg_rec_')) return false
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

      // Explicitly purge demo conversations and demo messages
      DEMO_CONV_IDS.forEach((dId) => {
        this.conversations.delete(dId)
        this.messages.delete(dId)
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

    // 5. Ensure group/channel conversations have participants initialized if empty
    if (profiles && profiles.length > 0) {
      Array.from(this.conversations.values()).forEach((c) => {
        if (c.type === 'group' || c.type === 'channel' || c.type === 'support') {
          if (!c.participants || c.participants.length === 0) {
            c.participants = profiles.map((p, idx) => ({
              id: `part_${c.id}_${p.id || idx}`,
              conversation_id: c.id,
              user_id: p.id,
              user_name: p.full_name || p.email.split('@')[0],
              user_role: p.role,
              user_avatar: p.avatar_url,
              user_email: p.email,
              role: p.role === 'admin' ? 'admin' : p.role === 'teacher' ? 'moderator' : 'member',
              is_muted: false,
              joined_at: p.created_at || new Date().toISOString()
            }))
          }
        }
      })
    }

    this.saveToStorage()
    return Array.from(this.conversations.values())
  }

  public getLatestTimestamp(conversationId: string): number {
    const msgs = this.messages.get(conversationId)
    if (msgs && msgs.length > 0) {
      for (let i = msgs.length - 1; i >= 0; i--) {
        const m = msgs[i]
        if (m && m.created_at) {
          const t = new Date(m.created_at).getTime()
          if (!isNaN(t) && t > 0) return t
        }
      }
    }
    const conv = this.conversations.get(conversationId)
    if (conv?.updated_at) {
      const t = new Date(conv.updated_at).getTime()
      if (!isNaN(t) && t > 0) return t
    }
    if (conv?.created_at) {
      const t = new Date(conv.created_at).getTime()
      if (!isNaN(t) && t > 0) return t
    }
    return 0
  }

  public getConversations(): ChatConversation[] {
    const list = Array.from(this.conversations.values())
    return list.sort((a, b) => {
      const timeA = this.getLatestTimestamp(a.id) || (a.updated_at ? new Date(a.updated_at).getTime() : 0)
      const timeB = this.getLatestTimestamp(b.id) || (b.updated_at ? new Date(b.updated_at).getTime() : 0)
      return timeB - timeA
    })
  }

  public markAsRead(conversationId: string): boolean {
    const conv = this.conversations.get(conversationId)
    if (conv) {
      if ((conv.unread_count || 0) > 0) {
        conv.unread_count = 0
        this.conversations.set(conversationId, conv)
        this.saveToStorage()
        return true
      }
    }
    return false
  }

  public getMessages(conversationId: string): ChatMessage[] {
    const list = this.messages.get(conversationId) || []
    return deduplicateMessagesList(list)
  }

  public addMessage(msg: ChatMessage, activeConversationId?: string): ChatMessage {
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

    // Update conversation last message snippet and timestamp
    const conv = this.conversations.get(msg.conversation_id)
    if (conv) {
      conv.last_message = msg.type === 'text' ? msg.text : `[${msg.type.toUpperCase()}] ${msg.media_name || 'Attachment'}`
      conv.last_message_time = 'Just now'
      conv.updated_at = msg.created_at || new Date().toISOString()
      if (activeConversationId === msg.conversation_id) {
        conv.unread_count = 0
      }
      this.conversations.set(msg.conversation_id, conv)
    }

    this.saveToStorage()
    return msg
  }

  public mergeServerMessages(
    data: ChatMessage[] | Record<string, ChatMessage[]>,
    options?: { activeConvId?: string; currentUserId?: string }
  ): boolean {
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

      let isNewMsg = false
      if (existingIdx === -1) {
        list.push(m)
        hasNew = true
        isNewMsg = true
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
        conv.updated_at = last.created_at || new Date().toISOString()

        if (options?.activeConvId && conv.id === options.activeConvId) {
          conv.unread_count = 0
        } else if (isNewMsg && options?.currentUserId && m.sender_id !== options.currentUserId) {
          conv.unread_count = (conv.unread_count || 0) + 1
        }
      }
    })

    if (hasNew) {
      this.saveToStorage()
    }
    return hasNew
  }

  /**
   * Merges server-side channel/group metadata (title, is_locked, pinned_notice) into
   * the local conversation store. This propagates admin changes globally to all views.
   * Returns true if any conversation was actually updated.
   */
  public mergeServerConversations(serverConvs: ChatConversation[]): boolean {
    if (!serverConvs) return false
    let hasChanges = false
    const serverConvIds = new Set(serverConvs.map((s) => s.id))

    // 1. Prune any group / channel / support conversation that was deleted from the server
    this.conversations.forEach((conv, id) => {
      if ((conv.type === 'group' || conv.type === 'channel' || conv.type === 'support') && !serverConvIds.has(id)) {
        this.conversations.delete(id)
        this.messages.delete(id)
        this.deletedConversationIds.add(id)
        hasChanges = true
      }
    })

    // 2. Insert or update server conversations
    serverConvs.forEach((serverConv) => {
      const local = this.conversations.get(serverConv.id)
      if (local) {
        // Only update metadata fields — never overwrite type, messages, or direct-chat data
        let changed = false
        if (serverConv.title && serverConv.title !== local.title) {
          local.title = serverConv.title
          changed = true
        }
        if (serverConv.is_locked !== undefined && serverConv.is_locked !== local.is_locked) {
          local.is_locked = serverConv.is_locked
          changed = true
        }
        if (serverConv.pinned_notice !== undefined && serverConv.pinned_notice !== local.pinned_notice) {
          local.pinned_notice = serverConv.pinned_notice
          changed = true
        }
        if (serverConv.avatar && serverConv.avatar !== local.avatar) {
          local.avatar = serverConv.avatar
          changed = true
        }
        if (changed) {
          local.updated_at = serverConv.updated_at || new Date().toISOString()
          this.conversations.set(serverConv.id, local)
          hasChanges = true
        }
      } else {
        // New conversation directly from database
        this.conversations.set(serverConv.id, {
          id: serverConv.id,
          title: serverConv.title,
          type: serverConv.type || 'group',
          avatar: serverConv.avatar || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=120&auto=format&fit=crop&q=80',
          is_locked: !!serverConv.is_locked,
          pinned_notice: serverConv.pinned_notice,
          last_message: serverConv.last_message || 'Active',
          last_message_time: serverConv.last_message_time || 'Active',
          unread_count: 0,
          created_at: serverConv.created_at,
          updated_at: serverConv.updated_at
        })
        hasChanges = true
      }
    })

    if (hasChanges) {
      this.saveToStorage()
    }
    return hasChanges
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

  // Group Member Management Methods
  public getGroupParticipants(conversationId: string): ChatParticipant[] {
    const conv = this.conversations.get(conversationId)
    return conv?.participants || []
  }

  public ensureGroupParticipants(conversationId: string, availableProfiles: Profile[]): ChatParticipant[] {
    const conv = this.conversations.get(conversationId)
    if (!conv) return []

    if (conv.participants && conv.participants.length > 0) {
      return conv.participants
    }

    const defaultParticipants: ChatParticipant[] = availableProfiles.map((p, idx) => ({
      id: `part_${conversationId}_${p.id || idx}`,
      conversation_id: conversationId,
      user_id: p.id,
      user_name: p.full_name || p.email.split('@')[0],
      user_role: p.role,
      user_avatar: p.avatar_url,
      user_email: p.email,
      role: p.role === 'admin' ? 'admin' : p.role === 'teacher' ? 'moderator' : 'member',
      is_muted: false,
      joined_at: p.created_at || new Date().toISOString()
    }))

    conv.participants = defaultParticipants
    this.saveToStorage()
    return defaultParticipants
  }

  public addGroupParticipant(
    conversationId: string,
    user: {
      id: string
      name: string
      email?: string
      role?: string
      avatar?: string | null
    },
    groupRole: 'admin' | 'moderator' | 'member' = 'member',
    addedByName?: string
  ): ChatParticipant | null {
    const conv = this.conversations.get(conversationId)
    if (!conv) return null

    if (!conv.participants) {
      conv.participants = []
    }

    if (conv.participants.some((p) => p.user_id === user.id)) {
      return null
    }

    const newParticipant: ChatParticipant = {
      id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversation_id: conversationId,
      user_id: user.id,
      user_name: user.name || user.email || 'Member',
      user_role: user.role || 'student',
      user_avatar: user.avatar,
      user_email: user.email,
      role: groupRole,
      is_muted: false,
      joined_at: new Date().toISOString()
    }

    conv.participants.push(newParticipant)
    conv.updated_at = new Date().toISOString()

    this.addMessage({
      id: `sys_join_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      conversation_id: conversationId,
      sender_id: 'system',
      sender_name: 'System',
      sender_role: 'system',
      text: `${addedByName ? `${addedByName} added ` : ''}${newParticipant.user_name} to the channel.`,
      type: 'system',
      status: 'read',
      created_at: new Date().toISOString()
    })

    this.saveToStorage()
    return newParticipant
  }

  public removeGroupParticipant(
    conversationId: string,
    userId: string,
    removedByName?: string
  ): boolean {
    const conv = this.conversations.get(conversationId)
    if (!conv || !conv.participants) return false

    const target = conv.participants.find((p) => p.user_id === userId)
    if (!target) return false

    conv.participants = conv.participants.filter((p) => p.user_id !== userId)
    conv.updated_at = new Date().toISOString()

    this.addMessage({
      id: `sys_leave_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      conversation_id: conversationId,
      sender_id: 'system',
      sender_name: 'System',
      sender_role: 'system',
      text: `${removedByName ? `${removedByName} removed ` : ''}${target.user_name} from the channel.`,
      type: 'system',
      status: 'read',
      created_at: new Date().toISOString()
    })

    this.saveToStorage()
    return true
  }

  public updateGroupParticipantRole(
    conversationId: string,
    userId: string,
    newRole: 'admin' | 'moderator' | 'member'
  ): boolean {
    const conv = this.conversations.get(conversationId)
    if (!conv || !conv.participants) return false

    const participant = conv.participants.find((p) => p.user_id === userId)
    if (!participant) return false

    participant.role = newRole
    conv.updated_at = new Date().toISOString()

    this.saveToStorage()
    return true
  }

  public toggleGroupParticipantMute(
    conversationId: string,
    userId: string
  ): boolean {
    const conv = this.conversations.get(conversationId)
    if (!conv || !conv.participants) return false

    const participant = conv.participants.find((p) => p.user_id === userId)
    if (!participant) return false

    participant.is_muted = !participant.is_muted
    conv.updated_at = new Date().toISOString()

    this.saveToStorage()
    return Boolean(participant.is_muted)
  }
}
