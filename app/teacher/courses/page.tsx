import Link from 'next/link'
import { getTeacherCourses } from '@/actions/course-actions'
import { Plus, BookOpen, Settings, Eye, Video } from 'lucide-react'

export default async function TeacherCoursesPage() {
  const courses = await getTeacherCourses()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Course Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-1">
            My Created Courses ({courses.length})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Build chapters, upload video files, add PDF study notes, and publish when ready.
          </p>
        </div>

        <Link
          href="/teacher/courses/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {courses.map((course) => {
          const isLive = course.status === 'published'
          return (
            <div
              key={course.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="aspect-video relative bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={course.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-zinc-800 shadow-sm backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-200">
                    {course.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase shadow-sm backdrop-blur text-white ${
                      isLive ? 'bg-emerald-600/90' : 'bg-amber-600/90'
                    }`}
                  >
                    {course.status}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 pt-2">
                    <span>{course._count?.lectures || 0} Lectures</span>
                    <span>•</span>
                    <span>{course._count?.enrollments || 0} Students</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <Link
                    href={`/teacher/courses/${course.id}`}
                    className="flex-1 text-center py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
                  >
                    Manage Curriculum
                  </Link>
                  <Link
                    href={`/teacher/courses/${course.id}/edit`}
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                    title="Edit Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/student/courses/${course.id}`}
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                    title="Student Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
