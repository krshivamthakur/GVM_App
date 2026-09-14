'use client'

import React, { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  FeePayment,
  FeeReceiptInstitutionSettings,
  DEFAULT_RECEIPT_SETTINGS
} from '@/types/fee'
import { getFeeReceiptSettings } from '@/actions/fee-actions'
import { ReceiptHeaderSettingsModal } from './ReceiptHeaderSettingsModal'
import {
  Printer,
  Download,
  CheckCircle2,
  Building2,
  ShieldCheck,
  X,
  Edit3,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react'

interface FeeReceiptModalProps {
  payment: FeePayment | null
  isOpen: boolean
  onClose: () => void
  studentBalance?: number
  isAdmin?: boolean
}

export function FeeReceiptModal({
  payment,
  isOpen,
  onClose,
  studentBalance = 0,
  isAdmin = true
}: FeeReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [receiptSettings, setReceiptSettings] = useState<FeeReceiptInstitutionSettings>(DEFAULT_RECEIPT_SETTINGS)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Manage body attribute so global CSS can hide background if window.print is called directly
  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-receipt-open', 'true')
    } else {
      document.body.removeAttribute('data-receipt-open')
    }
    return () => {
      document.body.removeAttribute('data-receipt-open')
    }
  }, [isOpen])

  // Load dynamic settings from localStorage or server action
  const loadSettings = async () => {
    try {
      const stored = localStorage.getItem('gvm_receipt_institution_settings')
      if (stored) {
        setReceiptSettings({ ...DEFAULT_RECEIPT_SETTINGS, ...JSON.parse(stored) })
        return
      }
    } catch {}

    try {
      const serverSettings = await getFeeReceiptSettings()
      if (serverSettings) {
        setReceiptSettings(serverSettings)
      }
    } catch (e) {
      console.warn('Could not load receipt settings from server:', e)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  // Listen for real-time receipt settings updates
  useEffect(() => {
    const handleUpdate = () => {
      loadSettings()
    }
    window.addEventListener('receipt_settings_updated', handleUpdate)
    return () => window.removeEventListener('receipt_settings_updated', handleUpdate)
  }, [])

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt)
  }

  // Isolated Iframe Printing: Prints ONLY the official receipt, zero background pages
  const handlePrint = () => {
    if (!payment) return

    // Clean up any stale iframe
    const oldIframe = document.getElementById('receipt-print-isolated-iframe')
    if (oldIframe) {
      oldIframe.remove()
    }

    const iframe = document.createElement('iframe')
    iframe.id = 'receipt-print-isolated-iframe'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.opacity = '0'
    iframe.style.pointerEvents = 'none'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) return

    const formattedAmount = formatCurrency(payment.amountPaid)
    const formattedDue = formatCurrency(studentBalance)
    const logoHtml = receiptSettings.logoUrl
      ? `<img src="${receiptSettings.logoUrl}" alt="Logo" style="max-height: 52px; max-width: 80px; object-fit: contain;" />`
      : `<div style="width: 44px; height: 44px; background: #e0e7ff; color: #4338ca; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; border: 1px solid #c7d2fe;">GVM</div>`

    const printHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Official_Receipt_${payment.receiptNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      padding: 0;
      margin: 0;
    }
    .receipt-card {
      max-width: 720px;
      margin: 0 auto;
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      padding: 20px 24px;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .top-ribbon {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 5px;
      margin-bottom: 12px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #475569;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px dashed #94a3b8;
      padding-bottom: 12px;
      margin-bottom: 12px;
      gap: 16px;
    }
    .header-left {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .institute-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
      line-height: 1.2;
    }
    .institute-sub {
      font-size: 10.5px;
      color: #334155;
      font-weight: 600;
      margin-top: 2px;
    }
    .institute-contact {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
      flex-shrink: 0;
    }
    .status-badge {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      font-weight: 800;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .receipt-no {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
    }
    .receipt-date {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 1px;
    }
    .student-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 12px;
    }
    .field-label {
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 2px;
    }
    .field-val {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .field-val-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }
    .table-container {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      text-align: left;
    }
    thead th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 7px 12px;
      border-bottom: 1px solid #cbd5e1;
    }
    tbody td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 14px;
    }
    .totals-box {
      width: 260px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 10.5px;
      color: #475569;
    }
    .totals-row.main {
      font-size: 12px;
      font-weight: 800;
      color: #15803d;
      padding-bottom: 3px;
    }
    .totals-row.outstanding {
      border-top: 1px solid #cbd5e1;
      padding-top: 4px;
      font-weight: 700;
      color: #0f172a;
    }
    .footer-wrap {
      border-top: 1px dashed #94a3b8;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-left {
      max-width: 380px;
    }
    .officer-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .officer-name {
      font-size: 10.5px;
      font-style: italic;
      color: #334155;
      margin-top: 1px;
    }
    .notice {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 5px;
      line-height: 1.3;
    }
    .sig-box {
      text-align: center;
      width: 160px;
      flex-shrink: 0;
    }
    .sig-line {
      border-bottom: 1px solid #0f172a;
      padding-bottom: 3px;
      font-size: 9.5px;
      font-weight: 700;
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .sig-sub {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 3px;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="top-ribbon">
      <span>Official Fee Payment Receipt</span>
      <span>Original Student Copy</span>
    </div>

    <div class="header">
      <div class="header-left">
        ${logoHtml}
        <div>
          <div class="institute-title">${receiptSettings.instituteName || 'GVM Institute of Technology & Science'}</div>
          <div class="institute-sub">${receiptSettings.departmentName || 'Department of Academic Accounts & Bursar'} • ${receiptSettings.referencePrefix || 'Ref: GVM-EDU-2026'}</div>
          <div class="institute-contact">
            ${receiptSettings.addressLine || 'Campus Road, Tech City'} • ${receiptSettings.contactEmail || 'accounts@gvm.edu'}
            ${receiptSettings.contactPhone ? ` • ${receiptSettings.contactPhone}` : ''}
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="status-badge">✓ ${payment.status.toUpperCase()}</div>
        <div class="receipt-no">${payment.receiptNumber}</div>
        <div class="receipt-date">Date: ${payment.paymentDate}</div>
      </div>
    </div>

    <div class="student-grid">
      <div>
        <div class="field-label">Student Name</div>
        <div class="field-val">${payment.studentName}</div>
      </div>
      <div>
        <div class="field-label">Roll Number</div>
        <div class="field-val-mono">${payment.rollNumber}</div>
      </div>
      <div>
        <div class="field-label">Course / Program</div>
        <div class="field-val">${payment.courseName}</div>
      </div>
      <div>
        <div class="field-label">Payment Mode</div>
        <div class="field-val" style="text-transform: uppercase;">${payment.paymentMode.replace('_', ' ')}</div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Fee Description</th>
            <th style="width: 25%;">Installment / Ref</th>
            <th style="width: 25%; text-align: right;">Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Tuition & Academic Semester Fees</strong>
              ${payment.notes ? `<div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">${payment.notes}</div>` : ''}
            </td>
            <td style="color: #475569;">${payment.installmentTitle || 'Standard Installment'}</td>
            <td style="text-align: right; font-weight: 800; color: #0f172a;">${formattedAmount}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="totals-wrap">
      <div class="totals-box">
        <div class="totals-row main">
          <span>Amount Received:</span>
          <span>${formattedAmount}</span>
        </div>
        <div class="totals-row">
          <span>Transaction Ref:</span>
          <span style="font-family: monospace; font-weight: 600;">${payment.transactionRef || 'COUNTER-OFFLINE'}</span>
        </div>
        <div class="totals-row outstanding">
          <span>Current Outstanding Due:</span>
          <span style="font-weight: 800;">${formattedDue}</span>
        </div>
      </div>
    </div>

    <div class="footer-wrap">
      <div class="footer-left">
        <div class="officer-title">Cashier / Receiving Officer:</div>
        <div class="officer-name">${payment.receivedBy || 'Accounts Bursar'}</div>
        <div class="notice">${receiptSettings.footerNote || 'This is an official computer-generated fee payment receipt. No physical signature required.'}</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">${receiptSettings.authorizedSignatoryTitle || 'Authorized Signatory'}</div>
        <div class="sig-sub">System Verified & Recorded</div>
      </div>
    </div>
  </div>
</body>
</html>
`

    doc.open()
    doc.write(printHtml)
    doc.close()

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (err) {
        console.error('Iframe print error:', err)
        window.print()
      }
    }, 250)
  }

  // Intercept Ctrl+P / Cmd+P to route directly to isolated iframe print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        if (isOpen && payment) {
          e.preventDefault()
          handlePrint()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, payment, receiptSettings, studentBalance])

  if (!mounted || !isOpen || !payment) return null

  const modalContent = (
    <>
      <div
        id="receipt-modal-portal"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 print:static print:p-0 print:m-0 print:bg-transparent print:backdrop-blur-none print:block print:overflow-visible print:h-auto"
      >
        <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:static print:max-w-none print:w-full print:border-none print:shadow-none print:bg-white print:overflow-visible print:max-h-none print:rounded-none">
          
          {/* Header Bar — Hidden in Print */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-muted/40 print:hidden shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Official Payment Receipt</h3>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-card hover:bg-muted border border-border rounded-lg transition-colors shadow-2xs cursor-pointer"
                  title="Configure Institution details, name, address, and logo for receipts"
                >
                  <Edit3 className="w-3.5 h-3.5 text-primary" />
                  <span>Edit Header</span>
                </button>
              )}
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Receipt Body */}
          <div className="overflow-y-auto p-5 sm:p-7 md:p-8 space-y-5 print:p-0 print:space-y-4 print:overflow-visible print:max-h-none" ref={receiptRef}>
            <div id="official-payment-receipt" className="space-y-4 print:space-y-3.5">
              
              {/* Receipt Top Ribbon */}
              <div className="flex items-center justify-between pb-2 border-b border-border/80 text-[10px] uppercase font-bold tracking-wider text-muted-foreground print:text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Official Fee Payment Receipt
                </span>
                <span>Original Student Copy</span>
              </div>


              {/* Institute Header — Admin Managed Dynamic Section */}
              <div className="relative group/header flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-dashed border-border gap-4 print:pb-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20 shrink-0 overflow-hidden print:border-neutral-300 print:bg-neutral-50">
                    {receiptSettings.logoUrl ? (
                      <img src={receiptSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight print:text-black">
                        {receiptSettings.instituteName || 'GVM Institute of Technology & Science'}
                      </h2>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setIsSettingsOpen(true)}
                          className="opacity-0 group-hover/header:opacity-100 transition-opacity p-1 text-primary hover:bg-primary/10 rounded-md text-[10px] flex items-center gap-1 border border-primary/20 print:hidden cursor-pointer"
                          title="Click to edit institute name and header"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          Edit
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium print:text-neutral-700">
                      {receiptSettings.departmentName || 'Department of Academic Accounts & Bursar'} • {receiptSettings.referencePrefix || 'Ref: GVM-EDU-2026'}
                    </p>
                    <p className="text-xs text-muted-foreground print:text-neutral-600">
                      {receiptSettings.addressLine || 'Campus Road, Tech City'} • {receiptSettings.contactEmail || 'accounts@gvm.edu'}
                      {receiptSettings.contactPhone ? ` • ${receiptSettings.contactPhone}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 mb-1 print:bg-emerald-50 print:border-emerald-300 print:text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {payment.status.toUpperCase()}
                  </span>
                  <p className="text-xs font-mono font-bold text-foreground print:text-black">{payment.receiptNumber}</p>
                  <p className="text-[11px] text-muted-foreground print:text-neutral-600">Date: {payment.paymentDate}</p>
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs print:bg-neutral-50 print:border-neutral-300 print:gap-2 print:p-2.5">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold print:text-neutral-600">Student Name</span>
                  <span className="font-bold text-foreground text-sm print:text-black truncate block">{payment.studentName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold print:text-neutral-600">Roll Number</span>
                  <span className="font-mono font-bold text-foreground print:text-black">{payment.rollNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold print:text-neutral-600">Course / Program</span>
                  <span className="font-medium text-foreground truncate block print:text-black">{payment.courseName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold print:text-neutral-600">Payment Mode</span>
                  <span className="font-semibold text-foreground uppercase print:text-black">{payment.paymentMode.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Payment Line Items */}
              <div className="border border-border rounded-xl overflow-hidden print:border-neutral-300">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border print:bg-neutral-100 print:text-neutral-700 print:border-neutral-300">
                    <tr>
                      <th className="py-2.5 px-4">Fee Description</th>
                      <th className="py-2.5 px-4">Installment / Ref</th>
                      <th className="py-2.5 px-4 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border print:divide-neutral-200">
                    <tr>
                      <td className="py-3 px-4 font-medium text-foreground print:text-black">
                        Tuition & Academic Semester Fees
                        {payment.notes && <span className="block text-[11px] text-muted-foreground font-normal print:text-neutral-600">{payment.notes}</span>}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground print:text-neutral-700">
                        {payment.installmentTitle || 'Standard Installment'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground print:text-black">
                        {formatCurrency(payment.amountPaid)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals & Remaining Due */}
              <div className="flex flex-col items-end space-y-1 pt-1 text-xs print:space-y-0.5">
                <div className="flex justify-between w-64 text-muted-foreground print:text-neutral-700">
                  <span className="font-medium">Amount Received:</span>
                  <span className="font-bold text-foreground text-sm text-emerald-600 print:text-emerald-800">
                    {formatCurrency(payment.amountPaid)}
                  </span>
                </div>
                <div className="flex justify-between w-64 text-muted-foreground print:text-neutral-600 text-[11px]">
                  <span>Transaction Ref:</span>
                  <span className="font-mono text-foreground font-semibold print:text-black">{payment.transactionRef || 'COUNTER-OFFLINE'}</span>
                </div>
                <div className="flex justify-between w-64 pt-1.5 border-t border-border font-semibold text-foreground print:border-neutral-300 print:text-black">
                  <span>Current Outstanding Due:</span>
                  <span className="text-amber-600 font-bold print:text-neutral-800">{formatCurrency(studentBalance)}</span>
                </div>
              </div>

              {/* Signatures & Footer Notice */}
              <div className="pt-5 border-t border-dashed border-border grid grid-cols-2 gap-4 text-xs text-muted-foreground items-end print:pt-4 print:border-neutral-300">
                <div>
                  <p className="font-semibold text-foreground mb-1 print:text-black">Cashier / Receiving Officer:</p>
                  <p className="italic font-medium text-foreground print:text-black">{payment.receivedBy || 'Accounts Officer'}</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-2 print:text-neutral-600">
                    {receiptSettings.footerNote || 'This is an official computer-generated fee payment receipt. No physical signature required.'}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="w-36 border-b border-foreground/50 pb-1 text-center font-mono text-[10px] text-foreground font-semibold print:text-black print:border-black">
                    {receiptSettings.authorizedSignatoryTitle || 'Authorized Signatory'}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 print:text-neutral-600">System Verified & Recorded</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions — Hidden in Print */}
          <div className="px-6 py-3.5 bg-muted/20 border-t border-border flex items-center justify-between gap-3 print:hidden shrink-0">
            <div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-xs text-primary hover:underline font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Customize Header & Branding
                </button>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {createPortal(modalContent, document.body)}

      {/* Admin Receipt Header Settings Modal */}
      <ReceiptHeaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={receiptSettings}
        onSaved={saved => setReceiptSettings(saved)}
      />
    </>
  )
}

