'use client'

import React, { useState } from 'react'
import {
  StudentFeeProfile,
  FeeStructure,
  FeeCategory,
  FeePayment,
  FeeFinancialSummary,
  FeeNotificationLog,
  PaymentMode,
  FeePaymentStatus
} from '@/types/fee'
import {
  sendFeeReminder,
  verifyOrCancelPayment,
  deleteFeeStructure
} from '@/actions/fee-actions'
import { FeeCollectionModal } from './FeeCollectionModal'
import { FeeReceiptModal } from './FeeReceiptModal'
import { FeeStructureModal } from './FeeStructureModal'
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  Users,
  Search,
  Plus,
  ArrowUpRight,
  Receipt,
  Download,
  Calendar,
  Layers,
  Send,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  Filter,
  CreditCard,
  Building,
  RotateCcw
} from 'lucide-react'

interface AdminFeeDashboardProps {
  initialSummary: FeeFinancialSummary
  initialProfiles: StudentFeeProfile[]
  initialStructures: FeeStructure[]
  initialCategories: FeeCategory[]
  initialPayments: FeePayment[]
  initialNotifications: FeeNotificationLog[]
}

export function AdminFeeDashboard({
  initialSummary,
  initialProfiles,
  initialStructures,
  initialCategories,
  initialPayments,
  initialNotifications
}: AdminFeeDashboardProps) {
  const [summary, setSummary] = useState<FeeFinancialSummary>(initialSummary)
  const [profiles, setProfiles] = useState<StudentFeeProfile[]>(initialProfiles)
  const [structures, setStructures] = useState<FeeStructure[]>(initialStructures)
  const [payments, setPayments] = useState<FeePayment[]>(initialPayments)
  const [notifications, setNotifications] = useState<FeeNotificationLog[]>(initialNotifications)

  // Tab State
  const [activeTab, setActiveTab] = useState<'profiles' | 'structures' | 'defaulters' | 'transactions' | 'reports'>('profiles')

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [courseFilter, setCourseFilter] = useState<string>('all')

  // Modals state
  const [collectingStudent, setCollectingStudent] = useState<StudentFeeProfile | null>(null)
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false)

  const [activeReceipt, setActiveReceipt] = useState<FeePayment | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null)
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false)

  // Notification feedback state
  const [reminderStatus, setReminderStatus] = useState<string>('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Filtered student profiles
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    const matchesCourse = courseFilter === 'all' || p.courseId === courseFilter

    return matchesSearch && matchesStatus && matchesCourse
  })

  // Defaulters list (< 100% and past due)
  const defaulters = profiles.filter(p => p.status === 'overdue' || (p.dueFee > 0 && p.lateFineAccrued > 0))

  // Handlers
  const handleOpenCollect = (profile: StudentFeeProfile) => {
    setCollectingStudent(profile)
    setIsCollectModalOpen(true)
  }

  const handlePaymentSuccess = (newPayment: FeePayment, updatedProfile: StudentFeeProfile) => {
    setPayments([newPayment, ...payments])
    setProfiles(profiles.map(p => (p.studentId === updatedProfile.studentId ? updatedProfile : p)))

    // Update summary
    setSummary(prev => {
      const newCollected = prev.totalRevenueCollected + newPayment.amountPaid
      const newOutstanding = Math.max(0, prev.totalOutstandingDues - newPayment.amountPaid)
      return {
        ...prev,
        totalRevenueCollected: newCollected,
        totalOutstandingDues: newOutstanding,
        collectionEfficiency: prev.totalRevenueExpected > 0
          ? Math.round((newCollected / prev.totalRevenueExpected) * 100)
          : 0
      }
    })

    // Automatically prompt receipt
    setActiveReceipt(newPayment)
    setIsReceiptModalOpen(true)
  }

  const handleViewReceipt = (payment: FeePayment) => {
    setActiveReceipt(payment)
    setIsReceiptModalOpen(true)
  }

  const handleSendReminder = async (studentId: string) => {
    try {
      const log = await sendFeeReminder(studentId, 'email')
      setNotifications([log, ...notifications])
      setReminderStatus(`Reminder notification sent to ${log.studentName}`)
      setTimeout(() => setReminderStatus(''), 4000)
    } catch (err: any) {
      alert(err.message || 'Failed to send reminder.')
    }
  }

  const handleDeleteStructure = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return
    const ok = await deleteFeeStructure(id)
    if (ok) {
      setStructures(structures.filter(s => s.id !== id))
    }
  }

  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Student Name', 'Roll No', 'Course', 'Amount (INR)', 'Payment Mode', 'Transaction Ref', 'Date', 'Status']
    const rows = payments.map(p => [
      p.receiptNumber,
      `"${p.studentName}"`,
      p.rollNumber,
      `"${p.courseName}"`,
      p.amountPaid,
      p.paymentMode,
      p.transactionRef || '',
      p.paymentDate,
      p.status
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `fee_payments_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {reminderStatus && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{reminderStatus}</span>
        </div>
      )}

      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Wallet className="w-6 h-6" />
            </div>
            Institutional Fee Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track fee structures, collect cash/online payments, monitor defaulters, and generate certified receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Ledger
          </button>
          <button
            onClick={() => {
              setEditingStructure(null)
              setIsStructureModalOpen(true)
            }}
            className="px-3.5 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Fee Structure
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Fee Demanded</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.totalRevenueExpected)}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              {summary.totalStudentsBilled} enrolled students billed
            </p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Revenue Collected</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-emerald-600">
              {formatCurrency(summary.totalRevenueCollected)}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${summary.collectionEfficiency}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">
                {summary.collectionEfficiency}%
              </span>
            </div>
          </div>
        </div>

        {/* Pending Dues */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Outstanding Balance</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-500">
              {formatCurrency(summary.totalOutstandingDues)}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              Accrued fines: {formatCurrency(summary.totalFinesAccrued)}
            </p>
          </div>
        </div>

        {/* Overdue Accounts */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Overdue Accounts</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-rose-500">
              {summary.overdueDefaultersCount} Students
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              Immediate action / fee notices required
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-2xl border border-border/60 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'profiles'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-3.5 h-3.5 inline mr-1.5" />
          Student Fee Directory ({profiles.length})
        </button>
        <button
          onClick={() => setActiveTab('defaulters')}
          className={`px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'defaulters'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 text-rose-500" />
          Pending Dues & Defaulters ({defaulters.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 inline mr-1.5" />
          Transactions & Receipts ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'structures'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-3.5 h-3.5 inline mr-1.5" />
          Fee Structures ({structures.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />
          Analytics & Reports
        </button>
      </div>

      {/* TAB 1: STUDENT FEE DIRECTORY */}
      {activeTab === 'profiles' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-card border border-border rounded-2xl">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by student name, roll no, or email..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
                <option value="unpaid">Unpaid</option>
              </select>
              <select
                value={courseFilter}
                onChange={e => setCourseFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none"
              >
                <option value="all">All Courses</option>
                <option value="11111111-1111-1111-1111-111111111111">Java Programming Masterclass</option>
                <option value="22222222-2222-2222-2222-222222222222">Physics Class 12 & JEE</option>
              </select>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Student & Details</th>
                    <th className="py-3 px-4">Course & Structure</th>
                    <th className="py-3 px-4">Total Net Fee</th>
                    <th className="py-3 px-4">Paid Amount</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProfiles.map(p => {
                    const isFullyPaid = p.status === 'paid'
                    return (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.studentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                              alt={p.studentName}
                              className="w-8 h-8 rounded-full object-cover border border-border"
                            />
                            <div>
                              <span className="font-semibold text-foreground block">{p.studentName}</span>
                              <span className="text-[11px] text-muted-foreground font-mono">{p.rollNumber}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-foreground block truncate max-w-[180px]">{p.courseName}</span>
                          <span className="text-[11px] text-muted-foreground">{p.structureName}</span>
                          {p.discountAmount > 0 && (
                            <span className="inline-block text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium mt-0.5">
                              {p.discountName} (-₹{p.discountAmount.toLocaleString()})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {formatCurrency(p.netFee)}
                        </td>
                        <td className="py-3 px-4 font-medium text-emerald-600">
                          {formatCurrency(p.paidFee)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${p.dueFee > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {formatCurrency(p.dueFee)}
                          </span>
                          {p.lateFineAccrued > 0 && (
                            <span className="block text-[10px] text-rose-500">
                              +Fine: {formatCurrency(p.lateFineAccrued)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider ${
                              p.status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : p.status === 'partial'
                                ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                : p.status === 'overdue'
                                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isFullyPaid && (
                              <button
                                onClick={() => handleOpenCollect(p)}
                                className="px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-xs"
                              >
                                Record Pay
                              </button>
                            )}
                            {p.dueFee > 0 && (
                              <button
                                onClick={() => handleSendReminder(p.studentId)}
                                title="Send due reminder email/SMS"
                                className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING DUES & DEFAULTERS */}
      {activeTab === 'defaulters' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Defaulters & Overdue Collection Queue</h3>
                <p className="text-xs text-muted-foreground">Students with unpaid fee past grace period deadline. Late fines calculated daily.</p>
              </div>
            </div>
            <button
              onClick={() => {
                defaulters.forEach(d => handleSendReminder(d.studentId))
              }}
              className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Send Bulk Alerts ({defaulters.length})
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Installment Due</th>
                  <th className="py-3 px-4">Outstanding (Base)</th>
                  <th className="py-3 px-4">Accrued Late Fine</th>
                  <th className="py-3 px-4">Total Amount Payable</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {defaulters.map(d => {
                  const overdueInst = d.installments.find(i => i.status === 'overdue')
                  const totalPayable = d.dueFee + d.lateFineAccrued
                  return (
                    <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-foreground block">{d.studentName}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{d.rollNumber} • {d.email}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{d.courseName}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-rose-500">{overdueInst?.title || 'Installment 1'}</span>
                        <span className="block text-[10px] text-muted-foreground">Due: {overdueInst?.dueDate}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{formatCurrency(d.dueFee)}</td>
                      <td className="py-3 px-4 font-semibold text-rose-500">+{formatCurrency(d.lateFineAccrued)}</td>
                      <td className="py-3 px-4 font-bold text-foreground">{formatCurrency(totalPayable)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSendReminder(d.studentId)}
                            className="px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Remind
                          </button>
                          <button
                            onClick={() => handleOpenCollect(d)}
                            className="px-3 py-1 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                          >
                            Collect
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS & RECEIPTS LEDGER */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Official Payment Receipts Ledger</h3>
                <p className="text-xs text-muted-foreground">Audit trail of all online & counter-recorded fee transactions.</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Receipt Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Reference No.</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {pay.receiptNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground block">{pay.studentName}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{pay.rollNumber}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      {formatCurrency(pay.amountPaid)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="uppercase text-[11px] font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
                        {pay.paymentMode.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                      {pay.transactionRef || 'OFFLINE-COUNTER'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {pay.paymentDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase">
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewReceipt(pay)}
                        className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors inline-flex items-center gap-1.5"
                      >
                        <Printer className="w-3 h-3" />
                        Print Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: FEE STRUCTURES */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground text-base">Course Fee Structures</h3>
              <p className="text-xs text-muted-foreground">Configure tuition, admission, laboratory, and library line items by program</p>
            </div>
            <button
              onClick={() => {
                setEditingStructure(null)
                setIsStructureModalOpen(true)
              }}
              className="px-3.5 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Structure
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {structures.map(str => (
              <div key={str.id} className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-foreground text-sm leading-snug">{str.name}</h4>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                      {str.frequency}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{str.courseName} • Batch {str.batchYear}</p>

                  <div className="mt-4 pt-3 border-t border-border space-y-1.5 text-xs">
                    {str.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-muted-foreground">
                        <span>{item.categoryName}</span>
                        <span className="font-medium text-foreground">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Total Net Fee</span>
                    <span className="text-base font-bold text-primary">{formatCurrency(str.totalAmount)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingStructure(str)
                        setIsStructureModalOpen(true)
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteStructure(str.id)}
                      className="px-2.5 py-1 text-xs font-medium text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS & FINANCIAL ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Method Distribution */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <h3 className="font-semibold text-foreground text-sm mb-1">Collection by Payment Mode</h3>
              <p className="text-xs text-muted-foreground mb-4">Breakdown of online vs cash counter revenue</p>

              <div className="space-y-3">
                {summary.paymentModeDistribution.map(pm => {
                  const pct = summary.totalRevenueCollected > 0
                    ? Math.round((pm.totalAmount / summary.totalRevenueCollected) * 100)
                    : 0
                  return (
                    <div key={pm.mode} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="uppercase text-foreground">{pm.mode.replace('_', ' ')} ({pm.count} txns)</span>
                        <span className="text-emerald-600 font-bold">{formatCurrency(pm.totalAmount)} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <h3 className="font-semibold text-foreground text-sm mb-1">Monthly Collection Velocity</h3>
              <p className="text-xs text-muted-foreground mb-4">Collected vs Pending Target</p>

              <div className="space-y-3">
                {summary.monthlyCollection.map(mc => (
                  <div key={mc.month} className="p-3 bg-muted/20 border border-border/50 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{mc.month}</span>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 block">{formatCurrency(mc.collected)}</span>
                      <span className="text-[10px] text-muted-foreground">Due: {formatCurrency(mc.due)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Program Recovery Rate Table */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
            <h3 className="font-semibold text-foreground text-sm mb-1">Program-Wise Fee Recovery Rates</h3>
            <p className="text-xs text-muted-foreground mb-4">Comparison of fee recovery efficiency across departments</p>

            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Program Name</th>
                  <th className="py-2.5 px-4">Students</th>
                  <th className="py-2.5 px-4">Demanded</th>
                  <th className="py-2.5 px-4">Collected</th>
                  <th className="py-2.5 px-4">Pending</th>
                  <th className="py-2.5 px-4">Recovery %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.courseCollection.map(cc => (
                  <tr key={cc.courseId} className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-semibold text-foreground">{cc.courseName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{cc.enrolledCount}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{formatCurrency(cc.demanded)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{formatCurrency(cc.collected)}</td>
                    <td className="py-3 px-4 font-medium text-amber-500">{formatCurrency(cc.pending)}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600">
                        {cc.recoveryRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Payment Collection Modal */}
      <FeeCollectionModal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        studentProfile={collectingStudent}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* 2. Official Printable Receipt Modal */}
      <FeeReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        payment={activeReceipt}
        studentBalance={
          profiles.find(p => p.studentId === activeReceipt?.studentId)?.dueFee || 0
        }
      />

      {/* 3. Fee Structure Builder Modal */}
      <FeeStructureModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        categories={initialCategories}
        editingStructure={editingStructure}
        onSuccess={saved => {
          if (editingStructure) {
            setStructures(structures.map(s => (s.id === saved.id ? saved : s)))
          } else {
            setStructures([saved, ...structures])
          }
        }}
      />
    </div>
  )
}
