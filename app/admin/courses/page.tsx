export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getAllCoursesAdmin, toggleCoursePublish, deleteCourse } from '@/actions/course-actions'
import { BookOpenCheck, ExternalLink, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

export default async function AdminCoursesPage() {
  const courses = await getAllCoursesAdmin()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
          <BookOpenCheck className="w-4 h-4" />
          <span>Curriculum Moderation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-1">
          Platform Course Directory
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Inspect all courses created across the LMS platform, toggle publish states, or moderate content.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            Total Courses ({courses.length})
          </h3>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {courses.map((course) => (
            <div
              key={course.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-4">
                <img
                  src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'}
                  alt={course.title}
                  className="w-20 h-14 rounded-xl object-cover border border-zinc-200 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">
                      {course.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        course.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-1">
                    {course.title}
                  </h4>
                  <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link
                  href={`/student/courses/${course.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Link>

                <form
                  action={async () => {
                    'use server'
                    await toggleCoursePublish(course.id)
                  }}
                >
                  <button
                    type="submit"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      course.status === 'published'
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {course.status === 'published' ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Unpublish</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </>
                    )}
                  </button>
                </form>

                <form
                  action={async () => {
                    'use server'
                    await deleteCourse(course.id)
                  }}
                >
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
