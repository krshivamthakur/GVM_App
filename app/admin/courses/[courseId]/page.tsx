import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourseById } from '@/actions/course-actions'
import { CourseManager } from '@/components/teacher/CourseManager'
import { ArrowLeft, Settings, Eye, BookOpen, ShieldCheck } from 'lucide-react'

export default async function AdminCourseCurriculumPage({
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/courses"
            className="p-2.5 rounded-xl border border-border bg-background hover:bg-accent text-foreground transition-colors"
            title="Back to Platform Courses"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Admin Curriculum Control
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                {course.category}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/student/courses/${course.id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Student Preview</span>
          </Link>

          <Link
            href="/admin/courses"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-accent text-xs font-semibold text-foreground transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>All Courses</span>
          </Link>
        </div>
      </div>

      {/* Interactive Curriculum Manager */}
      <CourseManager course={course} />
    </div>
  )
}
