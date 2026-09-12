'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShortVideo } from '@/types/database'
import { createShortVideoAction, deleteShortVideoAction } from '@/actions/short-actions'
import { formatImageUrl, DEFAULT_FALLBACK_THUMBNAIL } from '@/lib/utils'
import { 
  Flame, 
  Plus, 
  Search, 
  Trash2, 
  Play, 
  Eye, 
  Heart, 
  MessageCircle, 
  X, 
  Sparkles, 
  Video, 
  ExternalLink,
  Tag,
  Calendar,
  AlertTriangle
} from 'lucide-react'

interface AdminShortsManagerProps {
  initialShorts: ShortVideo[]
}

export function AdminShortsManager({ initialShorts }: AdminShortsManagerProps) {
  const [shorts, setShorts] = useState<ShortVideo[]>(initialShorts)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('All')

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createVideoUrl, setCreateVideoUrl] = useState('')
  const [createTags, setCreateTags] = useState('Tutorial, QuickTip')
  const [isCreating, setIsCreating] = useState(false)

  // Watch Modal State
  const [activePreviewShort, setActivePreviewShort] = useState<ShortVideo | null>(null)

  // Delete State
  const [deletingShort, setDeletingShort] = useState<ShortVideo | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Extract all unique tags
  const allTags = ['All', ...Array.from(new Set(shorts.flatMap((s) => s.tags || [])))]

  // Filtered shorts
  const filteredShorts = shorts.filter((short) => {
    const matchesTag = selectedTag === 'All' || (short.tags && short.tags.includes(selectedTag))
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      short.title.toLowerCase().includes(q) ||
      (short.description && short.description.toLowerCase().includes(q)) ||
      (short.teacher?.full_name && short.teacher.full_name.toLowerCase().includes(q)) ||
      (short.tags && short.tags.some((t) => t.toLowerCase().includes(q)))

    return matchesTag && matchesSearch
  })

  // Metrics
  const totalShorts = shorts.length
  const totalViews = shorts.reduce((acc, s) => acc + (s.views_count || 0), 0)
  const totalLikes = shorts.reduce((acc, s) => acc + (s.likes_count || 0), 0)

  // Handle Create Short
  const handleCreateShort = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createTitle.trim() || !createVideoUrl.trim()) return
    setIsCreating(true)

    try {
      const fd = new FormData()
      fd.append('title', createTitle.trim())
      fd.append('description', createDesc.trim())
      fd.append('video_url', createVideoUrl.trim())
      fd.append('tags', createTags)

      const res = await createShortVideoAction(fd)
      if (res.success && res.short) {
        setShorts((prev) => [res.short!, ...prev])
        setShowCreateModal(false)
        setCreateTitle('')
        setCreateDesc('')
        setCreateVideoUrl('')
      } else {
        alert(res.error || 'Failed to create micro-short')
      }
    } catch (err: any) {
      alert(err.message || 'Error creating short')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle Delete Short
  const handleConfirmDelete = async () => {
    if (!deletingShort) return
    setIsDeleting(true)

    try {
      const ok = await deleteShortVideoAction(deletingShort.id)
      if (ok) {
        setShorts((prev) => prev.filter((s) => s.id !== deletingShort.id))
        setDeletingShort(null)
      } else {
        alert('Failed to delete short')
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting short')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            <Flame className="w-4 h-4" />
            <span>Micro-Learning Moderation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Shorts & Micro-Videos Studio
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Inspect all educator shorts, moderate bite-sized clips, post platform announcements, and monitor video engagement.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/shorts"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-xs font-semibold text-foreground transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Feed Preview</span>
          </Link>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Upload Short</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Published Clips</span>
          <div className="text-2xl font-black text-foreground mt-1">{totalShorts}</div>
          <span className="text-[11px] text-muted-foreground">Active micro-lessons</span>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Total Video Views</span>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{totalViews.toLocaleString()}</div>
          <span className="text-[11px] text-muted-foreground">Learner watch sessions</span>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Learner Likes</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{totalLikes.toLocaleString()}</div>
          <span className="text-[11px] text-muted-foreground">Positive reactions</span>
        </div>
      </div>

      {/* Search and Tag Filtering */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search shorts by title, tags, or instructor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {allTags.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {allTags.slice(0, 8).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedTag === tag
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {tag === 'All' ? 'All' : `#${tag}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Shorts Grid */}
      {filteredShorts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card">
          <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-foreground">No shorts found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || selectedTag !== 'All'
              ? 'No micro-short clips match your active filters.'
              : 'No shorts uploaded yet. Upload your first micro-video lesson!'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Short</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredShorts.map((short) => (
            <div
              key={short.id}
              className="group rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Preview with Play Overlay */}
                <div
                  onClick={() => setActivePreviewShort(short)}
                  className="relative aspect-9/16 max-h-72 w-full bg-black cursor-pointer overflow-hidden group/thumb"
                >
                  <img
                    src={formatImageUrl(
                      short.thumbnail_url ||
                      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80'
                    )}
                    alt={short.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_THUMBNAIL
                    }}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover/thumb:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-lg group-hover/thumb:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-orange-600 text-white shadow-xs">
                      {short.duration || 45}s
                    </span>
                  </div>

                  {/* Bottom Stats Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs font-semibold">
                    <div className="flex items-center gap-1 drop-shadow-sm">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{short.views_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 drop-shadow-sm">
                      <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      <span>{short.likes_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                    {short.title}
                  </h4>
                  {short.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {short.description}
                    </p>
                  )}

                  {/* Tags */}
                  {short.tags && short.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {short.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Instructor */}
                  {short.teacher && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-secondary overflow-hidden border border-border flex items-center justify-center font-bold text-[9px]">
                        {short.teacher.avatar_url ? (
                          <img src={short.teacher.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span>{short.teacher.full_name?.charAt(0) || 'T'}</span>
                        )}
                      </div>
                      <span className="truncate">{short.teacher.full_name || 'Instructor'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActivePreviewShort(short)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-background border border-border hover:bg-accent text-xs font-semibold text-foreground transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Watch</span>
                </button>

                <button
                  onClick={() => setDeletingShort(short)}
                  className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                  title="Delete Short"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Watch Short Video */}
      {activePreviewShort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl flex flex-col animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setActivePreviewShort(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative aspect-9/16 w-full max-h-[75vh] bg-black">
              <video
                src={activePreviewShort.video_url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 bg-zinc-900 text-white space-y-1">
              <h3 className="font-bold text-sm leading-snug">{activePreviewShort.title}</h3>
              <p className="text-xs text-zinc-400 line-clamp-2">{activePreviewShort.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Upload Short */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-600/10 text-orange-600">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Upload Platform Short</h3>
                  <p className="text-xs text-muted-foreground">Publish a micro-lesson clip visible across all feeds</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShort} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Short Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master CSS Grid in 30 Seconds"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Video URL * (MP4 / WebM / Direct Stream)
                </label>
                <input
                  type="text"
                  required
                  placeholder="/videos/sample-short-1.mp4 or https://..."
                  value={createVideoUrl}
                  onChange={(e) => setCreateVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Quick summary or tip highlights..."
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Tutorial, CSS, WebDev"
                  value={createTags}
                  onChange={(e) => setCreateTags(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 disabled:opacity-50"
                >
                  {isCreating ? 'Publishing Short...' : 'Publish Micro-Short'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Short Confirmation */}
      {deletingShort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/50">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Delete Micro-Short?</h3>
                <p className="text-xs text-muted-foreground">Permanent deletion confirmation</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              Are you sure you want to remove <strong className="text-foreground">{deletingShort.title}</strong>? It will no longer appear in the shorts discovery feed.
            </p>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-border">
              <button
                onClick={() => setDeletingShort(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete Short'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
