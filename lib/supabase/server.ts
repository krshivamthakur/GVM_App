import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const FALLBACK_SUPABASE_URL = 'https://ansszvwhfcmdmmtosdgv.supabase.co'
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuc3N6dndoZmNtZG1tdG9zZGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTYxODIsImV4cCI6MjEwMzg3MjE4Mn0.lnVDUMEhfAD4rxlG5S1fDbr-d8DKLWCZTDJ_KGhcc9k'
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuc3N6dndoZmNtZG1tdG9zZGd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5NjE4MiwiZXhwIjoyMTAzODcyMTgyfQ.cDOOhmgFdjlGtamLCx4yjCw4kMDdoNjN9t7OuhXlqBc'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY

  return createServerClient(
    supabaseUrl,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}

/**
 * Server-side Admin client with Service Role privileges for reliable CRUD operations
 * bypassing RLS restrictions during server actions.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SERVICE_ROLE_KEY

  return createSupabaseJsClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
