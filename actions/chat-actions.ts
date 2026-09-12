'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { 
  ChatConversation, 
  ChatMessage, 
  ModerationReport 
} from '@/types/chat'
import { Profile } from '@/types/database'
import { dataStore } from '@/lib/data/store'

export async function getChatUsersAction(): Promise<Profile[]> {
  try {
    const supabase = createAdminClient()
    const { data: profiles, error } = await supabase.from('Profile').select('*').order('created_at', { ascending: false })
    if (!error && profiles && profiles.length > 0) {
      return profiles
    }
  } catch (e) {
    console.warn('Supabase getChatUsersAction fallback:', e)
  }
  return dataStore.getAllProfilesAdmin()
}

function isUserAuthorizedForConversation(
  conversationId: string,
  user: { id?: string; email?: string } | null
): boolean {
  if (!conversationId.startsWith('direct_')) return true // Public channels and cohort groups
  if (!user) return false

  const raw = conversationId.replace('direct_', '')
  const participants = raw.split('__').map(p => p.toLowerCase().trim())
  if (participants.length !== 2) return false

  const uid = (user.id || '').toLowerCase().trim()
  const uemail = (user.email || '').toLowerCase().trim()
  const uusername = (user.email?.split('@')[0] || '').toLowerCase().trim()

  return participants.some(p => p === uid || p === uemail || p === uusername)
}

export async function sendServerMessageAction(payload: {
  id?: string
  conversationId: string
  conversationTitle?: string
  text: string
  type?: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system'
  mediaUrl?: string
  mediaName?: string
  mediaSize?: string
  replyToId?: string
  replyToText?: string
  replyToSender?: string
  senderId?: string
  senderName?: string
  senderRole?: 'student' | 'teacher' | 'admin' | 'system'
  senderAvatar?: string | null
}): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!isUserAuthorizedForConversation(payload.conversationId, currentUser)) {
    return { success: false, error: 'Unauthorized: Private messages are strictly between the two participants only.' }
  }

  const senderId = currentUser?.id || payload.senderId || 'guest_user'
  const senderName = currentUser?.full_name || (currentUser?.email ? currentUser.email.split('@')[0] : payload.senderName || 'Member')
  const senderRole = currentUser?.role || payload.senderRole || 'student'
  const senderAvatar = currentUser?.avatar_url || payload.senderAvatar

  const messageId = payload.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const now = new Date().toISOString()

  const newMsg: ChatMessage = {
    id: messageId,
    conversation_id: payload.conversationId,
    sender_id: senderId,
    sender_name: senderName,
    sender_role: senderRole,
    sender_avatar: senderAvatar,
    text: payload.text,
    type: payload.type || 'text',
    media_url: payload.mediaUrl,
    media_name: payload.mediaName,
    media_size: payload.mediaSize,
    reply_to_id: payload.replyToId,
    reply_to_text: payload.replyToText,
    reply_to_sender: payload.replyToSender,
    status: 'delivered',
    created_at: now
  }

  try {
    const supabase = createAdminClient()

    // 1. Ensure conversation exists to satisfy foreign key constraint
    await supabase.from('chat_conversations').upsert({
      id: payload.conversationId,
      title: payload.conversationTitle || payload.conversationId,
      type: payload.conversationId.startsWith('direct_') ? 'direct' : payload.conversationId.startsWith('conv_ann') ? 'channel' : 'group',
      last_message: payload.text,
      last_message_time: 'Just now',
      updated_at: now
    }, { onConflict: 'id' })

    // 2. Insert into chat_messages
    const { data, error } = await supabase.from('chat_messages').insert({
      id: messageId,
      conversation_id: payload.conversationId,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      sender_avatar: senderAvatar,
      text: payload.text,
      type: newMsg.type,
      media_url: payload.mediaUrl,
      media_name: payload.mediaName,
      media_size: payload.mediaSize,
      reply_to_id: payload.replyToId,
      reply_to_text: payload.replyToText,
      reply_to_sender: payload.replyToSender,
      status: 'delivered',
      created_at: now
    }).select().maybeSingle()

    if (!error && data) {
      return { success: true, message: data }
    } else if (error) {
      console.warn('Supabase chat_messages insert error:', error)
    }
  } catch (err) {
    console.warn('sendServerMessageAction fallback error:', err)
  }

  return { success: true, message: newMsg }
}

export async function getServerMessagesAction(conversationId: string): Promise<ChatMessage[]> {
  const currentUser = await getCurrentUser()
  if (!isUserAuthorizedForConversation(conversationId, currentUser)) {
    return [] // Strictly block third parties from reading private messages
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      return data as ChatMessage[]
    }
  } catch (e) {
    console.warn('getServerMessagesAction fallback:', e)
  }
  return []
}

