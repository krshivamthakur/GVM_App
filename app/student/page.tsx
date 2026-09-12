import Link from 'next/link'
import { getCourses, getStudentEnrolledCourses } from '@/actions/course-actions'
import { getRecentLearningActivity } from '@/actions/progress-actions'
import { getCurrentUser } from '@/actions/auth-actions'
import { getShortVideos } from '@/actions/short-actions'
import { CourseCard } from '@/components/course/CourseCard'
import { ContinueLearning } from '@/components/student/ContinueLearning'
import { ShortsShelf } from '@/components/shorts/ShortsShelf'
import { ShadcnMetricCard } from '@/components/dashboard/ShadcnMetricCard'
import {
  BookOpen,
  Compass,
  CheckCircle2,
  Flame,
  Sparkles,
  ArrowRight,
  Search,
  Calendar,
  Layers,
  MessageSquare
} from 'lucide-react'

export default async function StudentDashboardPage() {
  const [user, courses, enrolledCourses, recentActivity, shorts] = await Promise.all([
    getCurrentUser(),
    getCourses(),
    getStudentEnrolledCourses(),
    getRecentLearningActivity(),
    getShortVideos()
  ])

  const popularCourses = courses.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Top Page Header (Signature Shadcn Admin Page Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Learning Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Learner'}! Track your curriculum progress and continue studying.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Daily Streak: 5 Days Active</span>
          </div>

          <Link
            href="/student/chat"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-background hover:bg-accent text-foreground text-xs font-semibold shadow-xs transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span>Student Chat</span>
          </Link>

          <Link
            href="/shorts"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-background hover:bg-accent text-foreground text-xs font-semibold shadow-xs transition-colors"
          >
            <Flame className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
            <span>Quick Shorts</span>
          </Link>

          <Link
            href="/student/courses"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Explore Courses</span>
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
          href="/student/my-courses"
          className="px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          My Courses ({enrolledCourses.length})
        </Link>
        <Link
          href="/shorts"
          className="px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Micro-Shorts
        </Link>
        <Link
          href="/student/courses"
          className="px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Course Catalogue
        </Link>
      </div>

      {/* 4 Metric KPI Cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ShadcnMetricCard
          title="Daily Learning Streak"
          value="5 Days"
          subtext="consistent study habits"
          trend={{ value: '+2 days', isPositive: true }}
          icon={Flame}
        />
        <ShadcnMetricCard
          title="Enrolled Courses"
          value={enrolledCourses.length.toString()}
          subtext="active certifications"
          trend={{ value: 'In Progress', isPositive: true }}
          icon={BookOpen}
        />
        <ShadcnMetricCard
          title="Lessons Completed"
          value="18 Units"
          subtext="across enrolled curriculum"
          trend={{ value: '+4 this week', isPositive: true }}
          icon={CheckCircle2}
        />
        <ShadcnMetricCard
          title="Micro-Shorts Watched"
          value="24 Clips"
          subtext="60s high-yield concepts"
          trend={{ value: 'Top 10%', isPositive: true }}
          icon={Sparkles}
        />
      </div>

      {/* Featured Continue Learning Component */}
      <ContinueLearning activity={recentActivity} />

      {/* Live Mentorship & Peer Discussions Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Need guidance or have course doubts?
              </h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                Live Chat
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect 1-on-1 with verified instructors, collaborate with student cohorts, and initiate video consultations.
            </p>
          </div>
        </div>

        <Link
          href="/student/chat"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0 shadow-xs"
        >
          <span>Open Student Chat</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Daily Quick Shorts Shelf */}
      <ShortsShelf
        shorts={shorts}
        title="⚡ Micro-Learning Shorts"
        subtitle="Learn bite-sized concepts & programming tips in under 60 seconds"
      />

      {/* Quick Category Jump Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap mr-1">
          Explore Subjects:
        </span>
        {['Programming', 'Physics', 'Chemistry', 'Mathematics'].map((cat) => (
          <Link
            key={cat}
            href={`/student/courses?category=${cat}`}
            className="px-3 py-1 rounded-md bg-muted/60 border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent whitespace-nowrap transition-all"
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* My Enrolled Courses Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              My Active Enrolled Courses ({enrolledCourses.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Resume your lectures and track overall module milestones.
            </p>
          </div>

          <Link
            href="/student/my-courses"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Courses</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-semibold text-sm text-foreground">No active enrollments yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Explore our comprehensive course catalogue and start learning for free today.
            </p>
            <Link
              href="/student/courses"
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground font-medium text-xs shadow-xs hover:bg-primary/90 transition-colors"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Browse Catalog</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((c) => (
              <CourseCard key={c.id} course={c} showProgress={true} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
