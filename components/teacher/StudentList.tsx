import { Users, Mail, Calendar, BookOpen, CheckCircle2 } from 'lucide-react'
import { formatDisplayDate } from '@/lib/utils'

interface StudentListProps {
  students: any[]
}

export function StudentList({ students }: StudentListProps) {
  if (students.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center bg-white dark:bg-zinc-900">
        <Users className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">No Students Enrolled Yet</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          As students discover and enroll in your published courses, their progress and statistics will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
          Enrolled Students Roster ({students.length})
        </h3>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Course</th>
              <th className="py-3 px-4">Course Progress</th>
              <th className="py-3 px-4">Enrolled Date</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {students.map((item) => (
              <tr key={item.enrollmentId} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    {item.student?.avatar_url ? (
                      <img
                        src={item.student.avatar_url}
                        alt={item.student.full_name || 'Student'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {item.student?.full_name?.charAt(0) || 'S'}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.student?.full_name || 'Student'}
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {item.student?.email}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1">
                    {item.course?.title}
                  </div>
                  <div className="text-[11px] text-zinc-400">{item.course?.category}</div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="space-y-1 max-w-[140px]">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {item.progressPercentage}%
                      </span>
                      <span className="text-zinc-400">
                        {item.completedLectures}/{item.totalLectures}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${item.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-zinc-500">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    <span suppressHydrationWarning>{formatDisplayDate(item.enrolledAt)}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      item.progressPercentage === 100
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {item.progressPercentage === 100 ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </>
                    ) : (
                      'In Progress'
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
