'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Note, ChapterWithLectures } from '@/types/database'
import { NotesViewer } from '@/components/student/NotesViewer'
import { 
  Info, 
  FileText, 
  BookOpen, 
  ListVideo, 
  CheckCircle2, 
  PlayCircle,
  Clock,
  Sparkles
} from 'lucide-react'

interface LectureContentTabsProps {
  courseId: string
  courseTitle: string
  chapterTitle: string
  lectureTitle: string
  lectureDescription?: string
  notes?: Note[]
  chapters: ChapterWithLectures[]
  currentLectureId: string
}

export function LectureContentTabs({
  courseId,
  courseTitle,
  chapterTitle,
  lectureTitle,
  lectureDescription,
  notes = [],
  chapters,
  currentLectureId
}: LectureContentTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'curriculum'>('overview')

  const allLectures = chapters.flatMap((c) => c.lectures)
  const completedCount = allLectures.filter((l) => l.progress?.completed).length
  const totalCount = allLectures.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Mobile Tab Header (Visible on < lg screens) */}
      <div className="lg:hidden flex items-center p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shadow-inner">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'notes'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Notes</span>
          {notes.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
              {notes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('curriculum')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'curriculum'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
          }`}
        >
          <ListVideo className="w-3.5 h-3.5" />
          <span>Playlist</span>
          <span className="text-[10px] text-zinc-400 font-normal">
            ({completedCount}/{totalCount})
          </span>
        </button>
      </div>

      {/* Overview Section: Shown if activeTab === 'overview' on mobile, or always on desktop */}
      <div className={`${activeTab === 'overview' ? 'block' : 'hidden lg:block'} space-y-4`}>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-4 shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {chapterTitle}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {lectureTitle}
            </h1>
          </div>

          <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-1.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              About this Lecture
            </h4>
            <p className="whitespace-pre-line">{lectureDescription || 'No lecture description provided.'}</p>
          </div>
        </div>
      </div>

      {/* Notes Section: Shown if activeTab === 'notes' on mobile, or always on desktop */}
      <div className={`${activeTab === 'notes' ? 'block' : 'hidden lg:block'}`}>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm">
          <NotesViewer notes={notes} lectureTitle={lectureTitle} />
        </div>
      </div>

      {/* Mobile-Only Playlist / Curriculum Section (When 'curriculum' tab selected on mobile) */}
      <div className={`${activeTab === 'curriculum' ? 'block' : 'hidden'} lg:hidden`}>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Course Curriculum
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">{courseTitle}</p>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {progressPercentage}% Completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Chapters and Lectures List */}
          <div className="space-y-4 pt-2">
            {chapters.map((chapter, chapIndex) => (
              <div key={chapter.id} className="space-y-2">
                <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                  Chapter {chapIndex + 1}: {chapter.title}
                </div>

                <div className="space-y-1.5">
                  {chapter.lectures.map((item) => {
                    const isCurrent = item.id === currentLectureId
                    const isDone = item.progress?.completed

                    return (
                      <Link
                        key={item.id}
                        href={`/student/courses/${courseId}/lectures/${item.id}`}
                        className={`flex items-center gap-3 p-3 rounded-xl text-xs transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                            : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className="shrink-0">
                          {isDone ? (
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
                          <p className="line-clamp-1 leading-snug">{item.title}</p>
                          <div
                            className={`flex items-center gap-2 text-[10px] mt-0.5 ${
                              isCurrent ? 'text-blue-100' : 'text-zinc-400'
                            }`}
                          >
                            <span>{Math.round((item.duration || 600) / 60)} mins</span>
                            {item.notes && item.notes.length > 0 && (
                              <span>• {item.notes.length} PDF</span>
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
        </div>
      </div>
    </div>
  )
}
