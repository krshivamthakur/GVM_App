import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navigation/Navbar'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { PlatformSettingsProvider } from '@/contexts/PlatformSettingsContext'
import { NotificationProvider } from '@/contexts/NotificationContext'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Education LMS — Next.js 16 + Supabase',
  description: 'Enterprise-grade Learning Management System with Student, Teacher, and Admin Portals.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary/20">
        <AuthProvider>
          <PlatformSettingsProvider>
            <ThemeProvider>
              <NotificationProvider>
                <Navbar />
                <div className="flex-1 flex flex-col">{children}</div>
              </NotificationProvider>
            </ThemeProvider>
          </PlatformSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
