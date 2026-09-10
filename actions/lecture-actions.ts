'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { dataStore } from '@/lib/data/store'
import { Lecture, Chapter, Note } from '@/types/database'
import { LectureFormData, ChapterFormData, NoteFormData } from '@/types/lecture'

export async function createChapter(data: ChapterFormData): Promise<{ success: boolean; chapter?: Chapter; error?: string }> {
  const activeUser = (await getCurrentUser()) || dataStore.getActiveUser()
  if (activeUser.role === 'student') {
    return { success: false, error: 'Access denied: Students cannot manage course curriculum.' }
  }

  try {
    const supabase = createAdminClient()
    const { data: newChap, error } = await supabase
      .from('chapters')
      .insert({
        course_id: data.course_id,
        title: data.title,
        description: data.description || '',
        chapter_order: data.chapter_order || 1
      })
      .select()
      .single()

    if (!error && newChap) {
      dataStore.createChapter(newChap)
      revalidatePath('/admin/courses')
      revalidatePath(`/teacher/courses/${data.course_id}`)
      return { success: true, chapter: newChap }
    }
  } catch (err) {
    console.warn('Supabase createChapter error, writing local:', err)
  }

  const fallback = dataStore.createChapter({
    course_id: data.course_id,
    title: data.title,
    description: data.description || '',
    chapter_order: data.chapter_order || 1
  })
  revalidatePath('/admin/courses')
  revalidatePath(`/teacher/courses/${data.course_id}`)
  return { success: true, chapter: fallback }
}

export async function updateChapter(
  chapterId: string,
  courseId: string,
  data: Partial<ChapterFormData>
): Promise<{ success: boolean; chapter?: Chapter; error?: string }> {
  const activeUser = (await getCurrentUser()) || dataStore.getActiveUser()
  if (activeUser.role === 'student') {
    return { success: false, error: 'Access denied: Students cannot manage course curriculum.' }
  }
  try {
    const supabase = createAdminClient()
    await supabase.from('chapters').update(data).eq('id', chapterId)
  } catch (err) {
    console.warn('Supabase updateChapter error:', err)
  }

  const updated = dataStore.updateChapter(chapterId, data)
  revalidatePath('/admin/courses')
  revalidatePath(`/teacher/courses/${courseId}`)
  return { success: !!updated, chapter: updated || undefined }
}

export async function deleteChapter(chapterId: string, courseId: string): Promise<{ success: boolean }> {
  const activeUser = (await getCurrentUser()) || dataStore.getActiveUser()
  if (activeUser.role === 'student') {
    return { success: false }
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('chapters').delete().eq('id', chapterId)
  } catch (err) {
    console.warn('Supabase deleteChapter error:', err)
  }

  const success = dataStore.deleteChapter(chapterId)
  revalidatePath('/admin/courses')
  revalidatePath(`/teacher/courses/${courseId}`)
  return { success }
}

export async function createLecture(data: LectureFormData, courseId: string): Promise<{ success: boolean; lecture?: Lecture; error?: string }> {
  const activeUser = (await getCurrentUser()) || dataStore.getActiveUser()
  if (activeUser.role === 'student') {
    return { success: false, error: 'Access denied: Students cannot create lectures.' }
  }

  try {
    const supabase = createAdminClient()
    const payload: any = {
      chapter_id: data.chapter_id,
      title: data.title,
      description: data.description || '',
      video_path: data.video_path || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration: data.duration || 600,
      lecture_order: data.lecture_order || 1,
      is_published: data.is_published ?? true,
    }

    if (data.is_free_preview !== undefined) {
      payload.is_free_preview = data.is_free_preview
    }

    let { data: newLec, error } = await supabase
      .from('lectures')
      .insert(payload)
      .select()
      .single()

    // If is_free_preview column doesn't exist yet in Supabase schema, retry without it
    if (error && error.message?.includes('is_free_preview')) {
      delete payload.is_free_preview
      const retry = await supabase.from('lectures').insert(payload).select().single()
      newLec = retry.data
      error = retry.error
    }

    if (!error && newLec) {
      dataStore.createLecture(newLec)
      revalidatePath('/admin/courses')
      revalidatePath(`/teacher/courses/${courseId}`)
      revalidatePath(`/student/courses/${courseId}`)
      return { success: true, lecture: newLec }
    }

    if (error) {
      console.error('Supabase createLecture error:', error)
      return { success: false, error: error.message }
    }
  } catch (err: any) {
    console.error('Supabase createLecture exception:', err)
    return { success: false, error: err.message || 'Failed to create lecture' }
  }

  const fallback = dataStore.createLecture({
    chapter_id: data.chapter_id,
    title: data.title,
    description: data.description || '',
    video_path: data.video_path || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: data.duration || 600,
    lecture_order: data.lecture_order || 1,
    is_published: data.is_published ?? true,
    is_free_preview: data.is_free_preview ?? false
  })
  revalidatePath('/admin/courses')
  revalidatePath(`/teacher/courses/${courseId}`)
  revalidatePath(`/student/courses/${courseId}`)
  return { success: true, lecture: fallback }
}

