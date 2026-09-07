'use client'

import { useState } from 'react'
import { CourseWithCurriculum } from '@/types/database'
import { 
  createChapter, 
  deleteChapter, 
  createLecture, 
  deleteLecture, 
  addNoteToLecture, 
  deleteNote 
} from '@/actions/lecture-actions'
import { toggleCoursePublish } from '@/actions/course-actions'
import { 
  Plus, 
  Trash2, 
  Video, 
  FileText, 
  Globe, 
  EyeOff, 
  Check, 
  UploadCloud, 
  ChevronDown, 
  ChevronUp, 
  PlaySquare,
  Sparkles,
  Layers
} from 'lucide-react'

export function CourseManager({ course }: { course: CourseWithCurriculum }) {
  const [isPublished, setIsPublished] = useState(course.status === 'published')
  const [isTogglingPublish, setIsTogglingPublish] = useState(false)

  // Chapter modal state
  const [showAddChapter, setShowAddChapter] = useState(false)
  const [chapterTitle, setChapterTitle] = useState('')
  const [chapterDesc, setChapterDesc] = useState('')

  // Lecture modal state
  const [activeChapterForLecture, setActiveChapterForLecture] = useState<string | null>(null)
  const [lectureTitle, setLectureTitle] = useState('')
  const [lectureDesc, setLectureDesc] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [durationMins, setDurationMins] = useState(15)
  const [isFreePreview, setIsFreePreview] = useState(false)
  const [pdfTitle, setPdfTitle] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')

  // Submitting states
  const [submitting, setSubmitting] = useState(false)

  const handleTogglePublish = async () => {
    setIsTogglingPublish(true)
    try {
      const res = await toggleCoursePublish(course.id)
      if (res.success) {
        setIsPublished(res.status === 'published')
      }
    } finally {
      setIsTogglingPublish(false)
    }
  }

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chapterTitle.trim()) return
    setSubmitting(true)
    try {
      await createChapter({
        course_id: course.id,
        title: chapterTitle,
        description: chapterDesc,
        chapter_order: (course.chapters.length || 0) + 1
      })
      setChapterTitle('')
      setChapterDesc('')
      setShowAddChapter(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeChapterForLecture || !lectureTitle.trim()) return
    setSubmitting(true)
    try {
      const targetChap = course.chapters.find((c) => c.id === activeChapterForLecture)
      const lecRes = await createLecture(
        {
          chapter_id: activeChapterForLecture,
          title: lectureTitle,
          description: lectureDesc,
          video_path: videoUrl || '/videos/sample-short-1.mp4',
          duration: (durationMins || 10) * 60,
          lecture_order: (targetChap?.lectures.length || 0) + 1,
          is_free_preview: isFreePreview,
          is_published: true
        },
        course.id
      )

      // Attach PDF notes if provided
      if (lecRes.lecture && pdfTitle.trim()) {
        await addNoteToLecture(
          {
            lecture_id: lecRes.lecture.id,
            title: pdfTitle,
            file_path: pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            file_type: 'application/pdf'
          },
          course.id
        )
      }

      // Reset modal
      setLectureTitle('')
      setLectureDesc('')
      setVideoUrl('')
      setPdfTitle('')
      setPdfUrl('')
      setIsFreePreview(false)
      setActiveChapterForLecture(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteChapter = async (chapId: string) => {
    if (confirm('Delete this chapter and all its lectures?')) {
      await deleteChapter(chapId, course.id)
    }
  }

  const handleDeleteLecture = async (lecId: string) => {
    if (confirm('Delete this lecture?')) {
      await deleteLecture(lecId, course.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isPublished
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {isPublished ? 'Live & Published' : 'Draft Mode'}
            </span>
            <span className="text-xs text-zinc-500">• {course.category}</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Organize chapters, upload video lessons, and attach PDF study notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddChapter(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chapter</span>
          </button>

          <button
            onClick={handleTogglePublish}
            disabled={isTogglingPublish}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
              isPublished
                ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
            }`}
          >
            {isPublished ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Unpublish Course</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                <span>Publish Course</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chapters & Lectures Curriculum List */}
      <div className="space-y-4">
        {course.chapters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white dark:bg-zinc-900">
            <Layers className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">No Chapters Created Yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto mb-4">
              Get started by creating your first chapter, then upload video lessons and notes into it.
            </p>
            <button
              onClick={() => setShowAddChapter(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Chapter 1</span>
            </button>
          </div>
        ) : (
          course.chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm"
            >
              {/* Chapter Header */}
              <div className="flex items-center justify-between p-4 bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {chapter.title}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                      {chapter.description || `${chapter.lectures.length} Lectures configured`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveChapterForLecture(chapter.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-900/50 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Lecture</span>
                  </button>

                  <button
                    onClick={() => handleDeleteChapter(chapter.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete Chapter"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lecture list inside chapter */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 p-2">
                {chapter.lectures.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-400 italic">
                    No lectures added in this chapter yet. Click &ldquo;Add Lecture&rdquo; above.
                  </div>
                ) : (
                  chapter.lectures.map((lecture, lecIdx) => (
                    <div
                      key={lecture.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <span className="text-xs font-mono text-zinc-400">
                          {lecIdx + 1}.
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                              {lecture.title}
                            </h5>
                            {lecture.is_free_preview && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded font-semibold uppercase">
                                Free Preview
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                            <span>{Math.round((lecture.duration || 600) / 60)} mins</span>
                            {lecture.notes && lecture.notes.length > 0 && (
                              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {lecture.notes.length} PDF note(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDeleteLecture(lecture.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Lecture"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Chapter Modal */}
      {showAddChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Add New Chapter
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Enter the module title and an optional summary.
            </p>

            <form onSubmit={handleCreateChapter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Chapter Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 3 — Object Oriented Programming"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description / Topics Covered
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what students will learn in this chapter..."
                  value={chapterDesc}
                  onChange={(e) => setChapterDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChapter(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 shadow-sm"
                >
                  {submitting ? 'Creating...' : 'Create Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lecture Modal */}
      {activeChapterForLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Add New Lecture
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Configure lesson details, video source, and attach supplementary PDF notes.
            </p>

            <form onSubmit={handleCreateLecture} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture 02: Classes & Objects"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Lecture Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of topics covered in this video..."
                  value={lectureDesc}
                  onChange={(e) => setLectureDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={durationMins}
                    onChange={(e) => setDurationMins(parseInt(e.target.value) || 10)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFreePreview}
                      onChange={(e) => setIsFreePreview(e.target.checked)}
                      className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Allow Free Preview</span>
                  </label>
                </div>
              </div>

              {/* Video URL / Source */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Video Stream URL (MP4 / Supabase Storage)
                </label>
                <input
                  type="text"
                  placeholder="/videos/sample-short-1.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Leave empty to use high-definition sample educational stream automatically.
                </span>
              </div>

              {/* PDF Study Material Section */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Supplementary PDF Notes (Optional)</span>
                </div>

                <input
                  type="text"
                  placeholder="Note Title: e.g. OOP Formulas & Cheatsheet PDF"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                />

                <input
                  type="text"
                  placeholder="PDF Download / Viewer URL"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveChapterForLecture(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save & Publish Lecture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
