import { getCourses } from '@/actions/course-actions'
import { CourseCatalogClient } from '@/components/course/CourseCatalogClient'
import { Compass, Sparkles } from 'lucide-react'

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Course Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-1">
            Explore All Courses
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Learn from verified master instructors. Join multiple courses to build a comprehensive skillset.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold w-fit">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Unlimited Multi-Course Access</span>
        </div>
      </div>

      {/* Interactive Catalog Client with Batch Join & Status Filters */}
      <CourseCatalogClient
        initialCourses={courses}
        initialCategory={category}
        initialSearch={search}
      />
    </div>
  )
}

