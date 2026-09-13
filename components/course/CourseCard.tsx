'use client'

import Link from 'next/link'
import { CourseWithCurriculum } from '@/types/database'
import { 
  BookOpen, 
  Users, 
  PlayCircle, 
  CheckCircle2, 
  ArrowRight, 
  GraduationCap, 
  Check, 
  Loader2,
  LogOut
} from 'lucide-react'
import { formatImageUrl, DEFAULT_FALLBACK_THUMBNAIL } from '@/lib/utils'

interface CourseCardProps {
  course: CourseWithCurriculum | any
  hrefPrefix?: string
  showProgress?: boolean
  selectable?: boolean
  isSelected?: boolean
  onToggleSelect?: (courseId: string) => void
  onQuickEnroll?: (courseId: string) => void
  onUnenroll?: (courseId: string) => void
  isEnrolling?: boolean
}

export function CourseCard({ 
  course, 
  hrefPrefix = '/student/courses', 
  showProgress = false,
  selectable = false,
  isSelected = false,
  onToggleSelect,
  onQuickEnroll,
  onUnenroll,
  isEnrolling = false
}: CourseCardProps) {
  const isEnrolled = course.is_enrolled || showProgress
  const progress = course.progress_percentage || 0
  const lecturesCount = course._count?.lectures || course.total_lectures_count || 0
  const studentsCount = course._count?.enrollments || 0

  return (
    <div className={`group flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 bg-card text-card-foreground hover:shadow-md ${
      isSelected 
        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm' 
        : 'border-border hover:border-zinc-300 dark:hover:border-zinc-700'
    }`}>
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={formatImageUrl(course.thumbnail_url)}
          alt={course.title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget
            if (target.src.includes('lh3.googleusercontent.com/d/')) {
              const fileId = target.src.split('/d/')[1]
              target.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
            } else {
              target.src = DEFAULT_FALLBACK_THUMBNAIL
            }
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Top Controls: Selection Checkbox & Category */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {selectable && !isEnrolled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect?.(course.id)
              }}
              className={`flex h-6 w-6 items-center justify-center rounded-md border text-white transition-all ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 shadow-xs'
                  : 'bg-black/50 border-white/40 hover:bg-black/70'
              }`}
              title={isSelected ? 'Deselect Course' : 'Select to Join'}
            >
              {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
            </button>
          )}

          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 shadow-sm backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-200">
            {course.category || 'General'}
          </span>
        </div>

        {/* Status or Enrolled Pill */}
        {isEnrolled ? (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur">
              <CheckCircle2 className="w-3 h-3" />
              Enrolled
            </span>
          </div>
        ) : (
          <div className="absolute top-3 right-3">
            <span className="rounded-full bg-blue-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur uppercase tracking-wider">
              Free
            </span>
          </div>
        )}

        {course.status && course.status !== 'published' && (
          <div className="absolute top-3 right-3">
            <span className="rounded-full bg-amber-500/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur uppercase">
              {course.status}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Teacher info */}
        <div className="flex items-center gap-2 mb-2">
          {course.teacher?.avatar_url ? (
            <img
              src={course.teacher.avatar_url}
              alt={course.teacher.full_name || 'Teacher'}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
              {course.teacher?.full_name?.charAt(0) || 'T'}
            </div>
          )}
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {course.teacher?.full_name || 'Expert Instructor'}
          </span>
        </div>

        {/* Title */}
        <Link href={`${hrefPrefix}/${course.id}`} className="group/link">
          <h3 className="line-clamp-2 text-base font-semibold text-zinc-900 group-hover/link:text-blue-600 dark:text-zinc-100 dark:group-hover/link:text-blue-400 transition-colors">
            {course.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {course.description || 'Comprehensive curriculum covering all required learning concepts.'}
        </p>

        {/* Progress Bar for Enrolled Students */}
        {isEnrolled && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium">
              <span className="text-zinc-500 dark:text-zinc-400">Course Progress</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Metadata stats */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
              {lecturesCount} Lectures
            </span>
            {studentsCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                {studentsCount}
              </span>
            )}
          </div>

          <Link
            href={`${hrefPrefix}/${course.id}`}
            className="flex items-center gap-1 font-semibold text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 group/link text-xs transition-colors"
          >
            <span>Curriculum</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>

        {/* Interactive Action Buttons: Quick Join or Continue */}
        <div className="mt-3 pt-3 border-t border-dashed border-zinc-100 dark:border-zinc-800/60">
          {isEnrolled ? (
            <div className="flex items-center gap-2">
              <Link
                href={`${hrefPrefix}/${course.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Continue Learning</span>
              </Link>
              
              {onUnenroll && (
                <button
                  type="button"
                  onClick={() => onUnenroll(course.id)}
                  title="Leave / Unenroll Course"
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {onQuickEnroll && (
                <button
                  type="button"
                  disabled={isEnrolling}
                  onClick={() => onQuickEnroll(course.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                >
                  {isEnrolling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Join Course Free</span>
                    </>
                  )}
                </button>
              )}

              {selectable && (
                <button
                  type="button"
                  onClick={() => onToggleSelect?.(course.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
