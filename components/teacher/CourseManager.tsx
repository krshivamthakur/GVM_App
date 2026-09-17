'use client'

import { useState, useRef } from 'react'
import { CourseWithCurriculum, Note } from '@/types/database'
import { 
  createChapter, 
  deleteChapter, 
  createLecture, 
  deleteLecture, 
  addNoteToLecture, 
  updateNote,
  deleteNote 
} from '@/actions/lecture-actions'
import { toggleCoursePublish } from '@/actions/course-actions'
import { uploadFile } from '@/actions/upload-actions'
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
  Layers,
  ExternalLink,
  Edit2,
  Loader2,
  Link as LinkIcon,
  X
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
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [pdfUploadError, setPdfUploadError] = useState('')

  // Notes Management Modal state (for existing lectures)
  const [activeLectureForNotes, setActiveLectureForNotes] = useState<{
    id: string
    title: string
    notes?: Note[]
  } | null>(null)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteUrl, setNewNoteUrl] = useState('')
  const [isUploadingModalPdf, setIsUploadingModalPdf] = useState(false)
  const [modalUploadError, setModalUploadError] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteTitle, setEditNoteTitle] = useState('')
  const [editNoteUrl, setEditNoteUrl] = useState('')

  // Submitting states
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalFileInputRef = useRef<HTMLInputElement>(null)

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

  // Handle PDF Upload for Lecture Creation
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPdf(true)
    setPdfUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadFile(formData, 'lecture-notes')

      if (res.success && res.url) {
        setPdfUrl(res.url)
        if (!pdfTitle.trim()) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
          setPdfTitle(cleanName)
        }
      } else {
        setPdfUploadError(res.error || 'Failed to upload PDF file')
      }
    } catch (err: unknown) {
      setPdfUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploadingPdf(false)
    }
  }

  // Handle PDF Upload inside Manage Notes Modal
  const handleModalPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingModalPdf(true)
    setModalUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadFile(formData, 'lecture-notes')

      if (res.success && res.url) {
        setNewNoteUrl(res.url)
        if (!newNoteTitle.trim()) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
          setNewNoteTitle(cleanName)
        }
      } else {
        setModalUploadError(res.error || 'Failed to upload PDF file')
      }
    } catch (err: unknown) {
      setModalUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploadingModalPdf(false)
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

      if (!lecRes.success) {
        alert(lecRes.error || 'Failed to save lecture to database.')
        return
      }

      // Attach PDF notes only if a valid title AND real URL are provided (NO dummy fallbacks)
      if (lecRes.lecture && pdfTitle.trim() && pdfUrl.trim()) {
        await addNoteToLecture(
          {
            lecture_id: lecRes.lecture.id,
            title: pdfTitle.trim(),
            file_path: pdfUrl.trim(),
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
      setPdfUploadError('')
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

  // Add Note from Modal
  const handleAddNoteToActiveLecture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeLectureForNotes || !newNoteTitle.trim() || !newNoteUrl.trim()) return

    setSubmitting(true)
    try {
      const res = await addNoteToLecture(
        {
          lecture_id: activeLectureForNotes.id,
          title: newNoteTitle.trim(),
          file_path: newNoteUrl.trim(),
          file_type: 'application/pdf'
        },
        course.id
      )

      if (res.success && res.note) {
        // Update local modal view
        setActiveLectureForNotes({
          ...activeLectureForNotes,
          notes: [...(activeLectureForNotes.notes || []), res.note]
        })
        setNewNoteTitle('')
        setNewNoteUrl('')
        setModalUploadError('')
      } else {
        alert(res.error || 'Failed to add note')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Update existing note
  const handleUpdateNote = async (noteId: string) => {
    if (!editNoteTitle.trim() || !editNoteUrl.trim()) return

    setSubmitting(true)
    try {
      const res = await updateNote(noteId, course.id, {
        title: editNoteTitle.trim(),
        file_path: editNoteUrl.trim()
      })

      if (res.success && activeLectureForNotes) {
        setActiveLectureForNotes({
          ...activeLectureForNotes,
          notes: (activeLectureForNotes.notes || []).map((n) =>
            n.id === noteId ? { ...n, title: editNoteTitle.trim(), file_path: editNoteUrl.trim() } : n
          )
        })
        setEditingNoteId(null)
      } else {
        alert(res.error || 'Failed to update note')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Delete note from modal
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return
    setSubmitting(true)
    try {
      const res = await deleteNote(noteId, course.id)
      if (res.success && activeLectureForNotes) {
        setActiveLectureForNotes({
          ...activeLectureForNotes,
          notes: (activeLectureForNotes.notes || []).filter((n) => n.id !== noteId)
        })
      }
    } finally {
      setSubmitting(false)
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
                            {lecture.notes && lecture.notes.length > 0 ? (
                              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
                                <FileText className="w-3 h-3" />
                                {lecture.notes.length} PDF note(s)
                              </span>
                            ) : (
                              <span className="text-zinc-400">No notes</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Manage / Attach PDF Notes Button */}
                        <button
                          onClick={() => {
                            setActiveLectureForNotes({
                              id: lecture.id,
                              title: lecture.title,
                              notes: lecture.notes || []
                            })
                            setNewNoteTitle('')
                            setNewNoteUrl('')
                            setModalUploadError('')
                            setEditingNoteId(null)
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors shadow-sm"
                          title="Attach or Manage PDF Notes"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span className="hidden sm:inline">Notes</span>
                          {lecture.notes && lecture.notes.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                              {lecture.notes.length}
                            </span>
                          )}
                        </button>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Add Chapter
              </h3>
              <button
                onClick={() => setShowAddChapter(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChapter} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Chapter Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 1 — Kinematics & Mechanics"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of what this chapter covers..."
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Add Lecture
              </h3>
              <button
                onClick={() => setActiveChapterForLecture(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLecture} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture 01: Newton's Laws & Vector Breakdown"
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
                  Lecture Video Link (Google Drive, YouTube, Vimeo, or MP4)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://drive.google.com/file/d/.../view or YouTube URL"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Paste Google Drive shared link, YouTube link, or direct MP4 stream URL.
                </span>
              </div>

              {/* PDF Study Material Section (Real Upload + Link Options) */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Supplementary PDF Notes (Optional)</span>
                  </div>
                  {pdfUrl && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                      <Check className="w-3.5 h-3.5" />
                      PDF Attached
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Note Title: e.g. Kinematics Handwritten Notes & Formulas"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                />

                {/* File Upload OR Link Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,application/pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingPdf}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-xs font-medium transition-colors"
                    >
                      {isUploadingPdf ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading File...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload PDF Document</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-zinc-400">or paste link below</span>
                  </div>

                  {pdfUploadError && (
                    <p className="text-[11px] text-rose-500 font-medium">{pdfUploadError}</p>
                  )}

                  <input
                    type="text"
                    placeholder="PDF Link (Google Drive, Dropbox, or Direct PDF URL)"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-zinc-400">
                    Students will be able to view and download this exact file.
                  </p>
                </div>
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

      {/* Manage Existing Lecture Notes Modal */}
      {activeLectureForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Manage PDF Notes
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                  {activeLectureForNotes.title}
                </p>
              </div>
              <button
                onClick={() => setActiveLectureForNotes(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of currently attached notes */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Attached Notes ({(activeLectureForNotes.notes || []).length})
              </h4>

              {(activeLectureForNotes.notes || []).length === 0 ? (
                <p className="text-xs text-zinc-400 italic p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                  No PDF notes attached to this lecture yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {(activeLectureForNotes.notes || []).map((note) => {
                    const isEditing = editingNoteId === note.id

                    if (isEditing) {
                      return (
                        <div
                          key={note.id}
                          className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2"
                        >
                          <input
                            type="text"
                            value={editNoteTitle}
                            onChange={(e) => setEditNoteTitle(e.target.value)}
                            placeholder="Note Title"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold"
                          />
                          <input
                            type="text"
                            value={editNoteUrl}
                            onChange={(e) => setEditNoteUrl(e.target.value)}
                            placeholder="PDF Link / Storage URL"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="px-2.5 py-1 rounded-md text-[11px] text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateNote(note.id)}
                              disabled={submitting}
                              className="px-3 py-1 rounded-md text-[11px] font-bold bg-blue-600 text-white hover:bg-blue-500"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={note.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {note.title}
                            </p>
                            <a
                              href={note.file_path}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-600 hover:underline truncate block max-w-xs font-mono"
                            >
                              {note.file_path}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingNoteId(note.id)
                              setEditNoteTitle(note.title)
                              setEditNoteUrl(note.file_path)
                            }}
                            className="p-1.5 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            title="Edit Note"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Add New Note Section */}
            <form onSubmit={handleAddNoteToActiveLecture} className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Attach a New PDF Note
              </h4>

              <input
                type="text"
                required
                placeholder="Note Title: e.g. Newton's 3 Laws Summary & Problems"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
              />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={modalFileInputRef}
                    accept=".pdf,application/pdf"
                    onChange={handleModalPdfUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingModalPdf}
                    onClick={() => modalFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-medium transition-colors"
                  >
                    {isUploadingModalPdf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload PDF File</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-zinc-400">or paste link below</span>
                </div>

                {modalUploadError && (
                  <p className="text-[11px] text-rose-500 font-medium">{modalUploadError}</p>
                )}

                <input
                  type="text"
                  required
                  placeholder="PDF Link (Google Drive, Dropbox, or Direct URL)"
                  value={newNoteUrl}
                  onChange={(e) => setNewNoteUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveLectureForNotes(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting || isUploadingModalPdf}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-sm"
                >
                  {submitting ? 'Saving Note...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
