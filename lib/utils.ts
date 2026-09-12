import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDisplayDate(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Recent'
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return 'Recent'
    const month = MONTHS[d.getUTCMonth()]
    const day = String(d.getUTCDate()).padStart(2, '0')
    const year = d.getUTCFullYear()
    return `${month} ${day}, ${year}`
  } catch {
    return 'Recent'
  }
}

export const DEFAULT_FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'

/**
 * Normalizes and converts image URLs (especially Google Drive links)
 * into direct, viewable image URLs suitable for <img> and Next/Image.
 *
 * Supported Google Drive link formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID
 * - https://drive.google.com/thumbnail?id=FILE_ID
 * - https://lh3.googleusercontent.com/d/FILE_ID
 */
export function formatImageUrl(
  url?: string | null,
  fallback: string = DEFAULT_FALLBACK_THUMBNAIL
): string {
  if (!url || typeof url !== 'string') {
    return fallback
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return fallback
  }

  // Detect Google Drive links
  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('googleusercontent.com')
  ) {
    let fileId: string | null = null

    // Match /file/d/ID or /d/ID
    const matchFileD = trimmed.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]+)/)
    if (matchFileD) {
      fileId = matchFileD[1]
    } else {
      // Match ?id=ID or &id=ID
      const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
      if (matchIdParam) {
        fileId = matchIdParam[1]
      }
    }

    if (fileId) {
      // Google's direct image CDN endpoint for Drive files
      return `https://lh3.googleusercontent.com/d/${fileId}`
    }
  }

  return trimmed
}
