import { getTeacherStudents } from '@/actions/admin-actions'
import { StudentList } from '@/components/teacher/StudentList'
import { Users } from 'lucide-react'

export default async function TeacherStudentsPage() {
  const students = await getTeacherStudents()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
          <Users className="w-4 h-4" />
          <span>Student Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-1">
          Enrolled Students & Progress
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Monitor your students&apos; lecture completion rates, learning activity, and engagement.
        </p>
      </div>

      <StudentList students={students} />
    </div>
  )
}
