export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getAllUsers } from '@/actions/admin-actions'
import { TeacherApprovalList } from '@/components/admin/TeacherApprovalList'

export default async function AdminTeachersPage() {
  const users = await getAllUsers('teacher')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Teachers Directory
        </h1>
      </div>

      <TeacherApprovalList initialTeachers={users} />
    </div>
  )
}
