'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { dataStore } from '@/lib/data/store'
import { LectureProgress } from '@/types/database'

export async function updateLectureProgress(
  lectureId: string,
  watchedSeconds: number,
  completed?: boolean,
  studentId?: string
): Promise<LectureProgress> {
  const activeUser = dataStore.getActiveUser()
  const targetStudentId = activeUser.role === 'student' ? activeUser.id : (studentId || activeUser.id)

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('lecture_progress')
      .upsert(
        {
          student_id: targetStudentId,
          lecture_id: lectureId,
          watched_seconds: Math.floor(watchedSeconds),
          completed: completed !== undefined ? completed : false,
          last_watched_at: new Date().toISOString()
        },
        { onConflict: 'student_id,lecture_id' }
      )
      .select()
      .single()

    if (!error && data) {
      dataStore.updateLectureProgress(targetStudentId, lectureId, watchedSeconds, completed)
      return data
    }
  } catch (err) {
    console.warn('Supabase updateLectureProgress fallback:', err)
  }

  const progress = dataStore.updateLectureProgress(targetStudentId, lectureId, watchedSeconds, completed)
  return progress
}

export async function toggleLectureCompletion(
  lectureId: string,
  courseId: string,
  studentId?: string
): Promise<LectureProgress> {
  const activeUser = dataStore.getActiveUser()
  const targetStudentId = activeUser.role === 'student' ? activeUser.id : (studentId || activeUser.id)

  const currentProgress = dataStore.getLectureDetails(lectureId, targetStudentId)?.lecture.progress
  const nextCompleted = currentProgress ? !currentProgress.completed : true

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('lecture_progress')
      .upsert(
        {
          student_id: targetStudentId,
          lecture_id: lectureId,
          watched_seconds: currentProgress?.watched_seconds || 0,
          completed: nextCompleted,
          last_watched_at: new Date().toISOString()
        },
        { onConflict: 'student_id,lecture_id' }
      )
      .select()
      .single()

    if (data) {
      dataStore.toggleLectureCompletion(targetStudentId, lectureId)
      revalidatePath(`/student/courses/${courseId}/lectures/${lectureId}`)
      revalidatePath(`/student/courses/${courseId}`)
      revalidatePath('/student')
      revalidatePath('/student/my-courses')
      return data
    }
  } catch (err) {
    console.warn('Supabase toggleLectureCompletion fallback:', err)
  }

  const progress = dataStore.toggleLectureCompletion(targetStudentId, lectureId)
  revalidatePath(`/student/courses/${courseId}/lectures/${lectureId}`)
  revalidatePath(`/student/courses/${courseId}`)
  revalidatePath('/student')
  revalidatePath('/student/my-courses')
  return progress
}

export async function getRecentLearningActivity(studentId?: string) {
  const activeUser = dataStore.getActiveUser()
  const targetStudentId = activeUser.role === 'student' ? activeUser.id : (studentId || activeUser.id)

  try {
    const supabase = createAdminClient()
    const { data: latest } = await supabase
      .from('lecture_progress')
      .select(`
        *,
        lecture:lectures(*, chapter:chapters(*, course:courses(*)))
      `)
      .eq('student_id', targetStudentId)
      .order('last_watched_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latest && latest.lecture?.chapter?.course) {
      return {
        course: latest.lecture.chapter.course,
        chapter: latest.lecture.chapter,
        lecture: latest.lecture,
        progress: latest
      }
    }
  } catch (err) {
    console.warn('Supabase getRecentLearningActivity fallback:', err)
  }

  return dataStore.getRecentLearningLecture(targetStudentId)
}
