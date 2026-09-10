'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePlatformSettings } from '@/contexts/PlatformSettingsContext'
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  BookmarkCheck,
  UserCircle,
  Video,
  Flame,
  Users,
  UserCheck,
  ShieldCheck,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  ChevronRight,
  GraduationCap,
  MessageSquare,
  Bell
} from 'lucide-react'

interface NavGroup {
  label: string
  items: {
    title: string
    href: string
    icon: React.ElementType
    badge?: string | number
    exact?: boolean
  }[]
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

  // Dynamic portal detection: path prefix takes priority so portal layout always matches current URL
  const portalRole = pathname.startsWith('/admin')
    ? 'admin'
    : pathname.startsWith('/teacher')
    ? 'teacher'
    : pathname.startsWith('/student')
    ? 'student'
    : role

  const isAdmin = portalRole === 'admin'
  const isTeacher = portalRole === 'teacher'
  const isStudent = portalRole === 'student'

  // Generate navigation groups dynamically based on role
  const getNavGroups = (): NavGroup[] => {
    if (isAdmin) {
      return [
        {
          label: 'General',
          items: [
            { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
            { title: 'Platform Analytics', href: '/admin/analytics', icon: BarChart3 },
            { title: 'System Reports', href: '/admin/reports', icon: Sparkles },
          ]
        },
        {
          label: 'Management',
          items: [
            { title: 'Course Management', href: '/admin/courses', icon: BookOpen, badge: 'Full CRUD' },
            { title: 'Shorts Studio', href: '/admin/shorts', icon: Flame, badge: 'Studio' },
            { title: 'User Management', href: '/admin/users', icon: ShieldCheck, badge: 'All' },
            { title: 'Teachers Pipeline', href: '/admin/teachers', icon: UserCheck, badge: 'Review' },
            { title: 'Student Directory', href: '/admin/students', icon: GraduationCap },
            { title: 'Notifications', href: '/admin/notifications', icon: Bell, badge: 'Broadcast' },
            { title: 'Chat & Moderation', href: '/admin/chat', icon: MessageSquare, badge: 'Live' },
          ]
        },
        {
          label: 'Learner Experience',
          items: [
            { title: 'Explore Shorts Feed', href: '/shorts', icon: Video, badge: 'Live' },
          ]
        },
        {
          label: 'Settings',
          items: [
            { title: 'Platform Settings', href: '/admin/settings', icon: Settings }
          ]
        }
      ]
    }

    if (isTeacher) {
      return [
        {
          label: 'General',
          items: [
            { title: 'Dashboard', href: '/teacher', icon: LayoutDashboard, exact: true },
            { title: 'My Courses', href: '/teacher/courses', icon: BookOpen },
          ]
        },
        {
          label: 'Shorts Studio',
          items: [
            { title: 'Upload Short', href: '/teacher/shorts', icon: Video, badge: 'Studio' },
            { title: 'Explore Shorts', href: '/shorts', icon: Flame },
          ]
        },
        {
          label: 'Teaching Hub',
          items: [
            { title: 'Student Progress', href: '/teacher/analytics', icon: BarChart3 },
            { title: 'Student Chat', href: '/student/chat', icon: MessageSquare, badge: 'Live' },
            { title: 'Notifications', href: '/student/notifications', icon: Bell },
            { title: 'Teacher Profile', href: '/teacher/profile', icon: UserCircle },
          ]
        }
      ]
    }

    // Default: Student navigation
    return [
      {
        label: 'General',
        items: [
          { title: 'Dashboard', href: '/student', icon: LayoutDashboard, exact: true },
          { title: '⚡ Micro-Shorts', href: '/shorts', icon: Flame, badge: 'New' },
          { title: 'Explore Courses', href: '/student/courses', icon: Compass },
          { title: 'My Learning', href: '/student/my-courses', icon: BookmarkCheck },
          { title: 'Student Chat', href: '/student/chat', icon: MessageSquare, badge: 'Live' },
          { title: 'Notifications', href: '/student/notifications', icon: Bell },
        ]
      },
      {
        label: 'Account & Settings',
        items: [
          { title: 'Student Profile', href: '/student/profile', icon: UserCircle },
        ]
      }
    ]
  }

  const navGroups = getNavGroups()

  return (
    <aside
      className={`${
        isMobile
          ? 'flex flex-col w-full h-full bg-transparent border-0'
          : `hidden lg:flex flex-col border-r border-border bg-sidebar shrink-0 ${
              isCollapsed ? 'w-16' : 'w-64'
            }`
      } text-sidebar-foreground transition-all duration-300 ease-in-out select-none`}
    >
      {/* Workspace / Brand Header (Only shown on Desktop) */}
      {!isMobile && (
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3.5">
          <Link
            href={isAdmin ? '/admin' : isTeacher ? '/teacher' : '/student'}
            className="flex items-center gap-2.5 overflow-hidden group"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs">
              <GraduationCap className="h-4 w-4" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold tracking-tight truncate leading-tight text-sidebar-foreground">
                  {settings.platformName || 'GVM EduLMS'}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {portalRole} Portal
                </span>
              </div>
            )}
          </Link>
        </div>
      )}

      {/* Grouped Nav Items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!isCollapsed && (
              <h4 className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </h4>
            )}

            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.title : undefined}
                  className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {!isCollapsed && (
                    <>
                      <span className="truncate flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary tracking-wide uppercase">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* User Footer Profile Card */}
      <div className="border-t border-sidebar-border p-2">
        <div
          className={`flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-sidebar-accent/50 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="relative h-8 w-8 shrink-0 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center font-bold text-xs uppercase text-secondary-foreground">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name || 'User'} className="h-full w-full object-cover" />
            ) : (
              <span>{user?.full_name?.charAt(0) || 'U'}</span>
            )}
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">
                {user?.full_name || 'Active User'}
              </span>
              <span className="text-[11px] text-muted-foreground truncate leading-tight">
                {user?.email || 'user@example.com'}
              </span>
            </div>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <div className="mt-1 flex justify-center">
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
