'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import {
  PanelLeft,
  Search,
  Bell,
  Check,
  Flame,
  User,
  LogOut,
  ExternalLink
} from 'lucide-react'

import { NotificationBellPopover } from '@/components/notifications/NotificationBellPopover'
import { logoutUser } from '@/actions/auth-actions'

interface AppHeaderProps {
  onToggleSidebar: () => void
  onToggleMobileMenu: () => void
}

export function AppHeader({ onToggleSidebar, onToggleMobileMenu }: AppHeaderProps) {
  const { user, role, switchRole } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left: Sidebar Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Desktop Sidebar Toggle (Laptops / Desktops) */}
        <button
          onClick={onToggleSidebar}
          type="button"
          aria-label="Toggle Sidebar"
          className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        {/* Mobile & Tablet Hamburger Toggle */}
        <button
          onClick={onToggleMobileMenu}
          type="button"
          aria-label="Open Navigation"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Right Controls: Command Search, Notifications, ThemeToggle, Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Search Bar (Desktop) */}
        <div className="relative hidden lg:block w-56">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search courses... ⌘K"
            className="h-9 w-full rounded-md border border-border bg-muted/40 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background transition-colors"
          />
        </div>

        {/* Explore Shorts Button */}
        <Link
          href="/shorts"
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
        >
          <Flame className="h-3.5 w-3.5 fill-rose-500" />
          <span>Shorts</span>
        </Link>

        {/* Notifications Popover */}
        <NotificationBellPopover />

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            type="button"
            className="flex items-center gap-2 rounded-full p-0.5 ring-1 ring-border hover:ring-ring transition-all cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary flex items-center justify-center text-xs font-bold uppercase text-secondary-foreground">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name || 'User'} className="h-full w-full object-cover" />
              ) : (
                <span>{user?.full_name?.charAt(0) || 'U'}</span>
              )}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
              <div className="px-2 py-1.5 border-b border-border mb-1">
                <p className="text-xs font-semibold leading-none truncate text-foreground">
                  {user?.full_name || 'User Profile'}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
                <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                  {role}
                </span>
              </div>

              <div className="py-1 border-t border-border">
                <Link
                  href={role === 'teacher' ? '/teacher/profile' : role === 'admin' ? '/admin/settings' : '/student/profile'}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Profile & Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    setProfileOpen(false)
                    await logoutUser()
                    window.location.href = '/'
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-medium text-left"
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
