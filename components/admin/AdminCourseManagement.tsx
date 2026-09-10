'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Course, Profile, CourseStatus } from '@/types/database'
import { CourseFormData } from '@/types/course'
import { createCourse, updateCourse, deleteCourse, toggleCoursePublish } from '@/actions/course-actions'
import { 
  BookOpen, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit3, 
  Eye, 
  Layers, 
  Sparkles, 
  User, 
  FileVideo, 
  Calendar,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react'

interface AdminCourseManagementProps {
  initialCourses: Course[]
  teachers: Profile[]
}

const CATEGORIES = ['Programming', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'General']

export function AdminCourseManagement({ initialCourses, teachers }: AdminCourseManagementProps) {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  // Create Course Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createCategory, setCreateCategory] = useState('Programming')
  const [createStatus, setCreateStatus] = useState<CourseStatus>('published')
  const [createTeacherId, setCreateTeacherId] = useState<string>(teachers[0]?.id || '')
  const [createThumbnail, setCreateThumbnail] = useState('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80')
  const [isCreating, setIsCreating] = useState(false)

  // Edit Course Modal State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editStatus, setEditStatus] = useState<CourseStatus>('draft')
  const [editTeacherId, setEditTeacherId] = useState('')
  const [editThumbnail, setEditThumbnail] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Delete Confirm Modal State
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtered courses
  const filteredCourses = courses.filter((course) => {
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      course.title.toLowerCase().includes(q) ||
      (course.description && course.description.toLowerCase().includes(q)) ||
      (course.category && course.category.toLowerCase().includes(q)) ||
      (course.teacher?.full_name && course.teacher.full_name.toLowerCase().includes(q)) ||
      (course.teacher?.email && course.teacher.email.toLowerCase().includes(q))

    return matchesStatus && matchesCategory && matchesSearch
  })

  // Metrics
  const totalCourses = courses.length
  const publishedCourses = courses.filter((c) => c.status === 'published').length
  const draftCourses = courses.filter((c) => c.status === 'draft').length
  const totalLectures = courses.reduce((acc, c) => acc + (c._count?.lectures || 0), 0)

  // Quick Toggle Publish
  const handleTogglePublish = async (courseId: string) => {
    const originalCourses = [...courses]
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            status: c.status === 'published' ? 'draft' : 'published'
          }
        }
        return c
      })
    )

    try {
      const res = await toggleCoursePublish(courseId)
      if (!res.success) {
        setCourses(originalCourses)
      }
    } catch {
      setCourses(originalCourses)
    }
  }

  // Handle Create Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createTitle.trim()) return
    setIsCreating(true)

    try {
      const courseData: CourseFormData = {
        title: createTitle.trim(),
        description: createDesc.trim(),
        category: createCategory,
        status: createStatus,
        thumbnail_url: createThumbnail.trim(),
        teacher_id: createTeacherId || undefined,
        price: 0
      }

      const res = await createCourse(courseData)
      if (res.success && res.course) {
        const assignedTeacher = teachers.find((t) => t.id === createTeacherId)
        const newCourse: Course = {
          ...res.course,
          teacher: assignedTeacher,
          _count: { enrollments: 0, lectures: 0 }
        }
        setCourses((prev) => [newCourse, ...prev])
        setShowCreateModal(false)
        setCreateTitle('')
        setCreateDesc('')
        // Optionally redirect directly to curriculum builder
        router.push(`/admin/courses/${res.course.id}`)
      } else {
        alert(res.error || 'Failed to create course')
      }
    } catch (err: any) {
      alert(err.message || 'Error creating course')
    } finally {
      setIsCreating(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (course: Course) => {
    setEditingCourse(course)
    setEditTitle(course.title)
    setEditDesc(course.description || '')
    setEditCategory(course.category || 'General')
    setEditStatus(course.status)
    setEditTeacherId(course.teacher_id || '')
    setEditThumbnail(course.thumbnail_url || '')
  }

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCourse || !editTitle.trim()) return
    setIsSaving(true)

    try {
      const updateData: Partial<CourseFormData> = {
        title: editTitle.trim(),
        description: editDesc.trim(),
        category: editCategory,
        status: editStatus,
        thumbnail_url: editThumbnail.trim(),
        teacher_id: editTeacherId || undefined
      }

      const res = await updateCourse(editingCourse.id, updateData)
      if (res.success && res.course) {
        const assignedTeacher = teachers.find((t) => t.id === editTeacherId)
        setCourses((prev) =>
          prev.map((c) =>
            c.id === editingCourse.id
              ? {
                  ...c,
                  ...res.course,
                  teacher: assignedTeacher || c.teacher
                }
              : c
          )
        )
        setEditingCourse(null)
      } else {
        alert(res.error || 'Failed to update course')
      }
    } catch (err: any) {
      alert(err.message || 'Error updating course')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingCourse) return
    setIsDeleting(true)

    try {
      const res = await deleteCourse(deletingCourse.id)
      if (res.success) {
        setCourses((prev) => prev.filter((c) => c.id !== deletingCourse.id))
        setDeletingCourse(null)
      } else {
        alert(res.error || 'Failed to delete course')
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting course')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Curriculum & Platform Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Course Management Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Create courses, build curriculum modules, assign instructors, manage lecture videos, and publish live content.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Course</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Courses</span>
          <div className="text-2xl font-black text-foreground mt-1">{totalCourses}</div>
          <span className="text-[11px] text-muted-foreground">All platform modules</span>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Published Live</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{publishedCourses}</div>
          <span className="text-[11px] text-muted-foreground">Available to students</span>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Draft Modules</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{draftCourses}</div>
          <span className="text-[11px] text-muted-foreground">In curriculum review</span>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Lectures</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{totalLectures}</div>
          <span className="text-[11px] text-muted-foreground">Lessons with videos & notes</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses by title, category, or instructor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Status Tabs */}
          <div className="flex items-center rounded-xl bg-muted p-1 border border-border shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({courses.length})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'published'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Published ({publishedCourses})
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'draft'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Drafts ({draftCourses})
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shrink-0"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Cards Directory */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-foreground">No courses found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'No courses match your active search filter. Try resetting filters.'
              : 'There are currently no courses in the platform database.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Course</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const isPub = course.status === 'published'
            const lectureCount = course._count?.lectures || 0

            return (
              <div
                key={course.id}
                className="group rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="relative h-44 w-full bg-muted overflow-hidden">
                    <img
                      src={
                        course.thumbnail_url ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-background/90 text-foreground backdrop-blur-md">
                        {course.category || 'General'}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md ${
                          isPub
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-amber-500/90 text-white'
                        }`}
                      >
                        {isPub ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{course.status}</span>
                      </span>
                    </div>

                    {/* Bottom overlay inside thumbnail */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <FileVideo className="w-3.5 h-3.5 text-purple-300" />
                        <span>{lectureCount} {lectureCount === 1 ? 'Lecture' : 'Lectures'}</span>
                      </div>

                      {course.teacher && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-200">
                          <User className="w-3 h-3 text-zinc-400" />
                          <span className="truncate max-w-[120px]">{course.teacher.full_name || 'Instructor'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {course.description || 'No course description provided yet.'}
                      </p>
                    </div>

                    {/* Instructor Info pill */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden border border-border flex items-center justify-center font-bold text-[10px] text-foreground">
                          {course.teacher?.avatar_url ? (
                            <img
                              src={course.teacher.avatar_url}
                              alt={course.teacher.full_name || 'Teacher'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{course.teacher?.full_name?.charAt(0) || 'T'}</span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-[11px]">
                          {course.teacher?.full_name || 'Unassigned Teacher'}
                        </span>
                      </div>

                      <span className="text-[11px] font-bold text-muted-foreground">
                        {course.price && course.price > 0 ? `$${course.price}` : 'Free Access'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Controls Footer */}
                <div className="p-4 border-t border-border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2">
                    {/* Primary Button: Manage Curriculum */}
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Manage Curriculum</span>
                    </Link>

                    {/* Preview as Student */}
                    <Link
                      href={`/student/courses/${course.id}`}
                      target="_blank"
                      className="p-2 rounded-xl border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Preview Course as Student"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {/* Edit Metadata */}
                    <button
                      onClick={() => openEditModal(course)}
                      className="p-2 rounded-xl border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit Course Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeletingCourse(course)}
                      className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Fast Publish / Unpublish Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      Status: <strong className="text-foreground capitalize">{course.status}</strong>
                    </span>
                    <button
                      onClick={() => handleTogglePublish(course.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                        isPub
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                          : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                      }`}
                    >
                      {isPub ? (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Switch to Draft</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Publish Course</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL: Create New Course */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Create New Platform Course</h3>
                  <p className="text-xs text-muted-foreground">Add a new curriculum course & assign an instructor</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Fullstack Next.js 16 & TypeScript"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide an overview of the course objectives, prerequisites, and learning outcomes..."
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Initial Status
                  </label>
                  <select
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value as CourseStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Assign Instructor
                  </label>
                  <select
                    value={createTeacherId}
                    onChange={(e) => setCreateTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Platform Administrator</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name || t.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Thumbnail Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={createThumbnail}
                  onChange={(e) => setCreateThumbnail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isCreating ? 'Creating Course...' : 'Create Course & Open Builder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Course Metadata */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Edit Course Details</h3>
                  <p className="text-xs text-muted-foreground">Modify title, category, instructor, or visibility</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Visibility Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as CourseStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Assign Instructor
                  </label>
                  <select
                    value={editTeacherId}
                    onChange={(e) => setEditTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Platform Administrator</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name || t.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Thumbnail Image URL
                </label>
                <input
                  type="text"
                  value={editThumbnail}
                  onChange={(e) => setEditThumbnail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Course Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete Course */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/50">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Delete Course?</h3>
                <p className="text-xs text-muted-foreground">Permanent deletion confirmation</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{deletingCourse.title}</strong>? All associated curriculum chapters, lectures, and resources will be removed.
            </p>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-border">
              <button
                onClick={() => setDeletingCourse(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
