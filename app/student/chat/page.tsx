import { Metadata } from 'next'
import CometChatWrapper from '@/components/chat/CometChatWrapper'
import { getAllUsers } from '@/actions/admin-actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Student Chat & Mentorship | GVM EduLMS',
  description: 'Connect directly with course instructors, join peer study cohorts, and schedule video consultations with CometChat.',
}

export default async function StudentChatPage() {
  const users = await getAllUsers('all')

  return (
    <div className="w-full">
      <CometChatWrapper initialUsers={users} />
    </div>
  )
}
