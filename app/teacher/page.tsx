import Link from 'next/link'
import { getTeacherCourses } from '@/actions/course-actions'
import { getTeacherStudents } from '@/actions/admin-actions'
import { getCurrentUser } from '@/actions/auth-actions'
import { ShadcnMetricCard } from '@/components/dashboard/ShadcnMetricCard'
import { OverviewChart } from '@/components/dashboard/OverviewChart'
import { RecentActivityFeed, ActivityItem } from '@/components/dashboard/RecentActivityFeed'
import {
  BookOpen,
  Users,
  Video,
  Plus,
  ArrowRight,
  Settings,
  Eye,
  CheckCircle2,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react'

export default async function TeacherDashboardPage() {
  const [user, courses, students] = await Promise.all([
    getCurrentUser(),
    getTeacherCourses(),
    getTeacherStudents()
  ])

  const totalLectures = courses.reduce((acc, c) => acc + (c._count?.lectures || 0), 0)
  const totalStudents = students.length
  const publishedCourses = courses.filter((c) => c.status === 'published').length

  const recentStudents: ActivityItem[] = students.slice(0, 5).map((s: any, idx: number) => ({
    id: s.enrollmentId || s.id || `student-${idx}`,
    name: s.student?.full_name || s.full_name || 'Enrolled Student',
    email: s.student?.email || s.course?.title || s.email || 'learner@example.com',
    avatarUrl: s.student?.avatar_url || s.avatar_url || undefined,
    action: s.course?.title ? `Enrolled in ${s.course.title}` : 'Enrolled in course',
    amountOrStatus: 'In Progress',
    date: `${(idx + 1) * 3}h ago`
  }))

  return (
    <div className="space-y-6">
      {/* Top Page Header (Signature Shadcn Admin Page Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Instructor Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your courses, curriculum lectures, study notes, and student performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Academic Term 2026</span>
          </div>

          <Link
            href="/teacher/shorts"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-background hover:bg-accent text-foreground text-xs font-semibold shadow-xs transition-colors"
          >
            <Video className="h-3.5 w-3.5 text-rose-500" />
            <span>Upload Short</span>
          </Link>

          <Link
            href="/teacher/courses/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Course</span>
          </Link>
        </div>
      </div>

      {/* Segmented Tabs Bar */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border w-fit">
        <button
          type="button"
          className="px-3 py-1 rounded-md text-xs font-medium bg-background text-foreground shadow-xs"
        >
          Overview
        </button>
        <Link
          href="/teacher/courses"
          className="px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          My Courses ({courses.length})
        </Link>
        <Link
          href="/teacher/shorts"
          className="px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Shorts Studio
        </Link>
        <button
          type="button"
          className="px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Analytics
        </button>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ShadcnMetricCard
          title="Active Courses"
          value={courses.length.toString()}
          subtext={`${publishedCourses} published live`}
          trend={{ value: '+1 new', isPositive: true }}
          icon={BookOpen}
        />
        <ShadcnMetricCard
          title="Enrolled Learners"
          value={totalStudents.toLocaleString()}
          subtext="across all batches"
          trend={{ value: '+18.2%', isPositive: true }}
          icon={Users}
        />
        <ShadcnMetricCard
          title="Video Lessons"
          value={totalLectures.toLocaleString()}
          subtext="curriculum units"
          trend={{ value: '100% active', isPositive: true }}
          icon={Video}
        />
        <ShadcnMetricCard
          title="Avg. Completion"
          value="84.6%"
          subtext="student milestone rate"
          trend={{ value: '+5.4%', isPositive: true }}
          icon={CheckCircle2}
        />
      </div>

      {/* Main 2-Column Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-4">
          <OverviewChart
            title="Learning Hours Overview"
            description="Total watch hours and student completion metrics per month"
          />
        </div>

        <div className="lg:col-span-3">
          <RecentActivityFeed
            title="Recent Student Enrollments"
            subtitle="Learners who recently registered for your courses"
            items={recentStudents}
          />
        </div>
      </div>

      {/* Courses List Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              My Courses Curriculum ({courses.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage chapters, uploaded video lectures, notes, and publishing state.
            </p>
          </div>

          <Link
            href="/teacher/courses"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const isLive = course.status === 'published'
            return (
              <div
                key={course.id}
                className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs hover:border-border/80 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                      {course.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isLive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                    {course.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
                    <span>{course._count?.lectures || 0} Lessons</span>
                    <span>•</span>
                    <span>{course._count?.enrollments || 0} Students</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 mt-3 border-t border-border">
                  <Link
                    href={`/teacher/courses/${course.id}`}
                    className="flex-1 text-center py-1.5 px-3 rounded-md bg-primary text-primary-foreground font-medium text-xs shadow-xs hover:bg-primary/90 transition-colors"
                  >
                    Manage Content
                  </Link>

                  <Link
                    href={`/teacher/courses/${course.id}/edit`}
                    className="p-1.5 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>

                  <Link
                    href={`/student/courses/${course.id}`}
                    className="p-1.5 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Student Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
