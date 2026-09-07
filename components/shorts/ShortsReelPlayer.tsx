'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ShortVideo, ShortComment } from '@/types/database'
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  BookOpen, 
  X, 
  Send, 
  Check, 
  Compass,
  ArrowRight
} from 'lucide-react'
import { toggleLikeShortVideo, toggleSaveShortVideo, addShortCommentAction } from '@/actions/short-actions'
import { formatDisplayDate } from '@/lib/utils'

interface ShortsReelPlayerProps {
  shorts: ShortVideo[]
  initialIndex?: number
  onIndexChange?: (index: number) => void
}

export function ShortsReelPlayer({
  shorts,
  initialIndex = 0,
  onIndexChange
}: ShortsReelPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [showPlayStateAnim, setShowPlayStateAnim] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [copiedToast, setCopiedToast] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showSwipeHint, setShowSwipeHint] = useState(true)

  // Drag & Swipe physics state
  const [dragOffset, setDragOffset] = useState<number>(0)
  const [isSwiping, setIsSwiping] = useState<boolean>(false)
  const touchStartY = useRef<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const isDragging = useRef<boolean>(false)
  const hasDragged = useRef<boolean>(false)
  const wheelCooldown = useRef<boolean>(false)

  // Local state for interactive counters & toggles
  const [localShorts, setLocalShorts] = useState<ShortVideo[]>(shorts)
  const currentShort = localShorts[currentIndex] || localShorts[0]

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep localShorts synced if props change
  useEffect(() => {
    setLocalShorts(shorts)
  }, [shorts])

  // Play active video, pause all others
  useEffect(() => {
    videoRefs.current.forEach((vid, idx) => {
      if (!vid) return
      if (idx === currentIndex) {
        try {
          vid.currentTime = 0
        } catch (e) {}

        if (isPlaying) {
          try {
            const playPromise = vid.play()
            if (playPromise !== undefined) {
              playPromise.catch((err) => {
                // Browser autoplay policy might require user interaction or muted
                if (err.name === 'NotAllowedError') {
                  vid.muted = true
                  setIsMuted(true)
                  vid.play().catch(() => {})
                }
              })
            }
          } catch (e) {
            // Guard against synchronous browser media exception
          }
        }
      } else {
        try {
          vid.pause()
        } catch (e) {}
      }
    })

    if (onIndexChange) {
      onIndexChange(currentIndex)
    }
  }, [currentIndex, isPlaying, onIndexChange])

  // Sync mute state to all videos
  useEffect(() => {
    videoRefs.current.forEach((vid) => {
      if (vid) vid.muted = isMuted
    })
  }, [isMuted])

  const handleNext = () => {
    if (currentIndex < localShorts.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setIsPlaying(true)
      setShowComments(false)
      setShowSwipeHint(false)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setIsPlaying(true)
      setShowComments(false)
      setShowSwipeHint(false)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showComments && document.activeElement?.tagName === 'INPUT') return

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === ' ') {
        e.preventDefault()
        togglePlayPause()
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        setIsMuted((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, isPlaying, showComments, localShorts.length])

  // Swipe Gestures: Touch Events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (showComments) return
    touchStartY.current = e.touches[0].clientY
    touchStartX.current = e.touches[0].clientX
    isDragging.current = true
    hasDragged.current = false
    setIsSwiping(true)
    setDragOffset(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartY.current === null || touchStartX.current === null || showComments) return
    const currentY = e.touches[0].clientY
    const currentX = e.touches[0].clientX
    const diffY = currentY - touchStartY.current
    const diffX = currentX - touchStartX.current

    // Ignore if horizontal gesture dominates
    if (Math.abs(diffX) > Math.abs(diffY)) return

    if (Math.abs(diffY) > 8) {
      hasDragged.current = true
    }

    // Apply rubber-band resistance at top/bottom extremes
    let offset = diffY
    if ((currentIndex === 0 && offset > 0) || (currentIndex === localShorts.length - 1 && offset < 0)) {
      offset = offset * 0.3
    }
    setDragOffset(offset)
  }

  const handleTouchEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    setIsSwiping(false)

    const threshold = 55 // Min distance for swipe
    if (dragOffset < -threshold) {
      // Swiped UP -> Next video
      handleNext()
    } else if (dragOffset > threshold) {
      // Swiped DOWN -> Previous video
      handlePrev()
    }

    setDragOffset(0)
    touchStartY.current = null
    touchStartX.current = null
  }

  // Desktop Mouse Drag Support
  const handleMouseDown = (e: React.MouseEvent) => {
    if (showComments) return
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('input')) return

    touchStartY.current = e.clientY
    touchStartX.current = e.clientX
    isDragging.current = true
    hasDragged.current = false
    setIsSwiping(true)
    setDragOffset(0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || touchStartY.current === null || showComments) return
    const diffY = e.clientY - touchStartY.current
    if (Math.abs(diffY) > 8) {
      hasDragged.current = true
    }

    let offset = diffY
    if ((currentIndex === 0 && offset > 0) || (currentIndex === localShorts.length - 1 && offset < 0)) {
      offset = offset * 0.3
    }
    setDragOffset(offset)
  }

  const handleMouseUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    setIsSwiping(false)

    const threshold = 55
    if (dragOffset < -threshold) {
      handleNext()
    } else if (dragOffset > threshold) {
      handlePrev()
    }

    setDragOffset(0)
    touchStartY.current = null
    touchStartX.current = null
  }

  // Wheel / Trackpad Scroll Navigation
  const handleWheel = (e: React.WheelEvent) => {
    if (showComments) return
    if (wheelCooldown.current) return

    if (Math.abs(e.deltaY) > 25) {
      if (e.deltaY > 0) {
        // Scrolled down -> Next video
        handleNext()
      } else {
        // Scrolled up -> Previous video
        handlePrev()
      }
      wheelCooldown.current = true
      setTimeout(() => {
        wheelCooldown.current = false
      }, 450)
    }
  }

  const togglePlayPause = () => {
    const vid = videoRefs.current[currentIndex]
    if (!vid) return

    try {
      if (vid.paused) {
        const p = vid.play()
        if (p !== undefined) {
          p.catch(() => {})
        }
        setIsPlaying(true)
      } else {
        vid.pause()
        setIsPlaying(false)
      }
    } catch (e) {}
    setShowPlayStateAnim(true)
    setTimeout(() => setShowPlayStateAnim(false), 700)
  }

  const handleLike = async (idxToLike = currentIndex) => {
    const targetShort = localShorts[idxToLike]
    if (!targetShort) return
    const prevLiked = !!targetShort.is_liked
    const newLiked = !prevLiked
    const delta = newLiked ? 1 : -1

    // Optimistic update
    setLocalShorts((prev) =>
      prev.map((s, idx) =>
        idx === idxToLike
          ? {
              ...s,
              is_liked: newLiked,
              likes_count: Math.max(0, s.likes_count + delta)
            }
          : s
      )
    )

    try {
      await toggleLikeShortVideo(targetShort.id)
    } catch (err) {
      console.error('Like failed:', err)
    }
  }

  const handleSave = async (idxToSave = currentIndex) => {
    const targetShort = localShorts[idxToSave]
    if (!targetShort) return
    const prevSaved = !!targetShort.is_saved
    const newSaved = !prevSaved

    // Optimistic update
    setLocalShorts((prev) =>
      prev.map((s, idx) =>
        idx === idxToSave ? { ...s, is_saved: newSaved } : s
      )
    )

    try {
      await toggleSaveShortVideo(targetShort.id)
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  const handleShare = (shortToShare = currentShort) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/shorts?id=${shortToShare?.id}`
      navigator.clipboard.writeText(url)
      setCopiedToast(true)
      setTimeout(() => setCopiedToast(false), 2500)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim() || !currentShort || isSubmittingComment) return

    setIsSubmittingComment(true)
    const content = commentInput.trim()
    setCommentInput('')

    // Temporary optimistic comment
    const tempComment: ShortComment = {
      id: `temp-${Date.now()}`,
      short_id: currentShort.id,
      user_id: 'user-student-1',
      user_name: 'You',
      user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      content,
      created_at: new Date().toISOString(),
      likes_count: 0
    }

    setLocalShorts((prev) =>
      prev.map((s, idx) =>
        idx === currentIndex
          ? { ...s, comments: [tempComment, ...(s.comments || [])] }
          : s
      )
    )

    try {
      const actualComment = await addShortCommentAction(currentShort.id, content)
      if (actualComment) {
        setLocalShorts((prev) =>
          prev.map((s, idx) =>
            idx === currentIndex
              ? {
                  ...s,
                  comments: [
                    actualComment,
                    ...s.comments.filter((c) => c.id !== tempComment.id)
                  ]
                }
              : s
          )
        )
      }
    } catch (err) {
      console.error('Comment error:', err)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (!currentShort) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
        <Sparkles className="w-12 h-12 text-zinc-400 mb-3" />
        <p className="font-semibold text-lg">No educational shorts found.</p>
        <p className="text-sm mt-1">Check back soon for new micro-learning clips!</p>
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center w-full min-h-[calc(100vh-8rem)] py-2 select-none">
      {/* Ambient background glow matching the video */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 blur-3xl transition-all duration-700 hidden lg:block"
        style={{
          backgroundImage: `radial-gradient(circle at center, #6366f1 0%, #3b82f6 40%, transparent 80%)`
        }}
      />

      {/* Main Shorts Container: 9:16 portrait wrapper with touch and swipe support */}
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="relative w-full max-w-[420px] h-[720px] max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl bg-black border border-zinc-800 touch-none select-none cursor-grab active:cursor-grabbing"
      >
        {/* Videos Vertical Reel Stack */}
        {localShorts.map((short, idx) => {
          const diff = idx - currentIndex
          // Render only nearby videos for peak performance
          if (Math.abs(diff) > 2) return null

          const isCurrent = idx === currentIndex

          return (
            <div
              key={short.id}
              style={{
                transform: `translateY(calc(${diff * 100}% + ${dragOffset}px))`,
                transition: isSwiping ? 'none' : 'transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1)'
              }}
              className="absolute inset-0 w-full h-full will-change-transform z-10 flex flex-col justify-between"
            >
              {/* Full Video Frame */}
              <video
                ref={(el) => {
                  videoRefs.current[idx] = el
                }}
                src={short.video_url || '/videos/sample-short-1.mp4'}
                poster={short.thumbnail_url}
                loop
                playsInline
                muted={isMuted}
                preload="metadata"
                onClick={() => {
                  if (hasDragged.current) {
                    hasDragged.current = false
                    return
                  }
                  togglePlayPause()
                }}
                onError={(e) => {
                  const target = e.currentTarget
                  if (!target.src.includes('/videos/')) {
                    target.src = '/videos/sample-short-1.mp4'
                    try { target.load() } catch (err) {}
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
              />

              {/* Top Gradient for text contrast */}
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-10" />

              {/* Right Action Rail (Like, Comment, Save, Share) */}
              <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4 pointer-events-auto">
                {/* Creator Avatar */}
                <div className="relative group">
                  <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-indigo-600 shadow-md">
                    <img
                      src={
                        short.teacher?.avatar_url ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={short.teacher?.full_name || 'Creator'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLike(idx)
                  }}
                  className="flex flex-col items-center gap-1 text-white group cursor-pointer"
                  title="Like this short"
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                      short.is_liked
                        ? 'bg-rose-600/90 border-rose-500 text-white scale-110 shadow-lg shadow-rose-500/40'
                        : 'bg-black/50 hover:bg-black/80 border-white/10 text-white group-hover:scale-105'
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 transition-transform ${
                        short.is_liked ? 'fill-white text-white' : 'text-white'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold tracking-tight text-white drop-shadow">
                    {short.likes_count.toLocaleString()}
                  </span>
                </button>

                {/* Comments Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowComments(true)
                  }}
                  className="flex flex-col items-center gap-1 text-white group cursor-pointer"
                  title="View comments"
                >
                  <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all group-hover:scale-105">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-tight text-white drop-shadow">
                    {(short.comments?.length || 0).toLocaleString()}
                  </span>
                </button>

                {/* Save / Bookmark Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSave(idx)
                  }}
                  className="flex flex-col items-center gap-1 text-white group cursor-pointer"
                  title="Save short"
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                      short.is_saved
                        ? 'bg-amber-500 border-amber-400 text-white scale-110 shadow-lg shadow-amber-500/40'
                        : 'bg-black/50 hover:bg-black/80 border-white/10 text-white group-hover:scale-105'
                    }`}
                  >
                    <Bookmark
                      className={`w-5 h-5 ${
                        short.is_saved ? 'fill-white text-white' : 'text-white'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold tracking-tight text-white drop-shadow">
                    Save
                  </span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleShare(short)
                  }}
                  className="flex flex-col items-center gap-1 text-white group cursor-pointer"
                  title="Share short"
                >
                  <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all group-hover:scale-105">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-tight text-white drop-shadow">
                    Share
                  </span>
                </button>
              </div>

              {/* Bottom Information Overlay */}
              <div className="mt-auto relative z-20 px-4 pb-4 pt-16 bg-gradient-to-t from-black via-black/75 to-transparent flex flex-col gap-2 pointer-events-auto">
                {/* Creator Name */}
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm tracking-tight drop-shadow">
                    @{short.teacher?.full_name?.replace(/\s+/g, '').toLowerCase() || 'educator'}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">
                    Instructor
                  </span>
                </div>

                {/* Short Title & Description */}
                <h2 className="text-white font-bold text-sm sm:text-base leading-snug drop-shadow line-clamp-2">
                  {short.title}
                </h2>

                <p className="text-white/80 text-xs line-clamp-2 leading-relaxed">
                  {short.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {short.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-medium text-indigo-300 hover:text-indigo-200 cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Linked Course Bridge */}
                {short.course_id && (
                  <Link
                    href={`/student/courses/${short.course_id}`}
                    className="mt-1 flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white text-xs font-semibold transition-all group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">
                        From: {short.course_title || 'Related Course'}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </div>
            </div>
          )
        })}

        {/* Top Floating Controls Header (Always on Top) */}
        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-4 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="px-2.5 py-1 rounded-full bg-indigo-600/90 text-white font-bold text-[11px] tracking-wider uppercase flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>Micro-Byte</span>
            </span>
            <span className="text-white/80 text-xs font-mono drop-shadow">
              {currentIndex + 1} / {localShorts.length}
            </span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Audio Mute / Unmute */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all border border-white/10 cursor-pointer"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>

        {/* Play / Pause Animated Icon Overlay */}
        {showPlayStateAnim && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center animate-ping duration-300">
              {isPlaying ? <Play className="w-10 h-10 fill-white" /> : <Pause className="w-10 h-10 fill-white" />}
            </div>
          </div>
        )}

        {/* Mobile Swipe-Up Helper Hint (Visible initially on first video) */}
        {showSwipeHint && currentIndex === 0 && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center animate-bounce duration-1000 opacity-90 sm:hidden">
            <ChevronUp className="w-5 h-5 text-white drop-shadow" />
            <span className="text-[10px] font-semibold text-white bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-md border border-white/10 whitespace-nowrap">
              Swipe up for next
            </span>
          </div>
        )}

        {/* Comments Slide-over Drawer */}
        {showComments && (
          <div 
            className="absolute inset-0 z-40 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between animate-in slide-in-from-bottom duration-200 touch-auto cursor-auto"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <MessageCircle className="w-4 h-4 text-indigo-400" />
                <span>Comments ({currentShort.comments?.length || 0})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowComments(false)}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {(!currentShort.comments || currentShort.comments.length === 0) ? (
                <div className="text-center py-12 text-zinc-500">
                  <p>No comments yet. Be the first to start the discussion!</p>
                </div>
              ) : (
                currentShort.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2.5">
                    <img
                      src={
                        comment.user_avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={comment.user_name}
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200">
                          {comment.user_name}
                        </span>
                        <span className="text-[10px] text-zinc-500" suppressHydrationWarning>
                          {formatDisplayDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-zinc-300 mt-1 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input Form */}
            <form
              onSubmit={handleAddComment}
              className="p-3 border-t border-zinc-800 flex items-center gap-2 bg-zinc-900/60"
            >
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a question or comment..."
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!commentInput.trim() || isSubmittingComment}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Link Copied Toast Notification */}
        {copiedToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in-90 duration-150">
            <Check className="w-3.5 h-3.5" />
            <span>Shorts link copied to clipboard!</span>
          </div>
        )}
      </div>

      {/* Up / Down Navigation Controls (Desktop Helper Floating to the Right) */}
      <div className="hidden md:flex flex-col gap-3 ml-6 z-20">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed shadow-md transition-all hover:scale-105 cursor-pointer"
          title="Previous Short (Swipe Down / Up Arrow)"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex === localShorts.length - 1}
          className="p-3 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed shadow-md transition-all hover:scale-105 cursor-pointer"
          title="Next Short (Swipe Up / Down Arrow)"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
