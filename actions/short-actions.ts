'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { dataStore } from '@/lib/data/store'
import { ShortVideo, ShortComment } from '@/types/database'

export async function getShortVideos(tag?: string, search?: string): Promise<ShortVideo[]> {
  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('shorts')
      .select('*, teacher:Profile(*), comments:short_comments(*), likes:short_likes(*)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (tag && tag !== 'All') {
      const cleanTag = tag.replace(/^#/, '')
      query = query.contains('tags', [cleanTag])
    }

    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    let { data, error } = await query

    // If short_comments or short_likes relations don't exist yet in Supabase schema, retry with teacher:Profile(*)
    if (error) {
      let fallbackQuery = supabase
        .from('shorts')
        .select('*, teacher:Profile(*)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (tag && tag !== 'All') {
        const cleanTag = tag.replace(/^#/, '')
        fallbackQuery = fallbackQuery.contains('tags', [cleanTag])
      }

      if (search && search.trim()) {
        fallbackQuery = fallbackQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const fallbackResult = await fallbackQuery
      data = fallbackResult.data
      error = fallbackResult.error
    }

    if (!error && data) {
      if (data.length === 0) return []
      const activeUser = dataStore.getActiveUser()
      return data.map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description || '',
        video_url: s.video_url,
        thumbnail_url: s.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
        duration: s.duration || 45,
        teacher_id: s.teacher_id,
        teacher: s.teacher,
        course_id: s.course_id,
        course_title: s.course_title,
        views_count: s.views_count || 0,
        likes_count: s.likes?.length ?? s.likes_count ?? 0,
        is_liked: s.likes ? s.likes.some((l: any) => l.user_id === activeUser.id) : false,
        is_saved: false,
        tags: s.tags || [],
        created_at: s.created_at,
        comments: (s.comments || []).map((c: any) => ({
          id: c.id,
          short_id: c.short_id,
          user_id: c.user_id,
          user_name: c.user_name || 'Anonymous',
          user_avatar: c.user_avatar,
          content: c.content,
          created_at: c.created_at,
          likes_count: c.likes_count || 0
        }))
      }))
    }
  } catch (err) {
    console.warn('Supabase getShortVideos fallback to local store:', err)
  }

  return dataStore.getShorts(tag, search)
}

export async function getShortVideoById(id: string): Promise<ShortVideo | null> {
  try {
    const supabase = createAdminClient()
    let { data, error } = await supabase
      .from('shorts')
      .select('*, teacher:Profile(*), comments:short_comments(*), likes:short_likes(*)')
      .eq('id', id)
      .single()

    if (error) {
      const fallback = await supabase
        .from('shorts')
        .select('*, teacher:Profile(*)')
        .eq('id', id)
        .single()
      data = fallback.data
      error = fallback.error
    }

    if (!error && data) {
      // Increment views count in Supabase
      await supabase
        .from('shorts')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', id)

      const activeUser = dataStore.getActiveUser()
      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        video_url: data.video_url,
        thumbnail_url: data.thumbnail_url,
        duration: data.duration || 45,
        teacher_id: data.teacher_id,
        teacher: data.teacher,
        course_id: data.course_id,
        course_title: data.course_title,
        views_count: (data.views_count || 0) + 1,
        likes_count: data.likes?.length ?? data.likes_count ?? 0,
        is_liked: data.likes ? data.likes.some((l: any) => l.user_id === activeUser.id) : false,
        is_saved: false,
        tags: data.tags || [],
        created_at: data.created_at,
        comments: (data.comments || []).map((c: any) => ({
          id: c.id,
          short_id: c.short_id,
          user_id: c.user_id,
          user_name: c.user_name || 'Anonymous',
          user_avatar: c.user_avatar,
          content: c.content,
          created_at: c.created_at,
          likes_count: c.likes_count || 0
        }))
      }
    }
  } catch (err) {
    console.warn('Supabase getShortVideoById fallback:', err)
  }

  const short = dataStore.getShortById(id)
  if (short) {
    dataStore.incrementShortViews(id)
  }
  return short
}

