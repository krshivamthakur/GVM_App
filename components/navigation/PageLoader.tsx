'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { usePlatformSettings } from '@/contexts/PlatformSettingsContext'

export function triggerPageLoading() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:page-loading-start'))
  }
}

export function finishPageLoading() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:page-loading-stop'))
  }
}

function PageLoaderInternal() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { settings } = usePlatformSettings()

  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showPill, setShowPill] = useState(false)

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pillTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startLoading = () => {
    // Clear any existing timers
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    if (pillTimeoutRef.current) clearTimeout(pillTimeoutRef.current)
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)

    setIsLoading(true)
    setProgress(15)
    setShowPill(false)

    // Show floating pill only if loading takes longer than 150ms (prevents flicker on quick pages)
    pillTimeoutRef.current = setTimeout(() => {
      setShowPill(true)
    }, 150)

    // Increment progress gradually to indicate active loading
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) {
          return prev + 0.5 > 95 ? 95 : prev + 0.5
        }
        if (prev >= 60) {
          return prev + 1.5
        }
        return prev + 4
      })
    }, 120)

    // Safety timeout: auto stop after 10s if route never completes
    safetyTimeoutRef.current = setTimeout(() => {
      stopLoading()
    }, 10000)
  }

  const stopLoading = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    if (pillTimeoutRef.current) clearTimeout(pillTimeoutRef.current)
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)

    setProgress(100)

    setTimeout(() => {
      setIsLoading(false)
      setShowPill(false)
      setTimeout(() => {
        setProgress(0)
      }, 250)
    }, 200)
  }

  // Complete loading whenever pathname or search params change
  useEffect(() => {
    stopLoading()
  }, [pathname, searchParams])

  // Listen to custom loading events and global link/button clicks
  useEffect(() => {
    const handleStartEvent = () => startLoading()
    const handleStopEvent = () => stopLoading()

    const handleDocumentClick = (e: MouseEvent) => {
      // Don't trigger if default was prevented or modifier keys held
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }

      // Check if clicked element or parent is an anchor
      const target = e.target as HTMLElement | null
      const anchor = target?.closest('a')
      if (anchor) {
        const href = anchor.getAttribute('href')
        const targetAttr = anchor.getAttribute('target')

        // Ignore external, empty, hash-only, or new tab links
        if (
          !href ||
          href.startsWith('#') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          targetAttr === '_blank' ||
          anchor.hasAttribute('download')
        ) {
          return
        }

        try {
          const currentUrl = new URL(window.location.href)
          const targetUrl = new URL(href, window.location.href)

          // Only trigger for same-origin internal navigations
          if (targetUrl.origin === currentUrl.origin) {
            const currentFull = currentUrl.pathname + currentUrl.search
            const targetFull = targetUrl.pathname + targetUrl.search

            // Trigger if moving to a different URL
            if (targetFull !== currentFull) {
              startLoading()
            }
          }
        } catch {
          // Ignore invalid URLs
        }
        return
      }

      // Check if button clicked has data-loading or navigates
      const button = target?.closest('button')
      if (button && button.getAttribute('data-nav-loading') === 'true') {
        startLoading()
      }
    }

    // Capture click events early
    document.addEventListener('click', handleDocumentClick, true)
    window.addEventListener('app:page-loading-start', handleStartEvent)
    window.addEventListener('app:page-loading-stop', handleStopEvent)
    window.addEventListener('popstate', handleStartEvent)

    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
      window.removeEventListener('app:page-loading-start', handleStartEvent)
      window.removeEventListener('app:page-loading-stop', handleStopEvent)
      window.removeEventListener('popstate', handleStartEvent)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (pillTimeoutRef.current) clearTimeout(pillTimeoutRef.current)
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
    }
  }, [])

  if (!isLoading && progress === 0) return null

  return (
    <>
      {/* Top Gradient Glowing Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[99999] h-[3.5px] pointer-events-none overflow-hidden"
        style={{ opacity: isLoading ? 1 : 0, transition: 'opacity 250ms ease-out' }}
      >
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-all ease-out"
          style={{
            width: `${progress}%`,
            transitionDuration: progress === 100 ? '150ms' : '250ms'
          }}
        />
      </div>

      {/* Floating Modern Glassmorphic Pill Loader */}
      {showPill && isLoading && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99998] pointer-events-none select-none animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
            {/* Spinning Brand Icon / Mini Logo */}
            <div className="relative flex items-center justify-center w-4 h-4">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/25 border-t-emerald-500 animate-spin" />
              <img
                src={settings.logoUrl || '/gvm.png'}
                alt=""
                className="w-2.5 h-2.5 object-contain"
              />
            </div>
            <span>Loading page...</span>
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" />
            </span>
          </div>
        </div>
      )}
    </>
  )
}

export function PageLoader() {
  return (
    <Suspense fallback={null}>
      <PageLoaderInternal />
    </Suspense>
  )
}
