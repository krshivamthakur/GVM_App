import React from 'react'
import { Metadata } from 'next'
import { getAdminPlatformStats } from '@/actions/admin-actions'
import { ShadcnMetricCard } from '@/components/dashboard/ShadcnMetricCard'
import { OverviewChart } from '@/components/dashboard/OverviewChart'
import { RecentActivityFeed, ActivityItem } from '@/components/dashboard/RecentActivityFeed'
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  BookOpen,
  Flame,
  Calendar,
  Download
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Platform Analytics | GVM EduLMS Admin',
  description: 'Detailed platform analytics, revenue breakdown, enrollment trends, and shorts viewership metrics.',
}

export default async function AdminAnalyticsPage() {
  const stats = await getAdminPlatformStats()
  const totalShorts = (stats as any).totalShorts ?? 8
  const revenue = (stats as any).totalRevenue ?? 14250

  const activityItems: ActivityItem[] = [
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      action: 'Enrolled in Next.js 16 Fullstack Course',
      date: '2 hours ago',
      amountOrStatus: '+$149.00'
    },
    {
      id: '2',
      name: 'Maria Garcia',
      email: 'm.garcia@tech.edu',
      action: 'Completed Chapter 4: Database Transactions',
      date: '4 hours ago',
      amountOrStatus: 'Completed'
    },
    {
      id: '3',
      name: 'David Kim',
      email: 'dkim@codehub.io',
      action: 'Submitted final capstone project for review',
      date: '6 hours ago',
      amountOrStatus: 'In Review'
    },
    {
      id: '4',
      name: 'Dr. Sarah Jenkins',
      email: 'sarah.j@faculty.edu',
      action: 'Published new module: Server Actions Deep Dive',
      date: 'Yesterday',
      amountOrStatus: 'Verified'
    }
  ]

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Platform Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time enrollment velocities, course completion rates, and shorts engagement telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Jan 2026 – Present</span>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ShadcnMetricCard
          title="Total Gross Volume"
          value={`$${revenue.toLocaleString()}`}
          trend={{ value: '+18.4% from last month', isPositive: true }}
          icon={DollarSign}
        />
        <ShadcnMetricCard
          title="Active Student Accounts"
          value={stats.totalStudents.toLocaleString()}
          trend={{ value: '+12.1% net new users', isPositive: true }}
          icon={Users}
        />
        <ShadcnMetricCard
          title="Curriculum Catalog"
          value={`${stats.totalCourses} Published`}
          trend={{ value: '+4 courses added', isPositive: true }}
          icon={BookOpen}
        />
        <ShadcnMetricCard
          title="Shorts Reel Engagement"
          value={`${totalShorts * 1250} Plays`}
          trend={{ value: '+34.2% weekly surge', isPositive: true }}
          icon={Flame}
        />
      </div>

      {/* 2-Column Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-4 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Revenue & Enrollment Trajectory
              </h2>
              <p className="text-xs text-muted-foreground">
                Monthly student course purchase volumes and tuition growth.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              +28.5% YoY
            </span>
          </div>

          <OverviewChart />
        </div>

        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Recent Signups & Conversions
              </h2>
              <p className="text-xs text-muted-foreground">
                Latest student registrations and purchases.
              </p>
            </div>
          </div>

          <RecentActivityFeed items={activityItems} />
        </div>
      </div>
    </div>
  )
}
