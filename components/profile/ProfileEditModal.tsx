'use client'

import React, { useState } from 'react'
import { Profile } from '@/types/database'
import { updateCurrentUserProfile } from '@/actions/auth-actions'
import { AvatarSelector } from '@/components/ui/AvatarSelector'
import { Camera, X, User, Lock, Eye, EyeOff, KeyRound } from 'lucide-react'

interface ProfileEditModalProps {
  user: Profile
}

export function ProfileEditModal({ user }: ProfileEditModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(user.full_name || '')
  const [bio, setBio] = useState(user.bio || '')
  const [avatar, setAvatar] = useState(user.avatar_url || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (newPassword) {
      if (newPassword.length < 4) {
        alert('Password must be at least 4 characters.')
        return
      }
      if (newPassword !== confirmPassword) {
        alert('New password and confirmation do not match.')
        return
      }
    }

    setIsSaving(true)

    try {
      const res = await updateCurrentUserProfile({
        full_name: name.trim(),
        bio: bio.trim(),
        avatar_url: avatar || undefined,
        password: newPassword ? newPassword.trim() : undefined
      })

      if (res.success) {
        setIsOpen(false)
        setNewPassword('')
        setConfirmPassword('')
        window.location.reload()
      } else {
        alert(res.error || 'Failed to update profile')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-accent text-xs font-semibold text-foreground transition-colors shadow-xs"
      >
        <Camera className="w-3.5 h-3.5 text-primary" />
        <span>Change Avatar / Edit Profile</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Edit Your Profile</h3>
                  <p className="text-xs text-muted-foreground">Select an avatar from gallery, upload your photo, or update details</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>

              <AvatarSelector
                value={avatar}
                onChange={setAvatar}
                fallbackName={name}
                label="Profile Picture (Gallery or Upload)"
              />

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Bio / About
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio or your learning interests..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Password Section */}
              <div className="p-3.5 rounded-2xl border border-border bg-muted/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    <span>Change Account Password</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep same"
                        className="w-full px-3 py-1.5 pr-8 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                {newPassword && (
                  <p className="text-[11px] text-muted-foreground">
                    Password must be at least 4 characters long.
                  </p>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
