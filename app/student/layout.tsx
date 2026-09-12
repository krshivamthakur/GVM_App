import { DashboardShell } from '@/components/layout/DashboardShell'
import { getCurrentUser } from '@/actions/auth-actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  return <DashboardShell>{children}</DashboardShell>
}
