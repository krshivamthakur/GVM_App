'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Profile } from '@/types/database'
import { 
  ChatConversation, 
  ChatMessage, 
  ConversationType,
  ActiveCallState 
} from '@/types/chat'
import { ChatStateManager, SYSTEM_CHANNELS } from '@/lib/chat/chat-store'
import { 
  sendServerMessageAction, 
  getChatUsersAction, 
  getServerMessagesAction, 
  getAllRecentServerMessagesAction,
  deleteServerConversationAction,
  updateServerConversationAction,
  createServerConversationAction
} from '@/actions/chat-actions'
import { formatDisplayDate, formatImageUrl } from '@/lib/utils'
import {
  MessageSquare,
  Users,
  Search,
  Send,
  Paperclip,
  Smile,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Phone,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  MoreVertical,
  Reply,
  Copy,
  Edit2,
  Trash2,
  Pin,
  Flag,
  UserX,
  UserCheck,
  Download,
  FileText,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Volume2,
  VolumeX,
  X,
  Plus,
  ArrowLeft,
  Share2,
  FileDown,
  Lock,
  Unlock,
  Radio,
  Clock,
  ExternalLink,
  Play,
  Pause,
  Maximize2,
  RotateCcw,
  Settings,
  Sliders,
  AlertTriangle
} from 'lucide-react'

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '👏', '💡', '😂', '🎉', '🚀']

interface UnifiedChatEngineProps {
  portalRole: 'student' | 'teacher' | 'admin'
  initialUsers?: Profile[]
  customTitle?: string
  customSubtitle?: string
  initialActiveConvId?: string
}

