'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CourseWithCurriculum } from '@/types/database'
import { CourseCard } from '@/components/course/CourseCard'
import { CourseFilter } from '@/components/course/CourseFilter'
import { enrollCourse, enrollMultipleCourses, unenrollCourse } from '@/actions/course-actions'
import { 
  BookOpen, 
  CheckSquare, 
  GraduationCap, 
  Sparkles, 
  X, 
  Loader2, 
  CheckCircle2, 
  Layers, 
  Compass,
  BookmarkCheck
} from 'lucide-react'

interface CourseCatalogClientProps {
  initialCourses: CourseWithCurriculum[] | any[]
  initialCategory: string
  initialSearch: string
}

export function CourseCatalogClient({
  initialCourses,
  initialCategory,
  initialSearch
}: CourseCatalogClientProps) {
  const [courses, setCourses] = useState(initialCourses)
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'enrolled'>('all')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null)

  // Enrolled vs available counts
  const enrolledCourses = courses.filter((c) => c.is_enrolled)
  const availableCourses = courses.filter((c) => !c.is_enrolled)

  // Filtered by active tab
  const displayedCourses = courses.filter((c) => {
    if (activeTab === 'enrolled') return c.is_enrolled
    if (activeTab === 'available') return !c.is_enrolled
    return true
  })

  // Toggle single course selection
  const handleToggleSelect = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    )
  }

  // Select all available courses
  const handleSelectAllAvailable = () => {
    const availableIds = availableCourses.map((c) => c.id)
    setSelectedCourseIds(availableIds)
  }

  // Clear selection
  const handleClearSelection = () => {
    setSelectedCourseIds([])
  }

  // 1-Click quick enroll in a single course
  const handleQuickEnroll = (courseId: string) => {
    setEnrollingCourseId(courseId)
    startTransition(async () => {
      try {
        const res = await enrollCourse(courseId)
        if (res.success) {
          // Optimistic local update
          setCourses((prev) =>
            prev.map((c) =>
              c.id === courseId ? { ...c, is_enrolled: true, _count: { ...c._count, enrollments: (c._count?.enrollments || 0) + 1 } } : c
            )
          )
          setSelectedCourseIds((prev) => prev.filter((id) => id !== courseId))
          const enrolled = courses.find((c) => c.id === courseId)
          showToast(`Successfully enrolled in "${enrolled?.title || 'Course'}"!`)
        }
      } catch (err) {
        console.error('Failed to enroll:', err)
      } finally {
        setEnrollingCourseId(null)
      }
    })
  }

  // Batch enroll in multiple courses
  const handleBatchEnroll = () => {
    if (selectedCourseIds.length === 0) return

    startTransition(async () => {
      try {
        const res = await enrollMultipleCourses(selectedCourseIds)
        if (res.success) {
          const count = selectedCourseIds.length
          const selectedSet = new Set(selectedCourseIds)
          setCourses((prev) =>
            prev.map((c) =>
              selectedSet.has(c.id) ? { ...c, is_enrolled: true, _count: { ...c._count, enrollments: (c._count?.enrollments || 0) + 1 } } : c
            )
          )
          setSelectedCourseIds([])
          setSelectionMode(false)
          showToast(`🎉 Great job! Successfully enrolled in ${count} courses.`)
        }
      } catch (err) {
        console.error('Failed to batch enroll:', err)
      }
    })
  }

  // Unenroll
  const handleUnenroll = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    const confirmed = window.confirm(`Are you sure you want to unenroll from "${course?.title || 'this course'}"?`)
    if (!confirmed) return

    startTransition(async () => {
      try {
        const res = await unenrollCourse(courseId)
        if (res.success) {
          setCourses((prev) =>
            prev.map((c) =>
              c.id === courseId ? { ...c, is_enrolled: false } : c
            )
          )
          showToast(`Unenrolled from "${course?.title || 'course'}"`, 'info')
        }
      } catch (err) {
        console.error('Failed to unenroll:', err)
      }
    })
  }

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 4500)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all animate-in fade-in slide-in-from-bottom-3 ${
          notification.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20'
            : 'bg-zinc-900 text-white border-zinc-800 shadow-zinc-900/30'
        }`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{notification.message}</span>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Component */}
      <CourseFilter initialCategory={initialCategory} initialSearch={initialSearch} />

      {/* View Tabs & Multi-Join Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-border pb-4">
        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted border border-border text-xs font-semibold w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Courses ({courses.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'available'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Available to Join ({availableCourses.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('enrolled')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'enrolled'
                ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>My Enrolled ({enrolledCourses.length})</span>
          </button>
        </div>

        {/* Multi-Course Selection Toggle */}
        <div className="flex items-center gap-2">
          {availableCourses.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectionMode(!selectionMode)
                if (selectionMode) setSelectedCourseIds([])
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                selectionMode
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{selectionMode ? 'Exit Selection Mode' : 'Select Multiple Courses to Join'}</span>
            </button>
          )}

          {enrolledCourses.length > 0 && (
            <Link
              href="/student/my-courses"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-accent text-foreground text-xs font-semibold border border-border transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>Go to My Learning Hub</span>
            </Link>
          )}
        </div>
      </div>

      {/* Floating / Sticky Multi-Join Action Banner */}
      {selectionMode && (
        <div className="sticky top-20 z-40 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-500 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm">
                {selectedCourseIds.length} {selectedCourseIds.length === 1 ? 'course' : 'courses'} selected
              </div>
              <div className="text-xs text-blue-100">
                Join multiple subjects simultaneously with instant access to lectures and notes.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSelectAllAvailable}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors"
            >
              Select All ({availableCourses.length})
            </button>

            {selectedCourseIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              disabled={selectedCourseIds.length === 0 || isPending}
              onClick={handleBatchEnroll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enrolling...</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  <span>Join Selected ({selectedCourseIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Course Grid */}
      {displayedCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold text-sm text-foreground">
            {activeTab === 'enrolled' 
              ? 'No Enrolled Courses Found' 
              : activeTab === 'available'
              ? 'You have joined all courses!' 
              : 'No Courses Found'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {activeTab === 'enrolled'
              ? 'You have not joined any courses in this category yet. Switch to "Available to Join" to enroll.'
              : 'Try changing your subject category or search keyword.'}
          </p>
          {activeTab !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>View All Courses</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {displayedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              selectable={selectionMode && !course.is_enrolled}
              isSelected={selectedCourseIds.includes(course.id)}
              onToggleSelect={handleToggleSelect}
              onQuickEnroll={handleQuickEnroll}
              onUnenroll={handleUnenroll}
              isEnrolling={enrollingCourseId === course.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
