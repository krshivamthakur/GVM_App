import { DashboardShell } from '@/components/layout/DashboardShell'
import { getCurrentUser } from '@/actions/auth-actions'
import { redirect } from 'next/navigation'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/')
  }

  return <DashboardShell>{children}</DashboardShell>
}
