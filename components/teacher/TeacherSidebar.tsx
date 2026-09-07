'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  Users, 
  BarChart3, 
  Video,
  Award,
  Flame
} from 'lucide-react'

export function TeacherSidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/teacher/courses', label: 'My Courses', icon: BookOpen, exact: true },
    { href: '/teacher/shorts', label: '⚡ Shorts Studio', icon: Flame },
    { href: '/teacher/courses/new', label: 'Create New Course', icon: PlusCircle },
    { href: '/teacher/students', label: 'Student Enrollees', icon: Users },
  ]

  return (
    <aside className="w-64 shrink-0 hidden md:block border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 min-h-[calc(100vh-64px)]">
      {/* Teacher Status Badge */}
      <div className="p-3 mb-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/20 border border-purple-100 dark:border-purple-900/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            Teacher Studio
          </span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
            Verified
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
          Manage courses, upload lectures, track students.
        </p>
      </div>

      <div className="space-y-1">
        {links.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Quick Action */}
      <div className="mt-8 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          <Video className="w-3.5 h-3.5 text-purple-600" />
          <span>Upload Content</span>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mb-3 leading-relaxed">
          Add video lectures or PDF study materials to your active chapters.
        </p>
        <Link
          href="/teacher/courses"
          className="block text-center py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors"
        >
          Manage Curriculum
        </Link>
      </div>
    </aside>
  )
}
