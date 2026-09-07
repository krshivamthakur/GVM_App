export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getAllUsers } from '@/actions/admin-actions'
import { TeacherApprovalList } from '@/components/admin/TeacherApprovalList'
import { UserCheck } from 'lucide-react'

export default async function AdminTeachersPage() {
  const users = await getAllUsers('teacher')

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
          <UserCheck className="w-4 h-4" />
          <span>Teacher Operations & Approvals</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-1">
          Teacher Verification Pipeline
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Review instructor applications, approve credentials, or revoke teacher studio permissions.
        </p>
      </div>

      <TeacherApprovalList initialTeachers={users} />
    </div>
  )
}
