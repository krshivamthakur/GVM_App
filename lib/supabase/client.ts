import { createBrowserClient } from '@supabase/ssr'

const FALLBACK_SUPABASE_URL = 'https://ansszvwhfcmdmmtosdgv.supabase.co'
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuc3N6dndoZmNtZG1tdG9zZGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTYxODIsImV4cCI6MjEwMzg3MjE4Mn0.lnVDUMEhfAD4rxlG5S1fDbr-d8DKLWCZTDJ_KGhcc9k'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY
  return createBrowserClient(supabaseUrl, anonKey)
}
