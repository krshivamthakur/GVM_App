import { Metadata } from 'next'
import CometChatWrapper from '@/components/chat/CometChatWrapper'

export const metadata: Metadata = {
  title: 'Student Chat & Mentorship | GVM EduLMS',
  description: 'Connect directly with course instructors, join peer study cohorts, and schedule video consultations with CometChat.',
}

export default function StudentChatPage() {
  return (
    <div className="w-full">
      <CometChatWrapper />
    </div>
  )
}
