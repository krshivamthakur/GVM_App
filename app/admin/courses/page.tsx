export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getAllCoursesAdmin } from '@/actions/course-actions'
import { getAllUsers } from '@/actions/admin-actions'
import { AdminCourseManagement } from '@/components/admin/AdminCourseManagement'

export default async function AdminCoursesPage() {
  const [courses, users] = await Promise.all([
    getAllCoursesAdmin(),
    getAllUsers('teacher')
  ])

  return <AdminCourseManagement initialCourses={courses} teachers={users} />
}
