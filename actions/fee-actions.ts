'use server'

import {
  FeeCategory,
  FeeStructure,
  FeeDiscount,
  StudentFeeProfile,
  FeePayment,
  FeeFinancialSummary,
  FeeNotificationLog,
  PaymentMode,
  TransactionStatus,
  FeePaymentStatus
} from '@/types/fee'

// ============================================================
// IN-MEMORY MOCK STORE (Supabase / Postgres ready)
// ============================================================

let MOCK_CATEGORIES: FeeCategory[] = [
  { id: 'cat_tui', name: 'Tuition Fee', code: 'TUI', description: 'Academic instruction & lab classes', isRefundable: false },
  { id: 'cat_adm', name: 'Admission & Registration', code: 'ADM', description: 'One-time admission charge', isRefundable: false },
  { id: 'cat_exm', name: 'Examination & Evaluation', code: 'EXM', description: 'Semester exams and certifications', isRefundable: false },
  { id: 'cat_lib', name: 'Library & Digital Resources', code: 'LIB', description: 'Access to physical & e-library', isRefundable: true },
  { id: 'cat_lab', name: 'Laboratory & Tech Infrastructure', code: 'LAB', description: 'Computing equipment & servers', isRefundable: false },
  { id: 'cat_hos', name: 'Hostel & Residential Fee', code: 'HOS', description: 'Boarding, utilities and Wi-Fi', isRefundable: true },
  { id: 'cat_trn', name: 'Campus Transport', code: 'TRN', description: 'Bus transport across city routes', isRefundable: false },
  { id: 'cat_spr', name: 'Sports & Student Activities', code: 'SPR', description: 'Gym, clubs and tournaments', isRefundable: false },
]

let MOCK_DISCOUNTS: FeeDiscount[] = []
let MOCK_STRUCTURES: FeeStructure[] = []
let MOCK_STUDENT_PROFILES: StudentFeeProfile[] = []
let MOCK_PAYMENTS: FeePayment[] = []
let MOCK_NOTIFICATIONS: FeeNotificationLog[] = []

// ============================================================
// SERVER ACTIONS
// ============================================================

export async function getFeeCategories(): Promise<FeeCategory[]> {
  return [...MOCK_CATEGORIES]
}

export async function createFeeCategory(category: Omit<FeeCategory, 'id'>): Promise<FeeCategory> {
  const newCategory: FeeCategory = {
    ...category,
    id: `cat_${Date.now()}`
  }
  MOCK_CATEGORIES.push(newCategory)
  return newCategory
}

export async function getFeeStructures(): Promise<FeeStructure[]> {
  return [...MOCK_STRUCTURES]
}

