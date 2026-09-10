import { DashboardShell } from '@/components/layout/DashboardShell'
import { getCurrentUser } from '@/actions/auth-actions'
import { redirect } from 'next/navigation'

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  if (user.role !== 'teacher' && user.role !== 'admin') {
    redirect('/student')
  }

  return <DashboardShell>{children}</DashboardShell>
}
