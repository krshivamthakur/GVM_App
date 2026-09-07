'use client'

import React, { useState } from 'react'
import { Course } from '@/types/database'
import { Plus, X, Video, Sparkles, BookOpen, Tag, Check, Loader2 } from 'lucide-react'
import { createShortVideoAction } from '@/actions/short-actions'

interface ShortUploadModalProps {
  teacherCourses?: Course[]
  onSuccess?: () => void
}

const SAMPLE_VIDEOS = [
  {
    label: 'Science & Physics Sample',
    url: '/videos/sample-short-2.mp4'
  },
  {
    label: 'Tech & Coding Sample',
    url: '/videos/sample-short-1.mp4'
  },
  {
    label: 'Algorithm & Animation Sample',
    url: '/videos/sample-short-4.mp4'
  }
]

export function ShortUploadModal({ teacherCourses = [], onSuccess }: ShortUploadModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await createShortVideoAction(formData)
      if (res.success) {
        setIsOpen(false)
        setVideoUrl('')
        if (onSuccess) onSuccess()
      } else {
        setError(res.error || 'Failed to upload short')
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all hover:scale-105 active:scale-95"
      >
        <Plus className="w-4 h-4" />
        <span>Create New Short</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    Publish Educational Short
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Share a 30–60 second micro-lesson with students
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Short Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. ⚡ Newton's Third Law in 30 Seconds!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Concept Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Summarize the core takeaway for learners..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Video MP4 URL *
                  </label>
                  <span className="text-[11px] text-zinc-400">Sample clips:</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SAMPLE_VIDEOS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setVideoUrl(s.url)}
                      className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-700 text-[10px] font-medium transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <input
                  type="url"
                  name="video_url"
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://.../video.mp4"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Attach Full Course (Optional)
                  </label>
                  <select
                    name="course_id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">None (Standalone Short)</option>
                    {teacherCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    placeholder="Java, Interview, QuickTip"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Publish Short</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
