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
  password?: string
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
    password: data.password ? data.password.trim() : undefined,
    created_at: new Date().toISOString()
  }


  const cleanProfile: any = {}
  for (const [k, v] of Object.entries(newProfile)) {
    if (v !== undefined) {
      cleanProfile[k] = v
    }
  }

  try {
    const supabase = createAdminClient()
    let { data: created, error } = await supabase
      .from('Profile')
      .insert(cleanProfile)
      .select()
      .single()

    // If teacher_status column doesn't exist in Supabase schema cache yet, retry without it
    if (error && error.message && error.message.includes("'teacher_status'")) {
      const fallback = { ...cleanProfile }
      delete fallback.teacher_status
      const retry = await supabase
        .from('Profile')
        .insert(fallback)
        .select()
        .single()
      if (!retry.error && retry.data) {
        created = retry.data
        error = null
      }
    }

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
  const cleanUpdates: any = {}
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined) {
      cleanUpdates[k] = v
    }
  }

  try {
    const supabase = createAdminClient()
    let { data: updated, error } = await supabase
      .from('Profile')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single()

    // If teacher_status column does not exist in schema cache yet, retry without it
    if (error && error.message && error.message.includes("'teacher_status'")) {
      const fallback = { ...cleanUpdates }
      delete fallback.teacher_status
      const retry = await supabase
        .from('Profile')
        .update(fallback)
        .eq('id', id)
        .select()
        .single()
      if (!retry.error && retry.data) {
        updated = retry.data
        error = null
      }
    }

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
  const targetId = teacherId || dataStore.getActiveUser().id

  try {
    const supabase = createAdminClient()
    const { data: teacherCourses } = await supabase
      .from('courses')
      .select('id, title, status')
      .eq('teacher_id', targetId)

    if (!teacherCourses || teacherCourses.length === 0) {
      return []
    }

    const courseIds = teacherCourses.map((c) => c.id)

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*')
      .in('course_id', courseIds)

    if (!enrollments || enrollments.length === 0) {
      return []
    }

    const studentIds = [...new Set(enrollments.map((e) => e.student_id))]
    const { data: studentProfiles } = await supabase
      .from('Profile')
      .select('*')
      .in('id', studentIds)

    const profilesMap = new Map((studentProfiles || []).map((p) => [p.id, p]))
    const coursesMap = new Map(teacherCourses.map((c) => [c.id, c]))

    return enrollments.map((enr: any) => ({
      enrollmentId: enr.id,
      student: profilesMap.get(enr.student_id) || { id: enr.student_id, full_name: 'Student', email: '' },
      course: coursesMap.get(enr.course_id) || teacherCourses[0],
      enrolledAt: enr.enrolled_at || enr.created_at || new Date().toISOString(),
      progressPercentage: 0,
      completedLectures: 0,
      totalLectures: 0
    }))
  } catch (err) {
    console.warn('Supabase getTeacherStudents exception:', err)
    return []
  }
}
