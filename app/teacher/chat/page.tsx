import { Metadata } from 'next'
import { UnifiedChatEngine } from '@/components/chat/UnifiedChatEngine'
import { getChatUsersAction } from '@/actions/chat-actions'
import { Sparkles, GraduationCap } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Faculty Chat & Mentorship | GVM EduLMS',
  description: 'Connect with enrolled students, coordinate with department colleagues, manage discussion cohorts, and host video doubt sessions.',
}

export default async function TeacherChatPage() {
  const users = await getChatUsersAction()

  return (
    <div className="space-y-4">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Faculty Mentorship & Cohort Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-0.5">
            Student Mentorship & Live Chat Hub
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Guide enrolled learners, resolve course doubts in real-time, initiate video consultations, and coordinate subject cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Office Hours: Online</span>
          </span>
        </div>
      </div>

      {/* Unified Master Chat Component */}
      <UnifiedChatEngine
        portalRole="teacher"
        initialUsers={users}
        customTitle="Faculty Mentorship Hub"
        customSubtitle="Students, Cohorts & Colleagues"
      />
    </div>
  )
}