export async function createFeeStructure(structure: Omit<FeeStructure, 'id' | 'createdAt'>): Promise<FeeStructure> {
  const newStructure: FeeStructure = {
    ...structure,
    id: `struct_${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0]
  }
  MOCK_STRUCTURES.push(newStructure)
  return newStructure
}

export async function updateFeeStructure(id: string, updates: Partial<FeeStructure>): Promise<FeeStructure | null> {
  const index = MOCK_STRUCTURES.findIndex(s => s.id === id)
  if (index === -1) return null
  MOCK_STRUCTURES[index] = { ...MOCK_STRUCTURES[index], ...updates }
  return MOCK_STRUCTURES[index]
}

export async function deleteFeeStructure(id: string): Promise<boolean> {
  const before = MOCK_STRUCTURES.length
  MOCK_STRUCTURES = MOCK_STRUCTURES.filter(s => s.id !== id)
  return MOCK_STRUCTURES.length < before
}

export async function getFeeDiscounts(): Promise<FeeDiscount[]> {
  return [...MOCK_DISCOUNTS]
}

export async function createFeeDiscount(discount: Omit<FeeDiscount, 'id'>): Promise<FeeDiscount> {
  const newDiscount: FeeDiscount = {
    ...discount,
    id: `dsc_${Date.now()}`
  }
  MOCK_DISCOUNTS.push(newDiscount)
  return newDiscount
}

export async function getStudentFeeProfiles(filters?: {
  courseId?: string
  status?: FeePaymentStatus
  search?: string
}): Promise<StudentFeeProfile[]> {
  let list = [...MOCK_STUDENT_PROFILES]

  if (filters?.courseId && filters.courseId !== 'all') {
    list = list.filter(p => p.courseId === filters.courseId)
  }
  if (filters?.status && filters.status !== 'all' as any) {
    list = list.filter(p => p.status === filters.status)
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(p =>
      p.studentName.toLowerCase().includes(q) ||
      p.rollNumber.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    )
  }

  return list
}

export async function getStudentFeeProfile(studentId: string): Promise<StudentFeeProfile | null> {
  const profile = MOCK_STUDENT_PROFILES.find(p => p.studentId === studentId)
  return profile ? { ...profile } : null
}

export async function createStudentFeeProfile(profile: Omit<StudentFeeProfile, 'id'>): Promise<StudentFeeProfile> {
  const newProfile: StudentFeeProfile = {
    ...profile,
    id: `sfp_${Date.now()}`
  }
  MOCK_STUDENT_PROFILES.push(newProfile)
  return newProfile
}

export async function recordFeePayment(params: {
  studentId: string
  installmentId?: string
  amount: number
  paymentMode: PaymentMode
  transactionRef?: string
  notes?: string
  receivedBy?: string
}): Promise<{ success: boolean; payment: FeePayment; profile: StudentFeeProfile }> {
  const profileIndex = MOCK_STUDENT_PROFILES.findIndex(p => p.studentId === params.studentId)
  if (profileIndex === -1) {
    throw new Error('Student fee profile not found')
  }

  const profile = MOCK_STUDENT_PROFILES[profileIndex]
  const receiptNum = `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`

  let installmentTitle: string | undefined
  if (params.installmentId) {
    const inst = profile.installments.find(i => i.id === params.installmentId)
    if (inst) {
      installmentTitle = inst.title
      inst.paidAmount += params.amount
      inst.paidAt = new Date().toISOString()
      if (inst.paidAmount >= inst.amount + inst.lateFine) {
        inst.status = 'paid'
      } else {
        inst.status = 'partial'
      }
    }
  }

  const newPayment: FeePayment = {
    id: `pay_${Date.now()}`,
    receiptNumber: receiptNum,
    studentId: profile.studentId,
    studentName: profile.studentName,
    rollNumber: profile.rollNumber,
    courseName: profile.courseName,
    installmentId: params.installmentId,
    installmentTitle,
    amountPaid: params.amount,
    paymentMode: params.paymentMode,
    transactionRef: params.transactionRef || `TXN-${Date.now().toString().slice(-6)}`,
    paymentDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
    receivedBy: params.receivedBy || 'Admin Accounts',
    notes: params.notes,
    status: 'verified'
  }

  MOCK_PAYMENTS.unshift(newPayment)

  // Update profile totals
  profile.paidFee += params.amount
  profile.dueFee = Math.max(0, profile.netFee + profile.lateFineAccrued - profile.paidFee)
  profile.lastPaymentDate = newPayment.paymentDate.split(' ')[0]

  if (profile.dueFee === 0) {
    profile.status = 'paid'
  } else if (profile.paidFee > 0) {
    profile.status = 'partial'
  }

  MOCK_STUDENT_PROFILES[profileIndex] = { ...profile }

  return {
    success: true,
    payment: newPayment,
    profile: { ...profile }
  }
}

export async function getFeePayments(filters?: {
  studentId?: string
  status?: TransactionStatus
  paymentMode?: PaymentMode
  search?: string
}): Promise<FeePayment[]> {
  let list = [...MOCK_PAYMENTS]

  if (filters?.studentId) {
    list = list.filter(p => p.studentId === filters.studentId)
  }
  if (filters?.status) {
    list = list.filter(p => p.status === filters.status)
  }
  if (filters?.paymentMode) {
    list = list.filter(p => p.paymentMode === filters.paymentMode)
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(p =>
      p.receiptNumber.toLowerCase().includes(q) ||
      p.studentName.toLowerCase().includes(q) ||
      p.rollNumber.toLowerCase().includes(q) ||
      (p.transactionRef && p.transactionRef.toLowerCase().includes(q))
    )
  }

  return list
}

export async function getPaymentReceipt(receiptNumber: string): Promise<FeePayment | null> {
  const item = MOCK_PAYMENTS.find(p => p.receiptNumber === receiptNumber)
  return item ? { ...item } : null
}

export async function verifyOrCancelPayment(
  paymentId: string,
  newStatus: TransactionStatus,
  reason?: string
): Promise<FeePayment | null> {
  const index = MOCK_PAYMENTS.findIndex(p => p.id === paymentId)
  if (index === -1) return null

  const payment = MOCK_PAYMENTS[index]
  payment.status = newStatus
  if (reason) {
    payment.notes = (payment.notes ? `${payment.notes} | ` : '') + `Status changed to ${newStatus}: ${reason}`
  }

  // If refunded or cancelled, recalculate profile dues
  if (newStatus === 'refunded' || newStatus === 'cancelled') {
    const profIndex = MOCK_STUDENT_PROFILES.findIndex(p => p.studentId === payment.studentId)
    if (profIndex !== -1) {
      const prof = MOCK_STUDENT_PROFILES[profIndex]
      prof.paidFee = Math.max(0, prof.paidFee - payment.amountPaid)
      prof.dueFee = Math.max(0, prof.netFee + prof.lateFineAccrued - prof.paidFee)
      prof.status = prof.paidFee === 0 ? 'unpaid' : 'partial'
    }
  }

  return { ...payment }
}

export async function getFeeFinancialSummary(): Promise<FeeFinancialSummary> {
  const totalStudents = MOCK_STUDENT_PROFILES.length
  const totalExpected = MOCK_STUDENT_PROFILES.reduce((acc, p) => acc + p.netFee, 0)
  const totalCollected = MOCK_STUDENT_PROFILES.reduce((acc, p) => acc + p.paidFee, 0)
  const totalDues = MOCK_STUDENT_PROFILES.reduce((acc, p) => acc + p.dueFee, 0)
  const totalFines = MOCK_STUDENT_PROFILES.reduce((acc, p) => acc + p.lateFineAccrued, 0)
  const defaultersCount = MOCK_STUDENT_PROFILES.filter(p => p.status === 'overdue').length
  const efficiency = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  // Payment mode distribution
  const modeMap: Record<PaymentMode, { totalAmount: number; count: number }> = {
    cash: { totalAmount: 0, count: 0 },
    upi: { totalAmount: 0, count: 0 },
    bank_transfer: { totalAmount: 0, count: 0 },
    card: { totalAmount: 0, count: 0 },
    cheque: { totalAmount: 0, count: 0 }
  }

  for (const pay of MOCK_PAYMENTS) {
    if (pay.status === 'verified') {
      if (modeMap[pay.paymentMode]) {
        modeMap[pay.paymentMode].totalAmount += pay.amountPaid
        modeMap[pay.paymentMode].count += 1
      }
    }
  }

  const paymentModeDistribution = Object.entries(modeMap).map(([mode, val]) => ({
    mode: mode as PaymentMode,
    totalAmount: val.totalAmount,
    count: val.count
  }))

  // Course collection
  const courseMap = new Map<string, { courseName: string; count: number; demanded: number; collected: number; pending: number }>()
  for (const prof of MOCK_STUDENT_PROFILES) {
    const existing = courseMap.get(prof.courseId) || {
      courseName: prof.courseName,
      count: 0,
      demanded: 0,
      collected: 0,
      pending: 0
    }
    existing.count += 1
    existing.demanded += prof.netFee
    existing.collected += prof.paidFee
    existing.pending += prof.dueFee
    courseMap.set(prof.courseId, existing)
  }

  const courseCollection = Array.from(courseMap.entries()).map(([courseId, val]) => ({
    courseId,
    courseName: val.courseName,
    enrolledCount: val.count,
    demanded: val.demanded,
    collected: val.collected,
    pending: val.pending,
    recoveryRate: val.demanded > 0 ? Math.round((val.collected / val.demanded) * 100) : 0
  }))

  // Monthly collection aggregated dynamically from verified payments
  const monthMap = new Map<string, { collected: number; due: number }>()
  for (const pay of MOCK_PAYMENTS) {
    if (pay.status === 'verified' && pay.paymentDate) {
      const monthKey = new Date(pay.paymentDate.replace(' ', 'T')).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const current = monthMap.get(monthKey) || { collected: 0, due: 0 }
      current.collected += pay.amountPaid
      monthMap.set(monthKey, current)
    }
  }

  const monthlyCollection = Array.from(monthMap.entries()).map(([month, val]) => ({
    month,
    collected: val.collected,
    due: val.due
  }))

  return {
    totalStudentsBilled: totalStudents,
    totalRevenueExpected: totalExpected,
    totalRevenueCollected: totalCollected,
    totalOutstandingDues: totalDues,
    totalFinesAccrued: totalFines,
    overdueDefaultersCount: defaultersCount,
    collectionEfficiency: efficiency,
    paymentModeDistribution,
    monthlyCollection,
    courseCollection
  }
}

export async function sendFeeReminder(
  studentId: string,
  channel: 'email' | 'sms' | 'in_app' = 'email'
): Promise<FeeNotificationLog> {
  const profile = MOCK_STUDENT_PROFILES.find(p => p.studentId === studentId)
  if (!profile) throw new Error('Student profile not found')

  const log: FeeNotificationLog = {
    id: `notif_${Date.now()}`,
    studentId: profile.studentId,
    studentName: profile.studentName,
    email: profile.email,
    type: profile.status === 'overdue' ? 'overdue_alert' : 'due_reminder',
    amountDue: profile.dueFee + profile.lateFineAccrued,
    dueDate: '2026-09-30',
    channel,
    sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
  }

  MOCK_NOTIFICATIONS.unshift(log)
  return log
}

export async function getFeeNotificationLogs(): Promise<FeeNotificationLog[]> {
  return [...MOCK_NOTIFICATIONS]
}
