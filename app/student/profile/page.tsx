import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth-actions'
import { getStudentEnrolledCourses } from '@/actions/course-actions'
import { formatDisplayDate } from '@/lib/utils'
import { 
  UserCircle, 
  Mail, 
  Calendar, 
  Award, 
  Flame, 
  BookOpen, 
  CheckCircle2, 
  Clock
} from 'lucide-react'

export default async function StudentProfilePage() {
  const [user, enrolled] = await Promise.all([
    getCurrentUser(),
    getStudentEnrolledCourses()
  ])

  if (!user) {
    redirect('/')
  }

  const totalLecturesCount = enrolled.reduce((acc, c) => acc + (c.total_lectures_count || 0), 0)
  const completedLecturesCount = enrolled.reduce((acc, c) => acc + (c.completed_lectures_count || 0), 0)

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Student Profile
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your personal details, learning streak, and overall achievement stats.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || 'Student'}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-600/30"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-3xl">
              {user.full_name?.charAt(0) || 'S'}
            </div>
          )}

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {user.full_name}
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Active Student
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span suppressHydrationWarning>Member since {formatDisplayDate(user.created_at)}</span>
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 pt-2 leading-relaxed">
              {user.bio || 'Passionate student learning fullstack software engineering, physics, and science.'}
            </p>
          </div>
        </div>
      </div>

      {/* Learning Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Enrolled Courses</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{enrolled.length}</span>
            <p className="text-[11px] text-zinc-400">Total active courses</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Completed Lectures</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{completedLecturesCount}</span>
            <p className="text-[11px] text-zinc-400">out of {totalLecturesCount} total</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Current Streak</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">5 Days</span>
            <p className="text-[11px] text-zinc-400">Daily learning habit</p>
          </div>
        </div>
      </div>
    </div>
  )
}
