import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourseById, enrollCourse } from '@/actions/course-actions'
import { getLectureDetails } from '@/actions/lecture-actions'
import { toggleLectureCompletion } from '@/actions/progress-actions'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { LectureSidebar } from '@/components/lecture/LectureSidebar'
import { LectureContentTabs } from '@/components/lecture/LectureContentTabs'
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  FileText, 
  BookOpen, 
  Info,
  Award,
  Lock
} from 'lucide-react'

export default async function LecturePlayerPage({
  params,
}: {
  params: Promise<{ courseId: string; lectureId: string }>
}) {
  const { courseId, lectureId } = await params
  const [course, lectureData] = await Promise.all([
    getCourseById(courseId),
    getLectureDetails(lectureId)
  ])

  if (
    !course ||
    !lectureData ||
    !lectureData.lecture.is_published ||
    (course.status !== 'published' && !course.is_enrolled)
  ) {
    notFound()
  }

  const { lecture, chapter, prevLectureId, nextLectureId } = lectureData
  const isAvailable = Boolean(course.is_enrolled || lecture.is_free_preview)
  const isCompleted = lecture.progress?.completed || false

  if (!isAvailable) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          This Lecture is Locked
        </h2>
        <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
          &quot;{lecture.title}&quot; is part of <strong>{course.title}</strong>. Please enroll in this course to unlock all lectures and downloadable notes.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <form
            action={async () => {
              'use server'
              await enrollCourse(courseId)
            }}
          >
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Enroll in Course
            </button>
          </form>
          <Link
            href={`/student/courses/${courseId}`}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Back to Course Overview
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] -m-4 sm:-m-6 lg:-m-8">
      {/* Main Video & Content Area */}
      <div className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto space-y-4 sm:space-y-6">
        {/* Video Player */}
        <div className="w-full">
          <VideoPlayer
            videoUrl={
              lecture.video_path ||
              '/videos/sample-short-1.mp4'
            }
            lectureId={lecture.id}
            lectureTitle={lecture.title}
            initialSeconds={lecture.progress?.watched_seconds || 0}
            isCompleted={isCompleted}
          />
        </div>

        {/* Mobile & Desktop Standard Lecture Navigation Bar */}
        <div className="flex items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          {/* Previous Lecture */}
          <div className="flex-1 min-w-0">
            {prevLectureId ? (
              <Link
                href={`/student/courses/${courseId}/lectures/${prevLectureId}`}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Previous Lecture"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden text-[11px]">Prev</span>
              </Link>
            ) : (
              <span className="text-xs text-zinc-400 italic px-2">First Lecture</span>
            )}
          </div>

          {/* Mark Complete Form Action */}
          <div className="shrink-0">
            <form
              action={async () => {
                'use server'
                await toggleLectureCompletion(lecture.id, courseId)
              }}
            >
              <button
                type="submit"
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{isCompleted ? 'Completed ✓' : 'Mark as Completed'}</span>
              </button>
            </form>
          </div>

          {/* Next Lecture */}
          <div className="flex-1 min-w-0 flex justify-end">
            {nextLectureId && (
              <Link
                href={`/student/courses/${courseId}/lectures/${nextLectureId}`}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
                title="Next Lecture"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden text-[11px]">Next</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </Link>
            )}
          </div>
        </div>

        {/* Tabbed Content on Mobile, Full Overview + Notes on Desktop */}
        <LectureContentTabs
          courseId={course.id}
          courseTitle={course.title}
          chapterTitle={chapter.title}
          lectureTitle={lecture.title}
          lectureDescription={lecture.description}
          notes={lecture.notes}
          chapters={course.chapters}
          currentLectureId={lecture.id}
        />
      </div>

      {/* Right Lecture Curriculum Sidebar (Visible on Desktop lg+ screens) */}
      <LectureSidebar
        courseId={course.id}
        courseTitle={course.title}
        chapters={course.chapters}
        currentLectureId={lecture.id}
      />
    </div>
  )
}
