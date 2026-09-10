'use client'

import { useState } from 'react'
import { Profile } from '@/types/database'
import { createUser, updateUser, deleteUser } from '@/actions/admin-actions'
import { formatDisplayDate } from '@/lib/utils'
import { AvatarSelector } from '@/components/ui/AvatarSelector'
import { 
  GraduationCap, 
  Search, 
  UserPlus, 
  Mail, 
  Calendar, 
  Edit3, 
  Trash2, 
  BookOpen, 
  X, 
  Check, 
  Sparkles, 
  ShieldAlert,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'

interface StudentDirectoryTableProps {
  initialStudents: Profile[]
}

export function StudentDirectoryTable({ initialStudents }: StudentDirectoryTableProps) {
  const [students, setStudents] = useState<Profile[]>(initialStudents)
  const [search, setSearch] = useState('')

  // Create Student Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createBio, setCreateBio] = useState('')
  const [createAvatar, setCreateAvatar] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)


  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filter students: strictly students and match search query
  const filteredStudents = students.filter((s) => {
    const isStudentRole = s.role === 'student'
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.bio && s.bio.toLowerCase().includes(q))
    return isStudentRole && matchesSearch
  })

  // Handle Create Student
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim() || !createEmail.trim()) return
    setIsCreating(true)

    try {
      const res = await createUser({
        full_name: createName,
        email: createEmail,
        role: 'student',
        bio: createBio || 'Student learner',
        avatar_url: createAvatar || undefined,
        password: createPassword ? createPassword.trim() : undefined
      })

      if (res.success && res.user) {
        setStudents((prev) => [res.user!, ...prev])
        setShowCreateModal(false)
        setCreateName('')
        setCreateEmail('')
        setCreateBio('')
        setCreateAvatar('')
        setCreatePassword('')
        setShowCreatePassword(false)
      } else {
        alert(res.error || 'Failed to create student account')
      }
    } finally {
      setIsCreating(false)
    }
  }

  // Handle Open Edit
  const openEdit = (student: Profile) => {
    setEditingStudent(student)
    setEditName(student.full_name || '')
    setEditBio(student.bio || '')
    setEditAvatar(student.avatar_url || '')
    setEditPassword('')
    setShowEditPassword(false)
  }

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent || !editName.trim()) return
    setIsSaving(true)

    try {
      const res = await updateUser(editingStudent.id, {
        full_name: editName,
        bio: editBio,
        avatar_url: editAvatar || undefined,
        ...(editPassword.trim() ? { password: editPassword.trim() } : {})
      })

      if (res.success && res.user) {
        setStudents((prev) => prev.map((s) => (s.id === editingStudent.id ? res.user! : s)))
        setEditingStudent(null)
        setEditPassword('')
      } else {
        alert(res.error || 'Failed to update student profile')
      }

    } finally {
      setIsSaving(false)
    }
  }

  // Handle Delete Student
  const handleDelete = async (id: string, name?: string | null) => {
    if (confirm(`Are you sure you want to delete student "${name || id}"? This will remove them from Supabase Profile table.`)) {
      setDeletingId(id)
      try {
        await deleteUser(id)
        setStudents((prev) => prev.filter((s) => s.id !== id))
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
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Add Student Button */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium hidden sm:inline">
            Total Students: <strong className="text-zinc-900 dark:text-zinc-100">{filteredStudents.length}</strong>
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm shadow-blue-600/20 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center justify-between">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            Registered Students Directory ({filteredStudents.length})
          </h3>
          <span className="text-[11px] text-zinc-500 font-medium">Filtered strictly by Student Role</span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-x-auto">
          {filteredStudents.length === 0 ? (
            <div className="p-10 text-center text-xs text-zinc-500">
              No students found matching your search.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                    {/* Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {student.avatar_url ? (
                          <img
                            src={student.avatar_url}
                            alt={student.full_name || 'Student'}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {student.full_name?.charAt(0) || 'S'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {student.full_name}
                          </div>
                          {student.bio && (
                            <div className="text-[11px] text-zinc-500 line-clamp-1 max-w-xs">
                              {student.bio}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                        {student.email}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        <GraduationCap className="w-3 h-3" />
                        Student
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                      <span suppressHydrationWarning>{formatDisplayDate(student.created_at)}</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(student)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                          title="Edit Student"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id, student.full_name)}
                          disabled={deletingId === student.id}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Student Modal */}
      {showCreateModal && (
        <div 
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                    Register New Student
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Add student profile with credentials and enrolled details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="create-student-form" onSubmit={handleCreate} className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Set Initial Password</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">Optional</span>
                </label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    placeholder="Enter password or leave blank (min 4 chars)"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Bio / Learning Goals
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell about subjects or courses this student intends to learn..."
                  value={createBio}
                  onChange={(e) => setCreateBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <AvatarSelector
                value={createAvatar}
                onChange={setCreateAvatar}
                fallbackName={createName}
                label="Student Avatar (Gallery, Upload, or Link)"
              />
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50/80 dark:bg-zinc-900/80">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-student-form"
                disabled={isCreating}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div 
          onClick={() => setEditingStudent(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                    Edit Student Profile
                  </h3>
                  <p className="text-[11px] text-zinc-500 truncate max-w-[280px]">
                    Editing <span className="font-semibold text-zinc-800 dark:text-zinc-200">{editingStudent.email}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="edit-student-form" onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Bio / Notes
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Change Password</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">Leave blank to keep unchanged</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Leave blank to keep existing password"
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
                label="Student Avatar (Gallery, Upload, or Link)"
              />
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50/80 dark:bg-zinc-900/80">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-student-form"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
