'use client'

import { useCallback } from 'react'
import { triggerPageLoading, finishPageLoading } from '@/components/navigation/PageLoader'

export function usePageLoading() {
  const startLoading = useCallback(() => {
    triggerPageLoading()
  }, [])

  const stopLoading = useCallback(() => {
    finishPageLoading()
  }, [])

  return {
    startLoading,
    stopLoading,
  }
}

export { triggerPageLoading, finishPageLoading }
