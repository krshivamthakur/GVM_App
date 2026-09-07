'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Profile, UserRole } from '@/types/database'
import { getCurrentUser, switchRole as serverSwitchRole } from '@/actions/auth-actions'

interface AuthContextValue {
  user: Profile | null
  role: UserRole
  isStudent: boolean
  isTeacher: boolean
  isAdmin: boolean
  loading: boolean
  switchRole: (newRole: UserRole) => Promise<Profile | null>
  setUser: (user: Profile | null) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: 'student',
  isStudent: true,
  isTeacher: false,
  isAdmin: false,
  loading: true,
  switchRole: async () => null,
  setUser: () => {},
  refreshUser: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const u = await getCurrentUser()
      setUser(u)
    } catch (e) {
      console.error('Failed to load current user', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const switchRole = async (newRole: UserRole) => {
    setLoading(true)
    try {
      const updatedUser = await serverSwitchRole(newRole)
      setUser(updatedUser)
      return updatedUser
    } finally {
      setLoading(false)
    }
  }

  const role: UserRole = user?.role || 'student'
  const isStudent = role === 'student'
  const isTeacher = role === 'teacher' || role === 'admin'
  const isAdmin = role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isStudent,
        isTeacher,
        isAdmin,
        loading,
        switchRole,
        setUser,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