export async function toggleLikeShortVideo(id: string): Promise<{ likes_count: number; is_liked: boolean }> {
  try {
    const supabase = createAdminClient()
    const activeUser = dataStore.getActiveUser()

    // Check if like exists in short_likes table
    const { data: existingLike, error: likeSelectErr } = await supabase
      .from('short_likes')
      .select('id')
      .eq('short_id', id)
      .eq('user_id', activeUser.id)
      .maybeSingle()

    if (!likeSelectErr) {
      if (existingLike) {
        // Remove like
        await supabase.from('short_likes').delete().eq('id', existingLike.id)
        // Decrement count
        const { data: currentShort } = await supabase.from('shorts').select('likes_count').eq('id', id).single()
        const newCount = Math.max(0, (currentShort?.likes_count || 1) - 1)
        await supabase.from('shorts').update({ likes_count: newCount }).eq('id', id)
        
        dataStore.toggleLikeShort(id)
        revalidatePath('/shorts')
        return { likes_count: newCount, is_liked: false }
      } else {
        // Add like
        await supabase.from('short_likes').insert({
          short_id: id,
          user_id: activeUser.id
        })
        // Increment count
        const { data: currentShort } = await supabase.from('shorts').select('likes_count').eq('id', id).single()
        const newCount = (currentShort?.likes_count || 0) + 1
        await supabase.from('shorts').update({ likes_count: newCount }).eq('id', id)

        dataStore.toggleLikeShort(id)
        revalidatePath('/shorts')
        return { likes_count: newCount, is_liked: true }
      }
    } else {
      // If short_likes table does not exist, update shorts.likes_count directly in database
      const res = dataStore.toggleLikeShort(id)
      const { data: currentShort } = await supabase.from('shorts').select('likes_count').eq('id', id).single()
      if (currentShort) {
        const newCount = res.is_liked ? (currentShort.likes_count || 0) + 1 : Math.max(0, (currentShort.likes_count || 1) - 1)
        await supabase.from('shorts').update({ likes_count: newCount }).eq('id', id)
        revalidatePath('/shorts')
        return { likes_count: newCount, is_liked: res.is_liked }
      }
    }
  } catch (err) {
    console.warn('Supabase toggleLike fallback:', err)
  }

  const res = dataStore.toggleLikeShort(id)
  revalidatePath('/shorts')
  revalidatePath('/student')
  revalidatePath('/')
  return res
}

export async function toggleSaveShortVideo(id: string): Promise<{ is_saved: boolean }> {
  const res = dataStore.toggleSaveShort(id)
  revalidatePath('/shorts')
  return res
}

export async function addShortCommentAction(shortId: string, content: string): Promise<ShortComment | null> {
  const activeUser = dataStore.getActiveUser()

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('short_comments')
      .insert({
        short_id: shortId,
        user_id: activeUser.id,
        user_name: activeUser.full_name || 'Learner',
        user_avatar: activeUser.avatar_url,
        content: content.trim()
      })
      .select()
      .single()

    if (!error && data) {
      dataStore.addShortComment(shortId, content)
      revalidatePath('/shorts')
      return {
        id: data.id,
        short_id: data.short_id,
        user_id: data.user_id,
        user_name: data.user_name,
        user_avatar: data.user_avatar,
        content: data.content,
        created_at: data.created_at,
        likes_count: data.likes_count || 0
      }
    }
  } catch (err) {
    console.warn('Supabase addShortComment fallback:', err)
  }

  const newComment = dataStore.addShortComment(shortId, content)
  revalidatePath('/shorts')
  return newComment
}

export async function createShortVideoAction(formData: FormData): Promise<{ success: boolean; short?: ShortVideo; error?: string }> {
  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const videoUrl = formData.get('video_url') as string
    const courseId = formData.get('course_id') as string
    const rawTags = (formData.get('tags') as string) || ''
    const tags = rawTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)

    if (!title || !videoUrl) {
      return { success: false, error: 'Title and Video URL are required' }
    }

    let courseTitle: string | undefined
    if (courseId) {
      const course = dataStore.getCourseById(courseId)
      if (course) {
        courseTitle = course.title
      }
    }

    const activeUser = dataStore.getActiveUser()

    // Try Supabase insert
    try {
      const supabase = createAdminClient()
      const { data: supaShort, error } = await supabase
        .from('shorts')
        .insert({
          title,
          description,
          video_url: videoUrl,
          thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
          duration: 45,
          teacher_id: activeUser.id,
          course_id: courseId || null,
          course_title: courseTitle || null,
          tags: tags.length > 0 ? tags : ['Educational', 'QuickTip'],
          is_published: true
        })
        .select('*, teacher:Profile(*)')
        .single()

      if (!error && supaShort) {
        // Also keep store updated
        dataStore.createShort({
          title,
          description,
          video_url: videoUrl,
          course_id: courseId || undefined,
          course_title: courseTitle,
          tags: tags.length > 0 ? tags : ['Educational', 'QuickTip']
        })

        revalidatePath('/shorts')
        revalidatePath('/teacher/shorts')
        revalidatePath('/student')
        revalidatePath('/')

        return { success: true, short: supaShort }
      }
    } catch (supaErr) {
      console.warn('Supabase createShort fallback:', supaErr)
    }

    const short = dataStore.createShort({
      title,
      description,
      video_url: videoUrl,
      course_id: courseId || undefined,
      course_title: courseTitle,
      tags: tags.length > 0 ? tags : ['Educational', 'QuickTip']
    })

    revalidatePath('/shorts')
    revalidatePath('/teacher/shorts')
    revalidatePath('/student')
    revalidatePath('/')

    return { success: true, short }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create short' }
  }
}

export async function deleteShortVideoAction(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    await supabase.from('shorts').delete().eq('id', id)
  } catch (err) {
    console.warn('Supabase deleteShort fallback:', err)
  }

  const ok = dataStore.deleteShort(id)
  revalidatePath('/shorts')
  revalidatePath('/teacher/shorts')
  return ok
}
