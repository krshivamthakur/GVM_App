'use client'

import React, { useRef } from 'react'
import { FeePayment } from '@/types/fee'
import { Printer, Download, CheckCircle2, Building2, ShieldCheck, X } from 'lucide-react'

interface FeeReceiptModalProps {
  payment: FeePayment | null
  isOpen: boolean
  onClose: () => void
  studentBalance?: number
}

export function FeeReceiptModal({
  payment,
  isOpen,
  onClose,
  studentBalance = 0
}: FeeReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !payment) return null

  const handlePrint = () => {
    window.print()
  }

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-foreground text-base">Official Payment Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-6 print:p-0 print:border-none" ref={receiptRef}>
          {/* Institute Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-dashed border-border pb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">GVM Institute of Technology & Science</h2>
                <p className="text-xs text-muted-foreground">Department of Academic Accounts & Bursar • Ref: GVM-EDU-2026</p>
                <p className="text-xs text-muted-foreground">Campus Road, Tech City • accounts@gvm.edu</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 mb-1">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {payment.status.toUpperCase()}
              </span>
              <p className="text-xs font-mono font-bold text-foreground">{payment.receiptNumber}</p>
              <p className="text-[11px] text-muted-foreground">Date: {payment.paymentDate}</p>
            </div>
          </div>

          {/* Student Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 border border-border/60 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Student Name</span>
              <span className="font-semibold text-foreground text-sm">{payment.studentName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Roll Number</span>
              <span className="font-mono font-medium text-foreground">{payment.rollNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Course / Program</span>
              <span className="font-medium text-foreground truncate block">{payment.courseName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Payment Mode</span>
              <span className="font-medium text-foreground uppercase">{payment.paymentMode.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Payment Line Items */}
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Installment / Ref</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-4 font-medium text-foreground">
                    Tuition & Academic Semester Fees
                    {payment.notes && <span className="block text-[11px] text-muted-foreground font-normal">{payment.notes}</span>}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {payment.installmentTitle || 'Standard Installment'}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-foreground">
                    {formatCurrency(payment.amountPaid)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Remaining Due */}
          <div className="flex flex-col items-end space-y-1.5 pt-2 text-xs">
            <div className="flex justify-between w-64 text-muted-foreground">
              <span>Amount Received:</span>
              <span className="font-bold text-foreground text-sm text-emerald-600">
                {formatCurrency(payment.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between w-64 text-muted-foreground">
              <span>Transaction Ref:</span>
              <span className="font-mono text-foreground text-[11px]">{payment.transactionRef || 'N/A'}</span>
            </div>
            <div className="flex justify-between w-64 pt-2 border-t border-border font-semibold text-foreground">
              <span>Current Outstanding Due:</span>
              <span className="text-amber-600 font-bold">{formatCurrency(studentBalance)}</span>
            </div>
          </div>

          {/* Signatures & Footer Notice */}
          <div className="pt-6 border-t border-dashed border-border grid grid-cols-2 gap-4 text-xs text-muted-foreground items-end">
            <div>
              <p className="font-medium text-foreground mb-1">Cashier / Bursar:</p>
              <p className="italic">{payment.receivedBy}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-3">This is a system-authenticated digital fee receipt.</p>
            </div>
            <div className="text-right">
              <div className="inline-block border-b border-foreground/40 w-32 pb-1 text-center font-mono text-[10px] text-foreground">
                Authorized Signatory
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Computer Generated Receipt</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-colors flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  )
}
