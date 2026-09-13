'use client'

import React, { useState, useEffect } from 'react'
import { StudentFeeProfile, FeeStructure, FeeDiscount } from '@/types/fee'
import { assignFeeStructureToStudent } from '@/actions/fee-actions'
import {
  Layers,
  GraduationCap,
  Sparkles,
  Percent,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Calendar,
  IndianRupee
} from 'lucide-react'

interface AssignFeeStructureModalProps {
  isOpen: boolean
  onClose: () => void
  studentProfile: StudentFeeProfile | null
  structures: FeeStructure[]
  discounts: FeeDiscount[]
  courses?: Array<{ id: string; title: string }>
  onSuccess: (updatedProfile: StudentFeeProfile) => void
}

export function AssignFeeStructureModal({
  isOpen,
  onClose,
  studentProfile,
  structures,
  discounts,
  courses = [],
  onSuccess
}: AssignFeeStructureModalProps) {
  const [selectedStructureId, setSelectedStructureId] = useState<string>('')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [selectedDiscountId, setSelectedDiscountId] = useState<string>('none')
  const [customAdjustment, setCustomAdjustment] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  // Sync state when studentProfile or structures change
  useEffect(() => {
    if (studentProfile) {
      setSelectedStructureId(studentProfile.structureId || (structures[0]?.id || ''))
      setSelectedCourseId(studentProfile.courseId || (courses[0]?.id || ''))
      setSelectedDiscountId(studentProfile.discountId || 'none')
      setCustomAdjustment(studentProfile.customAdjustment || 0)
      setError('')
    }
  }, [studentProfile, structures, courses])

  if (!isOpen || !studentProfile) return null

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val)

  const activeStructure = structures.find(s => s.id === selectedStructureId) || structures[0]
  const activeDiscount = discounts.find(d => d.id === selectedDiscountId)

  // Calculations
  const baseAmount = activeStructure ? activeStructure.totalAmount : 0
  let discountAmount = 0
  if (activeDiscount) {
    discountAmount =
      activeDiscount.discountType === 'percentage'
        ? Math.round((baseAmount * activeDiscount.value) / 100)
        : activeDiscount.value
  }

  const netFee = Math.max(0, baseAmount - discountAmount + Number(customAdjustment || 0))
  const remainingDue = Math.max(0, netFee + (studentProfile.lateFineAccrued || 0) - studentProfile.paidFee)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeStructure) {
      setError('Please select a valid fee structure.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const matchedCourse = courses.find(c => c.id === selectedCourseId)

      const updated = await assignFeeStructureToStudent({
        studentId: studentProfile.studentId,
        structureId: activeStructure.id,
        courseId: selectedCourseId || activeStructure.courseId,
        courseName: matchedCourse ? matchedCourse.title : activeStructure.courseName,
        discountId: selectedDiscountId,
        customAdjustment: Number(customAdjustment || 0)
      })

      onSuccess(updated)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update fee structure assignment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Assign / Edit Fee Structure
                </h3>
                {studentProfile.isAutoDetected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Auto-Detected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {studentProfile.studentName} • {studentProfile.rollNumber} • {studentProfile.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="assign-structure-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Banner */}
          <div className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              {studentProfile.studentAvatar ? (
                <img
                  src={studentProfile.studentAvatar}
                  alt={studentProfile.studentName}
                  className="w-9 h-9 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                  {studentProfile.studentName.charAt(0)}
                </div>
              )}
              <div>
                <span className="font-semibold text-xs text-foreground block">{studentProfile.studentName}</span>
                <span className="text-[11px] text-muted-foreground">Directory Sync: Active</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Current Paid</span>
              <span className="text-xs font-bold text-emerald-600">{formatCurrency(studentProfile.paidFee)}</span>
            </div>
          </div>

          {/* Fee Structure Selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Select Fee Structure *</span>
            </label>
            <select
              value={selectedStructureId}
              onChange={e => setSelectedStructureId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {structures.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatCurrency(s.totalAmount)} ({s.frequency})
                </option>
              ))}
            </select>
          </div>

          {/* Program / Course Selector */}
          {courses.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                <span>Enrolled Program / Academic Department</span>
              </label>
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Structure Item Breakdown Pill List */}
          {activeStructure && activeStructure.items && activeStructure.items.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/80">
              <span className="text-[11px] font-semibold text-muted-foreground block mb-2">
                Fee Category Breakdown:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {activeStructure.items.map(it => (
                  <div key={it.id} className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/60">
                    <span className="text-muted-foreground truncate max-w-[120px] text-[11px]">{it.categoryName}</span>
                    <span className="font-semibold text-foreground text-[11px]">{formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concession / Discount Selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              <span>Institutional Scholarship / Concession</span>
            </label>
            <select
              value={selectedDiscountId}
              onChange={e => setSelectedDiscountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="none">None (Standard Institutional Fee)</option>
              {discounts.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.discountType === 'percentage' ? `${d.value}% Off` : `-₹${d.value.toLocaleString()}`})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Adjustment */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
              <span>Custom Fee Adjustment (+/- ₹)</span>
              <span className="text-[10px] text-muted-foreground">e.g. Special waiver or additional lab charge</span>
            </label>
            <input
              type="number"
              value={customAdjustment || ''}
              onChange={e => setCustomAdjustment(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Realtime Calculation Summary Card */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
            <span className="text-xs font-bold text-foreground block">
              Calculated Fee Schedule:
            </span>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Base Structure Fee:</span>
              <span className="font-medium text-foreground">{formatCurrency(baseAmount)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-medium">
                <span>Scholarship Concession:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {customAdjustment !== 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Custom Adjustment:</span>
                <span>{customAdjustment > 0 ? `+${formatCurrency(customAdjustment)}` : formatCurrency(customAdjustment)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-border flex justify-between text-xs font-bold text-foreground">
              <span>New Total Net Fee:</span>
              <span className="text-primary text-sm">{formatCurrency(netFee)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-amber-500">
              <span>Remaining Balance Due:</span>
              <span>{formatCurrency(remainingDue)}</span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-border shrink-0 bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="assign-structure-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Structure Assignment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
