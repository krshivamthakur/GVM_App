import { Metadata } from 'next'
import CometChatWrapper from '@/components/chat/CometChatWrapper'

export const metadata: Metadata = {
  title: 'Student Chat & Mentorship | GVM EduLMS',
  description: 'Connect directly with course instructors, join peer study cohorts, and schedule video consultations with CometChat.',
}

export default function StudentChatPage() {
  return (
    <div className="space-y-2.5 sm:space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 pb-1 sm:pb-2">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
            Student Chat & Mentorship
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
            Connect in real-time with your instructors, collaborate with study cohorts, and start video consultations.
          </p>
        </div>
      </div>

      {/* CometChat Interface */}
      <CometChatWrapper />
    </div>
  )
}
