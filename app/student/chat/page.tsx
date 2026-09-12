import { Metadata } from 'next'
import { UnifiedChatEngine } from '@/components/chat/UnifiedChatEngine'
import { getChatUsersAction } from '@/actions/chat-actions'
import { MessageSquare, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Student Chat & Mentorship | GVM EduLMS',
  description: 'Connect directly with course instructors, join peer study cohorts, ask doubts, and schedule video consultations.',
}

export default async function StudentChatPage() {
  const users = await getChatUsersAction()

  return (
    <div className="space-y-4">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            <span>Learner Network & Doubt Clearing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-0.5">
            Student Community & Mentorship Chat
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Direct 1-on-1 access to course teachers, cohort discussion circles, study group files, and voice notes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Study Circles</span>
          </span>
        </div>
      </div>

      {/* Unified Master Chat Component */}
      <UnifiedChatEngine
        portalRole="student"
        initialUsers={users}
        customTitle="Student Chat & Cohorts"
        customSubtitle="Verified Instructors & Peers"
      />
    </div>
  )
}
