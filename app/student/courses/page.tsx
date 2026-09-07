import { getCourses } from '@/actions/course-actions'
import { CourseCard } from '@/components/course/CourseCard'
import { CourseFilter } from '@/components/course/CourseFilter'
import { Compass, BookOpen } from 'lucide-react'

export default async function CoursesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const params = await searchParams
  const category = params.category || 'All'
  const search = params.search || ''

  const courses = await getCourses(category, search)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>Course Catalog</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-1">
          Explore All Courses
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Learn from verified master instructors. Enroll in complete multi-chapter courses for free.
        </p>
      </div>

      {/* Filter Component */}
      <CourseFilter initialCategory={category} initialSearch={search} />

      {/* Course Grid */}
      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center bg-white dark:bg-zinc-900">
          <BookOpen className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">No Courses Found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            No courses match the selected category &ldquo;{category}&rdquo; or search query &ldquo;{search}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
