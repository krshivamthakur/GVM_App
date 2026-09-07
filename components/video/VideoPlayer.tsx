'use client'

import { useRef, useState, useEffect } from 'react'
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
  Loader2
} from 'lucide-react'
import { useProgress } from '@/hooks/useProgress'

interface VideoPlayerProps {
  videoUrl: string
  lectureId: string
  initialSeconds?: number
  isCompleted?: boolean
  onToggleComplete?: () => void
  onEnded?: () => void
}

export function VideoPlayer({
  videoUrl,
  lectureId,
  initialSeconds = 0,
  isCompleted = false,
  onToggleComplete,
  onEnded
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { saveProgress } = useProgress(lectureId, initialSeconds)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialSeconds)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false)

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize playback position once video metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      if (initialSeconds > 0 && initialSeconds < videoRef.current.duration) {
        videoRef.current.currentTime = initialSeconds
        setCurrentTime(initialSeconds)
      }
      setIsLoading(false)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause()
        } else {
          const p = videoRef.current.play()
          if (p !== undefined) {
            p.catch(() => {})
          }
        }
      } catch (e) {}
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime
      setCurrentTime(cur)
      // Save progress heartbeat
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
  }

  const skipSeconds = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration)
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (videoRef.current) {
      videoRef.current.volume = val
      setIsMuted(val === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
      setSpeedMenuOpen(false)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
    saveProgress(duration, true)
    if (onEnded) onEnded()
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 2500)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl group select-none"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={videoUrl || '/videos/sample-short-1.mp4'}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        onClick={togglePlay}
        onError={(e) => {
          const target = e.currentTarget
          if (!target.src.includes('/videos/')) {
            target.src = '/videos/sample-short-1.mp4'
            try { target.load() } catch (err) {}
          }
        }}
        className="h-full w-full object-contain cursor-pointer"
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Big Center Play/Pause Overlay */}
      {!isPlaying && !isLoading && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
        >
          <div className="h-16 w-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="h-7 w-7 ml-1 fill-white" />
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seek Bar */}
        <div className="relative mb-3 flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left: Play, Skip, Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            <button
              onClick={() => skipSeconds(-10)}
              title="Rewind 10s"
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => skipSeconds(10)}
              title="Forward 10s"
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-300">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume, Speed, Mark Complete, Fullscreen */}
          <div className="flex items-center gap-3">
            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="p-1.5 rounded-lg hover:bg-white/20">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-zinc-600 rounded appearance-none cursor-pointer accent-blue-500 hidden group-hover/vol:inline-block"
              />
            </div>

            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 font-mono text-[11px]"
              >
                {playbackRate}x
              </button>
              {speedMenuOpen && (
                <div className="absolute bottom-8 right-0 bg-zinc-900 border border-zinc-700 rounded-lg p-1 shadow-xl flex flex-col gap-0.5 text-xs z-50">
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`px-3 py-1 text-left rounded hover:bg-blue-600 ${
                        playbackRate === rate ? 'font-bold text-blue-400' : 'text-zinc-200'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mark Completed */}
            {onToggleComplete && (
              <button
                onClick={onToggleComplete}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-zinc-200'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isCompleted ? 'Completed' : 'Mark Done'}</span>
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