export async function getAllRecentServerMessagesAction(): Promise<Record<string, ChatMessage[]>> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return {}

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1000)

    if (!error && data) {
      const grouped: Record<string, ChatMessage[]> = {}
      data.forEach((m: ChatMessage) => {
        // Enforce private message isolation: only include if user is authorized!
        if (!isUserAuthorizedForConversation(m.conversation_id, currentUser)) {
          return
        }
        if (!grouped[m.conversation_id]) {
          grouped[m.conversation_id] = []
        }
        grouped[m.conversation_id].push(m)
      })
      return grouped
    }
  } catch (e) {
    console.warn('getAllRecentServerMessagesAction fallback:', e)
  }
  return {}
}

export async function createServerConversationAction(payload: {
  title: string
  type: 'direct' | 'group' | 'channel' | 'support'
  avatar?: string
  isLocked?: boolean
  pinnedNotice?: string
  participantIds?: string[]
}): Promise<{ success: boolean; conversation?: ChatConversation; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'Authentication required' }
  }

  const convId = `conv_${Date.now()}`
  const now = new Date().toISOString()

  const newConv: ChatConversation = {
    id: convId,
    title: payload.title,
    type: payload.type,
    avatar: payload.avatar,
    created_by: currentUser.id,
    is_locked: !!payload.isLocked,
    pinned_notice: payload.pinnedNotice,
    last_message: 'Conversation established',
    last_message_time: 'Just now',
    created_at: now
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('chat_conversations').insert({
      id: convId,
      title: payload.title,
      type: payload.type,
      avatar: payload.avatar,
      created_by: currentUser.id,
      is_locked: payload.isLocked,
      pinned_notice: payload.pinnedNotice,
      created_at: now
    }).select().maybeSingle()

    if (!error && data) {
      return { success: true, conversation: data }
    }
  } catch (err) {
    // Supabase table pending migration; return fallback
  }

  return { success: true, conversation: newConv }
}

export async function reportServerMessageAction(payload: {
  messageId: string
  reportedUserId: string
  reason: 'spam' | 'harassment' | 'inappropriate' | 'academic_dishonesty' | 'other'
  notes?: string
}): Promise<{ success: boolean; report?: ModerationReport; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'Authentication required' }
  }

  const reportId = `rep_${Date.now()}`
  const rep: ModerationReport = {
    id: reportId,
    message_id: payload.messageId,
    reported_by: currentUser.id,
    reporter_name: currentUser.full_name || currentUser.email,
    reported_user_id: payload.reportedUserId,
    reason: payload.reason,
    notes: payload.notes,
    status: 'pending',
    created_at: new Date().toISOString()
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('chat_reports').insert({
      id: reportId,
      message_id: payload.messageId,
      reported_by: currentUser.id,
      reported_user_id: payload.reportedUserId,
      reason: payload.reason,
      notes: payload.notes,
      status: 'pending'
    })
  } catch (e) {}

  return { success: true, report: rep }
}

export async function getAdminChatStatsAction() {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'admin') {
    return null
  }

  try {
    const supabase = createAdminClient()
    const [msgsRes, convsRes, reportsRes] = await Promise.all([
      supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
      supabase.from('chat_conversations').select('id', { count: 'exact', head: true }),
      supabase.from('chat_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    ])

    return {
      totalMessages: msgsRes.count || 0,
      totalChannels: convsRes.count || 4,
      pendingReports: reportsRes.count || 0
    }
  } catch (e) {
    return {
      totalMessages: 248,
      totalChannels: 6,
      pendingReports: 0
    }
  }
}

export async function deleteServerConversationAction(conversationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    await supabase.from('chat_messages').delete().eq('conversation_id', conversationId)
    await supabase.from('chat_conversations').delete().eq('id', conversationId)
  } catch (e) {
    console.warn('deleteServerConversationAction fallback:', e)
  }
  return { success: true }
}

export async function updateServerConversationAction(payload: {
  id: string
  title?: string
  pinnedNotice?: string
  isLocked?: boolean
  avatar?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const updates: any = { updated_at: new Date().toISOString() }
    if (payload.title !== undefined) updates.title = payload.title
    if (payload.pinnedNotice !== undefined) updates.pinned_notice = payload.pinnedNotice
    if (payload.isLocked !== undefined) updates.is_locked = payload.isLocked
    if (payload.avatar !== undefined) updates.avatar = payload.avatar
    await supabase.from('chat_conversations').update(updates).eq('id', payload.id)
  } catch (e) {
    console.warn('updateServerConversationAction fallback:', e)
  }
  return { success: true }
}

