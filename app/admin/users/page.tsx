export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getAllUsers } from '@/actions/admin-actions'
import { UserManagementTable } from '@/components/admin/UserManagementTable'
import { ShieldCheck } from 'lucide-react'

export default async function AdminUsersPage() {
  const users = await getAllUsers('all')

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Role & User Administration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-1">
          User Management System
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage all registered user profiles across roles (Students, Teachers, Admins), assign RBAC permissions, and update profiles synced directly with Supabase.
        </p>
      </div>

      <UserManagementTable initialUsers={users} />
    </div>
  )
}
