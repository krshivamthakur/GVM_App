'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings,
  CheckCircle,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Gauge
} from 'lucide-react'
import { useProgress } from '@/hooks/useProgress'

interface VideoPlayerProps {
  videoUrl: string
  lectureId: string
  lectureTitle?: string
  initialSeconds?: number
  isCompleted?: boolean
  onToggleComplete?: () => void
  onEnded?: () => void
}

export type VideoQuality = 'Auto' | '1080p' | '720p' | '480p' | '360p'

export const QUALITY_PRESETS: { label: VideoQuality; name: string; badge: string; desc: string }[] = [
  { label: 'Auto', name: 'Auto (Recommended)', badge: 'Auto', desc: 'Adaptive network bitrate' },
  { label: '1080p', name: '1080p Full HD', badge: '1080p', desc: 'Highest clarity (Full HD)' },
  { label: '720p', name: '720p HD', badge: '720p', desc: 'High definition balanced' },
  { label: '480p', name: '480p Standard', badge: '480p', desc: 'Standard definition' },
  { label: '360p', name: '360p Data Saver', badge: '360p', desc: 'Saves mobile data' },
]

export interface ParsedVideoSource {
  type: 'gdrive' | 'youtube' | 'vimeo' | 'direct'
  fileId?: string
  streamUrl?: string
  embedUrl?: string
  rawUrl: string
  originalUrl: string
}

export function parseVideoUrl(url: string): ParsedVideoSource {
  if (!url || typeof url !== 'string') {
    return { type: 'direct', rawUrl: '/videos/sample-short-1.mp4', originalUrl: '' }
  }

  const trimmed = url.trim()

  // 1. Google Drive Links
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1]
      return {
        type: 'gdrive',
        fileId,
        // Stream directly to HTML5 video without Google Drive's dark mobile overlay/film
        streamUrl: `/api/video-stream?id=${fileId}`,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        rawUrl: trimmed,
        originalUrl: trimmed
      }
    }
  }

  // 2. YouTube Links (including YouTube Shorts)
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1]
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=0&enablejsapi=1`,
      rawUrl: trimmed,
      originalUrl: trimmed
    }
  }

  // 3. Vimeo Links
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/)
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      rawUrl: trimmed,
      originalUrl: trimmed
    }
  }

  // 4. Dropbox Links (convert to direct raw stream)
  if (trimmed.includes('dropbox.com')) {
    const rawDropbox = trimmed.includes('?')
      ? trimmed.replace(/[?&]dl=0/, '?raw=1')
      : `${trimmed}?raw=1`
    return {
      type: 'direct',
      rawUrl: rawDropbox,
      originalUrl: trimmed
    }
  }

  // 5. Loom Links
  if (trimmed.includes('loom.com/share/')) {
    const loomId = trimmed.split('loom.com/share/')[1]?.split('?')[0]
    if (loomId) {
      return {
        type: 'vimeo',
        embedUrl: `https://www.loom.com/embed/${loomId}`,
        rawUrl: trimmed,
        originalUrl: trimmed
      }
    }
  }

  // 6. Direct video URL (MP4, WebM, Supabase Storage, etc.)
  return {
    type: 'direct',
    rawUrl: trimmed,
    originalUrl: trimmed
  }
}

