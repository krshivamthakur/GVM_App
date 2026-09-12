'use client'

import React, { useState } from 'react'
import { FeeStructure, FeeCategory, BillingFrequency } from '@/types/fee'
import { createFeeStructure, updateFeeStructure } from '@/actions/fee-actions'
import { Plus, Trash2, X, Check, Loader2, Layers, AlertCircle } from 'lucide-react'

interface FeeStructureModalProps {
  isOpen: boolean
  onClose: () => void
  categories: FeeCategory[]
  editingStructure?: FeeStructure | null
  onSuccess: (structure: FeeStructure) => void
}

export function FeeStructureModal({
  isOpen,
  onClose,
  categories,
  editingStructure,
  onSuccess
}: FeeStructureModalProps) {
  const [name, setName] = useState(editingStructure?.name || '')
  const [courseName, setCourseName] = useState(editingStructure?.courseName || 'Java Programming Complete Masterclass')
  const [courseId, setCourseId] = useState(editingStructure?.courseId || '11111111-1111-1111-1111-111111111111')
  const [batchYear, setBatchYear] = useState(editingStructure?.batchYear || '2026-2027')
  const [frequency, setFrequency] = useState<BillingFrequency>(editingStructure?.frequency || 'semester')
  const [dueDate, setDueDate] = useState(editingStructure?.dueDate || '2026-09-30')
  const [gracePeriodDays, setGracePeriodDays] = useState(editingStructure?.gracePeriodDays || 7)
  const [lateFinePerDay, setLateFinePerDay] = useState(editingStructure?.lateFinePerDay || 50)
  const [maxLateFine, setMaxLateFine] = useState(editingStructure?.maxLateFine || 2000)

  const [items, setItems] = useState<Array<{ categoryId: string; amount: number }>>(
    editingStructure?.items.map(i => ({ categoryId: i.categoryId, amount: i.amount })) || [
      { categoryId: categories[0]?.id || 'cat_tui', amount: 40000 },
      { categoryId: categories[1]?.id || 'cat_lab', amount: 8000 }
    ]
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleAddItem = () => {
    const unselected = categories.find(c => !items.some(i => i.categoryId === c.id))
    const catId = unselected?.id || categories[0]?.id || 'cat_tui'
    setItems([...items, { categoryId: catId, amount: 5000 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, idx) => idx !== index))
  }

  const handleItemChange = (index: number, field: 'categoryId' | 'amount', value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please provide a structure name.')
      return
    }

    if (totalAmount <= 0) {
      setError('Total fee amount must be greater than zero.')
      return
    }

    try {
      setIsSubmitting(true)
      const mappedItems = items.map((item, idx) => {
        const cat = categories.find(c => c.id === item.categoryId)
        return {
          id: `fsi_${idx}_${Date.now()}`,
          categoryId: item.categoryId,
          categoryName: cat?.name || 'General Fee',
          amount: Number(item.amount) || 0
        }
      })

      if (editingStructure) {
        const updated = await updateFeeStructure(editingStructure.id, {
          name,
          courseId,
          courseName,
          batchYear,
          frequency,
          totalAmount,
          dueDate,
          gracePeriodDays: Number(gracePeriodDays),
          lateFinePerDay: Number(lateFinePerDay),
          maxLateFine: Number(maxLateFine),
          items: mappedItems
        })
        if (updated) {
          onSuccess(updated)
          onClose()
        }
      } else {
        const created = await createFeeStructure({
          name,
          courseId,
          courseName,
          batchYear,
          frequency,
          totalAmount,
          dueDate,
          gracePeriodDays: Number(gracePeriodDays),
          lateFinePerDay: Number(lateFinePerDay),
          maxLateFine: Number(maxLateFine),
          items: mappedItems,
          isActive: true
        })
        onSuccess(created)
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Error saving fee structure.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base">
                {editingStructure ? 'Edit Fee Structure' : 'Create New Fee Structure'}
              </h3>
              <p className="text-xs text-muted-foreground">Define course fees, installment frequencies, and late fine rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Structure Title</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. B.Tech Computer Science 2026-27"
                required
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Target Course / Program</label>
              <input
                type="text"
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                placeholder="e.g. Java Programming Masterclass"
                required
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Batch / Academic Year</label>
              <input
                type="text"
                value={batchYear}
                onChange={e => setBatchYear(e.target.value)}
                placeholder="2026-2027"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Billing Frequency</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as BillingFrequency)}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="semester">Per Semester</option>
                <option value="annual">Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
                <option value="one_time">One-Time (Admission)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Payment Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/20 border border-border/60 rounded-xl">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Grace Period (Days)</label>
              <input
                type="number"
                min="0"
                value={gracePeriodDays}
                onChange={e => setGracePeriodDays(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Late Fine / Day (₹)</label>
              <input
                type="number"
                min="0"
                value={lateFinePerDay}
                onChange={e => setLateFinePerDay(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Max Late Fine Cap (₹)</label>
              <input
                type="number"
                min="0"
                value={maxLateFine}
                onChange={e => setMaxLateFine(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg"
              />
            </div>
          </div>

          {/* Itemized Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground">Fee Breakdown Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] font-medium text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={item.categoryId}
                    onChange={e => handleItemChange(idx, 'categoryId', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.code})
                      </option>
                    ))}
                  </select>
                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-semibold">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={item.amount}
                      onChange={e => handleItemChange(idx, 'amount', Number(e.target.value))}
                      placeholder="0"
                      className="w-full pl-6 pr-2.5 py-2 text-xs font-medium bg-background border border-border rounded-xl focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={items.length <= 1}
                    onClick={() => handleRemoveItem(idx)}
                    className="p-2 text-muted-foreground hover:text-rose-500 disabled:opacity-30 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total Indicator */}
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Total Structure Fee:</span>
              <span className="text-sm font-bold text-primary">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalAmount <= 0}
              className="px-5 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {editingStructure ? 'Save Changes' : 'Create Structure'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
