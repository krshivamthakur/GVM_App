export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getAllUsers } from '@/actions/admin-actions'
import { UserManagementTable } from '@/components/admin/UserManagementTable'

export default async function AdminUsersPage() {
  const users = await getAllUsers('all')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          User Management
        </h1>
      </div>

      <UserManagementTable initialUsers={users} />
    </div>
  )
}
