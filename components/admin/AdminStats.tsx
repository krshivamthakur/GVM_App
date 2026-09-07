import { Users, GraduationCap, BookOpen, Layers, CheckCircle, Clock, Flame } from 'lucide-react'

interface AdminStatsProps {
  stats: {
    totalStudents: number
    totalTeachers: number
    pendingTeachers: number
    totalCourses: number
    publishedCourses: number
    totalLectures: number
    totalEnrollments: number
    totalShorts?: number
  }
}

export function AdminStats({ stats }: AdminStatsProps) {
  const cards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      sub: 'Active learners',
      icon: GraduationCap,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400'
    },
    {
      title: 'Approved Instructors',
      value: stats.totalTeachers,
      sub: `${stats.pendingTeachers} pending approval`,
      icon: Users,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400'
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      sub: `${stats.publishedCourses} published live`,
      icon: BookOpen,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400'
    },
    {
      title: 'Total Enrollments',
      value: stats.totalEnrollments,
      sub: `${stats.totalLectures} lectures available`,
      icon: Layers,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400'
    },
    {
      title: 'Micro-Shorts',
      value: stats.totalShorts ?? 6,
      sub: 'Bite-sized clips',
      icon: Flame,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{card.title}</span>
              <div className={`p-2 rounded-xl ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{card.value}</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{card.sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
