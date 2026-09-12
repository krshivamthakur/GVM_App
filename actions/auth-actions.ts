'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { dataStore } from '@/lib/data/store'
import { Profile, UserRole } from '@/types/database'
import { createCometChatUserServer } from '@/lib/cometchat-server'

export async function getCurrentUser(): Promise<Profile | null> {
  try {
    const cookieStore = await cookies()
    const authUserId = cookieStore.get('auth_user_id')?.value

    if (authUserId) {
      // 1. Try Supabase
      try {
        const supabase = createAdminClient()
        let { data: profile } = await supabase
          .from('Profile')
          .select('*')
          .eq('id', authUserId)
          .maybeSingle()

        if (!profile) {
          const res = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUserId)
            .maybeSingle()
          profile = res.data
        }

        if (profile) {
          dataStore.setActiveUser(profile)
          return profile
        }
      } catch (e) {
        console.warn('Supabase getCurrentUser fallback:', e)
      }

      // 2. Try in-memory store
      const local = dataStore.getAllProfilesAdmin().find((p) => p.id === authUserId)
      if (local) {
        dataStore.setActiveUser(local)
        return local
      }
    }
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.digest?.startsWith?.('NEXT_')) {
      throw err
    }
    console.warn('getCurrentUser cookie read error:', err)
  }

  // When no auth session cookie is present, user is unauthenticated
  return null
}

export async function requireAuth(): Promise<Profile> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized: Authentication required.')
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]): Promise<Profile> {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden: Insufficient permissions.')
  }
  return user
}

export async function switchRole(role: UserRole): Promise<Profile | null> {
  const current = await getCurrentUser()
  if (!current) return null

  // Non-admins cannot elevate themselves to admin
  if (role === 'admin' && current.role !== 'admin') {
    return current
  }

  return current
}

export async function updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
  const active = await getCurrentUser()
  if (!active) {
    return null
  }

  // Enforce: Non-admins cannot escalate their role or teacher status
  const safeUpdates: Partial<Profile> = { ...updates }
  if (active.role !== 'admin') {
    delete safeUpdates.role
    delete safeUpdates.teacher_status
  }

  try {
    const supabase = createAdminClient()
    const { data: updated } = await supabase
      .from('Profile')
      .update(safeUpdates)
      .eq('id', active.id)
      .select()
      .maybeSingle()

    if (updated) {
      dataStore.updateProfileAdmin(active.id, safeUpdates)
      revalidatePath('/', 'layout')
      return updated
    }
  } catch (err) {
    console.warn('Supabase updateProfile fallback:', err)
  }

  const updated = dataStore.updateProfileAdmin(active.id, safeUpdates)
  if (updated) {
    revalidatePath('/', 'layout')
    return updated
  }
  return null
}

