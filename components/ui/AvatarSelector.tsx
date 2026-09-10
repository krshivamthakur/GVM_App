'use client'

import React, { useState, useRef } from 'react'
import { 
  Upload, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Check, 
  X, 
  Sparkles,
  Camera,
  User,
  GraduationCap,
  BookOpen,
  Bot
} from 'lucide-react'

export interface PresetAvatar {
  id: string
  name: string
  url: string
  category: 'students' | 'teachers' | '3d-avatars' | 'leadership'
}

export const PRESET_AVATARS: PresetAvatar[] = [
  // Students
  {
    id: 'std-1',
    name: 'Student Emma',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    category: 'students'
  },
  {
    id: 'std-2',
    name: 'Student Alex',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    category: 'students'
  },
  {
    id: 'std-3',
    name: 'Student Sophia',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    category: 'students'
  },
  {
    id: 'std-4',
    name: 'Student Liam',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    category: 'students'
  },
  // Teachers / Professors
  {
    id: 'tch-1',
    name: 'Dr. Sharma',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    category: 'teachers'
  },
  {
    id: 'tch-2',
    name: 'Prof. Sarah',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    category: 'teachers'
  },
  {
    id: 'tch-3',
    name: 'Dr. David',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    category: 'teachers'
  },
  {
    id: 'tch-4',
    name: 'Prof. Maya',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    category: 'teachers'
  },
  // 3D / Creative Avatars
  {
    id: '3d-1',
    name: 'Cyber Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=b6e3f4',
    category: '3d-avatars'
  },
  {
    id: '3d-2',
    name: 'Sparky',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka&backgroundColor=ffdfbf',
    category: '3d-avatars'
  },
  {
    id: '3d-3',
    name: 'Smartie',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dusty&backgroundColor=c0aede',
    category: '3d-avatars'
  },
  {
    id: '3d-4',
    name: 'CodeBot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Bella&backgroundColor=d1d4f9',
    category: '3d-avatars'
  },
  // Leadership & Admin
  {
    id: 'lead-1',
    name: 'Admin Marcus',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    category: 'leadership'
  },
  {
    id: 'lead-2',
    name: 'Admin Elena',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    category: 'leadership'
  }
]

interface AvatarSelectorProps {
  value: string
  onChange: (url: string) => void
  label?: string
  fallbackName?: string
}

export function AvatarSelector({
  value,
  onChange,
  label = 'Profile Avatar',
  fallbackName = 'User'
}: AvatarSelectorProps) {
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'url'>('gallery')
  const [galleryCategory, setGalleryCategory] = useState<'all' | 'students' | 'teachers' | '3d-avatars'>('all')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Compress and resize image to lightweight base64 Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, or WebP).')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File size should be under 8MB.')
      return
    }

    setIsProcessing(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 256
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width)
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height)
            height = MAX_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
          onChange(dataUrl)
        }
        setIsProcessing(false)
      }
      img.onerror = () => {
        setUploadError('Could not process this image. Please try another.')
        setIsProcessing(false)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const filteredAvatars = PRESET_AVATARS.filter(
    (a) => galleryCategory === 'all' || a.category === galleryCategory
  )

  return (
    <div className="space-y-3">
      {/* Label and Current Selected Preview */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-primary" />
          <span>{label}</span>
        </label>

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Main Avatar Preview & Selector Tabs Container */}
      <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs space-y-3">
        {/* Top: Current Avatar Highlight & Mode Tabs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pb-3 border-b border-border">
          {/* Circular Avatar Preview */}
          <div className="relative group shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/40 bg-secondary flex items-center justify-center shadow-xs">
              {value ? (
                <img
                  src={value}
                  alt={fallbackName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // In case image URL fails to load
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              ) : (
                <span className="font-bold text-lg text-secondary-foreground uppercase">
                  {fallbackName.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-primary-foreground shadow-xs">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex-1 w-full flex items-center gap-1 p-1 rounded-xl bg-muted border border-border text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold transition-all ${
                activeTab === 'gallery'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-primary" />
              <span>Avatar Gallery</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              <span>Upload Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold transition-all ${
                activeTab === 'url'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Custom URL</span>
            </button>
          </div>
        </div>

        {/* TAB 1: PRESET AVATAR GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-2.5 animate-in fade-in-50 duration-150">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Avatars' },
                { id: 'students', label: 'Students' },
                { id: 'teachers', label: 'Instructors' },
                { id: '3d-avatars', label: '3D / Bots' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setGalleryCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    galleryCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Avatars Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-40 overflow-y-auto p-1 rounded-xl bg-muted/20 border border-border/60">
              {filteredAvatars.map((avatar) => {
                const isSelected = value === avatar.url
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => onChange(avatar.url)}
                    title={avatar.name}
                    className={`relative rounded-full aspect-square p-0.5 transition-all group overflow-hidden ${
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-sm'
                        : 'hover:ring-2 hover:ring-border hover:scale-105'
                    }`}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full h-full rounded-full object-cover bg-secondary"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/40 rounded-full flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Click any avatar to select it for the profile
            </p>
          </div>
        )}

        {/* TAB 2: UPLOAD FROM DEVICE */}
        {activeTab === 'upload' && (
          <div className="space-y-2 animate-in fade-in-50 duration-150">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/gif"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-4 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {isProcessing ? 'Processing image...' : 'Click to browse and upload photo'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                PNG, JPG or WebP up to 8MB (Auto-scaled for profiles)
              </p>
            </div>

            {uploadError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium text-center">
                {uploadError}
              </p>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOM IMAGE URL */}
        {activeTab === 'url' && (
          <div className="space-y-2 animate-in fade-in-50 duration-150">
            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="Paste direct image link: https://..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Provide any public HTTPS image URL from Unsplash, Cloudinary, or Google Storage.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
