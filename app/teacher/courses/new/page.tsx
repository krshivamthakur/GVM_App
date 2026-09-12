'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCourse } from '@/actions/course-actions'
import { CourseStatus } from '@/types/database'
import { formatImageUrl, DEFAULT_FALLBACK_THUMBNAIL } from '@/lib/utils'
import { PlusCircle, ArrowLeft, UploadCloud, ImageIcon, Sparkles } from 'lucide-react'

const CATEGORIES = ['Programming', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'General']

export default function CreateCoursePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Programming')
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80')
  const [status, setStatus] = useState<CourseStatus>('draft')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)

    try {
      const res = await createCourse({
        title,
        description,
        category,
        thumbnail_url: formatImageUrl(thumbnailUrl),
        status,
        price: 0
      })

      if (res.success && res.course) {
        router.push(`/teacher/courses/${res.course.id}`)
      } else {
        alert(res.error || 'Failed to create course')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/teacher/courses"
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Create New Course</h1>
          <p className="text-xs text-zinc-500">
            Set up the foundation for your new subject module and curriculum.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Course Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Course Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Java Programming Complete Course"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Course Description
            </label>
            <textarea
              rows={4}
              placeholder="Learn from beginner to advanced concepts with practical examples..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Category & Status */}
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
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CourseStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="draft">Draft (Work in Progress)</option>
                <option value="published">Published (Visible to Students)</option>
              </select>
            </div>
          </div>

          {/* Thumbnail URL */}
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

          {/* Submit */}
          <div className="pt-4 flex justify-end gap-3">
            <Link
              href="/teacher/courses"
              className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
            >
              {loading ? 'Creating...' : 'Create Course & Build Curriculum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
