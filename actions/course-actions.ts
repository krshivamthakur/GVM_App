'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { dataStore } from '@/lib/data/store'
import { Course, CourseWithCurriculum, ChapterWithLectures } from '@/types/database'
import { CourseFormData } from '@/types/course'

export async function getCourses(category?: string, search?: string): Promise<Course[]> {
  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('courses')
      .select('*, teacher:Profile(*), chapters:chapters(*, lectures:lectures(*))')
      .eq('status', 'published')

    if (category && category !== 'All') {
      query = query.ilike('category', `%${category}%`)
    }
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (!error && data && data.length > 0) {
      return data.map((c: any) => ({
        ...c,
        _count: {
          enrollments: 0,
          lectures: c.chapters?.flatMap((ch: any) => ch.lectures || []).length || 0
        }
      }))
    }
  } catch (err) {
    console.warn('Supabase getCourses fallback to local store:', err)
  }

  return dataStore.getPublishedCourses(category, search)
}

export async function getTeacherCourses(teacherId?: string): Promise<Course[]> {
  const activeUser = dataStore.getActiveUser()
  const targetId = teacherId || activeUser.id

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('courses')
      .select('*, teacher:Profile(*), chapters:chapters(*, lectures:lectures(*))')
      .eq('teacher_id', targetId)

    if (!error && data && data.length > 0) {
      return data.map((c: any) => ({
        ...c,
        _count: {
          enrollments: 0,
          lectures: c.chapters?.flatMap((ch: any) => ch.lectures || []).length || 0
        }
      }))
    }
  } catch (err) {
    console.warn('Supabase getTeacherCourses fallback:', err)
  }

  return dataStore.getCoursesByTeacher(targetId)
}

export async function getAllCoursesAdmin(): Promise<Course[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('courses')
      .select('*, teacher:Profile(*), chapters:chapters(*, lectures:lectures(*))')

    if (!error && data && data.length > 0) {
      return data.map((c: any) => ({
        ...c,
        _count: {
          enrollments: 0,
          lectures: c.chapters?.flatMap((ch: any) => ch.lectures || []).length || 0
        }
      }))
    }
  } catch (err) {
    console.warn('Supabase getAllCoursesAdmin fallback:', err)
  }

  return dataStore.getAllCourses()
}

