'use client'

import React, { useState, useEffect } from 'react'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { BottomNavigationBar } from './BottomNavigationBar'
import { usePlatformSettings } from '@/contexts/PlatformSettingsContext'
import { X, GraduationCap } from 'lucide-react'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { settings } = usePlatformSettings()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Load user preference for sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('edulms-sidebar-collapsed')
    if (saved === 'true') {
      setIsCollapsed(true)
    }
  }, [])

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('edulms-sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground relative">
      {/* Desktop Collapsible Sidebar (Laptops & Desktops) */}
      <AppSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Mobile & Tablet Drawer Overlay & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-col bg-sidebar border-r border-border p-4 shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-border/80 shadow-xs overflow-hidden p-1">
                  <img
                    src={settings.logoUrl || '/gvm.png'}
                    alt={settings.logoText || settings.platformName || 'Logo'}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-tight text-foreground leading-tight truncate max-w-[150px]">
                    {settings.platformName || 'GVM EduLMS'}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Portal Navigation
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Close Navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-2 -mx-2" onClick={() => setMobileMenuOpen(false)}>
              <AppSidebar isCollapsed={false} onToggleCollapse={() => {}} isMobile={true} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex flex-1 flex-col min-w-0">
        <AppHeader
          onToggleSidebar={toggleCollapse}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 sm:pb-24 lg:pb-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-300">
          {children}
        </main>
      </div>

      {/* Bottom Navigation Bar for Mobile and Tablets only */}
      <BottomNavigationBar />
    </div>
  )
}
