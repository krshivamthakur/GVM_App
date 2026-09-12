export type ConversationType = 'direct' | 'group' | 'channel' | 'support'

export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'system'

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended'

export type CallType = 'audio' | 'video'

export interface ChatReaction {
  emoji: string
  count: number
  users: string[] // User IDs who reacted
  hasReacted?: boolean
}

export interface ChatAttachment {
  url: string
  name: string
  size?: string
  type: string
  durationSeconds?: number
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_role?: 'admin' | 'teacher' | 'student' | 'support' | string
  sender_avatar?: string | null
  text: string
  type: MessageType
  media_url?: string
  media_name?: string
  media_size?: string
  media_type?: string
  duration_seconds?: number
  reply_to_id?: string
  reply_to_text?: string
  reply_to_sender?: string
  is_edited?: boolean
  is_deleted?: boolean
  is_pinned?: boolean
  status: MessageStatus
  reactions?: ChatReaction[]
  created_at: string
  updated_at?: string
  // UI helpers
  isSelf?: boolean
}

export interface ChatParticipant {
  id: string
  conversation_id: string
  user_id: string
  user_name: string
  user_role: string
  user_avatar?: string | null
  role: 'admin' | 'moderator' | 'member'
  is_muted?: boolean
  last_read_at?: string
  joined_at?: string
}

export interface ChatConversation {
  id: string
  title: string
  type: ConversationType
  avatar?: string | null
  created_by?: string
  is_archived?: boolean
  is_pinned?: boolean
  is_locked?: boolean // Only admins/moderators can send messages
  pinned_notice?: string
  last_message?: string
  last_message_time?: string
  unread_count?: number
  status?: 'online' | 'offline' | 'away'
  last_seen?: string
  other_user_id?: string
  other_user_role?: string
  other_user_name?: string
  participants?: ChatParticipant[]
  created_at?: string
  updated_at?: string
}

export interface ModerationReport {
  id: string
  message_id?: string
  message_text?: string
  reported_by: string
  reporter_name?: string
  reported_user_id: string
  reported_user_name?: string
  reason: 'spam' | 'harassment' | 'inappropriate' | 'academic_dishonesty' | 'other'
  notes?: string
  status: 'pending' | 'reviewed' | 'dismissed' | 'resolved'
  action_taken?: string
  created_at: string
}

export interface ActiveCallState {
  status: CallStatus
  type: CallType
  participantName: string
  participantAvatar?: string | null
  participantRole?: string
  durationSeconds: number
  isMuted: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
}