export function UnifiedChatEngine({
  portalRole,
  initialUsers = [],
  customTitle,
  customSubtitle,
  initialActiveConvId
}: UnifiedChatEngineProps) {
  const { user } = useAuth()
  const chatStore = useMemo(() => ChatStateManager.getInstance(), [])

  // State
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string>(initialActiveConvId || 'conv_announcements')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [filterTab, setFilterTab] = useState<'all' | 'direct' | 'groups' | 'support'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [messageSearch, setMessageSearch] = useState('')
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMobileList, setShowMobileList] = useState(true)

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [voiceSeconds, setVoiceSeconds] = useState(0)
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Media preview lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState<ChatMessage | null>(null)
  const [reportReason, setReportReason] = useState<'spam' | 'harassment' | 'inappropriate' | 'academic_dishonesty' | 'other'>('inappropriate')
  const [reportNotes, setReportNotes] = useState('')

  // Manage Group Modal state
  const [showManageGroupModal, setShowManageGroupModal] = useState(false)
  const [manageGroupTarget, setManageGroupTarget] = useState<ChatConversation | null>(null)
  const [manageGroupTitle, setManageGroupTitle] = useState('')
  const [manageGroupNotice, setManageGroupNotice] = useState('')
  const [manageGroupIsLocked, setManageGroupIsLocked] = useState(false)
  const [manageGroupAvatar, setManageGroupAvatar] = useState('')

  // Delete Group Confirm Modal state
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState<ChatConversation | null>(null)

  // New Group Form
  const [newGroupTitle, setNewGroupTitle] = useState('')
  const [newGroupNotice, setNewGroupNotice] = useState('')
  const [newGroupIsLocked, setNewGroupIsLocked] = useState(false)

  // Call Simulation State
  const [callState, setCallState] = useState<ActiveCallState | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Action Menu Popover per message
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Audio Playback simulation state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)

  // 1. Initialize & sync conversations with profiles and fetch recent server messages
  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      const list = chatStore.syncWithProfiles(initialUsers, user?.id, user?.email)
      setConversations(list)
      if (list.length > 0 && !list.find((c) => c.id === activeConvId)) {
        setActiveConvId(list[0].id)
      }
    } else {
      getChatUsersAction()
        .then((fetchedUsers) => {
          if (fetchedUsers && fetchedUsers.length > 0) {
            const list = chatStore.syncWithProfiles(fetchedUsers, user?.id, user?.email)
            setConversations(list)
            if (list.length > 0 && !list.find((c) => c.id === activeConvId)) {
              setActiveConvId(list[0].id)
            }
          }
        })
        .catch(() => {})
    }

    // Load recent messages across all channels from database
    getAllRecentServerMessagesAction()
      .then((grouped) => {
        if (grouped && Object.keys(grouped).length > 0) {
          const hasNew = chatStore.mergeServerMessages(grouped)
          if (hasNew) {
            setConversations([...chatStore.getConversations()])
            if (activeConvId) {
              setMessages([...chatStore.getMessages(activeConvId)])
            }
          }
        }
      })
      .catch(() => {})
  }, [initialUsers, user?.id, user?.email, chatStore, activeConvId])

  // 2. Load messages whenever activeConvId changes and poll for remote updates
  useEffect(() => {
    if (!activeConvId) return

    // Immediately load from local store
    const localMsgs = chatStore.getMessages(activeConvId)
    setMessages(localMsgs)
    scrollToBottom()

    // Fetch latest messages from database
    getServerMessagesAction(activeConvId)
      .then((serverMsgs) => {
        if (serverMsgs && serverMsgs.length > 0) {
          const hasNew = chatStore.mergeServerMessages(serverMsgs)
          if (hasNew) {
            setMessages([...chatStore.getMessages(activeConvId)])
            setConversations([...chatStore.getConversations()])
            scrollToBottom()
          }
        }
      })
      .catch(() => {})

    // Active live polling every 2 seconds for cross-user/cross-device delivery
    const pollTimer = setInterval(() => {
      getServerMessagesAction(activeConvId)
        .then((serverMsgs) => {
          if (serverMsgs && serverMsgs.length > 0) {
            const hasNew = chatStore.mergeServerMessages(serverMsgs)
            if (hasNew) {
              setMessages([...chatStore.getMessages(activeConvId)])
              setConversations([...chatStore.getConversations()])
              scrollToBottom()
            }
          }
        })
        .catch(() => {})
    }, 2000)

    return () => clearInterval(pollTimer)
  }, [activeConvId, chatStore])

  // 3. Real-time live synchronization across accounts & browser windows
  useEffect(() => {
    const handleSync = () => {
      setConversations([...chatStore.getConversations()])
      if (activeConvId) {
        setMessages([...chatStore.getMessages(activeConvId)])
      }
    }

    window.addEventListener('storage', handleSync)
    window.addEventListener('gvm_chat_updated', handleSync)
    window.addEventListener('gvm_chat_update', handleSync)
    return () => {
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('gvm_chat_updated', handleSync)
      window.removeEventListener('gvm_chat_update', handleSync)
    }
  }, [activeConvId, chatStore])

  useEffect(() => {
    if (initialActiveConvId) {
      setActiveConvId(initialActiveConvId)
    }
  }, [initialActiveConvId])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
  }

  // Active conversation object
  const currentConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || conversations[0]
  }, [conversations, activeConvId])

  // Filtered conversations with strict contact deduplication
  const filteredConversations = useMemo(() => {
    const seenDirectTargets = new Set<string>()

    return conversations.filter((c) => {
      // Exclude self user in direct chats
      if (c.type === 'direct') {
        if (user?.id && c.other_user_id === user.id) return false
        if (user?.email && (c.other_user_name?.toLowerCase() === user.email.toLowerCase() || c.title?.toLowerCase() === user.email.split('@')[0].toLowerCase())) return false

        // Secondary deduplication guard: never render two direct chats for the same contact
        const targetIdentifier = (c.other_user_id || c.other_user_name || c.title || '').toLowerCase().trim()
        if (targetIdentifier && seenDirectTargets.has(targetIdentifier)) {
          return false
        }
        if (targetIdentifier) {
          seenDirectTargets.add(targetIdentifier)
        }
      }

      // Tab filter
      if (filterTab === 'direct' && c.type !== 'direct') return false
      if (filterTab === 'groups' && c.type !== 'group' && c.type !== 'channel') return false
      if (filterTab === 'support' && c.type !== 'support') return false

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const titleMatch = c.title.toLowerCase().includes(query)
        const lastMsgMatch = c.last_message?.toLowerCase().includes(query)
        if (!titleMatch && !lastMsgMatch) return false
      }
      return true
    })
  }, [conversations, filterTab, searchQuery, user?.id, user?.email])

  // Filtered and deduplicated messages in current chat
  const displayedMessages = useMemo(() => {
    let source = messages
    if (messageSearch.trim()) {
      const q = messageSearch.toLowerCase()
      source = messages.filter((m) => m.text.toLowerCase().includes(q) || m.sender_name.toLowerCase().includes(q))
    }

    // Comprehensive deduplication filter so no duplicate message is ever rendered
    const seen = new Set<string>()
    const deduped: ChatMessage[] = []
    source.forEach((m) => {
      if (!m || !m.id || seen.has(m.id)) return
      const mTime = new Date(m.created_at).getTime()
      const isDup = deduped.some((prev) => {
        if (prev.id === m.id) return true
        const sameSender = prev.sender_id === m.sender_id || prev.sender_name === m.sender_name
        const sameText = (prev.text || '').trim() === (m.text || '').trim()
        const sameType = prev.type === m.type
        const closeTime = !isNaN(mTime) && !isNaN(new Date(prev.created_at).getTime())
          ? Math.abs(new Date(prev.created_at).getTime() - mTime) < 30000
          : false
        return sameSender && sameText && sameType && closeTime
      })
      if (!isDup) {
        seen.add(m.id)
        deduped.push(m)
      }
    })
    return deduped
  }, [messages, messageSearch])

  // Is current chat locked for non-admins
  const isChatLocked = useMemo(() => {
    if (!currentConversation) return false
    if (currentConversation.is_locked && portalRole !== 'admin') return true
    return false
  }, [currentConversation, portalRole])

  // Is user restricted by administrator (muted or blocked)
  const isUserRestricted = useMemo(() => {
    if (!user?.id) return false
    return chatStore.isUserBlocked(user.id) || chatStore.isUserMuted(user.id)
  }, [user?.id, chatStore])

  // Handle Send Text Message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isUserRestricted) {
      alert('Your account is currently restricted from sending messages by administrator.')
      return
    }
    if (!inputText.trim() && !editingMessage) return
    if (!currentConversation) return

    if (editingMessage) {
      chatStore.editMessage(currentConversation.id, editingMessage.id, inputText)
      setMessages([...chatStore.getMessages(currentConversation.id)])
      setEditingMessage(null)
      setInputText('')
      return
    }

    const currentUserName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Member')
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversation_id: currentConversation.id,
      sender_id: user?.id || 'guest_user',
      sender_name: currentUserName,
      sender_role: portalRole,
      sender_avatar: user?.avatar_url,
      text: inputText.trim(),
      type: 'text',
      reply_to_id: replyingTo?.id,
      reply_to_text: replyingTo?.text,
      reply_to_sender: replyingTo?.sender_name,
      status: 'delivered',
      created_at: new Date().toISOString()
    }

    chatStore.addMessage(newMsg)
    setMessages([...chatStore.getMessages(currentConversation.id)])
    setConversations([...chatStore.getConversations()])
    setInputText('')
    setReplyingTo(null)
    setShowEmojiPicker(false)
    scrollToBottom()

    // Sync with Supabase backend for cross-user/cross-device delivery using exact same message ID
    sendServerMessageAction({
      id: newMsg.id,
      conversationId: currentConversation.id,
      conversationTitle: currentConversation.title,
      text: newMsg.text,
      type: 'text',
      replyToId: replyingTo?.id,
      replyToText: replyingTo?.text,
      replyToSender: replyingTo?.sender_name,
      senderId: user?.id,
      senderName: currentUserName,
      senderRole: portalRole,
      senderAvatar: user?.avatar_url || undefined
    }).then((res) => {
      if (res?.message) {
        chatStore.mergeServerMessages([res.message])
        setMessages([...chatStore.getMessages(currentConversation.id)])
      }
    }).catch((err) => {
      console.warn('sendServerMessageAction error:', err)
    })
  }

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentConversation) return

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds maximum limit of 15MB')
      return
    }

    const isImg = file.type.startsWith('image/')
    const isDoc = file.type.includes('pdf') || file.type.includes('document') || file.name.endsWith('.pdf') || file.name.endsWith('.docx')

    // Create object URL for local preview
    const objectUrl = URL.createObjectURL(file)
    const formattedSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`

    const currentUserName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Member')
    const attachmentMsg: ChatMessage = {
      id: `msg_file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversation_id: currentConversation.id,
      sender_id: user?.id || 'guest_user',
      sender_name: currentUserName,
      sender_role: portalRole,
      sender_avatar: user?.avatar_url,
      text: isImg ? 'Shared an image' : `Shared file: ${file.name}`,
      type: isImg ? 'image' : 'file',
      media_url: objectUrl,
      media_name: file.name,
      media_size: formattedSize,
      media_type: file.type,
      status: 'delivered',
      created_at: new Date().toISOString()
    }

    chatStore.addMessage(attachmentMsg)
    setMessages([...chatStore.getMessages(currentConversation.id)])
    setConversations([...chatStore.getConversations()])
    scrollToBottom()
    if (fileInputRef.current) fileInputRef.current.value = ''

    sendServerMessageAction({
      id: attachmentMsg.id,
      conversationId: currentConversation.id,
      conversationTitle: currentConversation.title,
      text: attachmentMsg.text,
      type: attachmentMsg.type,
      mediaUrl: attachmentMsg.media_url,
      mediaName: attachmentMsg.media_name,
      mediaSize: attachmentMsg.media_size,
      senderId: user?.id,
      senderName: currentUserName,
      senderRole: portalRole,
      senderAvatar: user?.avatar_url || undefined
    }).catch((err) => {
      console.warn('sendServerMessageAction attachment error:', err)
    })
  }

  // Voice Memo Recording
  const startVoiceRecording = () => {
    setIsRecordingVoice(true)
    setVoiceSeconds(0)
    voiceTimerRef.current = setInterval(() => {
      setVoiceSeconds((sec) => sec + 1)
    }, 1000)
  }

  const cancelVoiceRecording = () => {
    setIsRecordingVoice(false)
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current)
    setVoiceSeconds(0)
  }

  const sendVoiceMemo = () => {
    if (!currentConversation) return
    setIsRecordingVoice(false)
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current)

    const currentUserName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Member')
    const voiceMsg: ChatMessage = {
      id: `msg_voice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversation_id: currentConversation.id,
      sender_id: user?.id || 'guest_user',
      sender_name: currentUserName,
      sender_role: portalRole,
      sender_avatar: user?.avatar_url,
      text: 'Voice Memo',
      type: 'audio',
      duration_seconds: Math.max(voiceSeconds, 2),
      status: 'delivered',
      created_at: new Date().toISOString()
    }

    chatStore.addMessage(voiceMsg)
    setMessages([...chatStore.getMessages(currentConversation.id)])
    setConversations([...chatStore.getConversations()])
    setVoiceSeconds(0)
    scrollToBottom()

    sendServerMessageAction({
      id: voiceMsg.id,
      conversationId: currentConversation.id,
      conversationTitle: currentConversation.title,
      text: voiceMsg.text,
      type: 'audio',
      senderId: user?.id,
      senderName: currentUserName,
      senderRole: portalRole,
      senderAvatar: user?.avatar_url || undefined
    }).catch((err) => {
      console.warn('sendServerMessageAction voice error:', err)
    })
  }

  // Reaction toggle
  const handleToggleReaction = (msgId: string, emoji: string) => {
    if (!currentConversation) return
    const userId = user?.id || 'self'
    chatStore.toggleReaction(currentConversation.id, msgId, emoji, userId)
    setMessages([...chatStore.getMessages(currentConversation.id)])
    setActiveMenuMsgId(null)
  }

  // Delete message
  const handleDeleteMessage = (msgId: string) => {
    if (!currentConversation) return
    if (confirm('Delete this message?')) {
      chatStore.deleteMessage(currentConversation.id, msgId)
      setMessages([...chatStore.getMessages(currentConversation.id)])
      setActiveMenuMsgId(null)
    }
  }

  // Pin message
  const handleTogglePin = (msgId: string) => {
    if (!currentConversation) return
    chatStore.togglePinMessage(currentConversation.id, msgId)
    setMessages([...chatStore.getMessages(currentConversation.id)])
    setActiveMenuMsgId(null)
  }

  // Copy message
  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
    setActiveMenuMsgId(null)
  }

  // Report message
  const handleReportMessage = () => {
    if (!showReportModal) return
    chatStore.reportMessage({
      message_id: showReportModal.id,
      message_text: showReportModal.text,
      reported_by: user?.id || 'anon',
      reporter_name: user?.full_name || user?.email || 'Anonymous',
      reported_user_id: showReportModal.sender_id,
      reported_user_name: showReportModal.sender_name,
      reason: reportReason,
      notes: reportNotes
    })
    alert('Thank you. This message has been flagged for administrative review.')
    setShowReportModal(null)
    setReportNotes('')
  }

  // Create New Group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupTitle.trim()) return

    const newGroup = chatStore.createGroup({
      title: newGroupTitle.trim(),
      isLocked: newGroupIsLocked,
      pinnedNotice: newGroupNotice.trim() || undefined,
      creatorName: user?.full_name || user?.email || 'Instructor'
    })

    createServerConversationAction({
      title: newGroup.title,
      type: 'group',
      avatar: newGroup.avatar || undefined,
      isLocked: newGroup.is_locked,
      pinnedNotice: newGroup.pinned_notice
    }).catch(() => {})

    setConversations(chatStore.getConversations())
    setActiveConvId(newGroup.id)
    setShowCreateGroupModal(false)
    setNewGroupTitle('')
    setNewGroupNotice('')
    setNewGroupIsLocked(false)
  }

  // Open Manage Group Modal
  const openManageGroup = (convToManage?: ChatConversation) => {
    const target = convToManage || currentConversation
    if (!target) return
    setManageGroupTarget(target)
    setManageGroupTitle(target.title.replace(/^#/, ''))
    setManageGroupNotice(target.pinned_notice || '')
    setManageGroupIsLocked(Boolean(target.is_locked))
    setManageGroupAvatar(target.avatar || '')
    setShowManageGroupModal(true)
  }

  // Save Manage Group Changes
  const handleSaveManageGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manageGroupTarget) return
    if (!manageGroupTitle.trim()) return

    const updatedConv = chatStore.updateGroup(manageGroupTarget.id, {
      title: manageGroupTitle.trim(),
      pinnedNotice: manageGroupNotice.trim(),
      isLocked: manageGroupIsLocked,
      avatar: manageGroupAvatar || undefined
    })

    if (updatedConv) {
      setConversations([...chatStore.getConversations()])
      updateServerConversationAction({
        id: manageGroupTarget.id,
        title: updatedConv.title,
        pinnedNotice: updatedConv.pinned_notice,
        isLocked: updatedConv.is_locked,
        avatar: updatedConv.avatar || undefined
      }).catch(() => {})
    }

    setShowManageGroupModal(false)
    setManageGroupTarget(null)
  }

  // Delete Group Action
  const handleConfirmDeleteGroup = (convToDelete: ChatConversation) => {
    chatStore.deleteConversation(convToDelete.id)
    deleteServerConversationAction(convToDelete.id).catch(() => {})

    const remaining = chatStore.getConversations()
    setConversations([...remaining])

    if (activeConvId === convToDelete.id) {
      const nextActive = remaining.find((c) => c.id !== convToDelete.id)
      if (nextActive) {
        setActiveConvId(nextActive.id)
      } else {
        setActiveConvId('')
      }
    }

    setShowDeleteGroupModal(null)
    setShowManageGroupModal(false)
    setManageGroupTarget(null)
  }

  // Start Call Simulation (Audio or Video)
  const startCall = (type: 'audio' | 'video') => {
    if (!currentConversation) return
    setCallState({
      status: 'calling',
      type,
      participantName: currentConversation.title,
      participantAvatar: currentConversation.avatar || undefined,
      participantRole: currentConversation.other_user_role || 'Mentor',
      durationSeconds: 0,
      isMuted: false,
      isVideoEnabled: type === 'video',
      isScreenSharing: false
    })

    // Simulate connection after 2 seconds
    setTimeout(() => {
      setCallState((prev) => (prev ? { ...prev, status: 'connected' } : null))
      callTimerRef.current = setInterval(() => {
        setCallState((prev) => (prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null))
      }, 1000)
    }, 2000)
  }

  const endCall = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current)
    setCallState(null)
  }

  // Export Chat
  const handleExportChat = () => {
    if (!currentConversation) return
    const lines = [
      `GVM EduLMS Chat Transcript`,
      `Conversation: ${currentConversation.title}`,
      `Exported on: ${new Date().toLocaleString()}`,
      `------------------------------------------\n`
    ]
    messages.forEach((m) => {
      lines.push(`[${new Date(m.created_at).toLocaleTimeString()}] ${m.sender_name}: ${m.text}`)
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-export-${currentConversation.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[580px] max-h-[860px] rounded-2xl border border-border bg-card shadow-sm overflow-hidden text-card-foreground">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.zip,.mp3"
      />

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* =========================================================================
            LEFT COLUMN: CONVERSATION LIST & SEARCH SIDEBAR
        ========================================================================= */}
        <aside
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-border bg-muted/20 ${
            showMobileList ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Sidebar Top Header */}
          <div className="p-3.5 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm tracking-tight">
                    {customTitle || 'Live Messaging'}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {portalRole === 'admin'
                      ? 'Community & Governance'
                      : portalRole === 'teacher'
                      ? 'Student Cohorts & Mentorship'
                      : 'Mentors & Study Circles'}
                  </p>
                </div>
              </div>

              {/* New Group / Channel Button */}
              {(portalRole === 'admin' || portalRole === 'teacher') && (
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  title="Create New Channel or Study Group"
                  className="p-1.5 rounded-lg border border-border hover:bg-primary/10 hover:text-primary transition-colors text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">New Group</span>
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats, mentors, cohorts..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Tab Filters */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 text-[11px] font-medium">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1 rounded-lg text-center transition-all ${
                  filterTab === 'all'
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterTab('direct')}
                className={`flex-1 py-1 rounded-lg text-center transition-all ${
                  filterTab === 'direct'
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Direct
              </button>
              <button
                onClick={() => setFilterTab('groups')}
                className={`flex-1 py-1 rounded-lg text-center transition-all ${
                  filterTab === 'groups'
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Groups
              </button>
              <button
                onClick={() => setFilterTab('support')}
                className={`flex-1 py-1 rounded-lg text-center transition-all ${
                  filterTab === 'support'
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Support
              </button>
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No matching conversations found.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConvId
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id)
                      setShowMobileList(false)
                    }}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-colors relative group ${
                      isActive
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {/* Avatar & Online Dot */}
                    <div className="relative shrink-0">
                      <img
                        src={formatImageUrl(
                          conv.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
                        )}
                        alt={conv.title}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                      {conv.status === 'online' && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs text-foreground truncate flex items-center gap-1">
                          {conv.is_locked && <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                          <span>{conv.title}</span>
                        </h4>
                        <div className="flex items-center gap-1">
                          {(portalRole === 'admin' || portalRole === 'teacher') && conv.type !== 'direct' && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openManageGroup(conv)
                                }}
                                title="Manage Group"
                                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <Settings className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowDeleteGroupModal(conv)
                                }}
                                title="Delete Group"
                                className="p-1 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <span className="text-[10px] text-muted-foreground shrink-0 group-hover:hidden">
                            {conv.last_message_time || 'Active'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {conv.last_message || 'Start conversation...'}
                        </p>
                        {conv.unread_count && conv.unread_count > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                            {conv.unread_count}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* =========================================================================
            RIGHT COLUMN: ACTIVE CHAT CONVERSATION STREAM & INPUT
        ========================================================================= */}
        <main
          className={`flex-1 flex flex-col bg-background ${
            !showMobileList ? 'flex' : 'hidden md:flex'
          }`}
        >
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:px-4 border-b border-border flex items-center justify-between bg-card/60 backdrop-blur-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <img
                    src={formatImageUrl(
                      currentConversation.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
                    )}
                    alt={currentConversation.title}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-xs sm:text-sm text-foreground truncate">
                        {currentConversation.title}
                      </h3>
                      {currentConversation.other_user_role && (
                        <span className="px-1.5 py-0.2 rounded-md bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">
                          {currentConversation.other_user_role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{currentConversation.status === 'online' ? 'Active Now' : 'Last seen recently'}</span>
                      {currentConversation.type !== 'direct' && <span>• Study Group</span>}
                    </div>
                  </div>
                </div>

                {/* Right Call & Header Action Toolbar */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {/* Manage Group Button (Admins & Teachers) */}
                  {(portalRole === 'admin' || portalRole === 'teacher') && currentConversation.type !== 'direct' && (
                    <button
                      onClick={() => openManageGroup(currentConversation)}
                      title="Manage Group Settings & Permissions"
                      className="px-2.5 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">Manage</span>
                    </button>
                  )}

                  {/* Delete Group Button (Admins & Teachers) */}
                  {(portalRole === 'admin' || portalRole === 'teacher') && currentConversation.type !== 'direct' && (
                    <button
                      onClick={() => setShowDeleteGroupModal(currentConversation)}
                      title="Delete Chat Group"
                      className="px-2.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">Delete</span>
                    </button>
                  )}

                  {/* Audio Call Button */}
                  <button
                    onClick={() => startCall('audio')}
                    title="Start Audio Call Consultation"
                    className="p-2 rounded-xl border border-border hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  {/* Video Call Button */}
                  <button
                    onClick={() => startCall('video')}
                    title="Start Video Meeting"
                    className="p-2 rounded-xl border border-border hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/30 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                  </button>

                  {/* Export Transcript */}
                  <button
                    onClick={handleExportChat}
                    title="Export Chat Transcript"
                    className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>

                  {/* Restore Default Discussions */}
                  <button
                    onClick={() => {
                      if (confirm('Restore sample discussions and cohort messages?')) {
                        chatStore.resetToDefaultDiscussions()
                        setConversations([...chatStore.getConversations()])
                        if (activeConvId) {
                          setMessages([...chatStore.getMessages(activeConvId)])
                        }
                      }
                    }}
                    title="Restore Sample Discussions"
                    className="p-2 rounded-xl border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Clear Chat */}
                  <button
                    onClick={() => {
                      if (confirm('Clear chat history for this conversation?')) {
                        chatStore.clearChat(currentConversation.id)
                        setMessages([])
                      }
                    }}
                    title="Clear Chat History"
                    className="p-2 rounded-xl border border-border hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pinned Notice Announcement Banner */}
              {currentConversation.pinned_notice && (
                <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <Pin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-medium truncate">{currentConversation.pinned_notice}</span>
                  </div>
                </div>
              )}

              {/* =============================================================
                  CHAT MESSAGES STREAM
              ============================================================= */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                {displayedMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm">Conversation Initiated</h4>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Send a message, attach lecture notes, share code snippets, or start a voice consultation.
                    </p>
                  </div>
                ) : (
                  displayedMessages.map((msg) => {
                    const isSelf = Boolean(
                      (user?.id && msg.sender_id === user.id) ||
                      (user?.email && (msg.sender_id === user.email || (msg.sender_name && msg.sender_name.toLowerCase() === user.email.toLowerCase()))) ||
                      (user?.full_name && msg.sender_name === user.full_name)
                    )
                    const isPinned = msg.is_pinned

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        {/* Sender Label for Group chats */}
                        {!isSelf && (
                          <div className="flex items-center gap-1.5 ml-1 mb-1 text-[11px] text-muted-foreground font-semibold">
                            <span>{msg.sender_name}</span>
                            {msg.sender_role && (
                              <span className="text-[9px] px-1 rounded bg-muted uppercase tracking-wider font-bold">
                                {msg.sender_role}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Message Bubble Container */}
                        <div className="relative max-w-[85%] sm:max-w-md group/bubble">
                          {/* Hover Action Toolbar */}
                          <div
                            className={`absolute -top-7 ${
                              isSelf ? 'right-0' : 'left-0'
                            } opacity-0 group-hover/bubble:opacity-100 transition-opacity bg-card border border-border shadow-md rounded-lg px-1.5 py-0.5 flex items-center gap-1 z-10`}
                          >
                            {/* Quick Emoji Reactions */}
                            {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className="text-xs hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}

                            <div className="h-3 w-px bg-border mx-0.5" />

                            <button
                              onClick={() => setReplyingTo(msg)}
                              title="Reply"
                              className="p-1 hover:text-primary transition-colors"
                            >
                              <Reply className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => handleCopyMessage(msg.text)}
                              title="Copy Text"
                              className="p-1 hover:text-primary transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => handleTogglePin(msg.id)}
                              title={isPinned ? 'Unpin message' : 'Pin message'}
                              className="p-1 hover:text-amber-500 transition-colors"
                            >
                              <Pin className="w-3 h-3" />
                            </button>

                            {!isSelf && (
                              <button
                                onClick={() => setShowReportModal(msg)}
                                title="Report Message"
                                className="p-1 hover:text-rose-500 transition-colors"
                              >
                                <Flag className="w-3 h-3" />
                              </button>
                            )}

                            {isSelf && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingMessage(msg)
                                    setInputText(msg.text)
                                  }}
                                  title="Edit"
                                  className="p-1 hover:text-primary transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  title="Delete"
                                  className="p-1 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Replying quote badge */}
                          {msg.reply_to_text && (
                            <div className="mb-1 p-1.5 rounded-lg bg-black/10 dark:bg-white/10 text-[11px] border-l-2 border-primary truncate">
                              <span className="font-bold opacity-80">{msg.reply_to_sender || 'Reply'}: </span>
                              <span className="italic">{msg.reply_to_text}</span>
                            </div>
                          )}

                          {/* Bubble Content */}
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isSelf
                                ? 'bg-primary text-primary-foreground rounded-br-xs'
                                : 'bg-card border border-border text-foreground rounded-bl-xs'
                            }`}
                          >
                            {/* Pinned Marker */}
                            {isPinned && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mb-1">
                                <Pin className="w-2.5 h-2.5" />
                                <span>Pinned Message</span>
                              </div>
                            )}

                            {/* Image Attachment */}
                            {msg.type === 'image' && msg.media_url && (
                              <div
                                onClick={() => setLightboxImage(msg.media_url!)}
                                className="mb-2 rounded-xl overflow-hidden cursor-pointer border border-black/10 relative group/img"
                              >
                                <img
                                  src={formatImageUrl(msg.media_url)}
                                  alt={msg.media_name || 'Attached image'}
                                  referrerPolicy="no-referrer"
                                  className="max-h-60 w-full object-cover group-hover/img:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <Maximize2 className="w-4 h-4" />
                                </div>
                              </div>
                            )}

                            {/* File Document Attachment */}
                            {msg.type === 'file' && (
                              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/10 dark:bg-white/10 mb-2">
                                <div className="p-2 rounded-lg bg-background text-primary">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-xs truncate">{msg.media_name || 'Document'}</p>
                                  <p className="text-[10px] opacity-70">{msg.media_size || 'PDF File'}</p>
                                </div>
                                {msg.media_url && (
                                  <a
                                    href={msg.media_url}
                                    download={msg.media_name || 'download'}
                                    className="p-1.5 rounded-lg bg-background hover:bg-primary/20 text-foreground transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Voice Audio Memo Attachment */}
                            {msg.type === 'audio' && (
                              <div className="flex items-center gap-3 p-2 rounded-xl bg-black/10 dark:bg-white/10 mb-1 min-w-[200px]">
                                <button
                                  onClick={() =>
                                    setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)
                                  }
                                  className="w-8 h-8 rounded-full bg-background text-primary flex items-center justify-center shadow-xs"
                                >
                                  {playingAudioId === msg.id ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4 ml-0.5" />
                                  )}
                                </button>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-1 h-3">
                                    {[40, 70, 30, 90, 60, 100, 45, 80, 50, 75].map((h, i) => (
                                      <span
                                        key={i}
                                        style={{ height: `${h}%` }}
                                        className={`w-1 rounded-full ${
                                          playingAudioId === msg.id ? 'bg-emerald-400 animate-pulse' : 'bg-current opacity-40'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] opacity-70">
                                    00:{msg.duration_seconds ? String(msg.duration_seconds).padStart(2, '0') : '05'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Text message */}
                            {msg.text && <p className="whitespace-pre-wrap select-text">{msg.text}</p>}

                            {/* Footer: Timestamp & Delivery Status */}
                            <div
                              className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                                isSelf ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              }`}
                            >
                              {msg.is_edited && <span className="italic">(edited)</span>}
                              <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isSelf && (
                                <span>
                                  {msg.status === 'read' ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />
                                  ) : msg.status === 'delivered' ? (
                                    <CheckCheck className="w-3.5 h-3.5 inline" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 inline" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Reaction Pills below bubble */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {msg.reactions.map((r) => (
                                <button
                                  key={r.emoji}
                                  onClick={() => handleToggleReaction(msg.id, r.emoji)}
                                  className="px-1.5 py-0.5 rounded-full bg-card border border-border shadow-xs text-[11px] flex items-center gap-1 hover:bg-muted"
                                >
                                  <span>{r.emoji}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground">{r.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Real-time Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-xl bg-card border border-border max-w-xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <span>{currentConversation.title} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* =============================================================
                  CHAT INPUT BAR & ATTACHMENT CONTROLS
              ============================================================= */}
              <div className="p-3 border-t border-border bg-card">
                {/* Replying or Editing Context Bar */}
                {replyingTo && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-primary/10 border border-primary/20 mb-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Reply className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-semibold text-primary">{replyingTo.sender_name}:</span>
                      <span className="text-muted-foreground truncate">{replyingTo.text}</span>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1 hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {editingMessage && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Edit2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold text-amber-600">Editing Message</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditingMessage(null)
                        setInputText('')
                      }}
                      className="p-1 hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Moderation Restriction Warning */}
                {isUserRestricted ? (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center gap-2 font-medium">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>Your chat privileges have been suspended by the platform administrator.</span>
                  </div>
                ) : isChatLocked ? (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    <span>This announcement channel is restricted. Only platform administrators can post updates.</span>
                  </div>
                ) : isRecordingVoice ? (
                  /* Active Voice Memo Recording Interface */
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs animate-pulse">
                    <div className="flex items-center gap-2 text-rose-600 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                      <span>Recording Voice Memo... 00:{String(voiceSeconds).padStart(2, '0')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={cancelVoiceRecording}
                        className="px-3 py-1 rounded-lg border border-border text-muted-foreground hover:bg-background text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={sendVoiceMemo}
                        className="px-3.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm"
                      >
                        Send Audio
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Input Bar */
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    {/* Attachment Upload Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach Image or Document (Max 15MB)"
                      className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Emoji Quick Picker */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        title="Add Emoji"
                        className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <Smile className="w-4 h-4" />
                      </button>

                      {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 p-2 rounded-2xl bg-card border border-border shadow-xl grid grid-cols-4 gap-1.5 z-20 w-40">
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setInputText((prev) => prev + emoji)
                                setShowEmojiPicker(false)
                              }}
                              className="text-lg p-1 hover:bg-muted rounded-lg transition-transform hover:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Text Input */}
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Message ${currentConversation.title}...`}
                      className="flex-1 px-4 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                    />

                    {/* Voice Memo Mic Button */}
                    {!inputText.trim() && (
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        title="Record Voice Memo"
                        className="p-2 rounded-xl border border-border hover:bg-rose-500/10 hover:text-rose-500 transition-colors shrink-0"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={!inputText.trim() && !editingMessage}
                      className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-muted-foreground">
              Select a conversation to begin messaging.
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          AUDIO / VIDEO CALL SIMULATION MODAL
      ========================================================================= */}
      {callState && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 text-white p-6 sm:p-8 flex flex-col items-center text-center relative shadow-2xl">
            {/* Top Badge */}
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-6">
              {callState.status === 'calling' ? 'Calling...' : `Live ${callState.type.toUpperCase()} Consultation`}
            </span>

            {/* Avatar Visualizer */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-zinc-700 shadow-xl">
                <img
                  src={formatImageUrl(callState.participantAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80')}
                  alt={callState.participantName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              {callState.status === 'connected' && (
                <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-30" />
              )}
            </div>

            <h3 className="text-xl font-bold">{callState.participantName}</h3>
            <p className="text-xs text-zinc-400 mt-1">{callState.participantRole}</p>

            {/* Call Duration Timer */}
            <div className="mt-4 text-sm font-mono text-zinc-300">
              {callState.status === 'calling'
                ? 'Ringing...'
                : `00:${String(callState.durationSeconds).padStart(2, '0')}`}
            </div>

            {/* Simulated Video Feed Placeholder */}
            {callState.type === 'video' && callState.isVideoEnabled && (
              <div className="w-full h-40 mt-4 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center relative overflow-hidden">
                <div className="text-center space-y-1">
                  <Video className="w-6 h-6 text-purple-400 mx-auto animate-pulse" />
                  <p className="text-xs text-zinc-300 font-semibold">Encrypted WebRTC Stream Active</p>
                </div>
              </div>
            )}

            {/* Call Controls Toolbar */}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => setCallState({ ...callState, isMuted: !callState.isMuted })}
                className={`p-3.5 rounded-full border transition-colors ${
                  callState.isMuted
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700'
                }`}
                title={callState.isMuted ? 'Unmute' : 'Mute'}
              >
                {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {callState.type === 'video' && (
                <button
                  onClick={() => setCallState({ ...callState, isVideoEnabled: !callState.isVideoEnabled })}
                  className={`p-3.5 rounded-full border transition-colors ${
                    !callState.isVideoEnabled
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700'
                  }`}
                  title={callState.isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {callState.isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              )}

              {/* End Call Button */}
              <button
                onClick={endCall}
                title="Hang up"
                className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 transition-transform hover:scale-105"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          NEW GROUP / CHANNEL MODAL
      ========================================================================= */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Create New Discussion Channel</h3>
              <button onClick={() => setShowCreateGroupModal(false)} className="p-1 hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Channel / Group Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Lab Discussion"
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Pinned Topic / Announcement
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly problem sets and derivations"
                  value={newGroupNotice}
                  onChange={(e) => setNewGroupNotice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lockChannel"
                  checked={newGroupIsLocked}
                  onChange={(e) => setNewGroupIsLocked(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="lockChannel" className="text-xs text-foreground cursor-pointer font-medium">
                  Restricted broadcast channel (Only instructors & admins can post)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs transition-colors"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MANAGE GROUP MODAL
      ========================================================================= */}
      {showManageGroupModal && manageGroupTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Manage Chat Group</h3>
                  <p className="text-xs text-muted-foreground">
                    Update group title, pinned notices, permissions, and moderation settings.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowManageGroupModal(false)
                  setManageGroupTarget(null)
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManageGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Group / Channel Title *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">#</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. physics-cohort-2026"
                    value={manageGroupTitle}
                    onChange={(e) => setManageGroupTitle(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Pinned Topic / Announcement Banner
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Weekly problem sets, derivations, and live discussion."
                  value={manageGroupNotice}
                  onChange={(e) => setManageGroupNotice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Group Avatar Presets */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Group Icon / Avatar
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[
                    { label: 'Science', url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=120&auto=format&fit=crop&q=80' },
                    { label: 'Coding', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120&auto=format&fit=crop&q=80' },
                    { label: 'Announce', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80' },
                    { label: 'Study Hub', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=120&auto=format&fit=crop&q=80' },
                    { label: 'Support', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setManageGroupAvatar(preset.url)}
                      className={`relative rounded-xl p-0.5 border-2 transition-all overflow-hidden ${
                        manageGroupAvatar === preset.url ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} className="w-9 h-9 rounded-lg object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Posting Permissions */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-2">
                <span className="text-xs font-semibold text-foreground block">Channel Permissions</span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-foreground block">
                      {manageGroupIsLocked ? 'Locked / Read-Only Announcements' : 'Open Community Discussion'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {manageGroupIsLocked
                        ? 'Only administrators and certified instructors can send messages.'
                        : 'All enrolled students, instructors, and staff can participate.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManageGroupIsLocked(!manageGroupIsLocked)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      manageGroupIsLocked
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                    }`}
                  >
                    {manageGroupIsLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{manageGroupIsLocked ? 'Restricted' : 'Open'}</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">Danger Zone</span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Delete this Group</span>
                    <span className="text-[11px] text-muted-foreground">
                      Permanently remove this chat group and purge all message history for all members.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowManageGroupModal(false)
                      setShowDeleteGroupModal(manageGroupTarget)
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Group</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowManageGroupModal(false)
                    setManageGroupTarget(null)
                  }}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE GROUP CONFIRMATION MODAL
      ========================================================================= */}
      {showDeleteGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Delete Chat Group</h3>
                <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                  {showDeleteGroupModal.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-foreground">{showDeleteGroupModal.title}</strong>? All cohort conversation messages, attachments, and pinned notices will be permanently erased for all members.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowDeleteGroupModal(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteGroup(showDeleteGroupModal)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Group</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT MESSAGE MODAL
      ========================================================================= */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>Flag Content for Moderation</span>
              </div>
              <button onClick={() => setShowReportModal(null)} className="p-1 hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Reporting message by <strong>{showReportModal.sender_name}</strong>: &quot;{showReportModal.text.slice(0, 80)}...&quot;
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Violation Category</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="inappropriate">Inappropriate Language or Content</option>
                  <option value="harassment">Bullying or Harassment</option>
                  <option value="spam">Commercial Spam / Flood</option>
                  <option value="academic_dishonesty">Cheating or Academic Dishonesty</option>
                  <option value="other">Other Policy Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Additional Notes</label>
                <textarea
                  rows={3}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Provide context for our academic moderation team..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReportModal(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportMessage}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          IMAGE PREVIEW LIGHTBOX
      ========================================================================= */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={lightboxImage}
            alt="Preview"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
