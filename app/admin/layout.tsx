import { DashboardShell } from '@/components/layout/DashboardShell'
import { getCurrentUser } from '@/actions/auth-actions'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  if (user.role !== 'admin') {
    redirect(user.role === 'teacher' ? '/teacher' : '/student')
  }

  return <DashboardShell>{children}</DashboardShell>
}