export function VideoPlayer({
  videoUrl,
  lectureId,
  lectureTitle,
  initialSeconds = 0,
  isCompleted = false,
  onToggleComplete,
  onEnded
}: VideoPlayerProps) {
  const parsed = parseVideoUrl(videoUrl)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { saveProgress } = useProgress(lectureId, initialSeconds)

  // Player States
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialSeconds)
  const [duration, setDuration] = useState(0)
  const [bufferedPercent, setBufferedPercent] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false)
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('Auto')
  const [qualityToast, setQualityToast] = useState<string | null>(null)
  const [useFallbackEmbed, setUseFallbackEmbed] = useState(false)

  // Double-tap ripple state (YouTube-style mobile UX)
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null)
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 })
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const qualityToastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Automatically save progress for pure external embeds (YouTube/Vimeo)
  useEffect(() => {
    if ((parsed.type === 'youtube' || parsed.type === 'vimeo') && parsed.embedUrl) {
      saveProgress(30, isCompleted)
    }
  }, [parsed.type, parsed.embedUrl, isCompleted, saveProgress])

  // Reset controls hide timer
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    // Only auto-hide if playing and menus are closed
    if (isPlaying && !speedMenuOpen && !qualityMenuOpen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
        setSpeedMenuOpen(false)
        setQualityMenuOpen(false)
      }, 3500)
    }
  }, [isPlaying, speedMenuOpen, qualityMenuOpen])

  useEffect(() => {
    resetControlsTimer()
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [isPlaying, resetControlsTimer])

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration
      setDuration(dur)
      if (initialSeconds > 0 && initialSeconds < dur) {
        videoRef.current.currentTime = initialSeconds
        setCurrentTime(initialSeconds)
      }
      setIsLoading(false)
    }
  }

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0 && duration > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
      setBufferedPercent((bufferedEnd / duration) * 100)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
        setShowControls(true)
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true)
          resetControlsTimer()
        }).catch((err) => {
          console.warn('Playback request error:', err)
        })
      }
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime
      setCurrentTime(cur)
      saveProgress(cur, isCompleted)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
      saveProgress(time, isCompleted)
    }
    resetControlsTimer()
  }

  const skipSeconds = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration)
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
      saveProgress(newTime, isCompleted)
    }
    resetControlsTimer()
  }

  // Mobile standard double-tap gesture (Left: -10s, Right: +10s, Center/Single: toggle controls)
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const now = Date.now()

    const timeDiff = now - lastTapRef.current.time
    const distDiff = Math.abs(clickX - lastTapRef.current.x)

    // Double-tap detected within 320ms and within 60px
    if (timeDiff < 320 && distDiff < 60) {
      if (clickX < width * 0.4) {
        // Left side double-tap: Rewind 10s
        skipSeconds(-10)
        setDoubleTapSide('left')
        setTimeout(() => setDoubleTapSide(null), 700)
      } else if (clickX > width * 0.6) {
        // Right side double-tap: Forward 10s
        skipSeconds(10)
        setDoubleTapSide('right')
        setTimeout(() => setDoubleTapSide(null), 700)
      } else {
        togglePlay()
      }
      lastTapRef.current = { time: 0, x: 0 }
      return
    }

    lastTapRef.current = { time: now, x: clickX }

    // Single tap toggles controls visibility
    if (showControls && isPlaying && !speedMenuOpen && !qualityMenuOpen) {
      setShowControls(false)
      setSpeedMenuOpen(false)
      setQualityMenuOpen(false)
    } else {
      resetControlsTimer()
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (videoRef.current) {
      videoRef.current.volume = val
      setIsMuted(val === 0)
    }
    resetControlsTimer()
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted
      videoRef.current.muted = nextMuted
      setIsMuted(nextMuted)
    }
    resetControlsTimer()
  }

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
      setSpeedMenuOpen(false)
    }
    resetControlsTimer()
  }

  // Change streaming quality
  const changeQuality = (newQuality: VideoQuality) => {
    setSelectedQuality(newQuality)
    setQualityMenuOpen(false)
    setQualityToast(`Quality set to ${newQuality === 'Auto' ? 'Auto (1080p)' : newQuality}`)

    if (qualityToastTimeoutRef.current) {
      clearTimeout(qualityToastTimeoutRef.current)
    }
    qualityToastTimeoutRef.current = setTimeout(() => {
      setQualityToast(null)
    }, 2200)

    if (videoRef.current) {
      const curTime = videoRef.current.currentTime
      const wasPlaying = isPlaying

      // If playing through our stream endpoint, update query parameter seamlessly
      if (parsed.streamUrl) {
        const base = parsed.streamUrl.split('&quality=')[0]
        const targetSrc = newQuality !== 'Auto' ? `${base}&quality=${newQuality}` : base

        if (videoRef.current.src !== targetSrc) {
          setIsLoading(true)
          videoRef.current.src = targetSrc
          videoRef.current.currentTime = curTime
          if (wasPlaying) {
            videoRef.current.play().catch(() => {})
          }
        }
      }
    }
    resetControlsTimer()
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen()
        } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
          // iOS Safari specific fullscreen
          (videoRef.current as any).webkitEnterFullscreen()
        }
        setIsFullscreen(true)
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        }
        setIsFullscreen(false)
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err)
    }
    resetControlsTimer()
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
    setShowControls(true)
    saveProgress(duration, true)
    if (onEnded) onEnded()
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00'
    const totalSecs = Math.floor(seconds)
    const hours = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60

    if (hours > 0) {
      return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // If external YouTube/Vimeo embed or fallback requested
  if ((parsed.type === 'youtube' || parsed.type === 'vimeo' || useFallbackEmbed) && parsed.embedUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-black shadow-2xl border border-zinc-200 dark:border-zinc-800">
        <iframe
          src={parsed.embedUrl}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          title={lectureTitle || 'Lecture Video'}
        />
        {useFallbackEmbed && (
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={() => {
                setUseFallbackEmbed(false)
                setHasError(false)
                setIsLoading(true)
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-900/80 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20 hover:bg-zinc-800"
            >
              Switch to Native Player
            </button>
          </div>
        )}
      </div>
    )
  }

  // Primary source: Stream URL for Google Drive, or raw direct URL
  const videoSourceUrl = parsed.streamUrl || parsed.rawUrl || '/videos/sample-short-1.mp4'
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative aspect-video w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-black shadow-2xl group select-none ring-1 ring-black/10 dark:ring-white/10"
    >
      {/* HTML5 Native Video Tag with Mobile Optimization */}
      <video
        ref={videoRef}
        src={videoSourceUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onEnded={handleVideoEnded}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        className="h-full w-full object-contain cursor-pointer"
        playsInline
        preload="metadata"
      />

      {/* Double Tap Ripple Indicators for Mobile (YouTube Style) */}
      {doubleTapSide === 'left' && (
        <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-center pointer-events-none z-30 bg-white/5 animate-pulse">
          <div className="flex flex-col items-center justify-center p-4 rounded-full bg-black/60 backdrop-blur-md text-white">
            <RotateCcw className="w-8 h-8 animate-spin-once" />
            <span className="text-xs font-bold mt-1">-10s</span>
          </div>
        </div>
      )}

      {doubleTapSide === 'right' && (
        <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center pointer-events-none z-30 bg-white/5 animate-pulse">
          <div className="flex flex-col items-center justify-center p-4 rounded-full bg-black/60 backdrop-blur-md text-white">
            <RotateCw className="w-8 h-8 animate-spin-once" />
            <span className="text-xs font-bold mt-1">+10s</span>
          </div>
        </div>
      )}

      {/* Quality Change Toast Indicator */}
      {qualityToast && (
        <div className="absolute top-12 inset-x-0 flex justify-center pointer-events-none z-30 animate-in fade-in zoom-in duration-150">
          <div className="px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl">
            <Check className="w-3.5 h-3.5 text-blue-400" />
            <span>{qualityToast}</span>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none z-20">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 animate-spin" />
          <span className="text-white text-xs mt-2 font-medium tracking-wide">
            {selectedQuality !== 'Auto' ? `Buffering ${selectedQuality}...` : 'Loading stream...'}
          </span>
        </div>
      )}

      {/* Error Fallback Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 text-white p-6 text-center space-y-4 z-30">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Direct Stream Unavailable</h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              We could not stream this lecture video directly. You can switch to the standard cloud preview player.
            </p>
          </div>
          {parsed.embedUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setUseFallbackEmbed(true)
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Use Cloud Player Preview</span>
            </button>
          )}
        </div>
      )}

      {/* Top Header Bar Overlay (Fade with controls) */}
      <div
        className={`absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-3 sm:p-4 transition-opacity duration-300 pointer-events-none z-20 flex items-center justify-between ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-4">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/30 border border-blue-400/30 text-blue-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
            <Sparkles className="w-2.5 h-2.5" />
            {selectedQuality === 'Auto' ? 'HD Stream' : `${selectedQuality} Stream`}
          </span>
          {lectureTitle && (
            <h3 className="text-xs sm:text-sm font-semibold text-white/90 truncate drop-shadow-sm">
              {lectureTitle}
            </h3>
          )}
        </div>
      </div>

      {/* Center Touch Play/Seek Controls (Mobile Standard) */}
      <div
        className={`absolute inset-0 flex items-center justify-center gap-6 sm:gap-10 pointer-events-none z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* 10s Rewind Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            skipSeconds(-10)
          }}
          className="pointer-events-auto w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex flex-col items-center justify-center transition-transform active:scale-90 shadow-lg border border-white/10"
          title="Rewind 10 seconds"
        >
          <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] font-bold leading-none mt-0.5">10</span>
        </button>

        {/* Primary Center Play / Pause Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all shadow-2xl shadow-blue-600/50 hover:scale-105 active:scale-95 border-2 border-white/20"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
          ) : (
            <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-1 fill-white" />
          )}
        </button>

        {/* 10s Forward Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            skipSeconds(10)
          }}
          className="pointer-events-auto w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex flex-col items-center justify-center transition-transform active:scale-90 shadow-lg border border-white/10"
          title="Forward 10 seconds"
        >
          <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] font-bold leading-none mt-0.5">10</span>
        </button>
      </div>

      {/* Bottom Controls Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-6 pb-3 px-3 sm:px-5 transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Mobile-Friendly Scrubber / Progress Bar */}
        <div className="relative mb-2.5 flex items-center group/scrubber cursor-pointer">
          {/* Background Track */}
          <div className="w-full h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden relative">
            {/* Buffer indicator */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-white/30 rounded-full transition-all duration-200"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Active Playback Progress Bar */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Interactive Range Input */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            title="Seek timeline"
          />

          {/* Animated Thumb */}
          <div
            className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full shadow-md pointer-events-none transform -translate-x-1/2 group-hover/scrubber:scale-125 transition-transform ring-2 ring-blue-500"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Controls Row: Left (Play, Time) | Right (Speed, Quality, Volume, Fullscreen) */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left: Play/Pause mini toggle + Time Display */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={togglePlay}
              className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            {/* Time Display */}
            <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs text-zinc-300 font-medium">
              <span className="text-white font-semibold">{formatTime(currentTime)}</span>
              <span className="text-zinc-500">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume, Quality, Speed, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Volume Control */}
            <div className="flex items-center gap-1 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-16 h-1 bg-white/30 rounded appearance-none cursor-pointer accent-blue-500 hidden sm:group-hover/vol:inline-block"
              />
            </div>

            {/* Streaming Quality Selector (360p, 480p, 720p, 1080p, Auto) */}
            <div className="relative">
              <button
                onClick={() => {
                  setQualityMenuOpen(!qualityMenuOpen)
                  setSpeedMenuOpen(false)
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono transition-colors border ${
                  selectedQuality !== 'Auto'
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                    : 'bg-white/10 hover:bg-white/20 text-zinc-200 border-white/10'
                }`}
                title="Streaming Quality"
              >
                <Settings className="w-3 h-3 text-blue-400" />
                <span className="font-semibold hidden sm:inline">{selectedQuality}</span>
                <span className="font-semibold sm:hidden">{selectedQuality === 'Auto' ? 'Auto' : selectedQuality.replace('p', '')}</span>
              </button>

              {qualityMenuOpen && (
                <div className="absolute bottom-9 right-0 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 text-xs z-50 min-w-[160px]">
                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-0.5">
                    <span>Quality</span>
                    <span className="text-[9px] text-blue-400 font-normal">Adaptive</span>
                  </div>
                  {QUALITY_PRESETS.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => changeQuality(q.label)}
                      className={`px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between ${
                        selectedQuality === q.label
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'text-zinc-200 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex flex-col leading-tight">
                        <span className="text-xs">{q.label}</span>
                        <span className={`text-[10px] font-normal ${selectedQuality === q.label ? 'text-blue-100' : 'text-zinc-400'}`}>
                          {q.desc}
                        </span>
                      </div>
                      {selectedQuality === q.label && (
                        <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Playback Speed Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setSpeedMenuOpen(!speedMenuOpen)
                  setQualityMenuOpen(false)
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-mono text-zinc-200 transition-colors border border-white/10"
                title="Playback Speed"
              >
                <Gauge className="w-3 h-3 text-blue-400" />
                <span>{playbackRate}x</span>
              </button>

              {speedMenuOpen && (
                <div className="absolute bottom-9 right-0 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 text-xs z-50 min-w-[95px]">
                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Speed</div>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`px-3 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between ${
                        playbackRate === rate
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'text-zinc-200 hover:bg-white/10'
                      }`}
                    >
                      <span>{rate}x</span>
                      {rate === 1 && <span className="text-[10px] opacity-70">Normal</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Mark Completed */}
            {onToggleComplete && (
              <button
                onClick={onToggleComplete}
                className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-zinc-200'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isCompleted ? 'Done' : 'Mark Done'}</span>
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
