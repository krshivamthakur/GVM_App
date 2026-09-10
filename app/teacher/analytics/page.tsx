import React from 'react'
import { Metadata } from 'next'
import { getCurrentUser } from '@/actions/auth-actions'
import { getTeacherCourses } from '@/actions/course-actions'
import { getTeacherStudents } from '@/actions/admin-actions'
import { ShadcnMetricCard } from '@/components/dashboard/ShadcnMetricCard'
import { OverviewChart } from '@/components/dashboard/OverviewChart'
import {
  Users,
  BookOpen,
  Star,
  Award,
  Calendar
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Student Analytics & Progress | GVM EduLMS',
  description: 'Track student course completion rates, quiz scores, and engagement across your curriculum.',
}

export default async function TeacherAnalyticsPage() {
  const [user, courses, students] = await Promise.all([
    getCurrentUser(),
    getTeacherCourses(),
    getTeacherStudents()
  ])

  const totalStudents = students.length
  const publishedCourses = courses.filter((c) => c.status === 'published').length

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Teaching Analytics & Student Progress
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor student completion milestones, cohort activity, and lecture viewership.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Active Semester</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ShadcnMetricCard
          title="Active Students"
          value={totalStudents.toLocaleString()}
          trend={{ value: '+14% this month', isPositive: true }}
          icon={Users}
        />
        <ShadcnMetricCard
          title="Active Courses"
          value={publishedCourses.toString()}
          trend={{ value: 'Curriculum Live', isPositive: true }}
          icon={BookOpen}
        />
        <ShadcnMetricCard
          title="Average Rating"
          value="4.9 / 5.0"
          trend={{ value: 'Top 5% Faculty', isPositive: true }}
          icon={Star}
        />
        <ShadcnMetricCard
          title="Completion Rate"
          value="84.2%"
          trend={{ value: '+6.1% vs average', isPositive: true }}
          icon={Award}
        />
      </div>

      {/* Chart & Student Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-4 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Student Lecture Consumption
              </h2>
              <p className="text-xs text-muted-foreground">
                Hours of coursework completed per month.
              </p>
            </div>
          </div>
          <OverviewChart />
        </div>

        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="text-base font-semibold tracking-tight text-foreground mb-1">
            Active Student Roster
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Students currently progressing through your courses.
          </p>

          <div className="divide-y divide-border/60">
            {students.slice(0, 5).map((item: any, idx: number) => (
              <div key={item.enrollmentId || item.id || idx} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {(item.student?.full_name || item.full_name || 'S').charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {item.student?.full_name || item.full_name || 'Enrolled Student'}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                      {item.course?.title || 'General Curriculum'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
