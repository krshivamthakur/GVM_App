'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { dataStore } from '@/lib/data/store'
import { Course, CourseWithCurriculum, ChapterWithLectures } from '@/types/database'
import { CourseFormData } from '@/types/course'

export async function getCourses(category?: string, search?: string): Promise<Course[]> {
  try {
    const supabase = createAdminClient()
    let query = supabase.from('courses').select('*').eq('status', 'published')

    if (category && category !== 'All') {
      query = query.ilike('category', `%${category}%`)
    }
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: rawCourses, error } = await query
    if (!error && rawCourses) {
      if (rawCourses.length === 0) return []
      const courseIds = rawCourses.map((c) => c.id)
      const teacherIds = [...new Set(rawCourses.map((c) => c.teacher_id).filter(Boolean))]

      const [teachersRes, chaptersRes] = await Promise.all([
        teacherIds.length > 0 ? supabase.from('Profile').select('*').in('id', teacherIds) : Promise.resolve({ data: [] }),
        supabase.from('chapters').select('id, course_id').in('course_id', courseIds)
      ])

      const chIds = (chaptersRes.data || []).map((ch) => ch.id)
      const { data: lecs } = chIds.length > 0
        ? await supabase.from('lectures').select('id, chapter_id').in('chapter_id', chIds)
        : { data: [] }

      return rawCourses.map((c) => {
        const t = (teachersRes.data || []).find((p) => p.id === c.teacher_id)
        const chs = (chaptersRes.data || []).filter((ch) => ch.course_id === c.id)
        const chIdsSet = new Set(chs.map((ch) => ch.id))
        const lectureCount = (lecs || []).filter((l) => chIdsSet.has(l.chapter_id)).length

        return {
          ...c,
          teacher: t || undefined,
          _count: {
            enrollments: 0,
            lectures: lectureCount
          }
        }
      })
    }
  } catch (err) {
    console.warn('Supabase getCourses fallback to local store:', err)
  }

  return dataStore.getPublishedCourses(category, search)
}

export async function getTeacherCourses(teacherId?: string): Promise<Course[]> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return []
  if (currentUser.role === 'admin' && !teacherId) {
    return getAllCoursesAdmin()
  }
  const targetId = currentUser.role === 'admin' ? (teacherId || currentUser.id) : currentUser.id

  try {
    const supabase = createAdminClient()
    const { data: rawCourses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('teacher_id', targetId)

    if (!error && rawCourses) {
      if (rawCourses.length === 0) return []
      const courseIds = rawCourses.map((c) => c.id)
      const [teacherRes, chaptersRes] = await Promise.all([
        supabase.from('Profile').select('*').eq('id', targetId).maybeSingle(),
        supabase.from('chapters').select('id, course_id').in('course_id', courseIds)
      ])

      const chIds = (chaptersRes.data || []).map((ch) => ch.id)
      const { data: lecs } = chIds.length > 0
        ? await supabase.from('lectures').select('id, chapter_id').in('chapter_id', chIds)
        : { data: [] }

      return rawCourses.map((c) => {
        const chs = (chaptersRes.data || []).filter((ch) => ch.course_id === c.id)
        const chIdsSet = new Set(chs.map((ch) => ch.id))
        const lectureCount = (lecs || []).filter((l) => chIdsSet.has(l.chapter_id)).length

        return {
          ...c,
          teacher: teacherRes.data || undefined,
          _count: {
            enrollments: 0,
            lectures: lectureCount
          }
        }
      })
    }
  } catch (err) {
    console.warn('Supabase getTeacherCourses fallback:', err)
  }

  return []
}

