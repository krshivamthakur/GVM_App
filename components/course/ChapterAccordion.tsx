'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChapterWithLectures } from '@/types/database'
import { 
  ChevronDown, 
  ChevronUp, 
  PlayCircle, 
  CheckCircle2, 
  Lock, 
  FileText, 
  Clock 
} from 'lucide-react'

interface ChapterAccordionProps {
  chapters: ChapterWithLectures[]
  courseId: string
  isEnrolled: boolean
  currentLectureId?: string
  hrefPrefix?: string // defaults to `/student/courses/${courseId}/lectures`
}

export function ChapterAccordion({
  chapters,
  courseId,
  isEnrolled,
  currentLectureId,
  hrefPrefix
}: ChapterAccordionProps) {
  // Expand first chapter by default
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    [chapters[0]?.id || '']: true
  })

  const toggleChapter = (chapId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapId]: !prev[chapId]
    }))
  }

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '10m'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const baseHref = hrefPrefix || `/student/courses/${courseId}/lectures`

  return (
    <div className="space-y-3">
      {chapters.map((chapter, index) => {
        const isExpanded = expandedChapters[chapter.id] ?? false
        const totalDurationSecs = chapter.lectures.reduce((acc, l) => acc + (l.duration || 0), 0)
        const completedLectures = chapter.lectures.filter((l) => l.progress?.completed).length

        return (
          <div
            key={chapter.id}
            className="overflow-hidden rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
          >
            {/* Chapter Header */}
            <button
              onClick={() => toggleChapter(chapter.id)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    {chapter.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    <span>{chapter.lectures.length} Lectures</span>
                    <span>•</span>
                    <span>{Math.round(totalDurationSecs / 60)} mins</span>
                    {isEnrolled && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {completedLectures}/{chapter.lectures.length} completed
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-1 rounded-md text-zinc-400">
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {/* Lectures List */}
            {isExpanded && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/40">
                {chapter.lectures.length === 0 ? (
                  <div className="p-4 text-xs text-zinc-500 italic">No lectures added yet.</div>
                ) : (
                  chapter.lectures.map((lecture) => {
                    const isCompleted = lecture.progress?.completed
                    const isCurrent = lecture.id === currentLectureId
                    const canAccess = isEnrolled || lecture.is_free_preview

                    return (
                      <div
                        key={lecture.id}
                        className={`flex items-center justify-between p-3.5 pl-6 transition-colors ${
                          isCurrent
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600'
                            : 'hover:bg-white dark:hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : canAccess ? (
                            <PlayCircle className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-blue-600' : 'text-zinc-400'}`} />
                          ) : (
                            <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
                          )}

                          <div className="min-w-0">
                            {canAccess ? (
                              <Link
                                href={`${baseHref}/${lecture.id}`}
                                className={`text-xs font-medium truncate block hover:underline ${
                                  isCurrent
                                    ? 'text-blue-700 dark:text-blue-300 font-semibold'
                                    : 'text-zinc-800 dark:text-zinc-200'
                                }`}
                              >
                                {lecture.title}
                              </Link>
                            ) : (
                              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate block">
                                {lecture.title}
                              </span>
                            )}

                            {lecture.notes && lecture.notes.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                                <FileText className="w-3 h-3 text-indigo-400" />
                                {lecture.notes.length} PDF note{lecture.notes.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {lecture.is_free_preview && !isEnrolled && (
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              Preview
                            </span>
                          )}

                          <span className="flex items-center gap-1 text-xs text-zinc-400">
                            <Clock className="w-3 h-3" />
                            {formatDuration(lecture.duration)}
                          </span>

                          {canAccess && (
                            <Link
                              href={`${baseHref}/${lecture.id}`}
                              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 ml-2"
                            >
                              Play →
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
