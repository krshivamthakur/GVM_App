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
