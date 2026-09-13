'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePlatformSettings } from '@/contexts/PlatformSettingsContext'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import {
  PanelLeft,
  Search,
  Mail,
  Bell,
  Globe,
  ChevronDown,
  User,
  LogOut
} from 'lucide-react'

import { NotificationBellPopover } from '@/components/notifications/NotificationBellPopover'

interface AppHeaderProps {
  onToggleSidebar: () => void
  onToggleMobileMenu: () => void
}

export function AppHeader({ onToggleSidebar, onToggleMobileMenu }: AppHeaderProps) {
  const pathname = usePathname()
  const { user, role, logout } = useAuth()
  const { settings } = usePlatformSettings()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Dynamically determine page title based on authentic route and admin customizations
  const getHeaderTitle = () => {
    // 1. Direct exact match in customized nav labels
    if (settings.navLabels?.[pathname]) {
      return settings.navLabels[pathname]
    }

    // 2. Base portal routes
    if (pathname === '/admin' || pathname === '/teacher' || pathname === '/student') {
      return settings.navLabels?.[pathname] || 'Dashboard'
    }

    // 3. Match longest route prefix from customized navLabels
    const matchingKey = Object.keys(settings.navLabels || {})
      .filter((route) => route !== '/admin' && route !== '/teacher' && route !== '/student' && pathname.startsWith(route))
      .sort((a, b) => b.length - a.length)[0]
    
    if (matchingKey && settings.navLabels?.[matchingKey]) {
      return settings.navLabels[matchingKey]
    }

    if (pathname.includes('/analytics')) return 'Platform Analytics'
    if (pathname.includes('/reports')) return 'System Reports'
    if (pathname.includes('/attendance')) return 'Attendance Management'
    if (pathname.includes('/students')) return 'Student Directory'
    if (pathname.includes('/teachers')) return 'Teachers Pipeline'
    if (pathname.includes('/users')) return 'User Management'
    if (pathname.includes('/fees')) return 'Fee Management'
    if (pathname.includes('/courses')) return 'Course Management'
    if (pathname.includes('/shorts')) return 'Shorts Studio'
    if (pathname.includes('/chat')) return 'Chat & Moderation'
    if (pathname.includes('/notifications')) return 'Notice & Notifications'
    if (pathname.includes('/settings')) return 'Platform Settings'
    if (pathname.includes('/profile')) return 'Profile'
    if (pathname.includes('/my-courses')) return 'My Learning'
    return 'Dashboard'
  }

  // Automatically close profile popover when clicking anywhere outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false)
      }
    }

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileOpen])

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-border/70 bg-card/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      {/* Left: Sidebar Toggle & Page Title */}
      <div className="flex items-center gap-4">
        {/* Desktop Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          type="button"
          aria-label="Toggle Sidebar"
          className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleMobileMenu}
          type="button"
          aria-label="Open Navigation"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        {/* Page Title (Matching 'Dashboard' in Dribbble design) */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {getHeaderTitle()}
        </h1>
      </div>

      {/* Center / Search: Rounded Search Pill */}
      <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search"
            className="h-10 w-full rounded-2xl border border-border/60 bg-muted/40 pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:bg-card transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Language (EN), Mail, Bell, Profile Card */}
      <div className="flex items-center gap-3">
        {/* Language Selector (EN) */}
        <button
          type="button"
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span>EN</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        {/* Mail Icon Button with Badge */}
        <button
          type="button"
          aria-label="Messages"
          className="relative h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <Mail className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-card" />
        </button>

        {/* Notification Bell (Popover) */}
        <NotificationBellPopover />

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* User Profile Card Pill (matching Dribbble screenshot) */}
        <div className="relative ml-1" ref={profileMenuRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            type="button"
            className="flex items-center gap-3 p-1 rounded-2xl hover:bg-muted/60 transition-all cursor-pointer"
          >
            {/* User Avatar */}
            <div className="h-10 w-10 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-xs font-bold uppercase text-blue-600 ring-2 ring-blue-600/20 shadow-xs shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name || 'User'} className="h-full w-full object-cover" />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Carla Peter"
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            {/* Name and Role Subtitle */}
            <div className="hidden lg:flex flex-col text-left min-w-0">
              <span className="text-xs font-bold text-foreground leading-tight truncate">
                {user?.full_name || 'User Profile'}
              </span>
              <span className="text-[11px] text-muted-foreground capitalize leading-tight truncate">
                {role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Instructor' : 'Student'}
              </span>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden lg:block ml-0.5" />
          </button>

          {/* Profile Popover Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl z-50 animate-in fade-in-0 zoom-in-95">
              <div className="px-3 py-2 border-b border-border/60 mb-1">
                <p className="text-xs font-bold leading-none truncate text-foreground">
                  {user?.full_name || 'Active User'}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-1">{user?.email || 'user@example.com'}</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950 text-blue-600">
                  {role === 'admin' ? 'Administrator' : role}
                </span>
              </div>

              <div className="py-1">
                <Link
                  href={role === 'teacher' ? '/teacher/profile' : role === 'admin' ? '/admin/settings' : '/student/profile'}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Profile & Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    setProfileOpen(false)
                    await logout()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-semibold text-left cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
