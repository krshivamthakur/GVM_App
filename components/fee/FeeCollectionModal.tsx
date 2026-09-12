'use client'

import React, { useState } from 'react'
import { StudentFeeProfile, PaymentMode, FeePayment } from '@/types/fee'
import { recordFeePayment } from '@/actions/fee-actions'
import {
  CreditCard,
  Banknote,
  Building,
  QrCode,
  FileCheck2,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react'

interface FeeCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  studentProfile: StudentFeeProfile | null
  onPaymentSuccess: (payment: FeePayment, updatedProfile: StudentFeeProfile) => void
}

export function FeeCollectionModal({
  isOpen,
  onClose,
  studentProfile,
  onPaymentSuccess
}: FeeCollectionModalProps) {
  const [amount, setAmount] = useState<number>(0)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash')
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>('')
  const [transactionRef, setTransactionRef] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  // Set default amount when installment changes or on load
  React.useEffect(() => {
    if (studentProfile) {
      const pendingInst = studentProfile.installments.find(i => i.status !== 'paid')
      if (pendingInst) {
        setSelectedInstallmentId(pendingInst.id)
        setAmount(pendingInst.amount + pendingInst.lateFine - pendingInst.paidAmount)
      } else {
        setSelectedInstallmentId('')
        setAmount(studentProfile.dueFee + studentProfile.lateFineAccrued)
      }
    }
  }, [studentProfile])

  if (!isOpen || !studentProfile) return null

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  const handleInstallmentSelect = (instId: string) => {
    setSelectedInstallmentId(instId)
    if (instId === 'custom') {
      setAmount(0)
    } else {
      const inst = studentProfile.installments.find(i => i.id === instId)
      if (inst) {
        setAmount(inst.amount + inst.lateFine - inst.paidAmount)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (amount <= 0) {
      setError('Please enter a valid payment amount greater than zero.')
      return
    }

    const totalPayable = studentProfile.dueFee + studentProfile.lateFineAccrued
    if (amount > totalPayable && totalPayable > 0) {
      setError(`Payment amount cannot exceed remaining balance of ${formatCurrency(totalPayable)}.`)
      return
    }

    try {
      setIsSubmitting(true)
      const res = await recordFeePayment({
        studentId: studentProfile.studentId,
        installmentId: selectedInstallmentId === 'custom' ? undefined : selectedInstallmentId,
        amount,
        paymentMode,
        transactionRef: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
        receivedBy: 'Admin Bursar'
      })

      if (res.success) {
        onPaymentSuccess(res.payment, res.profile)
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const paymentModes: { id: PaymentMode; label: string; icon: React.ElementType }[] = [
    { id: 'cash', label: 'Cash (Offline)', icon: Banknote },
    { id: 'upi', label: 'UPI / QR Code', icon: QrCode },
    { id: 'bank_transfer', label: 'NetBanking / NEFT', icon: Building },
    { id: 'card', label: 'Debit / Credit Card', icon: CreditCard },
    { id: 'cheque', label: 'Bank Cheque / DD', icon: FileCheck2 }
  ]

  const remainingAfterPayment = Math.max(
    0,
    studentProfile.dueFee + studentProfile.lateFineAccrued - amount
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base">Record Fee Payment</h3>
              <p className="text-xs text-muted-foreground">Issue receipt and update ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Mini Profile Summary */}
        <div className="px-6 py-3 bg-muted/20 border-b border-border flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-foreground text-sm block">{studentProfile.studentName}</span>
            <span className="text-muted-foreground">Roll: {studentProfile.rollNumber} • {studentProfile.courseName}</span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground block text-[11px]">Total Outstanding Due</span>
            <span className="font-bold text-amber-500 text-sm">
              {formatCurrency(studentProfile.dueFee + studentProfile.lateFineAccrued)}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Installment Allocation */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Select Installment / Term
            </label>
            <select
              value={selectedInstallmentId}
              onChange={e => handleInstallmentSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {studentProfile.installments.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.title} — Due: {formatCurrency(inst.amount + inst.lateFine - inst.paidAmount)} (Due Date: {inst.dueDate}) [{inst.status.toUpperCase()}]
                </option>
              ))}
              <option value="custom">Custom Partial Payment</option>
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Amount to Collect (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">₹</span>
              <input
                type="number"
                min="1"
                max={studentProfile.dueFee + studentProfile.lateFineAccrued}
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
                placeholder="0"
                required
                className="w-full pl-7 pr-3 py-2 text-sm font-semibold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex justify-between mt-1 text-[11px] text-muted-foreground">
              <span>Balance After Payment:</span>
              <span className="font-semibold text-foreground">{formatCurrency(remainingAfterPayment)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {paymentModes.map(mode => {
                const Icon = mode.icon
                const isSelected = paymentMode === mode.id
                return (
                  <button
                    type="button"
                    key={mode.id}
                    onClick={() => setPaymentMode(mode.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs'
                        : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{mode.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Transaction Reference */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Transaction Reference / Cheque No. / UTR
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={e => setTransactionRef(e.target.value)}
              placeholder={paymentMode === 'cash' ? 'Cash receipt voucher (optional)' : 'e.g. UPI-9923184 or CHQ-00129'}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Remarks / Notes */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Remarks & Internal Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Received full term fee, verified with accounts officer"
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Actions */}
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
              disabled={isSubmitting || amount <= 0}
              className="px-5 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm & Generate Receipt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
