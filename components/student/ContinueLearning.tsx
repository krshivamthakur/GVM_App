import Link from 'next/link'
import { PlayCircle, ArrowRight, Clock } from 'lucide-react'

interface ContinueLearningProps {
  activity: any
}

export function ContinueLearning({ activity }: ContinueLearningProps) {
  if (!activity) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-zinc-900 dark:to-zinc-900/50">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Ready to start learning?</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
          You haven&apos;t started watching any courses yet. Browse our comprehensive library and enroll in free courses!
        </p>
        <Link
          href="/student/courses"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm"
        >
          <span>Explore All Courses</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    )
  }

  const { course, lecture, progress } = activity
  const watchedSecs = progress?.watched_seconds || 0
  const durationSecs = lecture?.duration || 600
  const percent = durationSecs > 0 ? Math.min(100, Math.round((watchedSecs / durationSecs) * 100)) : 0

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-r from-primary/95 via-primary to-primary/85 text-primary-foreground p-6 shadow-xs">
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary-foreground/15 backdrop-blur text-[11px] font-semibold uppercase tracking-wider">
            <PlayCircle className="w-3.5 h-3.5 text-amber-300" />
            <span>Continue Learning</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight line-clamp-1">
            {course.title}
          </h2>

          <p className="text-xs text-primary-foreground/80 line-clamp-1">
            Next Up: <strong className="font-semibold text-primary-foreground">{lecture.title}</strong>
          </p>

          <div className="pt-2 space-y-1.5 max-w-md">
            <div className="flex justify-between text-xs text-primary-foreground/80 font-medium">
              <span>Lecture Progress</span>
              <span>{percent}% completed</span>
            </div>
            <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-foreground transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <Link
            href={`/student/courses/${course.id}/lectures/${lecture.id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-background text-foreground hover:bg-accent font-semibold text-xs shadow-xs transition-all"
          >
            <PlayCircle className="w-4 h-4 text-primary" />
            <span>Resume Lecture</span>
          </Link>
        </div>
      </div>

      {/* Subtle ambient light */}
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  )
}
