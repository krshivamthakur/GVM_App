'use client'

import Link from 'next/link'
import { ShortVideo } from '@/types/database'
import { Play, Sparkles, Flame, ArrowRight, Eye, Heart } from 'lucide-react'

interface ShortsShelfProps {
  shorts: ShortVideo[]
  title?: string
  subtitle?: string
  showExploreAll?: boolean
}

export function ShortsShelf({
  shorts,
  title = '⚡ Micro-Learning Shorts',
  subtitle = 'Master high-yield concepts, derivations, and coding tips in 60 seconds',
  showExploreAll = true
}: ShortsShelfProps) {
  if (!shorts || shorts.length === 0) return null

  return (
    <section className="space-y-4">
      {/* Shelf Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {subtitle}
          </p>
        </div>

        {showExploreAll && (
          <Link
            href="/shorts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group self-start sm:self-auto"
          >
            <span>Browse All Shorts</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Horizontal Scrollable Carousel Shelf */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {shorts.map((short) => (
          <Link
            key={short.id}
            href={`/shorts?id=${short.id}`}
            className="group relative rounded-xl overflow-hidden aspect-[9/16] bg-zinc-900 border border-border shadow-xs hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            {/* Thumbnail Poster with Zoom */}
            <div className="absolute inset-0 z-0">
              <img
                src={short.thumbnail_url}
                alt={short.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
            </div>

            {/* Top Badges */}
            <div className="relative z-10 p-2.5 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white/90 border border-white/10 flex items-center gap-1">
                <Eye className="w-2.5 h-2.5 text-rose-400" />
                <span>{formatViews(short.views_count)}</span>
              </span>

              <span className="px-1.5 py-0.5 rounded-md bg-rose-600 text-[10px] font-bold text-white shadow-sm">
                {short.duration}s
              </span>
            </div>

            {/* Floating Play Button on Hover */}
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transform scale-90 group-hover:scale-100 transition-transform">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>

            {/* Bottom Content Info */}
            <div className="relative z-10 p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <img
                  src={
                    short.teacher?.avatar_url ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={short.teacher?.full_name || 'Creator'}
                  className="w-5 h-5 rounded-full object-cover border border-white/40"
                />
                <span className="text-[11px] font-medium text-white/80 truncate">
                  {short.teacher?.full_name || 'Instructor'}
                </span>
              </div>

              <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 drop-shadow">
                {short.title}
              </h3>

              <div className="flex items-center justify-between pt-1 text-[10px] text-white/70">
                <span className="text-rose-300 font-semibold truncate">
                  #{short.tags[0] || 'Shorts'}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  <span>{short.likes_count}</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
  return `${views}`
}
