import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourseById, enrollCourse } from '@/actions/course-actions'
import { ChapterAccordion } from '@/components/course/ChapterAccordion'
import { 
  PlayCircle, 
  BookOpen, 
  Clock, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  FileText,
  GraduationCap
} from 'lucide-react'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourseById(courseId)

  if (!course || (course.status !== 'published' && !course.is_enrolled)) {
    notFound()
  }

  const allLectures = course.chapters.flatMap((ch) => ch.lectures)
  const totalDurationSecs = allLectures.reduce((acc, l) => acc + (l.duration || 0), 0)
  const firstLectureId = allLectures[0]?.id

  return (
    <div className="space-y-8">
      {/* Course Hero Banner */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                {course.category || 'General'}
              </span>
              {course.is_enrolled && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {course.description}
            </p>

            {/* Instructor Bio */}
            <div className="flex items-center gap-3 pt-2">
              {course.teacher.avatar_url ? (
                <img
                  src={course.teacher.avatar_url}
                  alt={course.teacher.full_name || 'Instructor'}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  {course.teacher.full_name?.charAt(0) || 'I'}
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {course.teacher.full_name}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {course.teacher.bio || 'Senior Subject Expert'}
                </div>
              </div>
            </div>

            {/* Key Meta Stats */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-zinc-400" />
                {course.chapters.length} Chapters
              </span>
              <span className="flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4 text-zinc-400" />
                {allLectures.length} Lectures
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-400" />
                {Math.round(totalDurationSecs / 60)} mins total length
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-zinc-400" />
                {course._count?.enrollments || 0} Students Enrolled
              </span>
            </div>
          </div>

          {/* Right: Enrollment Action Box */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 space-y-5">
            <div className="aspect-video rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 relative">
              <img
                src={course.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>

            {course.is_enrolled ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>Your Learning Progress</span>
                    <span className="text-blue-600 dark:text-blue-400">{course.progress_percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${course.progress_percentage}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {course.completed_lectures_count} of {course.total_lectures_count} lectures completed
                  </span>
                </div>

                {firstLectureId && (
                  <Link
                    href={`/student/courses/${course.id}/lectures/${firstLectureId}`}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
                  >
                    <PlayCircle className="w-4 h-4 fill-white" />
                    <span>Continue Learning</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <form
                  action={async () => {
                    'use server'
                    await enrollCourse(course.id)
                  }}
                >
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Enroll Now (Free)</span>
                  </button>
                </form>

                {firstLectureId && (
                  <Link
                    href={`/student/courses/${course.id}/lectures/${firstLectureId}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <PlayCircle className="w-4 h-4 text-blue-600" />
                    <span>Watch Free Preview</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Curriculum Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Course Curriculum & Lessons
          </h2>
          <span className="text-xs text-zinc-500">
            {course.chapters.length} Chapters • {allLectures.length} Lectures
          </span>
        </div>

        <ChapterAccordion
          chapters={course.chapters}
          courseId={course.id}
          isEnrolled={course.is_enrolled || false}
        />
      </section>
    </div>
  )
}