export async function getAllCoursesAdmin(): Promise<Course[]> {
  try {
    const supabase = createAdminClient()
    const { data: rawCourses, error } = await supabase.from('courses').select('*')

    if (!error && rawCourses) {
      if (rawCourses.length === 0) return []
      const courseIds = rawCourses.map((c) => c.id)
      const teacherIds = [...new Set(rawCourses.map((c) => c.teacher_id).filter(Boolean))]

      const [teachersRes, chaptersRes] = await Promise.all([
        teacherIds.length > 0 ? supabase.from('Profile').select('*').in('id', teacherIds) : Promise.resolve({ data: [] }),
        supabase.from('chapters').select('id, course_id').in('course_id', courseIds)
      ])

      const chIds = (chaptersRes.data || []).map((ch) => ch.id)
      const { data: lecs } = chIds.length > 0
        ? await supabase.from('lectures').select('id, chapter_id').in('chapter_id', chIds)
        : { data: [] }

      return rawCourses.map((c) => {
        const t = (teachersRes.data || []).find((p) => p.id === c.teacher_id)
        const chs = (chaptersRes.data || []).filter((ch) => ch.course_id === c.id)
        const chIdsSet = new Set(chs.map((ch) => ch.id))
        const lectureCount = (lecs || []).filter((l) => chIdsSet.has(l.chapter_id)).length

        return {
          ...c,
          teacher: t || undefined,
          _count: {
            enrollments: 0,
            lectures: lectureCount
          }
        }
      })
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
  const activeUser = (await getCurrentUser()) || dataStore.getActiveUser()
  const targetStudentId = activeUser.role === 'student' ? activeUser.id : (studentId || activeUser.id)

  try {
    const supabase = createAdminClient()
    const { data: rawCourse } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle()

    if (rawCourse) {
      const [teacherRes, chaptersRes, enrRes] = await Promise.all([
        supabase.from('Profile').select('*').eq('id', rawCourse.teacher_id).maybeSingle(),
        supabase.from('chapters').select('*').eq('course_id', courseId).order('chapter_order'),
        targetStudentId
          ? supabase.from('enrollments').select('id').eq('course_id', courseId).eq('student_id', targetStudentId).maybeSingle()
          : Promise.resolve({ data: null })
      ])

      const isEnrolled = Boolean(enrRes.data)

      if (activeUser.role === 'student' && rawCourse.status !== 'published' && !isEnrolled) {
        return null
      }

      const chaptersData = chaptersRes.data || []
      const chIds = chaptersData.map((c) => c.id)

      let lecturesData: any[] = []
      let notesData: any[] = []
      let progressData: any[] = []

      if (chIds.length > 0) {
        const lecsRes = await supabase.from('lectures').select('*').in('chapter_id', chIds).order('lecture_order')
        lecturesData = lecsRes.data || []
        const lecIds = lecturesData.map((l) => l.id)

        if (lecIds.length > 0) {
          const [notesRes, progRes] = await Promise.all([
            supabase.from('notes').select('*').in('lecture_id', lecIds),
            targetStudentId
              ? supabase.from('lecture_progress').select('*').in('lecture_id', lecIds).eq('student_id', targetStudentId)
              : Promise.resolve({ data: [] })
          ])
          notesData = notesRes.data || []
          progressData = progRes.data || []
        }
      }

      const chaptersWithLectures: ChapterWithLectures[] = chaptersData.map((ch) => ({
        ...ch,
        lectures: lecturesData
          .filter((l) => l.chapter_id === ch.id)
          .map((l) => ({
            ...l,
            notes: notesData.filter((n) => n.lecture_id === l.id),
            progress: progressData.find((p) => p.lecture_id === l.id)
          }))
      }))

      const allLecs = chaptersWithLectures.flatMap((ch) => ch.lectures)
      const completedCount = allLecs.filter((l) => l.progress?.completed).length
      const totalCount = allLecs.length
      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

      return {
        ...rawCourse,
        teacher: teacherRes.data || {
          id: rawCourse.teacher_id,
          full_name: 'Instructor',
          email: 'instructor@example.com',
          role: 'teacher',
          created_at: rawCourse.created_at
        },
        chapters: chaptersWithLectures,
        is_enrolled: isEnrolled,
        progress_percentage: progressPercent,
        completed_lectures_count: completedCount,
        total_lectures_count: totalCount,
        _count: {
          enrollments: isEnrolled ? 1 : 0,
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
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) {
    return { success: false, error: 'Access denied: Only teachers and administrators can create courses.' }
  }
  const newCourseId = `00000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`
  const targetTeacherId = currentUser.role === 'admin' && data.teacher_id ? data.teacher_id : currentUser.id

  try {
    const supabase = createAdminClient()
    const { data: newCourse, error } = await supabase
      .from('courses')
      .insert({
        id: newCourseId,
        teacher_id: targetTeacherId,
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
      revalidatePath('/admin/courses')
      revalidatePath('/admin')
      revalidatePath('/teacher/courses')
      revalidatePath('/student/courses')
      return { success: true, course: newCourse }
    }
  } catch (err) {
    console.warn('Supabase createCourse error, syncing local store:', err)
  }

  const fallback = dataStore.createCourse({
    teacher_id: targetTeacherId,
    title: data.title,
    description: data.description || '',
    category: data.category || 'General',
    thumbnail_url: data.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    status: data.status || 'draft',
    price: data.price || 0
  })

  revalidatePath('/admin/courses')
  revalidatePath('/admin')
  revalidatePath('/teacher/courses')
  revalidatePath('/student/courses')
  return { success: true, course: fallback }
}

export async function updateCourse(
  courseId: string,
  data: Partial<CourseFormData>
): Promise<{ success: boolean; course?: Course; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) {
    return { success: false, error: 'Access denied: Only teachers and administrators can update courses.' }
  }

  // Enforce ownership: Teachers can only update their own courses
  if (currentUser.role === 'teacher') {
    const existing = dataStore.getCourseById(courseId)
    if (existing && existing.teacher_id !== currentUser.id) {
      return { success: false, error: 'Forbidden: You can only edit your own courses.' }
    }
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
      revalidatePath('/admin/courses')
      revalidatePath('/admin')
      revalidatePath(`/teacher/courses/${courseId}`)
      revalidatePath('/teacher/courses')
      revalidatePath(`/student/courses/${courseId}`)
      return { success: true, course: updated }
    }
  } catch (err) {
    console.warn('Supabase updateCourse fallback:', err)
  }

  const localUpdated = dataStore.updateCourse(courseId, data)
  revalidatePath('/admin/courses')
  revalidatePath('/admin')
  revalidatePath(`/teacher/courses/${courseId}`)
  revalidatePath('/teacher/courses')
  revalidatePath(`/student/courses/${courseId}`)
  return { success: !!localUpdated, course: localUpdated || undefined }
}

export async function deleteCourse(courseId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) {
    return { success: false, error: 'Unauthorized: Only teachers and administrators can delete courses.' }
  }

  // Enforce ownership: Teachers can only delete their own courses
  if (currentUser.role === 'teacher') {
    const existing = dataStore.getCourseById(courseId)
    if (existing && existing.teacher_id !== currentUser.id) {
      return { success: false, error: 'Forbidden: You can only delete your own courses.' }
    }
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('courses').delete().eq('id', courseId)
  } catch (err) {
    console.warn('Supabase deleteCourse error:', err)
  }

  const success = dataStore.deleteCourse(courseId)
  revalidatePath('/admin/courses')
  revalidatePath('/admin')
  revalidatePath('/teacher/courses')
  revalidatePath('/student/courses')
  return { success }
}


export async function toggleCoursePublish(courseId: string): Promise<{ success: boolean; status?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) {
    return { success: false }
  }

  const course = dataStore.getCourseById(courseId)
  if (!course) return { success: false }

  if (currentUser.role === 'teacher' && course.teacher_id !== currentUser.id) {
    return { success: false }
  }

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
  revalidatePath('/admin/courses')
  revalidatePath('/admin')
  revalidatePath('/teacher/courses')
  revalidatePath('/student/courses')
  return { success: true, status: newStatus }
}

export async function enrollCourse(courseId: string, studentId?: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'Please log in to enroll in courses.' }
  }
  const targetStudentId = currentUser.role === 'student' ? currentUser.id : (studentId || currentUser.id)

  // Students can only enroll in published courses
  const course = dataStore.getCourseById(courseId)
  if (currentUser.role === 'student' && course && course.status !== 'published') {
    return { success: false, error: 'Cannot enroll in an unpublished course.' }
  }

  try {
    const supabase = createAdminClient()
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', targetStudentId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (!existing) {
      await supabase.from('enrollments').insert({
        student_id: targetStudentId,
        course_id: courseId,
        enrolled_at: new Date().toISOString()
      })
    }
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
  const currentUser = await getCurrentUser()
  if (!currentUser) return []
  const targetStudentId = currentUser.role === 'student' ? currentUser.id : (studentId || currentUser.id)

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