export async function loginUser(email: string, password?: string) {
  if (!email || !email.trim()) {
    return { success: false, error: 'Please enter your User ID or Email address.' }
  }

  if (!password || password.trim().length < 4) {
    return { success: false, error: 'Please enter a valid password (minimum 4 characters).' }
  }

  const normalized = email.trim().toLowerCase()
  const trimmedPassword = password.trim()
  let user: Profile | null = null

  // 1. Search in Supabase Profile or profiles table
  try {
    const supabase = createAdminClient()

    // Query 1: Try 'Profile' table
    const { data: profiles, error: profileErr } = await supabase.from('Profile').select('*')
    if (!profileErr && profiles && profiles.length > 0) {
      const found = profiles.find(
        (p: Profile) =>
          p.email?.trim().toLowerCase() === normalized ||
          p.full_name?.trim().toLowerCase() === normalized ||
          p.id?.trim().toLowerCase() === normalized
      )
      if (found) user = found
    }

    // Query 2: Try 'profiles' table if not found yet
    if (!user) {
      const { data: lowerProfiles, error: lowerErr } = await supabase.from('profiles').select('*')
      if (!lowerErr && lowerProfiles && lowerProfiles.length > 0) {
        const found = lowerProfiles.find(
          (p: Profile) =>
            p.email?.trim().toLowerCase() === normalized ||
            p.full_name?.trim().toLowerCase() === normalized ||
            p.id?.trim().toLowerCase() === normalized
        )
        if (found) user = found
      }
    }

    // Query 3: Check Supabase Auth users if still not found
    if (!user) {
      try {
        const { data: authData } = await supabase.auth.signInWithPassword({
          email: normalized,
          password: trimmedPassword,
        })
        if (authData?.user) {
          user = {
            id: authData.user.id,
            email: authData.user.email || normalized,
            full_name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || normalized.split('@')[0],
            role: (authData.user.user_metadata?.role as UserRole) || 'student',
            teacher_status: 'approved',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            created_at: authData.user.created_at || new Date().toISOString()
          }
        }
      } catch (authErr) {
        // Auth sign-in attempt fallback
      }
    }
  } catch (err) {
    console.warn('Supabase loginUser query error:', err)
  }

  // 2. Fallback to in-memory dataStore profiles
  if (!user) {
    const all = dataStore.getAllProfilesAdmin()
    const found = all.find(
      (p) =>
        p.email?.trim().toLowerCase() === normalized ||
        p.full_name?.trim().toLowerCase() === normalized ||
        p.id?.trim().toLowerCase() === normalized
    )
    if (found) {
      user = found
    }
  }

  if (!user) {
    return {
      success: false,
      error: `Invalid credentials. No registered account found with email/ID: "${email}".`
    }
  }

  // Verify password if user has a set password
  if (user.password && user.password.trim() !== trimmedPassword) {
    return {
      success: false,
      error: 'Incorrect password. Please verify your credentials and try again.'
    }
  }


  // 3. Set persistent HTTP auth session cookies
  try {
    const cookieStore = await cookies()
    cookieStore.set('auth_user_id', user.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    cookieStore.set('auth_role', user.role, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })
  } catch (err) {
    console.warn('Cookie set error:', err)
  }

  dataStore.setActiveUser(user)
  revalidatePath('/', 'layout')
  return { success: true, user }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('auth_user_id')
    cookieStore.delete('auth_role')
  } catch (err) {
    console.warn('Logout cookie delete error:', err)
  }

  try {
    const supabase = createAdminClient()
    await supabase.auth.signOut()
  } catch (e) {
    // Supabase auth sign-out fallback
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function registerUser(fullName: string, email: string, role: UserRole, password?: string) {
  if (!fullName.trim() || !email.trim()) {
    return { success: false, error: 'Full name and email are required.' }
  }
  if (!password || password.trim().length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' }
  }

  const newId = `00000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`
  const newUser: Profile = {
    id: newId,
    full_name: fullName.trim(),
    email: email.trim().toLowerCase(),
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role,
    teacher_status: role === 'teacher' ? 'pending' : 'approved',
    password: password ? password.trim() : undefined,
    created_at: new Date().toISOString()
  }

  try {
    const supabase = createAdminClient()
    const cleanUser: any = { ...newUser }
    let { error } = await supabase.from('Profile').upsert(cleanUser)
    if (error && error.message?.includes("'teacher_status'")) {
      delete cleanUser.teacher_status
      await supabase.from('Profile').upsert(cleanUser)
    }
  } catch (err) {
    console.warn('Supabase registerUser fallback:', err)
  }

  dataStore.getAllProfilesAdmin().unshift(newUser)
  dataStore.setActiveUser(newUser)

  // Auto-create corresponding chat user in CometChat cloud
  try {
    await createCometChatUserServer(newUser)
  } catch (chatErr) {
    console.warn('Auto create CometChat user warning in registerUser:', chatErr)
  }

  try {
    const cookieStore = await cookies()
    cookieStore.set('auth_user_id', newUser.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })
    cookieStore.set('auth_role', newUser.role, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })
  } catch (err) {
    console.warn('Cookie set error in register:', err)
  }

  revalidatePath('/', 'layout')
  revalidatePath('/admin/chat')
  return { success: true, user: newUser }
}

export async function updateCurrentUserProfile(updates: {
  full_name?: string
  bio?: string
  avatar_url?: string
  password?: string
}): Promise<{ success: boolean; user?: Profile; error?: string }> {
  const current = await getCurrentUser()
  if (!current) {
    return { success: false, error: 'Unauthorized: Please log in to update profile' }
  }

  try {
    const supabase = createAdminClient()
    const { data: updated, error } = await supabase
      .from('Profile')
      .update(updates)
      .eq('id', current.id)
      .select()
      .single()

    if (!error && updated) {
      dataStore.setActiveUser(updated)
      dataStore.updateProfileAdmin(current.id, updates)
      revalidatePath('/student/profile')
      revalidatePath('/teacher/profile')
      revalidatePath('/admin')
      return { success: true, user: updated }
    }
  } catch (err: any) {
    console.warn('Supabase updateCurrentUserProfile fallback:', err)
  }

  const localUpdated = dataStore.updateProfileAdmin(current.id, updates)
  if (localUpdated) {
    dataStore.setActiveUser(localUpdated)
  }
  revalidatePath('/student/profile')
  revalidatePath('/teacher/profile')
  return { success: true, user: localUpdated }
}

