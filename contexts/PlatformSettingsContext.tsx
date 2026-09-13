'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface ChatEngineSettings {
  callingEnabled: boolean
  studentDMsEnabled: boolean
  groupCreationAllowed: boolean
  fileUploadsAllowed: boolean
}

export interface BottomNavItemLabel {
  title: string
  shortTitle?: string
}

export interface PlatformSettings {
  platformName: string
  logoUrl?: string
  logoText?: string
  supportEmail: string
  defaultLanguage: string
  allowRegistration: boolean
  maintenanceMode: boolean
  teacherApprovalMode: 'manual' | 'auto'
  shortsMaxDuration: string
  shortsCreatorPolicy: 'teachers' | 'all'
  chatEngine: ChatEngineSettings
  navLabels?: Record<string, string>
  bottomNavLabels?: Record<string, BottomNavItemLabel>
  courseCategories?: string[]
}

export const DEFAULT_NAV_LABELS: Record<string, string> = {
  // Admin Sidebar Nav
  '/admin': 'Dashboard',
  '/admin/analytics': 'Analytics',
  '/admin/reports': 'Reports',
  '/admin/courses': 'Courses',
  '/admin/fees': 'Fee Management',
  '/admin/attendance': 'Attendance',
  '/admin/students': 'Students',
  '/admin/teachers': 'Teachers',
  '/admin/users': 'Users',
  '/admin/shorts': 'Shorts Studio',
  '/admin/chat': 'Chat & Moderation',
  '/admin/notifications': 'Notifications',
  '/admin/settings': 'Settings',

  // Teacher Sidebar Nav
  '/teacher': 'Dashboard',
  '/teacher/courses': 'My Courses',
  '/teacher/attendance': 'Attendance',
  '/teacher/students': 'Students',
  '/teacher/analytics': 'Progress',
  '/teacher/shorts': 'Shorts Studio',
  '/teacher/chat': 'Faculty Chat',
  '/student/notifications': 'Notifications',
  '/teacher/profile': 'Profile',

  // Student Sidebar Nav
  '/student': 'Dashboard',
  '/student/courses': 'Explore Courses',
  '/student/my-courses': 'My Learning',
  '/shorts': 'Shorts Feed',
  '/student/fees': 'Fees & Receipts',
  '/student/attendance': 'My Attendance',
  '/student/chat': 'Student Chat',
  '/student/profile': 'Profile'
}

export const DEFAULT_BOTTOM_NAV_LABELS: Record<string, BottomNavItemLabel> = {
  // Admin Bottom Nav
  '/admin': { title: 'Dashboard', shortTitle: 'Home' },
  '/admin/users': { title: 'User Management', shortTitle: 'Users' },
  '/admin/courses': { title: 'Courses', shortTitle: 'Courses' },
  '/admin/notifications': { title: 'Notification', shortTitle: 'Alerts' },
  '/admin/settings': { title: 'Platform Settings', shortTitle: 'Settings' },

  // Teacher Bottom Nav
  '/teacher': { title: 'Dashboard', shortTitle: 'Home' },
  '/teacher/courses': { title: 'My Courses', shortTitle: 'Courses' },
  '/teacher/chat': { title: 'Chats', shortTitle: 'Chats' },
  '/teacher/shorts': { title: 'Shorts Studio', shortTitle: 'Shorts' },

  // Student Bottom Nav
  '/student': { title: 'Dashboard', shortTitle: 'Home' },
  '/student/my-courses': { title: 'My Courses', shortTitle: 'Courses' },
  '/student/chat': { title: 'Chats', shortTitle: 'Chats' }
}

export const DEFAULT_COURSE_CATEGORIES: string[] = [
  'Programming',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Biology',
  'General'
]

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'GVM EduLMS',
  logoUrl: '/gvm.png',
  logoText: 'GVM',
  supportEmail: 'support@gvmedu.com',
  defaultLanguage: 'en',
  allowRegistration: true,
  maintenanceMode: false,
  teacherApprovalMode: 'manual',
  shortsMaxDuration: '60',
  shortsCreatorPolicy: 'teachers',
  chatEngine: {
    callingEnabled: true,
    studentDMsEnabled: true,
    groupCreationAllowed: true,
    fileUploadsAllowed: true
  },
  navLabels: { ...DEFAULT_NAV_LABELS },
  bottomNavLabels: { ...DEFAULT_BOTTOM_NAV_LABELS },
  courseCategories: [...DEFAULT_COURSE_CATEGORIES]
}

const SETTINGS_STORAGE_KEY = 'edulms_platform_settings_v1'

interface PlatformSettingsContextValue {
  settings: PlatformSettings
  updateSettings: (newSettings: Partial<PlatformSettings>) => void
  resetSettings: () => void
  addCourseCategory: (category: string) => boolean
  deleteCourseCategory: (category: string) => boolean
  updateCourseCategory: (oldCategory: string, newCategory: string) => boolean
  resetCourseCategories: () => void
  isLoaded: boolean
}

