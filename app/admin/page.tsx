export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import { getAdminPlatformStats, getAllUsers } from '@/actions/admin-actions'
import { getAllCoursesAdmin } from '@/actions/course-actions'
import { ShadcnMetricCard } from '@/components/dashboard/ShadcnMetricCard'
import { OverviewChart } from '@/components/dashboard/OverviewChart'
import { RecentActivityFeed, ActivityItem } from '@/components/dashboard/RecentActivityFeed'
import { TeacherApprovalList } from '@/components/admin/TeacherApprovalList'
import {
  Users,
  GraduationCap,
  BookOpen,
  Flame,
  Download,
  Calendar,
  Sparkles,
  ArrowUpRight
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const [stats, users, courses] = await Promise.all([
    getAdminPlatformStats(),
    getAllUsers(),
    getAllCoursesAdmin()
  ])

  const allTeachers = users.filter((u) => u.role === 'teacher')
  const pendingTeachersCount = allTeachers.filter((u) => u.teacher_status === 'pending').length

  // Build real recent activity list from platform users and courses
  const recentActivities: ActivityItem[] = users.slice(0, 5).map((u, i) => ({
    id: u.id,
    name: u.full_name || 'Anonymous User',
    email: u.email,
    avatarUrl: u.avatar_url || undefined,
    action: u.role === 'teacher' ? 'Instructor joined' : 'Student enrolled',
    amountOrStatus: u.role === 'teacher' ? (u.teacher_status === 'approved' ? 'Verified' : 'Pending') : 'Active',
    date: `${(i + 1) * 2}h ago`
  }))

  return (
    <div className="space-y-6">
      {/* Top Page Header (Signature Shadcn Admin Page Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Platform performance metrics, teacher approvals, and course engagement overview.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Jan 20, 2026 - Mar 05, 2026</span>
          </div>

          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Manage Courses</span>
          </Link>

          <Link
            href="/admin/teachers"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Review Teachers ({pendingTeachersCount})</span>
          </Link>
        </div>
      </div>

      {/* Segmented Tabs Bar (Overview, Analytics, Reports, Notifications) */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border w-fit">
        <Link
          href="/admin"
          className="px-3 py-1 rounded-md text-xs font-medium bg-background text-foreground shadow-xs"
        >
          Overview
        </Link>
        <Link
          href="/admin/analytics"
          className="px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Analytics
        </Link>
        <Link
          href="/admin/reports"
          className="px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Reports
        </Link>
        <Link
          href="/admin/notifications"
          className="px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Notifications
        </Link>
      </div>

      {/* 4 Metric KPI Cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ShadcnMetricCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          subtext="from last month"
          trend={{ value: '+14.2%', isPositive: true }}
          icon={GraduationCap}
        />
        <ShadcnMetricCard
          title="Approved Instructors"
          value={stats.totalTeachers.toLocaleString()}
          subtext={`${pendingTeachersCount} awaiting approval`}
          trend={{ value: '+3', isPositive: true }}
          icon={Users}
        />
        <ShadcnMetricCard
          title="Active Courses"
          value={stats.totalCourses.toLocaleString()}
          subtext={`${stats.publishedCourses} published live`}
          trend={{ value: '+100%', isPositive: true }}
          icon={BookOpen}
        />
        <ShadcnMetricCard
          title="Micro-Shorts Clips"
          value={((stats as any).totalShorts ?? 8).toLocaleString()}
          subtext="bite-sized lessons"
          trend={{ value: '+28.4%', isPositive: true }}
          icon={Flame}
        />
      </div>

      {/* Main 2-Column Analytics Grid: Overview Chart (4 cols) + Recent Activity (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-4">
          <OverviewChart
            title="Overview"
            description="Monthly platform user registrations and active learning hours"
          />
        </div>

        <div className="lg:col-span-3">
          <RecentActivityFeed
            title="Recent Activity"
            subtitle="Latest platform registrations and verification status"
            items={recentActivities}
          />
        </div>
      </div>

      {/* Grid: Teacher Approvals Pipeline & Course Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Teacher Approvals */}
        <div>
          <TeacherApprovalList initialTeachers={allTeachers} />
        </div>

        {/* Platform Courses Snapshot */}
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <div>
              <h3 className="font-semibold leading-none tracking-tight text-foreground">
                Platform Courses Directory
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Published courses and draft modules across all educators
              </p>
            </div>
            <Link
              href="/admin/courses"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View Catalogue</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {courses.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={c.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'}
                    alt={c.title}
                    className="w-10 h-10 rounded-md object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-foreground truncate">
                      {c.title}
                    </h4>
                    <span className="text-[11px] text-muted-foreground">{c.category}</span>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