export async function updateLecture(
  lectureId: string,
  courseId: string,
  data: Partial<LectureFormData>
): Promise<{ success: boolean; lecture?: Lecture; error?: string }> {
  const activeUser = (await getCurrentUser()) || dataStore.getActiveUser()
  if (activeUser.role === 'student') {
    return { success: false, error: 'Access denied: Students cannot update lectures.' }
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('lectures').update(data).eq('id', lectureId)
  } catch (err) {
    console.warn('Supabase updateLecture error:', err)
  }

  const updated = dataStore.updateLecture(lectureId, data)
  revalidatePath('/admin/courses')
  revalidatePath(`/teacher/courses/${courseId}`)
  revalidatePath(`/student/courses/${courseId}`)
  return { success: !!updated, lecture: updated || undefined }
}

export async function deleteLecture(lectureId: string, courseId: string): Promise<{ success: boolean }> {
  const activeUser = (await getCurrentUser()) || dataStore.getActiveUser()
  if (activeUser.role === 'student') {
    return { success: false }
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('lectures').delete().eq('id', lectureId)
  } catch (err) {
    console.warn('Supabase deleteLecture error:', err)
  }

  const success = dataStore.deleteLecture(lectureId)
  revalidatePath('/admin/courses')
  revalidatePath(`/teacher/courses/${courseId}`)
  revalidatePath(`/student/courses/${courseId}`)
  return { success }
}

export async function getLectureDetails(lectureId: string, studentId?: string) {
  const activeUser = (await getCurrentUser()) || dataStore.getActiveUser()
  const targetStudentId = activeUser.role === 'student' ? activeUser.id : (studentId || activeUser.id)

  try {
    const supabase = createAdminClient()
    const { data: lecture } = await supabase
      .from('lectures')
      .select('*')
      .eq('id', lectureId)
      .maybeSingle()

    if (lecture) {
      const [chapterRes, notesRes, progRes] = await Promise.all([
        supabase.from('chapters').select('*').eq('id', lecture.chapter_id).maybeSingle(),
        supabase.from('notes').select('*').eq('lecture_id', lectureId),
        targetStudentId
          ? supabase.from('lecture_progress').select('*').eq('lecture_id', lectureId).eq('student_id', targetStudentId).maybeSingle()
          : Promise.resolve({ data: null })
      ])

      if (chapterRes.data) {
        const { data: course } = await supabase.from('courses').select('*').eq('id', chapterRes.data.course_id).maybeSingle()
        if (course) {
          return {
            lecture: {
              ...lecture,
              notes: notesRes.data || [],
              progress: progRes.data || undefined
            },
            chapter: chapterRes.data,
            course,
            prevLectureId: null,
            nextLectureId: null
          }
        }
      }
    }
  } catch (err) {
    console.warn('Supabase getLectureDetails fallback:', err)
  }

  return dataStore.getLectureDetails(lectureId, targetStudentId)
}

export async function addNoteToLecture(data: NoteFormData, courseId: string): Promise<{ success: boolean; note?: Note; error?: string }> {
  const activeUser = (await getCurrentUser()) || dataStore.getActiveUser()
  if (activeUser.role === 'student') {
    return { success: false, error: 'Access denied: Students cannot add notes.' }
  }

  try {
    const supabase = createAdminClient()
    const { data: newNote, error } = await supabase
      .from('notes')
      .insert({
        lecture_id: data.lecture_id,
        title: data.title,
        file_path: data.file_path,
        file_type: data.file_type || 'application/pdf'
      })
      .select()
      .single()

    if (!error && newNote) {
      dataStore.createNote(newNote)
      revalidatePath('/admin/courses')
      revalidatePath(`/teacher/courses/${courseId}`)
      revalidatePath(`/student/courses/${courseId}`)
      return { success: true, note: newNote }
    }
  } catch (err) {
    console.warn('Supabase addNoteToLecture error:', err)
  }

  const fallback = dataStore.createNote({
    lecture_id: data.lecture_id,
    title: data.title,
    file_path: data.file_path,
    file_type: data.file_type || 'application/pdf'
  })
  revalidatePath('/admin/courses')
  revalidatePath(`/teacher/courses/${courseId}`)
  revalidatePath(`/student/courses/${courseId}`)
  return { success: true, note: fallback }
}

export async function deleteNote(noteId: string, courseId: string): Promise<{ success: boolean }> {
  const activeUser = (await getCurrentUser()) || dataStore.getActiveUser()
  if (activeUser.role === 'student') {
    return { success: false }
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('notes').delete().eq('id', noteId)
  } catch (err) {
    console.warn('Supabase deleteNote error:', err)
  }

  const success = dataStore.deleteNote(noteId)
  revalidatePath('/admin/courses')
  revalidatePath(`/teacher/courses/${courseId}`)
  return { success }
}
