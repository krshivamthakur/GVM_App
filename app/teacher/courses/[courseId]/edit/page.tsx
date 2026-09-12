'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCourseById, updateCourse, deleteCourse } from '@/actions/course-actions'
import { CourseStatus, CourseWithCurriculum } from '@/types/database'
import { formatImageUrl, DEFAULT_FALLBACK_THUMBNAIL } from '@/lib/utils'
import { ArrowLeft, Trash2, Save } from 'lucide-react'

const CATEGORIES = ['Programming', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'General']

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.courseId as string

  const [course, setCourse] = useState<CourseWithCurriculum | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Programming')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [status, setStatus] = useState<CourseStatus>('draft')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      if (!courseId) return
      const c = await getCourseById(courseId)
      if (c) {
        setCourse(c)
        setTitle(c.title)
        setDescription(c.description || '')
        setCategory(c.category || 'General')
        setThumbnailUrl(c.thumbnail_url || '')
        setStatus(c.status)
      }
      setLoading(false)
    }
    load()
  }, [courseId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await updateCourse(courseId, {
        title,
        description,
        category,
        thumbnail_url: formatImageUrl(thumbnailUrl),
        status
      })
      router.push(`/teacher/courses/${courseId}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this entire course? This action cannot be undone.')) {
      await deleteCourse(courseId)
      router.push('/teacher/courses')
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-xs text-zinc-500">Loading course details...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/teacher/courses/${courseId}`}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Edit Course Details</h1>
            <p className="text-xs text-zinc-500">Update general information, metadata, and status.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400 text-xs font-semibold transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Course</span>
        </button>
      </div>

      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Course Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Course Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CourseStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Live)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Course Thumbnail URL
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="https://images.unsplash.com/... or Google Drive share link"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {thumbnailUrl && (
                <div className="w-12 h-10 rounded-lg overflow-hidden border border-zinc-200 shrink-0">
                  <img
                    src={formatImageUrl(thumbnailUrl)}
                    alt="Thumbnail preview"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_THUMBNAIL
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Supports direct image URLs and Google Drive share links (automatically converted).
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link
              href={`/teacher/courses/${courseId}`}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
