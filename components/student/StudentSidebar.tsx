'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Compass, 
  BookmarkCheck, 
  UserCircle, 
  GraduationCap, 
  Sparkles,
  Flame
} from 'lucide-react'

export function StudentSidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/shorts', label: '⚡ Shorts Feed', icon: Flame },
    { href: '/student/courses', label: 'Explore Courses', icon: Compass },
    { href: '/student/my-courses', label: 'My Learning', icon: BookmarkCheck },
    { href: '/student/profile', label: 'Student Profile', icon: UserCircle },
  ]

  return (
    <aside className="w-64 shrink-0 hidden md:block border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 min-h-[calc(100vh-64px)]">
      {/* Student Badge & Streak */}
      <div className="p-3 mb-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-indigo-950/40 dark:to-blue-950/20 border border-blue-100 dark:border-indigo-900/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" />
            Student Portal
          </span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 bg-amber-100 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
            <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
            5d Streak
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
          Keep learning to maintain your streak!
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
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Quick Upgrade/Help box */}
      <div className="mt-8 p-3.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-800 text-xs">
        <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Need Doubt Clearing?</span>
        </div>
        <p className="text-zinc-300 text-[11px] leading-relaxed mb-3">
          Join live discussion rooms and ask questions directly on lecture notes.
        </p>
        <Link
          href="/student/courses"
          className="inline-block w-full text-center py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
        >
          Browse Subjects
        </Link>
      </div>
    </aside>
  )
}
