'use client'

import { useState } from 'react'
import { Profile, UserRole, TeacherStatus } from '@/types/database'
import { createUser, updateUser, deleteUser } from '@/actions/admin-actions'
import { formatDisplayDate } from '@/lib/utils'
import { AvatarSelector } from '@/components/ui/AvatarSelector'
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Mail, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Check, 
  X,
  Sparkles,
  Award,
  Eye,
  EyeOff,
  Lock,
  Key
} from 'lucide-react'


interface UserManagementTableProps {
  initialUsers: Profile[]
}

export function UserManagementTable({ initialUsers }: UserManagementTableProps) {
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [createRole, setCreateRole] = useState<UserRole>('student')
  const [createTeacherStatus, setCreateTeacherStatus] = useState<TeacherStatus>('approved')
  const [createBio, setCreateBio] = useState('')
  const [createAvatar, setCreateAvatar] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [editName, setEditName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [editRole, setEditRole] = useState<UserRole>('student')
  const [editTeacherStatus, setEditTeacherStatus] = useState<TeacherStatus>('approved')
  const [editBio, setEditBio] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filter users by search and role
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.bio && u.bio.toLowerCase().includes(q))
    return matchesRole && matchesSearch
  })

  // Handle Create User
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim() || !createEmail.trim()) return
    setIsCreating(true)

    try {
      const res = await createUser({
        full_name: createName,
        email: createEmail,
        role: createRole,
        teacher_status: createRole === 'teacher' ? createTeacherStatus : undefined,
        bio: createBio,
        avatar_url: createAvatar || undefined,
        password: createPassword.trim() || undefined
      })

      if (res.success && res.user) {
        setUsers((prev) => [res.user!, ...prev])
        setShowCreateModal(false)
        setCreateName('')
        setCreateEmail('')
        setCreatePassword('')
        setCreateBio('')
        setCreateAvatar('')
      } else {
        alert(res.error || 'Failed to create user')
      }
    } finally {
      setIsCreating(false)
    }
  }

  // Handle Open Edit
  const openEdit = (user: Profile) => {
    setEditingUser(user)
    setEditName(user.full_name || '')
    setEditPassword('')
    setShowEditPassword(false)
    setEditRole(user.role)
    setEditTeacherStatus(user.teacher_status || 'approved')
    setEditBio(user.bio || '')
    setEditAvatar(user.avatar_url || '')
  }

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || !editName.trim()) return
    setIsSaving(true)

    try {
      const updates: Partial<Profile> = {
        full_name: editName,
        role: editRole,
        bio: editBio,
        avatar_url: editAvatar || undefined,
        ...(editRole === 'teacher' ? { teacher_status: editTeacherStatus } : {})
      }

      if (editPassword.trim()) {
        updates.password = editPassword.trim()
      }

      const res = await updateUser(editingUser.id, updates)

      if (res.success && res.user) {
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? res.user! : u)))
        setEditingUser(null)
      } else {
        alert(res.error || 'Failed to update user')
      }

    } finally {
      setIsSaving(false)
    }
  }

  // Handle Delete User
  const handleDelete = async (id: string, name?: string | null) => {
    if (confirm(`Are you sure you want to delete user "${name || id}"? This will remove them from Supabase Profile table.`)) {
      setDeletingId(id)
      try {
        await deleteUser(id)
        setUsers((prev) => prev.filter((u) => u.id !== id))
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Role Filters & Create Button */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs">
            {(['all', 'student', 'teacher', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                  roleFilter === r
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm shadow-rose-600/20 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center justify-between">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            Registered Profiles in Supabase ({filteredUsers.length})
          </h3>
          <span className="text-xs text-zinc-500">Live sync with public.&quot;Profile&quot;</span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-10 text-center text-xs text-zinc-500">
              No users match the search &ldquo;{search}&rdquo; or filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Teacher Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredUsers.map((user) => {
                  const isTeacher = user.role === 'teacher'
                  const isAdmin = user.role === 'admin'

                  return (
                    <tr key={user.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name || 'User'}
                              className="w-8 h-8 rounded-full object-cover border border-zinc-200 shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isAdmin
                                  ? 'bg-rose-100 text-rose-700'
                                  : isTeacher
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {user.full_name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">
                              {user.full_name || 'Unnamed User'}
                            </div>
                            {user.bio && (
                              <div className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                                {user.bio}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isAdmin
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : isTeacher
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {isAdmin && <ShieldCheck className="w-3 h-3" />}
                          {isTeacher && <BookOpen className="w-3 h-3" />}
                          {!isAdmin && !isTeacher && <GraduationCap className="w-3 h-3" />}
                          <span>{user.role}</span>
                        </span>
                      </td>

                      {/* Teacher Status */}
                      <td className="py-3.5 px-4">
                        {isTeacher ? (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                              user.teacher_status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : user.teacher_status === 'rejected'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {user.teacher_status || 'approved'}
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-zinc-500">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span suppressHydrationWarning>{formatDisplayDate(user.created_at)}</span>
                        </div>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Edit User Profile"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(user.id, user.full_name)}
                            disabled={deletingId === user.id}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete User from Supabase"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-rose-600" />
              <span>Create New User</span>
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Add a new student, teacher, or admin. This saves directly into the Supabase &quot;Profile&quot; table.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Khanna"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    <span>Account Password</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">Optional</span>
                </label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    placeholder="Set password (min 4 chars) or leave blank"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showCreatePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Role
                  </label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 capitalize"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {createRole === 'teacher' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Teacher Status
                    </label>
                    <select
                      value={createTeacherStatus}
                      onChange={(e) => setCreateTeacherStatus(e.target.value as TeacherStatus)}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 capitalize"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Bio / Qualifications
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description or professional background..."
                  value={createBio}
                  onChange={(e) => setCreateBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <AvatarSelector
                value={createAvatar}
                onChange={setCreateAvatar}
                fallbackName={createName}
                label="Profile Avatar (Gallery, Upload, or Link)"
              />

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 shadow-sm shadow-rose-600/20"
                >
                  {isCreating ? 'Saving to Supabase...' : 'Save User to Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              <span>Edit User Profile</span>
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Editing <strong className="text-zinc-800 dark:text-zinc-200">{editingUser.email}</strong>. Updates Supabase directly.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {editRole === 'teacher' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Teacher Status
                    </label>
                    <select
                      value={editTeacherStatus}
                      onChange={(e) => setEditTeacherStatus(e.target.value as TeacherStatus)}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Bio / Notes
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-blue-500" />
                    <span>Change Password</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">Leave blank to keep unchanged</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Enter new password to change..."
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <AvatarSelector
                value={editAvatar}
                onChange={setEditAvatar}
                fallbackName={editName}
                label="Profile Avatar (Gallery, Upload, or Link)"
              />

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-600/20"
                >
                  {isSaving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
