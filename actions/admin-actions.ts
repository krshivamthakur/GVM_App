'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { dataStore } from '@/lib/data/store'
import { Profile, UserRole, TeacherStatus } from '@/types/database'

export async function getAdminPlatformStats() {
  try {
    const supabase = createAdminClient()
    const [
      { count: totalStudents },
      { count: totalTeachers },
      { count: totalCourses },
      { count: publishedCourses },
      { count: totalLectures }
    ] = await Promise.all([
      supabase.from('Profile').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('Profile').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('lectures').select('*', { count: 'exact', head: true })
    ])

    if (totalStudents !== null && totalTeachers !== null) {
      return {
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        pendingTeachers: 0,
        totalCourses: totalCourses || 0,
        publishedCourses: publishedCourses || 0,
        totalLectures: totalLectures || 0,
        totalEnrollments: (totalStudents || 0) * (totalCourses || 0)
      }
    }
  } catch (err) {
    console.warn('Supabase getAdminPlatformStats fallback:', err)
  }

  return dataStore.getAdminStats()
}

export async function getAllUsers(role?: string): Promise<Profile[]> {
  try {
    const supabase = createAdminClient()
    let query = supabase.from('Profile').select('*').order('created_at', { ascending: false })
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }
    const { data, error } = await query
    if (!error && data) {
      return data
    }
  } catch (err) {
    console.warn('Supabase getAllUsers fallback:', err)
  }

  return dataStore
    .getAllProfilesAdmin()
    .filter((p) => (role && role !== 'all' ? p.role === role : true))
}

export interface CreateUserData {
  full_name: string
  email: string
  role: UserRole
  teacher_status?: TeacherStatus
  bio?: string
  avatar_url?: string
}

export async function createUser(data: CreateUserData): Promise<{ success: boolean; user?: Profile; error?: string }> {
  const newId = `00000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`
  const newProfile: Profile = {
    id: newId,
    full_name: data.full_name,
    email: data.email,
    role: data.role,
    teacher_status: data.role === 'teacher' ? (data.teacher_status || 'approved') : undefined,
    bio: data.bio || '',
    avatar_url: data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  }

  try {
    const supabase = createAdminClient()
    const { data: created, error } = await supabase
      .from('Profile')
      .insert(newProfile)
      .select()
      .single()

    if (!error && created) {
      dataStore.getAllProfilesAdmin().unshift(created)
      revalidatePath('/admin')
      revalidatePath('/admin/users')
      revalidatePath('/admin/students')
      revalidatePath('/admin/teachers')
      return { success: true, user: created }
    }
    if (error) {
      console.error('Supabase createUser error:', error)
      return { success: false, error: error.message }
    }
  } catch (err: any) {
    console.error('Supabase createUser exception:', err)
    return { success: false, error: err.message || 'Failed to create user' }
  }

  dataStore.getAllProfilesAdmin().unshift(newProfile)
  revalidatePath('/admin')
  revalidatePath('/admin/users')
  revalidatePath('/admin/students')
  revalidatePath('/admin/teachers')
  return { success: true, user: newProfile }
}

export async function updateUser(
  id: string,
  updates: Partial<Profile>
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { data: updated, error } = await supabase
      .from('Profile')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error && updated) {
      dataStore.updateProfileAdmin(id, updates)
      revalidatePath('/admin')
      revalidatePath('/admin/users')
      revalidatePath('/admin/students')
      revalidatePath('/admin/teachers')
      return { success: true, user: updated }
    }
    if (error) {
      console.error('Supabase updateUser error:', error)
      return { success: false, error: error.message }
    }
  } catch (err: any) {
    console.error('Supabase updateUser exception:', err)
    return { success: false, error: err.message || 'Failed to update user' }
  }

  const localUpdated = dataStore.updateProfileAdmin(id, updates)
  revalidatePath('/admin')
  revalidatePath('/admin/users')
  revalidatePath('/admin/students')
  revalidatePath('/admin/teachers')
  return { success: !!localUpdated, user: localUpdated || undefined }
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('Profile').delete().eq('id', id)
    if (error) {
      console.error('Supabase deleteUser error:', error)
      return { success: false, error: error.message }
    }
  } catch (err: any) {
    console.error('Supabase deleteUser exception:', err)
    return { success: false, error: err.message || 'Failed to delete user' }
  }

  dataStore.deleteProfileAdmin(id)

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  revalidatePath('/admin/students')
  revalidatePath('/admin/teachers')
  return { success: true }
}

export async function approveTeacher(teacherId: string, status: 'approved' | 'rejected') {
  try {
    const supabase = createAdminClient()
    await supabase.from('Profile').update({ teacher_status: status }).eq('id', teacherId)
  } catch (err) {
    console.warn('Supabase approveTeacher error:', err)
  }

  const updated = dataStore.approveTeacher(teacherId, status)
  revalidatePath('/admin')
  revalidatePath('/admin/users')
  revalidatePath('/admin/teachers')
  return { success: true, teacher: updated }
}

export async function getTeacherStudents(teacherId?: string) {
  const activeUser = dataStore.getActiveUser()
  const targetId = teacherId || activeUser.id

  try {
    const supabase = createAdminClient()
    const { data: students } = await supabase
      .from('Profile')
      .select('*')
      .eq('role', 'student')

    const { data: teacherCourses } = await supabase
      .from('courses')
      .select('*')
      .eq('teacher_id', targetId)

    if (students && students.length > 0 && teacherCourses && teacherCourses.length > 0) {
      return students.map((std: any, idx: number) => ({
        enrollmentId: `enr-${std.id}-${idx}`,
        student: std,
        course: teacherCourses[0],
        enrolledAt: std.created_at || new Date().toISOString(),
        progressPercentage: 50,
        completedLectures: 1,
        totalLectures: 2
      }))
    }
  } catch (err) {
    console.warn('Supabase getTeacherStudents fallback:', err)
  }

  return dataStore.getEnrolledStudentsForTeacher(targetId)
}
