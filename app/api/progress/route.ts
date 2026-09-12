import { NextRequest, NextResponse } from 'next/server'
import { updateLectureProgress } from '@/actions/progress-actions'
import { getCurrentUser } from '@/actions/auth-actions'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { lectureId, watchedSeconds, completed, studentId } = body

    if (!lectureId) {
      return NextResponse.json({ error: 'lectureId is required' }, { status: 400 })
    }

    // Students are strictly restricted to updating their own progress
    const targetStudentId = user.role === 'student' ? user.id : (studentId || user.id)

    const progress = await updateLectureProgress(
      lectureId,
      Math.floor(watchedSeconds || 0),
      completed,
      targetStudentId
    )

    return NextResponse.json({ success: true, progress })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update progress'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
