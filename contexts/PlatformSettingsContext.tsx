'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface ChatEngineSettings {
  callingEnabled: boolean
  studentDMsEnabled: boolean
  groupCreationAllowed: boolean
  fileUploadsAllowed: boolean
}

export interface PlatformSettings {
  platformName: string
  supportEmail: string
  defaultLanguage: string
  allowRegistration: boolean
  maintenanceMode: boolean
  teacherApprovalMode: 'manual' | 'auto'
  shortsMaxDuration: string
  shortsCreatorPolicy: 'teachers' | 'all'
  chatEngine: ChatEngineSettings
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'GVM EduLMS',
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
  }
}

const SETTINGS_STORAGE_KEY = 'edulms_platform_settings_v1'

interface PlatformSettingsContextValue {
  settings: PlatformSettings
  updateSettings: (newSettings: Partial<PlatformSettings>) => void
  resetSettings: () => void
  isLoaded: boolean
}

const PlatformSettingsContext = createContext<PlatformSettingsContextValue>({
  settings: DEFAULT_PLATFORM_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
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

  const updateSettings = (newSettings: Partial<PlatformSettings>) => {
    setSettings((prev) => {
      const updated: PlatformSettings = {
        ...prev,
        ...newSettings,
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

  const resetSettings = () => {
    setSettings(DEFAULT_PLATFORM_SETTINGS)
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY)
      window.dispatchEvent(new CustomEvent('edulms_settings_updated', { detail: DEFAULT_PLATFORM_SETTINGS }))
    } catch (e) {}
  }

  return (
    <PlatformSettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoaded }}>
      {children}
    </PlatformSettingsContext.Provider>
  )
}

export function usePlatformSettings() {
  return useContext(PlatformSettingsContext)
}
