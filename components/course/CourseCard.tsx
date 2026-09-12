'use client'

import Link from 'next/link'
import { CourseWithCurriculum } from '@/types/database'
import { BookOpen, Users, Clock, PlayCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { formatImageUrl, DEFAULT_FALLBACK_THUMBNAIL } from '@/lib/utils'

interface CourseCardProps {
  course: CourseWithCurriculum | any
  hrefPrefix?: string
  showProgress?: boolean
}

export function CourseCard({ course, hrefPrefix = '/student/courses', showProgress = false }: CourseCardProps) {
  const isEnrolled = course.is_enrolled || showProgress
  const progress = course.progress_percentage || 0
  const lecturesCount = course._count?.lectures || course.total_lectures_count || 0
  const studentsCount = course._count?.enrollments || 0

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-all hover:shadow-sm">
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
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 shadow-sm backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-200">
            {course.category || 'General'}
          </span>
        </div>

        {/* Status or Enrolled Pill */}
        {isEnrolled && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur">
              <CheckCircle2 className="w-3 h-3" />
              Enrolled
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
        <h3 className="line-clamp-2 text-base font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400 transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {course.description || 'Comprehensive curriculum covering all required learning concepts.'}
        </p>

        {/* Progress Bar for Enrolled Students */}
        {isEnrolled && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium">
              <span className="text-zinc-500 dark:text-zinc-400">Progress</span>
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
            className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 group/link text-xs"
          >
            <span>{isEnrolled ? 'Continue' : 'Details'}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
