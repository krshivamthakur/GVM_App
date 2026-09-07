'use client'

import { useState } from 'react'
import { Profile } from '@/types/database'
import { approveTeacher, createUser } from '@/actions/admin-actions'
import { formatDisplayDate } from '@/lib/utils'
import { Check, X, Mail, Calendar, Search, UserPlus, Sparkles, BookOpen } from 'lucide-react'

export function TeacherApprovalList({ initialTeachers }: { initialTeachers: Profile[] }) {
  const [teachers, setTeachers] = useState(initialTeachers)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Add Teacher Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleAction = async (teacherId: string, status: 'approved' | 'rejected') => {
    setProcessingId(teacherId)
    try {
      await approveTeacher(teacherId, status)
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, teacher_status: status } : t))
      )
    } finally {
      setProcessingId(null)
    }
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setIsCreating(true)
    try {
      const res = await createUser({
        full_name: name,
        email,
        role: 'teacher',
        teacher_status: 'approved',
        bio: bio || 'Course Instructor & Educator',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      })
      if (res.success && res.user) {
        setTeachers((prev) => [res.user!, ...prev])
        setShowAddModal(false)
        setName('')
        setEmail('')
        setBio('')
      } else {
        alert(res.error || 'Failed to add teacher')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const filteredTeachers = teachers.filter((t) => {
    const isTeacher = t.role === 'teacher'
    const matchesStatus =
      statusFilter === 'all' ||
      (t.teacher_status || 'approved') === statusFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      (t.full_name && t.full_name.toLowerCase().includes(q)) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.bio && t.bio.toLowerCase().includes(q))
    return isTeacher && matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search teachers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm shadow-purple-600/20 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Teacher</span>
          </button>
        </div>
      </div>
      {/* Teachers List Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center justify-between">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            Teacher Verification Pipeline ({filteredTeachers.length})
          </h3>
          <span className="text-[11px] text-zinc-500 font-medium">Filtered strictly by Teacher Role</span>
        </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {teachers.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">No teacher records found.</div>
        ) : (
          filteredTeachers.map((teacher) => {
            const isPending = teacher.teacher_status === 'pending'
            const isApproved = teacher.teacher_status === 'approved'

            return (
              <div
                key={teacher.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {teacher.avatar_url ? (
                    <img
                      src={teacher.avatar_url}
                      alt={teacher.full_name || 'Teacher'}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {teacher.full_name?.charAt(0) || 'T'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {teacher.full_name}
                      </h4>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {teacher.teacher_status || 'approved'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-zinc-400" />
                        {teacher.email}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span suppressHydrationWarning>Joined {formatDisplayDate(teacher.created_at)}</span>
                      </span>
                    </div>

                    {teacher.bio && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 line-clamp-1 italic">
                        &ldquo;{teacher.bio}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleAction(teacher.id, 'approved')}
                        disabled={processingId === teacher.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Teacher</span>
                      </button>

                      <button
                        onClick={() => handleAction(teacher.id, 'rejected')}
                        disabled={processingId === teacher.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400 text-xs font-semibold transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() =>
                        handleAction(teacher.id, isApproved ? 'rejected' : 'approved')
                      }
                      disabled={processingId === teacher.id}
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 underline"
                    >
                      {isApproved ? 'Revoke Access' : 'Re-approve'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                Add Instructor / Teacher
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="instructor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Department / Qualifications / Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Senior Faculty - Physics & Mathematics"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm transition-all"
                >
                  {isCreating ? 'Adding...' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
