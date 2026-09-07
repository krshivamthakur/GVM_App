'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { UserRole } from '@/types/database'
import { Sparkles, GraduationCap, BookOpen, ShieldAlert } from 'lucide-react'

export function DemoPersonaBar() {
  const { user, role, switchRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSwitch = async (newRole: UserRole) => {
    await switchRole(newRole)
    if (newRole === 'student' && !pathname.startsWith('/student')) {
      router.push('/student')
    } else if (newRole === 'teacher' && !pathname.startsWith('/teacher')) {
      router.push('/teacher')
    } else if (newRole === 'admin' && !pathname.startsWith('/admin')) {
      router.push('/admin')
    }
  }

  return (
    <div className="bg-muted/80 border-b border-border text-foreground text-xs py-1.5 px-4 flex flex-wrap items-center justify-between z-50">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold tracking-wide flex items-center gap-1.5 text-foreground">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Quick Role Switcher:
        </span>
        <span className="text-muted-foreground hidden sm:inline">
          Active as <strong className="text-foreground capitalize">{user?.full_name || role}</strong> ({role})
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
        <button
          onClick={() => handleSwitch('student')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            role === 'student'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'bg-background hover:bg-accent text-muted-foreground border border-border'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Student
        </button>

        <button
          onClick={() => handleSwitch('teacher')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            role === 'teacher'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'bg-background hover:bg-accent text-muted-foreground border border-border'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Teacher
        </button>

        <button
          onClick={() => handleSwitch('admin')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            role === 'admin'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'bg-background hover:bg-accent text-muted-foreground border border-border'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Admin
        </button>
      </div>
    </div>
  )
}
