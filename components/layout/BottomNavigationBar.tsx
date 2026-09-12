'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/contexts/NotificationContext'
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Flame,
  Video,
  Bell,
  Users,
  Settings,
  LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavItem {
  title: string
  shortTitle?: string
  href: string
  icon: LucideIcon
  exact?: boolean
  hasBadge?: boolean
  matchPrefixes?: string[]
}

export function BottomNavigationBar() {
  const pathname = usePathname()
  const { role } = useAuth()
  const { unreadCount } = useNotifications()

  // Determine current portal context from URL prefix or fallback to auth role
  const portalRole = pathname.startsWith('/admin')
    ? 'admin'
    : pathname.startsWith('/teacher')
    ? 'teacher'
    : pathname.startsWith('/student')
    ? 'student'
    : role

  // Tab definitions customized by role
  let items: BottomNavItem[] = []

  if (portalRole === 'admin') {
    items = [
      {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        exact: true
      },
      {
        title: 'User Management',
        shortTitle: 'Users',
        href: '/admin/users',
        icon: Users,
        matchPrefixes: ['/admin/users', '/admin/teachers', '/admin/students']
      },
      {
        title: 'Courses',
        href: '/admin/courses',
        icon: BookOpen
      },
      {
        title: 'Notification',
        shortTitle: 'Alerts',
        href: '/admin/notifications',
        icon: Bell,
        hasBadge: true
      },
      {
        title: 'Platform Settings',
        shortTitle: 'Settings',
        href: '/admin/settings',
        icon: Settings
      }
    ]
  } else if (portalRole === 'teacher') {
    items = [
      {
        title: 'Dashboard',
        href: '/teacher',
        icon: LayoutDashboard,
        exact: true
      },
      {
        title: 'My Courses',
        shortTitle: 'Courses',
        href: '/teacher/courses',
        icon: BookOpen
      },
      {
        title: 'Chats',
        href: '/teacher/chat',
        icon: MessageSquare
      },
      {
        title: 'Shorts Studio',
        shortTitle: 'Shorts',
        href: '/teacher/shorts',
        icon: Video,
        matchPrefixes: ['/teacher/shorts', '/shorts']
      },
      {
        title: 'Notification',
        shortTitle: 'Alerts',
        href: '/student/notifications',
        icon: Bell,
        hasBadge: true
      }
    ]
  } else {
    // Default: Student
    items = [
      {
        title: 'Dashboard',
        href: '/student',
        icon: LayoutDashboard,
        exact: true
      },
      {
        title: 'My Courses',
        shortTitle: 'Courses',
        href: '/student/my-courses',
        icon: BookOpen,
        matchPrefixes: ['/student/my-courses', '/student/courses']
      },
      {
        title: 'Chats',
        href: '/student/chat',
        icon: MessageSquare
      },
      {
        title: 'Shorts Studio',
        shortTitle: 'Shorts',
        href: '/shorts',
        icon: Flame
      },
      {
        title: 'Notification',
        shortTitle: 'Alerts',
        href: '/student/notifications',
        icon: Bell,
        hasBadge: true
      }
    ]
  }

  // Hide on auth routes and root
  if (
    !pathname ||
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password')
  ) {
    return null
  }

  const isItemActive = (item: BottomNavItem) => {
    if (item.exact) {
      return pathname === item.href
    }
    if (item.matchPrefixes && item.matchPrefixes.some((p) => pathname.startsWith(p))) {
      return true
    }
    return pathname.startsWith(item.href)
  }

  const isShorts = pathname.startsWith('/shorts')

  return (
    <nav
      aria-label="Mobile and Tablet Navigation"
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 lg:hidden backdrop-blur-lg border-t transition-all',
        isShorts
          ? 'bg-zinc-950/95 border-zinc-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.7)] text-zinc-100'
          : 'bg-background/95 border-border shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.25)]'
      )}
    >
      <div className="max-w-md sm:max-w-2xl mx-auto h-16 px-1.5 sm:px-4 flex items-center justify-around pb-[max(env(safe-area-inset-bottom),0.25rem)]">
        {items.map((item) => {
          const active = isItemActive(item)
          const Icon = item.icon

          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-200 group select-none',
                active
                  ? isShorts
                    ? 'text-rose-400 font-semibold'
                    : 'text-primary font-semibold'
                  : isShorts
                  ? 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40 active:scale-95'
              )}
            >
              {/* Top Active Indicator Pill */}
              {active && (
                <span
                  className={cn(
                    'absolute top-0 w-8 h-0.5 rounded-full shadow-xs animate-in fade-in zoom-in-75 duration-200',
                    isShorts ? 'bg-rose-500 shadow-rose-500/50' : 'bg-primary'
                  )}
                />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    'p-1 rounded-lg transition-transform duration-200',
                    active
                      ? isShorts
                        ? 'bg-rose-500/20 scale-105'
                        : 'bg-primary/10 scale-105'
                      : isShorts
                      ? 'group-hover:scale-105 group-hover:bg-white/5'
                      : 'group-hover:scale-105'
                  )}
                >
                  <Icon className={cn('h-5 w-5 transition-colors', active ? 'stroke-[2.2]' : 'stroke-[1.8]')} />
                </div>

                {/* Unread Notification Badge */}
                {item.hasBadge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[17px] h-4 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center shadow-xs ring-2 ring-background animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>

              {/* Label: Responsive full / short title */}
              <span
                className={cn(
                  'text-[10px] sm:text-[11px] font-medium tracking-tight mt-0.5 text-center truncate max-w-full leading-tight',
                  active
                    ? isShorts
                      ? 'font-semibold text-rose-400'
                      : 'font-semibold text-primary'
                    : isShorts
                    ? 'text-zinc-400 group-hover:text-zinc-200'
                    : 'text-muted-foreground'
                )}
              >
                {item.shortTitle ? (
                  <>
                    <span className="sm:hidden">{item.shortTitle}</span>
                    <span className="hidden sm:inline">{item.title}</span>
                  </>
                ) : (
                  item.title
                )}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
