export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getAdminPlatformStats, getAllUsers } from '@/actions/admin-actions'
import { getAllCoursesAdmin } from '@/actions/course-actions'
import { getCurrentUser } from '@/actions/auth-actions'
import { GVMDashboard } from '@/components/dashboard/GVMDashboard'

export default async function AdminDashboardPage() {
  const [stats, currentUser, students, teachers, courses] = await Promise.all([
    getAdminPlatformStats(),
    getCurrentUser(),
    getAllUsers('student'),
    getAllUsers('teacher'),
    getAllCoursesAdmin()
  ])

  return (
    <div className="w-full">
      <GVMDashboard
        currentUser={currentUser}
        stats={stats}
        initialStudents={students}
        initialTeachers={teachers}
        initialCourses={courses}
      />
    </div>
  )
}

