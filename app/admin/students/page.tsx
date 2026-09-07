export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getAllUsers } from '@/actions/admin-actions'
import { StudentDirectoryTable } from '@/components/admin/StudentDirectoryTable'
import { GraduationCap } from 'lucide-react'

export default async function AdminStudentsPage() {
  const students = await getAllUsers('student')

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" />
          <span>Student Administration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-1">
          Student Directory
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Browse registered students, manage student profiles, and monitor enrolled learner accounts synced with Supabase.
        </p>
      </div>

      <StudentDirectoryTable initialStudents={students} />
    </div>
  )
}
