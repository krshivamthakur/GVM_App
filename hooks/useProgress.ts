'use client'

import { useCallback, useRef } from 'react'

export function useProgress(lectureId: string, initialSeconds: number = 0) {
  const lastSavedSecondsRef = useRef<number>(initialSeconds)
  const isSavingRef = useRef<boolean>(false)

  const saveProgress = useCallback(
    async (seconds: number, completed: boolean = false) => {
      // Throttle: don't save if difference is less than 5 seconds unless completed is changed
      if (!completed && Math.abs(seconds - lastSavedSecondsRef.current) < 5) {
        return
      }

      if (isSavingRef.current) return
      isSavingRef.current = true

      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lectureId,
            watchedSeconds: Math.floor(seconds),
            completed
          })
        })
        lastSavedSecondsRef.current = seconds
      } catch (err) {
        console.error('Failed to sync progress heartbeat', err)
      } finally {
        isSavingRef.current = false
      }
    },
    [lectureId]
  )

  return {
    saveProgress,
    initialSeconds
  }
}
