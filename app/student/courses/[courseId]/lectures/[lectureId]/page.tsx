import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourseById, enrollCourse } from '@/actions/course-actions'
import { getLectureDetails } from '@/actions/lecture-actions'
import { toggleLectureCompletion } from '@/actions/progress-actions'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { LectureSidebar } from '@/components/lecture/LectureSidebar'
import { NotesViewer } from '@/components/student/NotesViewer'
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
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
        {/* Video Player */}
        <div className="w-full">
          <VideoPlayer
            videoUrl={
              lecture.video_path ||
              '/videos/sample-short-1.mp4'
            }
            lectureId={lecture.id}
            initialSeconds={lecture.progress?.watched_seconds || 0}
            isCompleted={isCompleted}
          />
        </div>

        {/* Lecture Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-center gap-2">
            {prevLectureId ? (
              <Link
                href={`/student/courses/${courseId}/lectures/${prevLectureId}`}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Lecture</span>
              </Link>
            ) : (
              <span className="text-xs text-zinc-400 italic px-2">First Lecture</span>
            )}
          </div>

          {/* Mark Complete Form Action */}
          <div className="flex items-center gap-3">
            <form
              action={async () => {
                'use server'
                await toggleLectureCompletion(lecture.id, courseId)
              }}
            >
              <button
                type="submit"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCompleted ? 'Completed ✓' : 'Mark as Completed'}</span>
              </button>
            </form>

            {nextLectureId && (
              <Link
                href={`/student/courses/${courseId}/lectures/${nextLectureId}`}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <span>Next Lecture</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Lecture Details & Description */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {chapter.title}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {lecture.title}
            </h1>
          </div>

          <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              About this Lecture
            </h4>
            <p>{lecture.description || 'No lecture description provided.'}</p>
          </div>
        </div>

        {/* PDF Study Material & Notes Viewer */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <NotesViewer notes={lecture.notes} lectureTitle={lecture.title} />
        </div>
      </div>

      {/* Right Lecture Curriculum Sidebar */}
      <LectureSidebar
        courseId={course.id}
        courseTitle={course.title}
        chapters={course.chapters}
        currentLectureId={lecture.id}
      />
    </div>
  )
}
