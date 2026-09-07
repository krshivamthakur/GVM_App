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
    const { data: existing } = await supabase
      .from('lecture_progress')
      .select('id')
      .eq('student_id', targetStudentId)
      .eq('lecture_id', lectureId)
      .maybeSingle()

    let resultData: LectureProgress | null = null

    if (existing?.id) {
      const { data, error } = await supabase
        .from('lecture_progress')
        .update({
          watched_seconds: Math.floor(watchedSeconds),
          completed: completed !== undefined ? completed : false,
          last_watched_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (!error && data) {
        resultData = data
      }
    } else {
      const { data, error } = await supabase
        .from('lecture_progress')
        .insert({
          student_id: targetStudentId,
          lecture_id: lectureId,
          watched_seconds: Math.floor(watchedSeconds),
          completed: completed !== undefined ? completed : false,
          last_watched_at: new Date().toISOString()
        })
        .select()
        .single()

      if (!error && data) {
        resultData = data
      }
    }

    if (resultData) {
      dataStore.updateLectureProgress(targetStudentId, lectureId, watchedSeconds, completed)
      return resultData
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
    const { data: existing } = await supabase
      .from('lecture_progress')
      .select('id, watched_seconds')
      .eq('student_id', targetStudentId)
      .eq('lecture_id', lectureId)
      .maybeSingle()

    let resultData: LectureProgress | null = null

    if (existing?.id) {
      const { data, error } = await supabase
        .from('lecture_progress')
        .update({
          completed: nextCompleted,
          last_watched_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (!error && data) {
        resultData = data
      }
    } else {
      const { data, error } = await supabase
        .from('lecture_progress')
        .insert({
          student_id: targetStudentId,
          lecture_id: lectureId,
          watched_seconds: currentProgress?.watched_seconds || 0,
          completed: nextCompleted,
          last_watched_at: new Date().toISOString()
        })
        .select()
        .single()

      if (!error && data) {
        resultData = data
      }
    }

    if (resultData) {
      dataStore.toggleLectureCompletion(targetStudentId, lectureId)
      revalidatePath(`/student/courses/${courseId}/lectures/${lectureId}`)
      revalidatePath(`/student/courses/${courseId}`)
      revalidatePath('/student')
      revalidatePath('/student/my-courses')
      return resultData
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
      .select('*')
      .eq('student_id', targetStudentId)
      .order('last_watched_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latest) {
      const { data: lecture } = await supabase
        .from('lectures')
        .select('*')
        .eq('id', latest.lecture_id)
        .maybeSingle()

      if (lecture) {
        const { data: chapter } = await supabase
          .from('chapters')
          .select('*')
          .eq('id', lecture.chapter_id)
          .maybeSingle()

        if (chapter) {
          const { data: course } = await supabase
            .from('courses')
            .select('*')
            .eq('id', chapter.course_id)
            .maybeSingle()

          if (course) {
            return {
              course,
              chapter,
              lecture,
              progress: latest
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Supabase getRecentLearningActivity fallback:', err)
  }

  return dataStore.getRecentLearningLecture(targetStudentId)
}
