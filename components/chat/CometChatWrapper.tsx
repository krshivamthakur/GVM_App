'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { MessageSquare, Loader2 } from 'lucide-react'

const StudentChatView = dynamic(() => import('./StudentChatView'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[600px] rounded-xl border border-border bg-card p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 animate-pulse">
        <MessageSquare className="h-6 w-6" />
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Initializing CometChat Workspace...</span>
      </div>
      <p className="text-xs text-muted-foreground max-w-sm">
        Loading real-time messaging, instructor channels, and peer study groups.
      </p>
    </div>
  )
})

export default function CometChatWrapper() {
  return <StudentChatView />
}
