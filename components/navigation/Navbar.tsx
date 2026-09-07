'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  GraduationCap, 
  BookOpen, 
  Search, 
  Bell, 
  User, 
  LogOut, 
  ShieldAlert,
  Layers,
  Menu,
  X,
  Flame
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { NotificationBellPopover } from '@/components/notifications/NotificationBellPopover'

export function Navbar() {
  const pathname = usePathname()
  const { user, role, isStudent, isTeacher, isAdmin } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Never render during SSR to prevent navbar appearing on initial load of login page
  if (!mounted) return null

  // Hide navbar on auth routes, landing page (login), and portal dashboards
  const hideNavbar =
    !pathname ||
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/student') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/admin')

  if (hideNavbar) return null

  const getPortalHome = () => {
    if (isAdmin) return '/admin'
    if (isTeacher) return '/teacher'
    return '/student'
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href={getPortalHome()} className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
                Education<span className="text-indigo-600 dark:text-indigo-400">LMS</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">
                {role} portal
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isStudent && (
              <>
                <Link
                  href="/student"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/student'
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/student/courses"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/student/courses')
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  Browse Courses
                </Link>
                <Link
                  href="/shorts"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/shorts')
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>Shorts</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white uppercase tracking-wider">
                    New
                  </span>
                </Link>
                <Link
                  href="/student/my-courses"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/student/my-courses'
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  My Courses
                </Link>
              </>
            )}

            {isTeacher && (
              <>
                <Link
                  href="/teacher"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/teacher'
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/teacher/courses"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/teacher/courses')
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  My Courses
                </Link>
                <Link
                  href="/teacher/shorts"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/teacher/shorts'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>Shorts Studio</span>
                </Link>
                <Link
                  href="/teacher/students"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/teacher/students'
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  Enrolled Students
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/admin'
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  href="/admin/teachers"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/admin/teachers'
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  Teacher Approvals
                </Link>
                <Link
                  href="/admin/courses"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/admin/courses'
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  Courses Moderation
                </Link>
                <Link
                  href="/shorts"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/shorts'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>Shorts Feed</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/student/courses"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search courses...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 font-mono">
              /
            </kbd>
          </Link>

          {/* Notification Bell */}
          <NotificationBellPopover />

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* User profile dropdown / indicator */}
          <div className="flex items-center gap-2">
            <Link
              href={isStudent ? '/student/profile' : isTeacher ? '/teacher' : '/admin'}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hidden lg:inline">
                {user?.full_name || 'My Account'}
              </span>
            </Link>

            <Link
              href="/login"
              title="Sign in / Sign out"
              className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-2 pb-4 space-y-1">
          {isStudent && (
            <>
              <Link
                href="/student"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Student Dashboard
              </Link>
              <Link
                href="/student/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Browse Courses
              </Link>
              <Link
                href="/shorts"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Flame className="w-4 h-4 fill-rose-500" />
                <span>⚡ Shorts (Micro-Lessons)</span>
              </Link>
              <Link
                href="/student/my-courses"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                My Enrolled Courses
              </Link>
              <Link
                href="/student/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Profile & Settings
              </Link>
            </>
          )}

          {isTeacher && (
            <>
              <Link
                href="/teacher"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Teacher Dashboard
              </Link>
              <Link
                href="/teacher/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Manage Courses
              </Link>
              <Link
                href="/teacher/courses/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Create New Course
              </Link>
              <Link
                href="/teacher/students"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Students Roster
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Admin Overview
              </Link>
              <Link
                href="/admin/teachers"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Teacher Approvals
              </Link>
              <Link
                href="/admin/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Courses Directory
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
