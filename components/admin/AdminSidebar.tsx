'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  BookOpenCheck, 
  BarChart, 
  ShieldCheck,
  UserPlus,
  GraduationCap
} from 'lucide-react'

export function AdminSidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/admin', label: 'Platform Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin/courses', label: 'Course Management', icon: BookOpenCheck },
    { href: '/admin/shorts', label: 'Shorts Studio', icon: BarChart },
    { href: '/admin/users', label: 'User Management', icon: ShieldCheck },
    { href: '/admin/teachers', label: 'Teachers Pipeline', icon: UserCheck },
    { href: '/admin/students', label: 'Student Directory', icon: GraduationCap },
    { href: '/admin/notifications', label: 'Broadcasts', icon: ShieldCheck },
    { href: '/admin/reports', label: 'System Reports', icon: BarChart },
  ]

  return (
    <aside className="w-64 shrink-0 hidden md:block border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 min-h-[calc(100vh-64px)]">
      {/* Admin Badge */}
      <div className="p-3 mb-4 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/20 border border-rose-100 dark:border-rose-900/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Control
          </span>
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 px-1.5 py-0.5 rounded">
            SuperAdmin
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
          Full user CRUD, teacher onboarding, course moderation.
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
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
