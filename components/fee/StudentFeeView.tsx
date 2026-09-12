'use client'

import React, { useState } from 'react'
import { StudentFeeProfile, FeePayment } from '@/types/fee'
import { recordFeePayment } from '@/actions/fee-actions'
import { FeeReceiptModal } from './FeeReceiptModal'
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Receipt,
  Download,
  CreditCard,
  Building,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Loader2
} from 'lucide-react'

interface StudentFeeViewProps {
  initialProfile: StudentFeeProfile
  initialPayments: FeePayment[]
}

export function StudentFeeView({
  initialProfile,
  initialPayments
}: StudentFeeViewProps) {
  const [profile, setProfile] = useState<StudentFeeProfile>(initialProfile)
  const [payments, setPayments] = useState<FeePayment[]>(initialPayments)
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isPayingOnline, setIsPayingOnline] = useState(false)
  const [onlinePaySuccess, setOnlinePaySuccess] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const paidPercentage = profile.netFee > 0
    ? Math.min(100, Math.round((profile.paidFee / profile.netFee) * 100))
    : 0

  const pendingInstallment = profile.installments.find(i => i.status !== 'paid')

  // Instant online pay simulation for student
  const handlePayInstallmentOnline = async () => {
    if (!pendingInstallment) return

    try {
      setIsPayingOnline(true)
      const payAmount = pendingInstallment.amount + pendingInstallment.lateFine - pendingInstallment.paidAmount
      const res = await recordFeePayment({
        studentId: profile.studentId,
        installmentId: pendingInstallment.id,
        amount: payAmount,
        paymentMode: 'upi',
        transactionRef: `UPI-APP-${Math.floor(100000 + Math.random() * 900000)}`,
        notes: `Online Self-Service Payment for ${pendingInstallment.title}`,
        receivedBy: 'GVM Online Payment Gateway'
      })

      if (res.success) {
        setProfile(res.profile)
        setPayments([res.payment, ...payments])
        setOnlinePaySuccess(`Payment of ${formatCurrency(payAmount)} successful! Receipt generated.`)
        setSelectedReceipt(res.payment)
        setIsReceiptModalOpen(true)
        setTimeout(() => setOnlinePaySuccess(''), 5000)
      }
    } catch (err: any) {
      alert(err.message || 'Payment simulation failed.')
    } finally {
      setIsPayingOnline(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {onlinePaySuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{onlinePaySuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Wallet className="w-6 h-6" />
            </div>
            My Fee & Receipt Portal
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            View your fee structure, installment due dates, online payments, and download certified receipts.
          </p>
        </div>

        {profile.dueFee > 0 && pendingInstallment && (
          <button
            onClick={handlePayInstallmentOnline}
            disabled={isPayingOnline}
            className="px-4 py-2.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
          >
            {isPayingOnline ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing Online Pay...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pay Next Due Online ({formatCurrency(pendingInstallment.amount + pendingInstallment.lateFine - pendingInstallment.paidAmount)})
              </>
            )}
          </button>
        )}
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Fee Demanded */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Program Net Fee</span>
            <Building className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-foreground">
              {formatCurrency(profile.netFee)}
            </h3>
            {profile.discountAmount > 0 ? (
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Includes {profile.discountName} (-{formatCurrency(profile.discountAmount)})
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1">
                {profile.structureName}
              </p>
            )}
          </div>
        </div>

        {/* Total Paid */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Amount Cleared</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-emerald-600">
              {formatCurrency(profile.paidFee)}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${paidPercentage}%` }}
                />
              </div>
              <span className="text-xs font-bold text-emerald-600">{paidPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Outstanding Due */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Outstanding Due Balance</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-bold ${profile.dueFee > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
              {formatCurrency(profile.dueFee)}
            </h3>
            {profile.lateFineAccrued > 0 ? (
              <p className="text-[11px] text-rose-500 font-medium mt-1">
                +{formatCurrency(profile.lateFineAccrued)} late charges accrued
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1">
                {profile.dueFee === 0 ? 'All fees settled!' : 'No late fine penalty'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Installments Schedule */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Installment Schedule & Due Dates</h3>
          <p className="text-xs text-muted-foreground">Check payment timeline and completion status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.installments.map(inst => {
            const isPaid = inst.status === 'paid'
            const isOverdue = inst.status === 'overdue'
            return (
              <div
                key={inst.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-colors ${
                  isPaid
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : isOverdue
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : 'bg-muted/20 border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-foreground text-sm block">{inst.title}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      Due Date: {inst.dueDate}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isPaid
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : isOverdue
                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse'
                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}
                  >
                    {inst.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Installment Amount</span>
                    <span className="font-bold text-foreground text-sm">{formatCurrency(inst.amount)}</span>
                  </div>
                  {isPaid ? (
                    <div className="text-right text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Paid {inst.paidAt?.split('T')[0] || 'on time'}
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-muted-foreground block text-[11px]">Remaining Due</span>
                      <span className="font-bold text-amber-500">
                        {formatCurrency(inst.amount + inst.lateFine - inst.paidAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment History & Downloadable Receipts */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Payment History & Receipts</h3>
            <p className="text-xs text-muted-foreground">Certified payment vouchers with unique verification codes</p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Receipt Serial</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Amount Paid</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Receipt Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {pay.receiptNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {pay.installmentTitle || 'Academic Term Fee'}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      {formatCurrency(pay.amountPaid)}
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] font-semibold text-foreground">
                      {pay.paymentMode.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {pay.paymentDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 uppercase">
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedReceipt(pay)
                          setIsReceiptModalOpen(true)
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors inline-flex items-center gap-1.5"
                      >
                        <Printer className="w-3 h-3" />
                        View / Print Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Receipt Modal */}
      <FeeReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        payment={selectedReceipt}
        studentBalance={profile.dueFee}
      />
    </div>
  )
}
