'use client'

import Link from 'next/link'
import { ChapterWithLectures } from '@/types/database'
import { PlayCircle, CheckCircle2, FileText, ChevronLeft, Award } from 'lucide-react'

interface LectureSidebarProps {
  courseId: string
  courseTitle: string
  chapters: ChapterWithLectures[]
  currentLectureId: string
}

export function LectureSidebar({
  courseId,
  courseTitle,
  chapters,
  currentLectureId
}: LectureSidebarProps) {
  const allLectures = chapters.flatMap((c) => c.lectures)
  const completedCount = allLectures.filter((l) => l.progress?.completed).length
  const totalCount = allLectures.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <aside className="w-80 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
        <Link
          href={`/student/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium mb-2 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Course Overview
        </Link>
        <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
          {courseTitle}
        </h2>

        {/* Progress summary */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            <span>Course Progress</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {completedCount}/{totalCount} ({progressPercentage}%)
            </span>
          </div>
          <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chapters & Lectures Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-2 space-y-3">
        {chapters.map((chapter, chapIndex) => (
          <div key={chapter.id} className="pt-2">
            <div className="px-2 py-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Ch {chapIndex + 1}: {chapter.title}
            </div>

            <div className="mt-1 space-y-1">
              {chapter.lectures.map((lecture) => {
                const isCurrent = lecture.id === currentLectureId
                const isCompleted = lecture.progress?.completed

                return (
                  <Link
                    key={lecture.id}
                    href={`/student/courses/${courseId}/lectures/${lecture.id}`}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                        : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2
                          className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-emerald-500'}`}
                        />
                      ) : (
                        <PlayCircle
                          className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-zinc-400'}`}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2 leading-snug">{lecture.title}</p>
                      <div
                        className={`flex items-center gap-2 text-[10px] mt-1 ${
                          isCurrent ? 'text-blue-100' : 'text-zinc-400'
                        }`}
                      >
                        <span>{Math.round((lecture.duration || 600) / 60)} mins</span>
                        {lecture.notes && lecture.notes.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <FileText className="w-3 h-3" />
                            PDF Note
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
