import Link from 'next/link'
import { getTeacherCourses } from '@/actions/course-actions'
import { getShortVideos, deleteShortVideoAction } from '@/actions/short-actions'
import { ShortUploadModal } from '@/components/shorts/ShortUploadModal'
import { 
  Video, 
  Flame, 
  Eye, 
  Heart, 
  ExternalLink, 
  Trash2, 
  BookOpen, 
  Sparkles,
  ArrowRight
} from 'lucide-react'

export const metadata = {
  title: 'Shorts Studio — Teacher Dashboard',
  description: 'Manage and upload micro-learning educational shorts.'
}

export default async function TeacherShortsPage() {
  const [courses, shorts] = await Promise.all([
    getTeacherCourses(),
    getShortVideos()
  ])

  const totalViews = shorts.reduce((acc, s) => acc + s.views_count, 0)
  const totalLikes = shorts.reduce((acc, s) => acc + s.likes_count, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Shorts Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Create high-yield 30–60 second micro-lessons to engage students and promote your full courses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shorts"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <span>View Public Feed</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <ShortUploadModal teacherCourses={courses} />
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Published Shorts</span>
            <Video className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {shorts.length}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Active in platform reel</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Total Reel Impressions</span>
            <Eye className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {totalViews.toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Student video views</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Student Hearts & Likes</span>
            <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {totalLikes.toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Positive reactions</p>
        </div>
      </div>

      {/* Shorts Grid / Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Your Published Micro-Lessons ({shorts.length})
          </h2>
          <span className="text-xs text-zinc-400">Click any short to view in reel</span>
        </div>

        {shorts.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Video className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
            <p className="text-sm font-semibold">No shorts published yet.</p>
            <p className="text-xs text-zinc-400 mt-1">
              Click &quot;Create New Short&quot; to post your first clip.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {shorts.map((short) => (
              <div
                key={short.id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-28 rounded-xl overflow-hidden bg-black shrink-0 border border-zinc-200 dark:border-zinc-800">
                    <img
                      src={short.thumbnail_url}
                      alt={short.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[10px] font-mono text-white">
                      {short.duration}s
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {short.title}
                      </span>
                      {short.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-300"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 max-w-xl">
                      {short.description}
                    </p>

                    {short.course_title && (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Attached to: {short.course_title}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {short.views_count.toLocaleString()} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        {short.likes_count.toLocaleString()} likes
                      </span>
                      <span>
                        {(short.comments?.length || 0)} comments
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link
                    href={`/shorts?id=${short.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
                  >
                    <span>Play in Reel</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <form
                    action={async () => {
                      'use server'
                      await deleteShortVideoAction(short.id)
                    }}
                  >
                    <button
                      type="submit"
                      title="Delete Short"
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