export async function getCourseById(
  courseId: string,
  studentId?: string
): Promise<CourseWithCurriculum | null> {
  const activeUser = dataStore.getActiveUser()
  const targetStudentId = activeUser.role === 'student' ? activeUser.id : (studentId || activeUser.id)

  try {
    const supabase = createAdminClient()
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        teacher:Profile(*),
        chapters:chapters(*, lectures:lectures(*, notes:notes(*), progress:lecture_progress(*)))
      `)
      .eq('id', courseId)
      .maybeSingle()

    if (!error && course) {
      // Check student enrollment status
      const { data: enr } = targetStudentId
        ? await supabase
            .from('enrollments')
            .select('id')
            .eq('course_id', courseId)
            .eq('student_id', targetStudentId)
            .maybeSingle()
        : { data: null }

      const isEnrolled = Boolean(enr)

      // Student can ONLY access published courses or courses they are enrolled in
      if (activeUser.role === 'student' && course.status !== 'published' && !isEnrolled) {
        return null
      }

      const chaptersWithLectures: ChapterWithLectures[] = (course.chapters || [])
        .sort((a: any, b: any) => (a.chapter_order || 1) - (b.chapter_order || 1))
        .map((ch: any) => ({
          ...ch,
          lectures: (ch.lectures || [])
            .sort((a: any, b: any) => (a.lecture_order || 1) - (b.lecture_order || 1))
            .map((l: any) => {
              const prog = targetStudentId
                ? l.progress?.find((p: any) => p.student_id === targetStudentId)
                : undefined
              return { ...l, progress: prog }
            })
        }))

      const allLecs = chaptersWithLectures.flatMap((ch) => ch.lectures)
      const completedCount = allLecs.filter((l) => l.progress?.completed).length
      const totalCount = allLecs.length
      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

      return {
        ...course,
        teacher: course.teacher || {
          id: course.teacher_id,
          full_name: 'Instructor',
          email: 'instructor@example.com',
          role: 'teacher',
          created_at: new Date().toISOString()
        },
        chapters: chaptersWithLectures,
        is_enrolled: isEnrolled,
        progress_percentage: progressPercent,
        completed_lectures_count: completedCount,
        total_lectures_count: totalCount,
        _count: {
          enrollments: 1,
          lectures: totalCount
        }
      }
    }
  } catch (err) {
    console.warn('Supabase getCourseById fallback:', err)
  }

  const localCourse = dataStore.getCourseById(courseId, targetStudentId)
  if (localCourse && activeUser.role === 'student' && localCourse.status !== 'published' && !localCourse.is_enrolled) {
    return null
  }
  return localCourse
}

export async function createCourse(data: CourseFormData): Promise<{ success: boolean; course?: Course; error?: string }> {
  const activeUser = dataStore.getActiveUser()
  if (activeUser.role === 'student') {
    return { success: false, error: 'Access denied: Students cannot create courses.' }
  }
  const newCourseId = `00000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`

  try {
    const supabase = createAdminClient()
    const { data: newCourse, error } = await supabase
      .from('courses')
      .insert({
        id: newCourseId,
        teacher_id: activeUser.id,
        title: data.title,
        description: data.description || '',
        category: data.category || 'General',
        thumbnail_url: data.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        status: data.status || 'draft'
      })
      .select()
      .single()

    if (!error && newCourse) {
      await supabase.from('chapters').insert({
        course_id: newCourse.id,
        title: 'Chapter 1 — Introduction & Fundamentals',
        description: 'First module introducing the core topics.',
        chapter_order: 1
      })

      dataStore.createCourse(newCourse)
      revalidatePath('/teacher/courses')
      revalidatePath('/student/courses')
      return { success: true, course: newCourse }
    }
  } catch (err) {
    console.warn('Supabase createCourse error, syncing local store:', err)
  }

  const fallback = dataStore.createCourse({
    teacher_id: activeUser.id,
    title: data.title,
    description: data.description || '',
    category: data.category || 'General',
    thumbnail_url: data.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    status: data.status || 'draft',
    price: data.price || 0
  })

  revalidatePath('/teacher/courses')
  revalidatePath('/student/courses')
  return { success: true, course: fallback }
}

export async function updateCourse(
  courseId: string,
  data: Partial<CourseFormData>
): Promise<{ success: boolean; course?: Course; error?: string }> {
  const activeUser = dataStore.getActiveUser()
  if (activeUser.role === 'student') {
    return { success: false, error: 'Access denied: Students cannot update courses.' }
  }

  try {
    const supabase = createAdminClient()
    const { data: updated } = await supabase
      .from('courses')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select()
      .maybeSingle()

    if (updated) {
      dataStore.updateCourse(courseId, data)
      revalidatePath(`/teacher/courses/${courseId}`)
      revalidatePath('/teacher/courses')
      revalidatePath(`/student/courses/${courseId}`)
      return { success: true, course: updated }
    }
  } catch (err) {
    console.warn('Supabase updateCourse fallback:', err)
  }

  const localUpdated = dataStore.updateCourse(courseId, data)
  revalidatePath(`/teacher/courses/${courseId}`)
  revalidatePath('/teacher/courses')
  revalidatePath(`/student/courses/${courseId}`)
  return { success: !!localUpdated, course: localUpdated || undefined }
}

export async function deleteCourse(courseId: string): Promise<{ success: boolean }> {
  const activeUser = dataStore.getActiveUser()
  if (activeUser.role === 'student') {
    return { success: false }
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('courses').delete().eq('id', courseId)
  } catch (err) {
    console.warn('Supabase deleteCourse error:', err)
  }

  const success = dataStore.deleteCourse(courseId)
  revalidatePath('/teacher/courses')
  revalidatePath('/student/courses')
  return { success }
}

export async function toggleCoursePublish(courseId: string): Promise<{ success: boolean; status?: string }> {
  const activeUser = dataStore.getActiveUser()
  if (activeUser.role === 'student') {
    return { success: false }
  }

  const course = dataStore.getCourseById(courseId)
  const newStatus = course?.status === 'published' ? 'draft' : 'published'

  try {
    const supabase = createAdminClient()
    await supabase
      .from('courses')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', courseId)
  } catch (err) {
    console.warn('Supabase toggleCoursePublish error:', err)
  }

  dataStore.updateCourse(courseId, { status: newStatus })
  revalidatePath('/teacher/courses')
  revalidatePath('/student/courses')
  return { success: true, status: newStatus }
}

export async function enrollCourse(courseId: string, studentId?: string) {
  const activeUser = dataStore.getActiveUser()
  const targetStudentId = activeUser.role === 'student' ? activeUser.id : (studentId || activeUser.id)

  // Students can only enroll in published courses
  const course = dataStore.getCourseById(courseId)
  if (activeUser.role === 'student' && course && course.status !== 'published') {
    return { success: false, error: 'Cannot enroll in an unpublished course.' }
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('enrollments').upsert({
      student_id: targetStudentId,
      course_id: courseId,
      enrolled_at: new Date().toISOString()
    })
  } catch (err) {
    console.warn('Supabase enrollCourse error:', err)
  }

  const enrollment = dataStore.enrollStudent(targetStudentId, courseId)
  revalidatePath(`/student/courses/${courseId}`)
  revalidatePath('/student/my-courses')
  revalidatePath('/student')
  return { success: true, enrollment }
}

export async function getStudentEnrolledCourses(studentId?: string): Promise<CourseWithCurriculum[]> {
  const activeUser = dataStore.getActiveUser()
  const targetStudentId = activeUser.role === 'student' ? activeUser.id : (studentId || activeUser.id)

  try {
    const supabase = createAdminClient()
    const { data: enrs, error } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', targetStudentId)

    if (!error && enrs && enrs.length > 0) {
      const coursePromises = enrs.map((e: any) => getCourseById(e.course_id, targetStudentId))
      const list = await Promise.all(coursePromises)
      const valid = list.filter((c): c is CourseWithCurriculum => c !== null)
      if (valid.length > 0) return valid
    }
  } catch (err) {
    console.warn('Supabase getStudentEnrolledCourses fallback:', err)
  }

  return dataStore.getStudentEnrollments(targetStudentId)
}