const PlatformSettingsContext = createContext<PlatformSettingsContextValue>({
  settings: DEFAULT_PLATFORM_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
  addCourseCategory: () => false,
  deleteCourseCategory: () => false,
  updateCourseCategory: () => false,
  resetCourseCategories: () => {},
  isLoaded: false
})

export function PlatformSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings((prev) => ({
          ...prev,
          ...parsed,
          logoUrl: parsed.logoUrl || prev.logoUrl,
          logoText: parsed.logoText || prev.logoText,
          courseCategories: parsed.courseCategories || prev.courseCategories || DEFAULT_COURSE_CATEGORIES,
          navLabels: {
            ...prev.navLabels,
            ...(parsed.navLabels || {})
          },
          bottomNavLabels: {
            ...prev.bottomNavLabels,
            ...(parsed.bottomNavLabels || {})
          },
          chatEngine: {
            ...prev.chatEngine,
            ...(parsed.chatEngine || {})
          }
        }))
      }
    } catch (e) {
      console.error('Failed to load platform settings from localStorage', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Dynamic Browser Title and Favicon Synchronization
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (settings.platformName) {
        document.title = settings.platformName
      }
      if (settings.logoUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
        if (!link) {
          link = document.createElement('link')
          link.rel = 'icon'
          document.getElementsByTagName('head')[0].appendChild(link)
        }
        link.href = settings.logoUrl
      }
    }
  }, [settings.platformName, settings.logoUrl])

  // Listen for cross-tab or cross-window updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          setSettings((prev) => ({
            ...prev,
            ...parsed
          }))
        } catch {}
      }
    }

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail) {
        setSettings(e.detail)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('edulms_settings_updated' as any, handleCustomEvent)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('edulms_settings_updated' as any, handleCustomEvent)
    }
  }, [])

  const updateSettings = (newSettings: Partial<PlatformSettings>) => {
    setSettings((prev) => {
      const updated: PlatformSettings = {
        ...prev,
        ...newSettings,
        navLabels: newSettings.navLabels
          ? { ...prev.navLabels, ...newSettings.navLabels }
          : prev.navLabels,
        bottomNavLabels: newSettings.bottomNavLabels
          ? { ...prev.bottomNavLabels, ...newSettings.bottomNavLabels }
          : prev.bottomNavLabels,
        courseCategories: newSettings.courseCategories
          ? [...newSettings.courseCategories]
          : prev.courseCategories,
        chatEngine: newSettings.chatEngine
          ? { ...prev.chatEngine, ...newSettings.chatEngine }
          : prev.chatEngine
      }
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated))
        // Dispatch custom event for cross-component and cross-tab sync
        window.dispatchEvent(new CustomEvent('edulms_settings_updated', { detail: updated }))
      } catch (e) {
        console.error('Failed to persist settings to localStorage', e)
      }
      return updated
    })
  }

  const addCourseCategory = (category: string): boolean => {
    const trimmed = category.trim()
    if (!trimmed) return false
    const existing = settings.courseCategories || DEFAULT_COURSE_CATEGORIES
    if (existing.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return false
    }
    updateSettings({ courseCategories: [...existing, trimmed] })
    return true
  }

  const deleteCourseCategory = (category: string): boolean => {
    const trimmed = category.trim().toLowerCase()
    const existing = settings.courseCategories || DEFAULT_COURSE_CATEGORIES
    const updated = existing.filter((c) => c.toLowerCase() !== trimmed)
    updateSettings({ courseCategories: updated })
    return true
  }

  const updateCourseCategory = (oldCategory: string, newCategory: string): boolean => {
    const trimmedNew = newCategory.trim()
    if (!trimmedNew) return false
    const existing = settings.courseCategories || DEFAULT_COURSE_CATEGORIES
    const existsOther = existing.some(
      (c) => c.toLowerCase() !== oldCategory.toLowerCase() && c.toLowerCase() === trimmedNew.toLowerCase()
    )
    if (existsOther) return false
    const updated = existing.map((c) => (c.toLowerCase() === oldCategory.toLowerCase() ? trimmedNew : c))
    updateSettings({ courseCategories: updated })
    return true
  }

  const resetCourseCategories = () => {
    updateSettings({ courseCategories: [...DEFAULT_COURSE_CATEGORIES] })
  }

  const resetSettings = () => {
    setSettings(DEFAULT_PLATFORM_SETTINGS)
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY)
      window.dispatchEvent(new CustomEvent('edulms_settings_updated', { detail: DEFAULT_PLATFORM_SETTINGS }))
    } catch (e) {}
  }

  return (
    <PlatformSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        addCourseCategory,
        deleteCourseCategory,
        updateCourseCategory,
        resetCourseCategories,
        isLoaded
      }}
    >
      {children}
    </PlatformSettingsContext.Provider>
  )
}

export function usePlatformSettings() {
  return useContext(PlatformSettingsContext)
}
