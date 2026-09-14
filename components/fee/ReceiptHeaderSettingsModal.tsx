'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  FeeReceiptInstitutionSettings,
  DEFAULT_RECEIPT_SETTINGS
} from '@/types/fee'
import { updateFeeReceiptSettings, resetFeeReceiptSettings } from '@/actions/fee-actions'
import {
  Building2,
  X,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Mail,
  Phone,
  MapPin,
  Tag,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Trash2,
  Link as LinkIcon
} from 'lucide-react'

interface ReceiptHeaderSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentSettings?: FeeReceiptInstitutionSettings
  onSaved?: (settings: FeeReceiptInstitutionSettings) => void
}

export function ReceiptHeaderSettingsModal({
  isOpen,
  onClose,
  currentSettings = DEFAULT_RECEIPT_SETTINGS,
  onSaved
}: ReceiptHeaderSettingsModalProps) {
  const [formData, setFormData] = useState<FeeReceiptInstitutionSettings>(currentSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, SVG, WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.')
      return
    }

    setError('')
    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        handleFieldChange('logoUrl', event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (isOpen) {
      // Check localStorage first for any client-side cached settings
      try {
        const stored = localStorage.getItem('gvm_receipt_institution_settings')
        if (stored) {
          setFormData({ ...DEFAULT_RECEIPT_SETTINGS, ...JSON.parse(stored) })
        } else {
          setFormData(currentSettings || DEFAULT_RECEIPT_SETTINGS)
        }
      } catch {
        setFormData(currentSettings || DEFAULT_RECEIPT_SETTINGS)
      }
      setSuccessMessage('')
      setError('')
    }
  }, [isOpen, currentSettings])

  if (!isOpen) return null

  const handleFieldChange = (field: keyof FeeReceiptInstitutionSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!formData.instituteName.trim()) {
      setError('Institution Name is required.')
      return
    }

    try {
      setIsSaving(true)
      const updated = await updateFeeReceiptSettings(formData)
      // Store in localStorage for instant sync across tabs and views
      try {
        localStorage.setItem('gvm_receipt_institution_settings', JSON.stringify(updated))
        window.dispatchEvent(new Event('receipt_settings_updated'))
      } catch (err) {
        console.warn('Could not write to localStorage:', err)
      }

      setSuccessMessage('Receipt header settings saved successfully!')
      if (onSaved) onSaved(updated)
      setTimeout(() => {
        onClose()
      }, 700)
    } catch (err: any) {
      setError(err.message || 'Failed to save receipt settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Reset all receipt header values back to institutional default?')) {
      return
    }
    try {
      setIsSaving(true)
      const res = await resetFeeReceiptSettings()
      setFormData(res)
      try {
        localStorage.removeItem('gvm_receipt_institution_settings')
        window.dispatchEvent(new Event('receipt_settings_updated'))
      } catch {}
      setSuccessMessage('Reset to defaults.')
      if (onSaved) onSaved(res)
    } catch (err: any) {
      setError(err.message || 'Failed to reset settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                Manage Official Receipt Header
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Admin Managed
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Configure institution branding, registration ref, and contact info printed on official receipts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* LIVE PREVIEW BOX */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" />
                Live Receipt Header Preview
              </span>
              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Official Format
              </span>
            </div>

            <div className="p-4 bg-background rounded-xl border border-dashed border-border flex items-center gap-3.5 shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20 shrink-0 overflow-hidden">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate">
                  {formData.instituteName || 'Institution Name Here'}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {formData.departmentName || 'Department of Accounts'} • {formData.referencePrefix || 'Ref: GVM-EDU-2026'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {formData.addressLine || 'Campus Road, Tech City'} • {formData.contactEmail || 'accounts@gvm.edu'}
                  {formData.contactPhone ? ` • ${formData.contactPhone}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* EDITABLE FIELDS */}
          <div className="space-y-4">
            {/* Institute Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Institution / School / University Name *
              </label>
              <input
                type="text"
                value={formData.instituteName}
                onChange={e => handleFieldChange('instituteName', e.target.value)}
                placeholder="e.g. GVM Institute of Technology & Science"
                required
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Department Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  Department / Bursar Subtitle
                </label>
                <input
                  type="text"
                  value={formData.departmentName}
                  onChange={e => handleFieldChange('departmentName', e.target.value)}
                  placeholder="e.g. Department of Academic Accounts & Bursar"
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Reference Prefix */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  Official Ref / Registration Prefix
                </label>
                <input
                  type="text"
                  value={formData.referencePrefix}
                  onChange={e => handleFieldChange('referencePrefix', e.target.value)}
                  placeholder="e.g. Ref: GVM-EDU-2026 or Reg: CBSE/2026/891"
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Campus Address */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Campus Address / City
              </label>
              <input
                type="text"
                value={formData.addressLine}
                onChange={e => handleFieldChange('addressLine', e.target.value)}
                placeholder="e.g. Campus Road, Tech City, New Delhi - 110001"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Accounts Email */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  Accounts / Bursar Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={e => handleFieldChange('contactEmail', e.target.value)}
                  placeholder="e.g. accounts@gvm.edu"
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  Helpline / Phone Number
                </label>
                <input
                  type="text"
                  value={formData.contactPhone || ''}
                  onChange={e => handleFieldChange('contactPhone', e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Logo Upload & Configuration */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    Institution Logo
                  </label>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('logoUrl', '')}
                      className="text-[10px] text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      Remove Logo
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoFileUpload}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                />

                <div className="p-3 bg-background border border-border rounded-xl space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Receipt Logo"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {formData.logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFieldChange('logoUrl', '/gvm.png')}
                          className="px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors cursor-pointer"
                          title="Use default platform logo"
                        >
                          Use /gvm.png
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        PNG, JPG, SVG or WebP up to 5MB
                      </p>
                    </div>
                  </div>

                  {/* Or enter custom URL toggle */}
                  <div className="pt-1.5 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <LinkIcon className="w-2.5 h-2.5" />
                      {showUrlInput ? 'Hide URL input' : 'Or paste image URL...'}
                    </button>
                    {showUrlInput && (
                      <div className="mt-1.5 animate-in fade-in">
                        <input
                          type="url"
                          value={formData.logoUrl || ''}
                          onChange={e => handleFieldChange('logoUrl', e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="w-full px-2.5 py-1 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 font-mono text-[11px]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Authorized Signatory Title */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-primary" />
                  Authorized Signatory Title
                </label>
                <input
                  type="text"
                  value={formData.authorizedSignatoryTitle || ''}
                  onChange={e => handleFieldChange('authorizedSignatoryTitle', e.target.value)}
                  placeholder="e.g. Accounts Officer / Bursar"
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Footer Note */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Receipt Footer Disclaimer / Terms
              </label>
              <textarea
                value={formData.footerNote || ''}
                onChange={e => handleFieldChange('footerNote', e.target.value)}
                rows={2}
                placeholder="e.g. This is a computer-generated fee receipt. No physical signature required."
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-3.5 py-2 text-xs text-muted-foreground hover:text-foreground rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Receipt Header'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
