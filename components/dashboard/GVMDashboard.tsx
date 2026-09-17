'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  MoreHorizontal,
  Printer,
  MapPin,
  Phone,
  ArrowUpRight,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Sparkles,
  Users,
  AlertCircle
} from 'lucide-react'
import { Profile, Course } from '@/types/database'

interface GVMDashboardProps {
  currentUser?: Profile | null
  stats?: {
    totalStudents: number
    totalTeachers: number
    totalCourses: number
    publishedCourses?: number
    totalLectures?: number
    totalEnrollments?: number
  }
  initialStudents?: Profile[]
  initialCourses?: Course[]
  initialTeachers?: Profile[]
}

interface StudentRow {
  id: string
  code: string
  studentName: string
  subject: string
  classGrade: string
  status: 'Active' | 'Opened' | 'Completed'
  submissionDate: string
  checked: boolean
}

export function GVMDashboard({
  currentUser,
  stats,
  initialStudents = [],
  initialCourses = [],
  initialTeachers = []
}: GVMDashboardProps) {
  // Calendar Segment Toggle ('Day to day' | 'Social Media')
  const [calendarMode, setCalendarMode] = useState<'day' | 'social'>('day')

  // Generate dynamic student rows from actual database
  const initialRows: StudentRow[] = useMemo(() => {
    return initialStudents.map((s, idx) => {
      const assignedCourse = initialCourses[idx % Math.max(1, initialCourses.length)]
      return {
        id: s.id,
        code: `#STU-${s.id.slice(0, 5).toUpperCase()}`,
        studentName: s.full_name || s.email.split('@')[0],
        subject: assignedCourse?.title || s.bio || 'General Curriculum',
        classGrade: assignedCourse?.category || '2026 Batch',
        status: (s.teacher_status === 'pending' ? 'Opened' : 'Active') as 'Active' | 'Opened' | 'Completed',
        submissionDate: s.created_at
          ? new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Active Now',
        checked: idx === 0
      }
    })
  }, [initialStudents, initialCourses])

  const [students, setStudents] = useState<StudentRow[]>(initialRows)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  // Sync state if initialStudents changes
  React.useEffect(() => {
    setStudents(initialRows)
  }, [initialRows])

  // Real dynamic courses from database for the Groups section
  const [courseJoinStates, setCourseJoinStates] = useState<Record<string, boolean>>({})

  const courseGroups = useMemo(() => {
    return initialCourses.slice(0, 4).map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.category || 'Course Module',
      joined: courseJoinStates[c.id] ?? (c.status === 'published')
    }))
  }, [initialCourses, courseJoinStates])

  const toggleGroupJoin = (id: string) => {
    setCourseJoinStates((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Active avatars stack from real users in database
  const activeAvatars = useMemo(() => {
    const combined = [...initialTeachers, ...initialStudents]
    const withAvatars = combined.filter((u) => u.avatar_url && u.avatar_url.trim())
    return withAvatars.slice(0, 4)
  }, [initialTeachers, initialStudents])

  // Calendar dynamic current month calculation
  const today = useMemo(() => new Date(), [])
  const currentMonthName = useMemo(() => {
    return today.toLocaleString('default', { month: 'short', year: 'numeric' })
  }, [today])
  const todayDateNum = today.getDate()
  const [selectedDate, setSelectedDate] = useState<number>(todayDateNum)

  // Generate real calendar days for current month
  const calendarDays = useMemo(() => {
    const year = today.getFullYear()
    const month = today.getMonth() // 0-indexed
    const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()

    const days: { day: number; isCurrentMonth: boolean }[] = []

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false })
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true })
    }

    // Next month filler days to complete grid (up to 35 cells)
    const remaining = 35 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false })
    }

    return days
  }, [today])

  // Real timeline items from actual database courses
  const timelineNodes = useMemo(() => {
    if (initialCourses.length === 0) return []
    return initialCourses.slice(0, 4).map((c, idx) => ({
      id: c.id,
      title: c.title,
      category: c.category || 'Core Track',
      time: `${9 + idx * 2}:00 ${idx >= 2 ? 'pm' : 'am'}`,
      active: idx === 0
    }))
  }, [initialCourses])

  const toggleCheck = (id: string) => {
    setStudents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, checked: !e.checked } : e))
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Student ID,Student Name,Subject,Class / Track,Status,Enrollment Date',
        ...students.map(
          (e) =>
            `${e.code},"${e.studentName}","${e.subject}","${e.classGrade}",${e.status},${e.submissionDate}`
        )
      ].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'Students_Directory_Export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalPages = Math.max(1, Math.ceil(students.length / pageSize))
  const paginatedStudents = students.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* 2-Column Responsive Grid matching GVM design */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: Bio Card, Metrics, Groups, Student Table        */}
        {/* ============================================================ */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Top Row: Bio Profile Card + Metrics & Groups */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* 1. Bio Profile Card (Dynamic from logged-in user in DB) */}
            <div className="md:col-span-5 bg-card border border-border/70 rounded-3xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground tracking-wide">Bio</span>
                <Link
                  href="/admin/settings"
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  title="Profile Settings"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Link>
              </div>

              {/* Avatar with Futuristic Orbital Dotted Tech Ring */}
              <div className="flex flex-col items-center justify-center my-3">
                <div className="relative flex items-center justify-center p-2.5">
                  <svg
                    className="w-28 h-28 absolute -inset-0.5 animate-spin-slow pointer-events-none"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="1.8"
                      strokeDasharray="4 8 16 8"
                      strokeLinecap="round"
                      className="opacity-75"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#93C5FD"
                      strokeWidth="1"
                      strokeDasharray="2 6"
                      className="opacity-50"
                    />
                  </svg>

                  {/* Circular Avatar from DB */}
                  <div className="w-20 h-20 rounded-full overflow-hidden shadow-md border-2 border-background relative z-10 bg-blue-100 dark:bg-blue-950 flex items-center justify-center font-bold text-blue-600 text-xl">
                    {currentUser?.avatar_url ? (
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.full_name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{currentUser?.full_name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                </div>

                {/* Profile Details from DB */}
                <h3 className="mt-2 text-sm font-bold text-foreground truncate max-w-[200px]">
                  {currentUser?.full_name || 'Active User'}
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate max-w-[220px]">
                  {currentUser?.email || 'admin@example.com'}
                </p>
                <p className="text-[11px] text-blue-600 font-semibold mt-0.5 capitalize">
                  {currentUser?.role === 'admin'
                    ? 'Platform Administrator'
                    : currentUser?.role === 'teacher'
                    ? 'Faculty Instructor'
                    : 'Enrolled Student'}
                </p>
              </div>

              {/* Social Action Icons Row */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-center gap-4 text-muted-foreground">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="p-1.5 rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  title="Print Profile"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  title="Location"
                >
                  <MapPin className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  title="Facebook"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  title="Twitter"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  title="Contact"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Top Metrics & Groups Grid (Dynamic from Database) */}
            <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
              
              {/* Metric 1 & Metric 2 Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Real Metric 1: Total Students */}
                <div className="bg-card border border-border/70 rounded-3xl p-4 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block">
                      Active Students
                    </span>
                    <span className="text-2xl font-extrabold text-foreground mt-1 block">
                      {stats?.totalStudents ?? initialStudents.length}
                    </span>
                  </div>
                  <Link
                    href="/admin/students"
                    title="View Students"
                    className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs shadow-blue-600/30 cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Real Metric 2: Published Courses Rate */}
                <div className="bg-card border border-border/70 rounded-3xl p-4 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block">
                      Published Courses
                    </span>
                    <span className="text-2xl font-extrabold text-foreground mt-1 block">
                      {stats?.publishedCourses ?? initialCourses.filter((c) => c.status === 'published').length}
                    </span>
                  </div>
                  <Link
                    href="/admin/courses"
                    title="Manage Courses"
                    className="w-7 h-7 rounded-full bg-muted/70 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Groups / Real Platform Courses Card */}
              <div className="bg-card border border-border/70 rounded-3xl p-4 shadow-xs space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground tracking-wide">
                      Platform Courses
                    </h4>
                    <Link
                      href="/admin/courses"
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      View All ({initialCourses.length})
                    </Link>
                  </div>
                  
                  {/* Real Course Cards Grid from DB */}
                  {courseGroups.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                      {courseGroups.map((group) => (
                        <div
                          key={group.id}
                          className="bg-muted/30 border border-border/60 rounded-2xl p-2.5 text-center flex flex-col items-center justify-between space-y-2 hover:border-blue-500/40 transition-all"
                        >
                          <div>
                            <span
                              className="text-[11px] font-bold text-foreground block truncate max-w-[85px]"
                              title={group.title}
                            >
                              {group.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate max-w-[85px]">
                              {group.subtitle}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleGroupJoin(group.id)}
                            className={`w-full py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                              group.joined
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            }`}
                          >
                            {group.joined ? 'Active' : 'Enroll'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-muted-foreground">
                        No courses created in Course Management yet.
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Row: + Create Course button & Real Avatars from DB */}
                <div className="pt-2 flex items-center justify-between">
                  <Link
                    href="/admin/courses"
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-blue-600/20 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Course</span>
                  </Link>

                  {/* Overlapping Avatars Stack from Real Database Users */}
                  <div className="flex items-center -space-x-2 overflow-hidden">
                    {activeAvatars.length > 0 ? (
                      activeAvatars.map((u, i) => (
                        <img
                          key={u.id || i}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-background object-cover"
                          src={u.avatar_url!}
                          alt={u.full_name || 'User'}
                        />
                      ))
                    ) : (
                      <div className="flex items-center -space-x-1.5 text-[10px] font-bold text-muted-foreground">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 ring-2 ring-background">
                          {currentUser?.full_name?.charAt(0) || 'A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* ============================================================ */}
          {/* 3. Student Directory & Enrollments Data Table (Database Data) */}
          {/* ============================================================ */}
          <div className="bg-card border border-border/70 rounded-3xl overflow-hidden shadow-xs">
            {/* Table Header Controls */}
            <div className="p-5 border-b border-border/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground tracking-tight">
                  Student Directory & Enrollments
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Synchronized with active platform database ({students.length} registered students)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Print"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {paginatedStudents.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground font-semibold text-[11px]">
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={students.length > 0 && students.every((e) => e.checked)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setStudents((prev) => prev.map((ex) => ({ ...ex, checked })))
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4 font-semibold">Student ID</th>
                      <th className="py-3 px-4 font-semibold">Student Name</th>
                      <th className="py-3 px-4 font-semibold">Assigned Program</th>
                      <th className="py-3 px-4 font-semibold">Track / Batch</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Enrolled Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {paginatedStudents.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={row.checked}
                            onChange={() => toggleCheck(row.id)}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-muted-foreground">
                          {row.code}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {row.studentName}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground truncate max-w-[140px]" title={row.subject}>
                          {row.subject}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {row.classGrade}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'Active'
                                ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/50'
                                : row.status === 'Opened'
                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                                : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground font-medium">
                          {row.submissionDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-semibold text-foreground">No students registered yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Students will automatically appear here once added through the Student Directory or self-registration.
                  </p>
                  <Link
                    href="/admin/students"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Go to Student Directory</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Circular Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border/50 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {totalPages > 5 && (
                  <span className="text-xs text-muted-foreground px-1 tracking-widest">......</span>
                )}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Event Calendar & Today's Schedule             */}
        {/* ============================================================ */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* 1. Event Calendar Card (Real Month & Day Highlight) */}
          <div className="bg-card border border-border/70 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-foreground tracking-tight">Event Calendar</h3>

            {/* Segmented Mode Toggle */}
            <div className="p-1 rounded-2xl bg-muted/50 border border-border/60 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCalendarMode('day')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  calendarMode === 'day'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Day to day
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode('social')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  calendarMode === 'social'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Social Media
              </button>
            </div>

            {/* Month Header (Dynamic Current Month) */}
            <div className="pt-2 flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground">{currentMonthName}</h4>
              <span className="text-[10px] text-blue-600 font-semibold">Today: Day {todayDateNum}</span>
            </div>

            {/* 7-Day Calendar Grid Dynamically Generated */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] font-medium gap-y-2">
                {calendarDays.map((item, idx) => {
                  const isToday = item.isCurrentMonth && item.day === todayDateNum
                  const isSelected = item.isCurrentMonth && item.day === selectedDate && !isToday

                  if (isToday) {
                    return (
                      <span
                        key={idx}
                        onClick={() => setSelectedDate(item.day)}
                        className="w-7 h-7 mx-auto rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs shadow-blue-600/30 cursor-pointer"
                        title="Today"
                      >
                        {item.day < 10 ? `0${item.day}` : item.day}
                      </span>
                    )
                  }

                  if (isSelected) {
                    return (
                      <span
                        key={idx}
                        onClick={() => setSelectedDate(item.day)}
                        className="w-7 h-7 mx-auto rounded-lg border-2 border-blue-600 text-blue-600 font-bold flex items-center justify-center cursor-pointer"
                      >
                        {item.day < 10 ? `0${item.day}` : item.day}
                      </span>
                    )
                  }

                  return (
                    <span
                      key={idx}
                      onClick={() => item.isCurrentMonth && setSelectedDate(item.day)}
                      className={`w-7 h-7 mx-auto flex items-center justify-center transition-colors ${
                        item.isCurrentMonth
                          ? 'text-foreground cursor-pointer hover:bg-muted/60 rounded-lg'
                          : 'text-muted-foreground/30 pointer-events-none'
                      }`}
                    >
                      {item.day < 10 ? `0${item.day}` : item.day}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 2. Today's Timeline / Scheduled Modules (Database Courses) */}
          <div className="bg-card border border-border/70 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground tracking-tight">Today&apos;s Timeline</h3>
              <Link href="/admin/courses" className="text-[11px] font-semibold text-blue-600 hover:underline">
                Courses
              </Link>
            </div>

            {/* Vertical timeline items from real database courses */}
            {timelineNodes.length > 0 ? (
              <div className="relative pl-6 space-y-5">
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-muted" />

                {timelineNodes.map((item) => (
                  <div key={item.id} className="relative group">
                    {item.active ? (
                      <div className="absolute -left-[19px] top-1 w-4 h-4 rounded-full border-2 border-background bg-blue-600 shadow-xs ring-4 ring-blue-600/20" />
                    ) : (
                      <div className="absolute -left-[18px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/40 bg-card" />
                    )}

                    <div className="space-y-0.5">
                      <h5 className="text-xs font-semibold text-foreground group-hover:text-blue-600 transition-colors truncate" title={item.title}>
                        {item.title}
                      </h5>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-blue-600">{item.category}</span>
                        <span className="text-muted-foreground font-mono">{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs text-muted-foreground">No course sessions currently scheduled.</p>
                <Link href="/admin/courses" className="text-xs font-semibold text-blue-600 hover:underline inline-block">
                  Add Courses
                </Link>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
