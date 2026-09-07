import Link from 'next/link'
import { getShortVideos } from '@/actions/short-actions'
import { ShortsReelPlayer } from '@/components/shorts/ShortsReelPlayer'
import { Sparkles, Compass, Flame, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: '⚡ Educational Shorts — Micro-Learning in 60s',
  description: 'Watch fast, high-impact video reels on programming, science, physics, and interview tips.'
}

const CATEGORY_TAGS = ['All', 'Programming', 'Physics', 'Chemistry', 'Productivity', 'Nextjs']

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
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100">
      {/* Category / Topic Filters Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-16 z-30 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            <span className="flex items-center gap-1 text-xs font-bold text-rose-400 uppercase tracking-wider whitespace-nowrap mr-2">
              <Flame className="w-4 h-4" />
              <span>Topics:</span>
            </span>

            {CATEGORY_TAGS.map((t) => {
              const isSelected = activeTag.toLowerCase() === t.toLowerCase()
              return (
                <Link
                  key={t}
                  href={`/shorts?tag=${t}`}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md shadow-rose-500/20'
                      : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60'
                  }`}
                >
                  {t}
                </Link>
              )
            })}
          </div>

          <Link
            href="/student/courses"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Full Courses</span>
          </Link>
        </div>
      </div>

      {/* Main Interactive Shorts Reel */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-6">
        <ShortsReelPlayer shorts={shorts} initialIndex={initialIndex} />
      </main>
    </div>
  )
}
