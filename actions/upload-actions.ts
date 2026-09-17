'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/actions/auth-actions'

export async function uploadFile(
  formData: FormData,
  bucket: 'course-thumbnails' | 'lecture-videos' | 'lecture-notes'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized: Please log in to upload files.' }
    }

    // Restrict course media uploads to teachers and admins
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only teachers and administrators can upload course media.' }
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    const supabase = createAdminClient()
    const rawExt = file.name.split('.').pop() || 'pdf'
    const fileExt = rawExt.toLowerCase()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const filePath = `${fileName}`

    // Convert Web File stream to Buffer for Supabase storage
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const contentType = file.type || (bucket === 'lecture-notes' ? 'application/pdf' : 'application/octet-stream')

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error(`Supabase storage direct upload error in ${bucket}:`, error)
      return { success: false, error: error.message }
    }

    if (data) {
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return { success: true, url: publicUrlData.publicUrl }
    }

    return { success: false, error: 'Failed to obtain public URL after upload' }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'File upload failed'
    console.error('File upload error:', message)
    return { success: false, error: message }
  }
}
