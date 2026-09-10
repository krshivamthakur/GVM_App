'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { GVMPreloader } from '@/components/ui/GVMPreloader'

const StudentChatView = dynamic(() => import('./StudentChatView'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[560px] rounded-xl border border-border bg-card p-8 text-center">
      <GVMPreloader
        size="md"
        text="Initializing Real-Time Chat"
        subtext="Loading verified instructors, peer channels, and CometChat services..."
      />
    </div>
  )
})

import { Profile } from '@/types/database'

interface CometChatWrapperProps {
  initialUsers?: Profile[]
}

export default function CometChatWrapper({ initialUsers }: CometChatWrapperProps) {
  return <StudentChatView initialUsers={initialUsers} />
}
