'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePlatformSettings } from '@/contexts/PlatformSettingsContext'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  CreditCard,
  BookOpen,
  ClipboardCheck,
  Bus,
  Bell,
  Settings,
  LogOut,
  Flame,
  Video,
  BookmarkCheck,
  Compass,
  Wallet,
  CalendarCheck,
  MessageSquare,
  BarChart3,
  UserCircle,
  TrendingUp,
  ShieldCheck,
  Mail
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  exact?: boolean
  badge?: string | number
}

interface AppSidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobile?: boolean
}

export function AppSidebar({ isCollapsed, onToggleCollapse, isMobile = false }: AppSidebarProps) {
  const pathname = usePathname()
  const { user, role, logout } = useAuth()
  const { settings } = usePlatformSettings()

  const portalRole = pathname.startsWith('/admin')
    ? 'admin'
    : pathname.startsWith('/teacher')
    ? 'teacher'
    : pathname.startsWith('/student')
    ? 'student'
    : role

  const isAdmin = portalRole === 'admin'
  const isTeacher = portalRole === 'teacher'

  const getNavTitle = (href: string, fallback: string) => {
    return settings.navLabels?.[href] || fallback
  }

  // Complete and accurate navigation items mapped to real platform routes
  const adminNavItems: NavItem[] = [
    { title: getNavTitle('/admin', 'Dashboard'), href: '/admin', icon: LayoutDashboard, exact: true },
    { title: getNavTitle('/admin/analytics', 'Analytics'), href: '/admin/analytics', icon: BarChart3 },
    { title: getNavTitle('/admin/reports', 'Reports'), href: '/admin/reports', icon: TrendingUp },
    { title: getNavTitle('/admin/courses', 'Courses'), href: '/admin/courses', icon: BookOpen },
    { title: getNavTitle('/admin/fees', 'Fee Management'), href: '/admin/fees', icon: Wallet },
    { title: getNavTitle('/admin/attendance', 'Attendance'), href: '/admin/attendance', icon: CalendarCheck },
    { title: getNavTitle('/admin/students', 'Students'), href: '/admin/students', icon: GraduationCap },
    { title: getNavTitle('/admin/teachers', 'Teachers'), href: '/admin/teachers', icon: UserCheck },
    { title: getNavTitle('/admin/users', 'Users'), href: '/admin/users', icon: ShieldCheck },
    { title: getNavTitle('/admin/shorts', 'Shorts Studio'), href: '/admin/shorts', icon: Flame },
    { title: getNavTitle('/admin/chat', 'Chat & Moderation'), href: '/admin/chat', icon: MessageSquare },
    { title: getNavTitle('/admin/notifications', 'Notifications'), href: '/admin/notifications', icon: Bell },
    { title: getNavTitle('/admin/mail', 'Mail & Setups'), href: '/admin/mail', icon: Mail },
    { title: getNavTitle('/admin/settings', 'Settings'), href: '/admin/settings', icon: Settings },
  ]

  const teacherNavItems: NavItem[] = [
    { title: getNavTitle('/teacher', 'Dashboard'), href: '/teacher', icon: LayoutDashboard, exact: true },
    { title: getNavTitle('/teacher/courses', 'My Courses'), href: '/teacher/courses', icon: BookOpen },
    { title: getNavTitle('/teacher/attendance', 'Attendance'), href: '/teacher/attendance', icon: CalendarCheck },
    { title: getNavTitle('/teacher/students', 'Students'), href: '/teacher/students', icon: GraduationCap },
    { title: getNavTitle('/teacher/analytics', 'Progress'), href: '/teacher/analytics', icon: BarChart3 },
    { title: getNavTitle('/teacher/shorts', 'Shorts Studio'), href: '/teacher/shorts', icon: Video },
    { title: getNavTitle('/teacher/chat', 'Faculty Chat'), href: '/teacher/chat', icon: MessageSquare },
    { title: getNavTitle('/student/notifications', 'Notice'), href: '/student/notifications', icon: Bell },
    { title: getNavTitle('/teacher/profile', 'Profile'), href: '/teacher/profile', icon: UserCircle },
  ]

  const studentNavItems: NavItem[] = [
    { title: getNavTitle('/student', 'Dashboard'), href: '/student', icon: LayoutDashboard, exact: true },
    { title: getNavTitle('/student/courses', 'Explore Courses'), href: '/student/courses', icon: Compass },
    { title: getNavTitle('/student/my-courses', 'My Learning'), href: '/student/my-courses', icon: BookmarkCheck },
    { title: getNavTitle('/shorts', 'Shorts Feed'), href: '/shorts', icon: Flame },
    { title: getNavTitle('/student/fees', 'Fees & Receipts'), href: '/student/fees', icon: Wallet },
    { title: getNavTitle('/student/attendance', 'My Attendance'), href: '/student/attendance', icon: CalendarCheck },
    { title: getNavTitle('/student/chat', 'Student Chat'), href: '/student/chat', icon: MessageSquare },
    { title: getNavTitle('/student/notifications', 'Notifications'), href: '/student/notifications', icon: Bell },
    { title: getNavTitle('/student/profile', 'Profile'), href: '/student/profile', icon: UserCircle },
  ]

  const currentNavItems = isAdmin
    ? adminNavItems
    : isTeacher
    ? teacherNavItems
    : studentNavItems

  return (
    <aside
      className={`${
        isMobile
          ? 'flex flex-col w-full h-full bg-transparent border-0'
          : `hidden lg:flex flex-col border-r border-border/70 bg-card shrink-0 ${
              isCollapsed ? 'w-20' : 'w-60'
            }`
      } text-foreground transition-all duration-300 ease-in-out select-none`}
    >
      {/* Brand Header with Logo Mark */}
      {!isMobile && (
        <div className="flex h-20 items-center px-6">
          <Link
            href={isAdmin ? '/admin' : isTeacher ? '/teacher' : '/student'}
            className="flex items-center gap-3 overflow-hidden group"
          >
            {/* Logo Emblem */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-border/80 shadow-xs overflow-hidden p-1">
              <img
                src={settings.logoUrl || "/gvm.png"}
                alt={settings.logoText || settings.platformName || "Logo"}
                className="h-full w-full object-contain"
              />
            </div>

            {!isCollapsed && (
              <span className="text-xl font-bold tracking-tight text-foreground truncate max-w-[130px]">
                {settings.logoText || settings.platformName || "GVM"}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* Main Navigation Links with Left Blue Active Bar */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-1">
        {currentNavItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.title : undefined}
              className={`group relative flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'text-blue-600 font-semibold bg-blue-50/60 dark:bg-blue-950/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              {/* Left Blue Pill Active Indicator (matching screenshot) */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-full shadow-xs shadow-blue-600/50" />
              )}

              <Icon
                className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />

              {!isCollapsed && (
                <span className="truncate flex-1">{item.title}</span>
              )}

              {!isCollapsed && item.badge && (
                <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Bottom Log out Action Link */}
      <div className="p-3 border-t border-border/60">
        <button
          type="button"
          onClick={logout}
          title={isCollapsed ? 'Log out' : undefined}
          className={`group relative flex w-full items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0 text-muted-foreground group-hover:text-rose-600 transition-colors" />
          {!isCollapsed && <span className="truncate">Log out</span>}
        </button>
      </div>
    </aside>
  )
}
