'use client'

import React, { useState, useMemo } from 'react'
import { 
  Users, 
  UserPlus, 
  Search, 
  X, 
  Shield, 
  ShieldCheck, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Check, 
  User, 
  CheckCircle2, 
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { ChatConversation, ChatParticipant } from '@/types/chat'
import { Profile } from '@/types/database'
import { ChatStateManager } from '@/lib/chat/chat-store'
import { 
  addServerParticipantAction, 
  removeServerParticipantAction, 
  updateServerParticipantRoleAction 
} from '@/actions/chat-actions'

interface AdminGroupMembersModalProps {
  channel: ChatConversation
  isOpen: boolean
  onClose: () => void
  initialUsers: Profile[]
  currentAdminName?: string
  onMembersUpdated?: (updatedChannel: ChatConversation) => void
}

export function AdminGroupMembersModal({
  channel,
  isOpen,
  onClose,
  initialUsers = [],
  currentAdminName = 'Admin',
  onMembersUpdated
}: AdminGroupMembersModalProps) {
  const chatStore = useMemo(() => ChatStateManager.getInstance(), [])
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all')
  const [statusNotice, setStatusNotice] = useState<string | null>(null)

  // Add members batch selection
  const [selectedUserIdsToAdd, setSelectedUserIdsToAdd] = useState<string[]>([])
  const [batchRole, setBatchRole] = useState<'member' | 'moderator' | 'admin'>('member')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ensure current participants are loaded and initialized if empty
  const participants = useMemo(() => {
    return chatStore.ensureGroupParticipants(channel.id, initialUsers)
  }, [channel.id, chatStore, initialUsers, statusNotice])

  // Filter current participants
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        p.user_name.toLowerCase().includes(q) ||
        (p.user_email && p.user_email.toLowerCase().includes(q)) ||
        p.user_role.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q)

      const matchesRole =
        roleFilter === 'all' ||
        p.user_role.toLowerCase() === roleFilter.toLowerCase()

      return matchesSearch && matchesRole
    })
  }, [participants, searchQuery, roleFilter])

  // Users available to be added (not currently participants)
  const availableUsers = useMemo(() => {
    const participantUserIds = new Set(participants.map((p) => p.user_id))
    return initialUsers.filter((u) => !participantUserIds.has(u.id))
  }, [initialUsers, participants])

  // Filter available users for 'Add' tab
  const filteredAvailableUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      const q = searchQuery.toLowerCase().trim()
      const name = (u.full_name || u.email.split('@')[0] || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const matchesSearch = !q || name.includes(q) || email.includes(q)
      const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase()
      return matchesSearch && matchesRole
    })
  }, [availableUsers, searchQuery, roleFilter])

  const notifyChange = (msg: string) => {
    setStatusNotice(msg)
    window.dispatchEvent(new CustomEvent('gvm_chat_update'))
    const updated = chatStore.getConversations().find((c) => c.id === channel.id)
    if (updated && onMembersUpdated) {
      onMembersUpdated(updated)
    }
    setTimeout(() => setStatusNotice(null), 3000)
  }

  // Handle Remove Participant
  const handleRemoveParticipant = async (userId: string, userName: string) => {
    chatStore.removeGroupParticipant(channel.id, userId, currentAdminName)
    try {
      await removeServerParticipantAction({ conversationId: channel.id, userId })
    } catch (err) {
      console.warn('Server remove error:', err)
    }
    notifyChange(`Removed ${userName} from channel`)
  }

  // Handle Change Role
  const handleChangeRole = async (userId: string, newRole: 'admin' | 'moderator' | 'member', userName: string) => {
    chatStore.updateGroupParticipantRole(channel.id, userId, newRole)
    try {
      await updateServerParticipantRoleAction({
        conversationId: channel.id,
        userId,
        role: newRole
      })
    } catch (err) {
      console.warn('Server update role error:', err)
    }
    notifyChange(`Updated role for ${userName} to ${newRole}`)
  }

  // Handle Toggle Mute
  const handleToggleMute = async (p: ChatParticipant) => {
    const isMuted = chatStore.toggleGroupParticipantMute(channel.id, p.user_id)
    try {
      await updateServerParticipantRoleAction({
        conversationId: channel.id,
        userId: p.user_id,
        role: p.role,
        isMuted
      })
    } catch (err) {
      console.warn('Server mute error:', err)
    }
    notifyChange(`${p.user_name} is now ${isMuted ? 'muted' : 'unmuted'} in this channel`)
  }

  // Handle Single User Add
  const handleAddSingleUser = async (user: Profile, role: 'admin' | 'moderator' | 'member' = 'member') => {
    setIsSubmitting(true)
    const added = chatStore.addGroupParticipant(
      channel.id,
      {
        id: user.id,
        name: user.full_name || user.email.split('@')[0],
        email: user.email,
        role: user.role,
        avatar: user.avatar_url
      },
      role,
      currentAdminName
    )

    if (added) {
      try {
        await addServerParticipantAction({
          conversationId: channel.id,
          userId: user.id,
          userName: user.full_name || user.email.split('@')[0],
          userRole: user.role,
          userAvatar: user.avatar_url,
          userEmail: user.email,
          role
        })
      } catch (err) {
        console.warn('Server add participant error:', err)
      }
      notifyChange(`Added ${user.full_name || user.email} as ${role}`)
    }
    setIsSubmitting(false)
  }

  // Handle Batch Add Users
  const handleBatchAddUsers = async () => {
    if (selectedUserIdsToAdd.length === 0) return
    setIsSubmitting(true)

    const usersToAdd = initialUsers.filter((u) => selectedUserIdsToAdd.includes(u.id))
    for (const u of usersToAdd) {
      chatStore.addGroupParticipant(
        channel.id,
        {
          id: u.id,
          name: u.full_name || u.email.split('@')[0],
          email: u.email,
          role: u.role,
          avatar: u.avatar_url
        },
        batchRole,
        currentAdminName
      )
      try {
        await addServerParticipantAction({
          conversationId: channel.id,
          userId: u.id,
          userName: u.full_name || u.email.split('@')[0],
          userRole: u.role,
          userAvatar: u.avatar_url,
          userEmail: u.email,
          role: batchRole
        })
      } catch (e) {}
    }

    notifyChange(`Successfully added ${usersToAdd.length} members as ${batchRole}`)
    setSelectedUserIdsToAdd([])
    setIsSubmitting(false)
  }

  const toggleSelectUser = (id: string) => {
    setSelectedUserIdsToAdd((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedUserIdsToAdd.length === filteredAvailableUsers.length) {
      setSelectedUserIdsToAdd([])
    } else {
      setSelectedUserIdsToAdd(filteredAvailableUsers.map((u) => u.id))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Manage Channel Members</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {participants.length} Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Channel: <span className="font-semibold text-foreground">{channel.title}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {statusNotice && (
          <div className="px-5 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 border-b border-emerald-500/20 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="px-5 pt-3 border-b border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('current')
                setSearchQuery('')
              }}
              className={`flex items-center gap-2 px-3.5 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'current'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Current Members ({participants.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('add')
                setSearchQuery('')
              }}
              className={`flex items-center gap-2 px-3.5 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'add'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Members ({availableUsers.length} available)</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-border bg-muted/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'current'
                  ? 'Search channel members by name or email...'
                  : 'Search platform users to add...'
              }
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Role Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['all', 'student', 'teacher', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors cursor-pointer shrink-0 ${
                  roleFilter === r
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Current Members */}
        {activeTab === 'current' && (
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-border">
            {filteredParticipants.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold text-foreground">No matching members found</p>
                <p className="text-[11px] mt-1">
                  {searchQuery ? 'Try clearing your search filters.' : 'Click "Add Members" to add participants.'}
                </p>
              </div>
            ) : (
              filteredParticipants.map((p) => (
                <div
                  key={p.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {p.user_avatar ? (
                        <img
                          src={p.user_avatar}
                          alt={p.user_name}
                          className="w-9 h-9 rounded-xl object-cover border border-border"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {p.user_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {p.is_muted && (
                        <span
                          className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-xs"
                          title="Muted in this channel"
                        >
                          <VolumeX className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-xs text-foreground truncate">{p.user_name}</p>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${
                            p.user_role === 'teacher'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                              : p.user_role === 'admin'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {p.user_role}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.user_email || 'Verified user'}
                      </p>
                    </div>
                  </div>

                  {/* Member Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role Selector */}
                    <select
                      value={p.role}
                      onChange={(e) =>
                        handleChangeRole(p.user_id, e.target.value as any, p.user_name)
                      }
                      className="px-2 py-1 rounded-lg border border-border bg-background text-[11px] font-semibold text-foreground focus:outline-none cursor-pointer"
                      title="Channel permissions role"
                    >
                      <option value="member">Member</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Channel Admin</option>
                    </select>

                    {/* Mute/Unmute in Channel */}
                    <button
                      type="button"
                      onClick={() => handleToggleMute(p)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        p.is_muted
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title={p.is_muted ? 'Unmute participant' : 'Mute participant in channel'}
                    >
                      {p.is_muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Remove Member */}
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.user_id, p.user_name)}
                      className="p-1.5 rounded-lg border border-rose-500/20 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove participant from channel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Add Members */}
        {activeTab === 'add' && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Batch Action Bar */}
            {filteredAvailableUsers.length > 0 && (
              <div className="p-3 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={
                      selectedUserIdsToAdd.length > 0 &&
                      selectedUserIdsToAdd.length === filteredAvailableUsers.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="select-all" className="text-xs font-semibold text-foreground cursor-pointer">
                    Select All ({filteredAvailableUsers.length})
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={batchRole}
                    onChange={(e) => setBatchRole(e.target.value as any)}
                    className="px-2.5 py-1 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="member">Add as Member</option>
                    <option value="moderator">Add as Moderator</option>
                    <option value="admin">Add as Admin</option>
                  </select>

                  <button
                    type="button"
                    disabled={selectedUserIdsToAdd.length === 0 || isSubmitting}
                    onClick={handleBatchAddUsers}
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Selected ({selectedUserIdsToAdd.length})</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 p-4 divide-y divide-border">
              {filteredAvailableUsers.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-80" />
                  <p className="text-xs font-semibold text-foreground">All eligible users are already in this channel!</p>
                  <p className="text-[11px] mt-1">
                    No users remaining to add matching the current search criteria.
                  </p>
                </div>
              ) : (
                filteredAvailableUsers.map((u) => {
                  const isSelected = selectedUserIdsToAdd.includes(u.id)
                  return (
                    <div
                      key={u.id}
                      className={`py-3 flex items-center justify-between gap-3 px-2 rounded-xl transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-500/5' : 'hover:bg-muted/20'
                      }`}
                      onClick={() => toggleSelectUser(u.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectUser(u.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-border">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (u.full_name || u.email).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-xs text-foreground truncate">
                              {u.full_name || u.email.split('@')[0]}
                            </p>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${
                                u.role === 'teacher'
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                  : u.role === 'admin'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>

                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleAddSingleUser(u, batchRole)}
                          className="px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Changes are saved immediately and updated across student & teacher portals.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
