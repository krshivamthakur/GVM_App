import { getAdminPlatformStats } from '@/actions/admin-actions'
import { BarChart, TrendingUp, Award, Layers, Users, BookOpen } from 'lucide-react'

export default async function AdminReportsPage() {
  const stats = await getAdminPlatformStats()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
          <BarChart className="w-4 h-4" />
          <span>Platform Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-1">
          System Reports & Engagement
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Platform-wide enrollment breakdowns, video engagement, and curriculum activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Engagement Breakdown */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Enrollment & Content Distribution</span>
          </h3>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">Published Courses Rate</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.totalCourses > 0 ? Math.round((stats.publishedCourses / stats.totalCourses) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${stats.totalCourses > 0 ? (stats.publishedCourses / stats.totalCourses) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">Teacher Approval Rate</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.totalTeachers + stats.pendingTeachers > 0
                    ? Math.round((stats.totalTeachers / (stats.totalTeachers + stats.pendingTeachers)) * 100)
                    : 100}%
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{
                    width: `${
                      stats.totalTeachers + stats.pendingTeachers > 0
                        ? (stats.totalTeachers / (stats.totalTeachers + stats.pendingTeachers)) * 100
                        : 100
                    }%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Summary Card */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Platform Resource Summary</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-xs text-zinc-500">Video Lessons</span>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats.totalLectures}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-xs text-zinc-500">Total Enrollments</span>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats.totalEnrollments}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-xs text-zinc-500">Learners</span>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats.totalStudents}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-xs text-zinc-500">Instructors</span>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats.totalTeachers}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
