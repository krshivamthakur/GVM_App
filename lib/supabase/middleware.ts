import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const FALLBACK_SUPABASE_URL = 'https://ansszvwhfcmdmmtosdgv.supabase.co'
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuc3N6dndoZmNtZG1tdG9zZGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTYxODIsImV4cCI6MjEwMzg3MjE4Mn0.lnVDUMEhfAD4rxlG5S1fDbr-d8DKLWCZTDJ_KGhcc9k'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return { supabaseResponse, user: null }
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
