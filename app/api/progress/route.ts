import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data/store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { lectureId, watchedSeconds, completed, studentId } = body

    if (!lectureId) {
      return NextResponse.json({ error: 'lectureId is required' }, { status: 400 })
    }

    const activeUser = dataStore.getActiveUser()
    const targetStudentId = studentId || activeUser.id

    const progress = dataStore.updateLectureProgress(
      targetStudentId,
      lectureId,
      Math.floor(watchedSeconds || 0),
      completed
    )

    return NextResponse.json({ success: true, progress })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update progress'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
