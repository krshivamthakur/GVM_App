import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth-actions'
import LoginPage from './(auth)/login/page'

export default async function LandingPage() {
  const user = await getCurrentUser()

  if (user) {
    if (user.role === 'admin') redirect('/admin')
    if (user.role === 'teacher') redirect('/teacher')
    redirect('/student')
  }

  return <LoginPage />
}
