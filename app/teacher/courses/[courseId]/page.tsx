import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourseById } from '@/actions/course-actions'
import { CourseManager } from '@/components/teacher/CourseManager'
import { ArrowLeft, Settings, Eye, BookOpen } from 'lucide-react'

export default async function TeacherCourseManagePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourseById(courseId)

  if (!course) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/courses"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Curriculum Manager
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/teacher/courses/${course.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit Settings</span>
          </Link>

          <Link
            href={`/student/courses/${course.id}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 text-xs font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Student View</span>
          </Link>
        </div>
      </div>

      {/* Interactive Course Curriculum Manager */}
      <CourseManager course={course} />
    </div>
  )
}
