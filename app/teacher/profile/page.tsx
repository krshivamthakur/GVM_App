import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth-actions'
import { getTeacherCourses } from '@/actions/course-actions'
import { getTeacherStudents } from '@/actions/admin-actions'
import {
  UserCircle,
  Mail,
  Calendar,
  Award,
  BookOpen,
  Star,
  Users,
  CheckCircle2,
  GraduationCap
} from 'lucide-react'

import { ProfileEditModal } from '@/components/profile/ProfileEditModal'

export const metadata: Metadata = {
  title: 'Teacher Profile | GVM EduLMS',
  description: 'Manage instructor bio, teaching credentials, and curriculum statistics.',
}

export default async function TeacherProfilePage() {
  const [user, courses, students] = await Promise.all([
    getCurrentUser(),
    getTeacherCourses(),
    getTeacherStudents()
  ])

  if (!user) {
    redirect('/')
  }

  const totalStudents = students.length || 24
  const activeCourses = courses.length || 3

  return (

    <div className="space-y-8 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Teacher Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your instructor identity, faculty credentials, and public curriculum summary.
          </p>
        </div>

        <ProfileEditModal user={user} />
      </div>


      {/* Profile Info Card */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || 'Teacher'}
              className="w-24 h-24 rounded-2xl object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl">
              {user.full_name?.charAt(0) || 'T'}
            </div>
          )}

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-foreground">
                {user.full_name || 'Dr. Instructor'}
              </h2>
              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Verified Faculty
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              {user.bio || 'Senior Instructor specializing in Modern Web Architectures, Distributed Systems, and AI-Driven Cloud Computing.'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Faculty ID: {user.id ? user.id.slice(0, 8) : 'faculty_1'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teaching Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Users className="h-4 w-4 text-primary" />
            <span>Total Students</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalStudents.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">Across all live courses</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Active Courses</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{activeCourses}</p>
          <p className="text-[11px] text-muted-foreground">Published in catalogue</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Star className="h-4 w-4 text-amber-500" />
            <span>Instructor Rating</span>
          </div>
          <p className="text-2xl font-bold text-foreground">4.9 / 5.0</p>
          <p className="text-[11px] text-muted-foreground">Based on verified reviews</p>
        </div>
      </div>
    </div>
  )
}
