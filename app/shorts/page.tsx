import { getShortVideos } from '@/actions/short-actions'
import { ShortsReelPlayer } from '@/components/shorts/ShortsReelPlayer'
import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar'

export const metadata = {
  title: '⚡ Educational Shorts — Micro-Learning in 60s',
  description: 'Watch fast, high-impact video reels on programming, science, physics, and interview tips.'
}

export default async function ShortsPage({
  searchParams
}: {
  searchParams: Promise<{ tag?: string; id?: string }>
}) {
  const { tag, id } = await searchParams
  const activeTag = tag || 'All'
  const shorts = await getShortVideos(activeTag)

  // Determine starting index if an id query param is passed
  let initialIndex = 0
  if (id && shorts.length > 0) {
    const foundIdx = shorts.findIndex((s) => s.id === id)
    if (foundIdx !== -1) {
      initialIndex = foundIdx
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      {/* Main Interactive Shorts Reel */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-6 pb-20 lg:pb-6">
        <ShortsReelPlayer shorts={shorts} initialIndex={initialIndex} />
      </main>

      {/* Bottom Navigation Bar for Mobile and Tablets */}
      <BottomNavigationBar />
    </div>
  )
}
