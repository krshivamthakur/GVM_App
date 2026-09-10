'use client'

import React from 'react'
import Image from 'next/image'

export interface GVMPreloaderProps {
  /** If true, covers entire screen with a backdrop blur and fixed positioning */
  fullScreen?: boolean
  /** Size scale of the preloader */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Primary label under the preloader */
  text?: string
  /** Secondary subtitle under the primary label */
  subtext?: string
  /** Additional custom class names */
  className?: string
}

export function GVMPreloader({
  fullScreen = false,
  size = 'lg',
  text = 'Loading GVM...',
  subtext = 'Preparing your learning environment',
  className = ''
}: GVMPreloaderProps) {
  // Dimensions per size variant
  const sizeConfig = {
    sm: {
      container: 'w-24 h-24',
      logoBox: 'w-14 h-14',
      logoSize: 56,
      textClass: 'text-xs',
      subtextClass: 'text-[10px]'
    },
    md: {
      container: 'w-32 h-32',
      logoBox: 'w-20 h-20',
      logoSize: 80,
      textClass: 'text-sm font-bold',
      subtextClass: 'text-xs'
    },
    lg: {
      container: 'w-40 h-40',
      logoBox: 'w-24 h-24',
      logoSize: 96,
      textClass: 'text-base font-extrabold',
      subtextClass: 'text-xs'
    },
    xl: {
      container: 'w-52 h-52',
      logoBox: 'w-32 h-32',
      logoSize: 128,
      textClass: 'text-lg font-extrabold',
      subtextClass: 'text-sm'
    }
  }[size]

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Circle Rotating Around GVM Logo Container */}
      <div className={`relative flex items-center justify-center ${sizeConfig.container}`}>
        {/* Ambient Pulse Glow in Background */}
        <div className="absolute inset-2 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 blur-xl animate-pulse pointer-events-none" />

        {/* Counter-Clockwise Secondary Dashed Outer Ring */}
        <div className="absolute inset-0 rounded-full border border-dashed border-emerald-500/25 dark:border-emerald-400/20 animate-[spin_8s_linear_infinite_reverse]" />

        {/* Primary Rotating Circular Gradient Ring around Logo */}
        <svg
          className="absolute inset-0 w-full h-full animate-[spin_1.8s_linear_infinite]"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gvm-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="40%" stopColor="#059669" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#047857" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Background circular guide track */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-zinc-200/80 dark:text-zinc-800/80"
          />

          {/* Active rotating arc */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="url(#gvm-ring-gradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="80 200"
          />
        </svg>

        {/* Orbiting Satellite Glowing Dot around the perimeter */}
        <div className="absolute inset-0 animate-[spin_1.8s_linear_infinite]">
          <div className="absolute top-[4%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] ring-2 ring-white dark:ring-zinc-950" />
          </div>
        </div>

        {/* Central Circular GVM Logo */}
        <div
          className={`relative ${sizeConfig.logoBox} rounded-full overflow-hidden p-1.5 bg-white/95 dark:bg-zinc-900/95 shadow-xl shadow-emerald-950/10 ring-2 ring-emerald-500/30 flex items-center justify-center z-10 transition-transform`}
        >
          <Image
            src="/gvm.png"
            alt="GVM Logo"
            width={sizeConfig.logoSize}
            height={sizeConfig.logoSize}
            priority
            className="h-full w-full object-contain rounded-full select-none pointer-events-none drop-shadow-xs"
          />
        </div>
      </div>

      {/* Label & Status message */}
      {(text || subtext) && (
        <div className="text-center space-y-1 z-10">
          {text && (
            <h3 className={`${sizeConfig.textClass} text-foreground tracking-tight flex items-center justify-center gap-1.5`}>
              <span>{text}</span>
              <span className="flex items-center gap-0.5 ml-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
              </span>
            </h3>
          )}
          {subtext && (
            <p className={`${sizeConfig.subtextClass} text-muted-foreground font-medium`}>
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
        {content}
      </div>
    )
  }

  return content
}

export default GVMPreloader
