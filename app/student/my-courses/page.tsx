import Link from 'next/link'
import { getStudentEnrolledCourses } from '@/actions/course-actions'
import { CourseCard } from '@/components/course/CourseCard'
import { BookmarkCheck, BookOpen, Compass } from 'lucide-react'

export default async function MyCoursesPage() {
  const enrolledCourses = await getStudentEnrolledCourses()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <BookmarkCheck className="w-4 h-4" />
          <span>My Learning</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-1">
          Enrolled Courses ({enrolledCourses.length})
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Track your course completion rate, resume watched videos, and review study materials.
        </p>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center bg-white dark:bg-zinc-900">
          <BookOpen className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">No Enrolled Courses Yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto mb-4">
            Enroll in free courses from our catalog to start building your skills.
          </p>
          <Link
            href="/student/courses"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>Browse All Courses</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {enrolledCourses.map((course) => (
            <CourseCard key={course.id} course={course} showProgress />
          ))}
        </div>
      )}
    </div>
  )
}
