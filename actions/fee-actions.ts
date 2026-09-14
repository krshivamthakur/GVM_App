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
  FeePaymentStatus,
  FeeInstallment,
  FeeReceiptInstitutionSettings,
  DEFAULT_RECEIPT_SETTINGS
} from '@/types/fee'
import { createAdminClient } from '@/lib/supabase/server'
import { dataStore } from '@/lib/data/store'
import { Profile } from '@/types/database'
import { revalidatePath } from 'next/cache'

// ============================================================
// IN-MEMORY STORE (Supabase / Postgres synchronized)
// ============================================================

let MOCK_CATEGORIES: FeeCategory[] = []

const DEFAULT_FEE_STRUCTURES: FeeStructure[] = []

const DEFAULT_FEE_DISCOUNTS: FeeDiscount[] = []

let MOCK_DISCOUNTS: FeeDiscount[] = []
let MOCK_STRUCTURES: FeeStructure[] = []
let MOCK_STUDENT_PROFILES: StudentFeeProfile[] = []
let MOCK_PAYMENTS: FeePayment[] = []
let MOCK_NOTIFICATIONS: FeeNotificationLog[] = []
let MOCK_RECEIPT_SETTINGS: FeeReceiptInstitutionSettings = { ...DEFAULT_RECEIPT_SETTINGS }

function ensureDefaultFeeStructures() {
  // Only database-backed or admin-created structures
}

function ensureDefaultDiscounts() {
  // Only database-backed or admin-created discounts
}

// ============================================================
// STUDENT DIRECTORY AUTO-DETECTION ENGINE
// ============================================================

/**
 * Fetch all students registered in the Student Directory.
 * Queries Supabase Profile table and falls back to / merges with in-memory dataStore.
 */
export async function getDirectoryStudents(): Promise<Profile[]> {
  const studentMap = new Map<string, Profile>()

  // 1. Fetch from Supabase Profile table
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('Profile')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      data.forEach(p => {
        if (p.id) studentMap.set(p.id, p)
      })
    }
  } catch (err) {
    console.warn('Supabase getDirectoryStudents fallback:', err)
  }

  // 2. Fetch from dataStore in-memory admin profiles
  const localStudents = dataStore.getAllProfilesAdmin().filter(p => p.role === 'student')
  localStudents.forEach(p => {
    if (p.id && !studentMap.has(p.id)) {
      studentMap.set(p.id, p)
    }
  })



  return Array.from(studentMap.values())
}

let syncInFlight: Promise<{
  syncedCount: number
  newlyDetectedCount: number
  profiles: StudentFeeProfile[]
}> | null = null

/**
 * Auto-detect and synchronize students from Student Directory into Fee Management.
 * - Existing profiles have student names/emails/avatars synchronized.
 * - New students have fee profiles automatically initialized with enrolled/default course structures.
 */
export async function syncStudentsFromDirectory(): Promise<{
  syncedCount: number
  newlyDetectedCount: number
  profiles: StudentFeeProfile[]
}> {
  if (syncInFlight) {
    return syncInFlight
  }

  syncInFlight = (async () => {
    try {
      ensureDefaultFeeStructures()
      ensureDefaultDiscounts()

      const directoryStudents = await getDirectoryStudents()
      let newlyDetectedCount = 0

      // Use a Map keyed by studentId to guarantee no duplicate profiles
      const profileMap = new Map<string, StudentFeeProfile>()
      for (const p of MOCK_STUDENT_PROFILES) {
        if (p.studentId) {
          profileMap.set(p.studentId, p)
        }
      }

      for (const student of directoryStudents) {
        const displayName = student.full_name || student.email.split('@')[0]
        const existing = profileMap.get(student.id)

        if (existing) {
          // Sync any updated directory details (name, email, avatar)
          existing.studentName = displayName
          existing.email = student.email
          if (student.avatar_url) {
            existing.studentAvatar = student.avatar_url
          }
          existing.isAutoDetected = true
          existing.syncedAt = new Date().toISOString()
        } else {
          // Auto-detect newly registered student
          newlyDetectedCount++

          // Determine course association: check enrollment or alternate across structures
          const enrollments = dataStore.getStudentEnrollments(student.id)
          const enrolledCourse = enrollments.length > 0 ? enrollments[0] : null

          let matchedStructure = MOCK_STRUCTURES.find(
            s => enrolledCourse && (s.courseId === enrolledCourse.id || (s.courseIds && s.courseIds.includes(enrolledCourse.id)))
          )
          if (!matchedStructure && MOCK_STRUCTURES.length > 0) {
            matchedStructure = MOCK_STRUCTURES[0]
          }

          const rollNumber = `GVM-2026-${student.id.replace(/-/g, '').slice(-4).toUpperCase()}`
          const baseFee = matchedStructure ? matchedStructure.totalAmount : 0
          const netFee = baseFee
          const dueFee = baseFee

          const installments: FeeInstallment[] = matchedStructure ? [
            {
              id: `inst_${student.id}_1`,
              studentId: student.id,
              installmentNumber: 1,
              title: 'Term 1 Installment',
              amount: Math.ceil(netFee / 2),
              dueDate: matchedStructure.dueDate,
              paidAmount: 0,
              lateFine: 0,
              status: 'unpaid'
            },
            {
              id: `inst_${student.id}_2`,
              studentId: student.id,
              installmentNumber: 2,
              title: 'Term 2 Installment',
              amount: netFee - Math.ceil(netFee / 2),
              dueDate: '2026-12-15',
              paidAmount: 0,
              lateFine: 0,
              status: 'unpaid'
            }
          ] : []

          const newProfile: StudentFeeProfile = {
            id: `sfp_${student.id}`,
            studentId: student.id,
            studentName: displayName,
            studentAvatar: student.avatar_url || undefined,
            rollNumber,
            email: student.email,
            courseId: matchedStructure ? matchedStructure.courseId : (enrolledCourse ? enrolledCourse.id : ''),
            courseName: enrolledCourse ? enrolledCourse.title : (matchedStructure ? matchedStructure.courseName : 'General Curriculum'),
            className: 'Class of 2026',
            structureId: matchedStructure ? matchedStructure.id : '',
            structureName: matchedStructure ? matchedStructure.name : 'No Fee Structure Assigned',
            discountAmount: 0,
            customAdjustment: 0,
            netFee,
            paidFee: 0,
            dueFee,
            lateFineAccrued: 0,
            status: dueFee > 0 ? 'unpaid' : 'paid',
            installments,
            isAutoDetected: true,
            syncedAt: new Date().toISOString()
          }

          profileMap.set(student.id, newProfile)
        }
      }

      MOCK_STUDENT_PROFILES = Array.from(profileMap.values())

      return {
        syncedCount: directoryStudents.length,
        newlyDetectedCount,
        profiles: [...MOCK_STUDENT_PROFILES]
      }
    } finally {
      syncInFlight = null
    }
  })()

  return syncInFlight
}

// ============================================================
// SERVER ACTIONS: CATEGORIES & STRUCTURES
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
  ensureDefaultFeeStructures()
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
  ensureDefaultDiscounts()
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

// ============================================================
// SERVER ACTIONS: RECEIPT INSTITUTION SETTINGS (ADMIN MANAGED)
// ============================================================

export async function getFeeReceiptSettings(): Promise<FeeReceiptInstitutionSettings> {
  return { ...MOCK_RECEIPT_SETTINGS }
}

export async function updateFeeReceiptSettings(
  settings: Partial<FeeReceiptInstitutionSettings>
): Promise<FeeReceiptInstitutionSettings> {
  MOCK_RECEIPT_SETTINGS = {
    ...MOCK_RECEIPT_SETTINGS,
    ...settings
  }
  revalidatePath('/admin/fees')
  revalidatePath('/student/fees')
  return { ...MOCK_RECEIPT_SETTINGS }
}

export async function resetFeeReceiptSettings(): Promise<FeeReceiptInstitutionSettings> {
  MOCK_RECEIPT_SETTINGS = { ...DEFAULT_RECEIPT_SETTINGS }
  revalidatePath('/admin/fees')
  revalidatePath('/student/fees')
  return { ...MOCK_RECEIPT_SETTINGS }
}

// ============================================================
// SERVER ACTIONS: STUDENT FEE PROFILES & MANAGEMENT
// ============================================================

export async function getStudentFeeProfiles(filters?: {
  courseId?: string
  status?: FeePaymentStatus
  search?: string
}): Promise<StudentFeeProfile[]> {
  // Always auto-detect and synchronize with Student Directory before returning
  await syncStudentsFromDirectory()

  let list = [...MOCK_STUDENT_PROFILES]

  if (filters?.courseId && filters.courseId !== 'all') {
    list = list.filter(p => p.courseId === filters.courseId)
  }
  if (filters?.status && (filters.status as string) !== 'all') {
    list = list.filter(p => p.status === filters.status)
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(p =>
      p.studentName.toLowerCase().includes(q) ||
      p.rollNumber.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.courseName.toLowerCase().includes(q)
    )
  }

  return list
}

export async function getStudentFeeProfile(studentId: string): Promise<StudentFeeProfile | null> {
  let profile = MOCK_STUDENT_PROFILES.find(p => p.studentId === studentId)
  if (!profile) {
    await syncStudentsFromDirectory()
    profile = MOCK_STUDENT_PROFILES.find(p => p.studentId === studentId)
  }
  return profile ? { ...profile } : null
}

export async function createStudentFeeProfile(profile: Omit<StudentFeeProfile, 'id'>): Promise<StudentFeeProfile> {
  const newProfile: StudentFeeProfile = {
    ...profile,
    id: `sfp_${Date.now()}`,
    isAutoDetected: true,
    syncedAt: new Date().toISOString()
  }
  MOCK_STUDENT_PROFILES.push(newProfile)
  return newProfile
}

/**
 * Assign or update fee structure, discounts, and adjustments for a student.
 */
export async function assignFeeStructureToStudent(params: {
  studentId: string
  structureId: string
  courseId?: string
  courseName?: string
  discountId?: string
  customAdjustment?: number
}): Promise<StudentFeeProfile> {
  ensureDefaultFeeStructures()
  ensureDefaultDiscounts()

  let profileIndex = MOCK_STUDENT_PROFILES.findIndex(p => p.studentId === params.studentId)
  if (profileIndex === -1) {
    await syncStudentsFromDirectory()
    profileIndex = MOCK_STUDENT_PROFILES.findIndex(p => p.studentId === params.studentId)
  }

  if (profileIndex === -1) {
    throw new Error('Student fee profile not found in directory')
  }

  const profile = MOCK_STUDENT_PROFILES[profileIndex]
  const structure = MOCK_STRUCTURES.find(s => s.id === params.structureId)
  if (!structure) {
    throw new Error('Selected fee structure does not exist')
  }

  // Calculate discount
  let discountAmount = 0
  let discountName: string | undefined = undefined
  if (params.discountId && params.discountId !== 'none') {
    const discount = MOCK_DISCOUNTS.find(d => d.id === params.discountId)
    if (discount) {
      discountName = discount.name
      discountAmount = discount.discountType === 'percentage'
        ? Math.round((structure.totalAmount * discount.value) / 100)
        : discount.value
    }
  }

  const customAdjustment = params.customAdjustment || 0
  const netFee = Math.max(0, structure.totalAmount - discountAmount + customAdjustment)
  const remainingDue = Math.max(0, netFee + profile.lateFineAccrued - profile.paidFee)

  // Rebuild installments with updated fee structure
  const inst1Amount = Math.ceil(netFee / 2)
  const inst2Amount = netFee - inst1Amount

  const installments: FeeInstallment[] = [
    {
      id: `inst_${profile.studentId}_1`,
      studentId: profile.studentId,
      installmentNumber: 1,
      title: 'Term 1 Installment',
      amount: inst1Amount,
      dueDate: structure.dueDate,
      paidAmount: Math.min(profile.paidFee, inst1Amount),
      lateFine: 0,
      status: profile.paidFee >= inst1Amount ? 'paid' : profile.paidFee > 0 ? 'partial' : 'unpaid'
    },
    {
      id: `inst_${profile.studentId}_2`,
      studentId: profile.studentId,
      installmentNumber: 2,
      title: 'Term 2 Installment',
      amount: inst2Amount,
      dueDate: '2026-12-15',
      paidAmount: Math.max(0, profile.paidFee - inst1Amount),
      lateFine: 0,
      status: profile.paidFee >= netFee ? 'paid' : (profile.paidFee - inst1Amount) > 0 ? 'partial' : 'unpaid'
    }
  ]

  let status: FeePaymentStatus = 'unpaid'
  if (remainingDue === 0) {
    status = 'paid'
  } else if (profile.paidFee > 0) {
    status = 'partial'
  }

  const updated: StudentFeeProfile = {
    ...profile,
    structureId: structure.id,
    structureName: structure.name,
    courseId: params.courseId || structure.courseId,
    courseName: params.courseName || structure.courseName,
    discountId: params.discountId === 'none' ? undefined : params.discountId,
    discountName,
    discountAmount,
    customAdjustment,
    netFee,
    dueFee: remainingDue,
    status,
    installments,
    syncedAt: new Date().toISOString()
  }

  MOCK_STUDENT_PROFILES[profileIndex] = updated
  revalidatePath('/admin/fees')
  revalidatePath('/student/fees')
  return updated
}

// ============================================================
// SERVER ACTIONS: PAYMENTS & RECEIPTS
// ============================================================

export async function recordFeePayment(params: {
  studentId: string
  installmentId?: string
  amount: number
  paymentMode: PaymentMode
  transactionRef?: string
  notes?: string
  receivedBy?: string
}): Promise<{ success: boolean; payment: FeePayment; profile: StudentFeeProfile }> {
  let profileIndex = MOCK_STUDENT_PROFILES.findIndex(p => p.studentId === params.studentId)
  if (profileIndex === -1) {
    await syncStudentsFromDirectory()
    profileIndex = MOCK_STUDENT_PROFILES.findIndex(p => p.studentId === params.studentId)
  }

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

  revalidatePath('/admin/fees')
  revalidatePath('/student/fees')

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

  revalidatePath('/admin/fees')
  revalidatePath('/student/fees')
  return { ...payment }
}

// ============================================================
// SERVER ACTIONS: FINANCIAL SUMMARY & NOTIFICATIONS
// ============================================================

export async function getFeeFinancialSummary(): Promise<FeeFinancialSummary> {
  await syncStudentsFromDirectory()

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
    dueDate: '2026-10-31',
    channel,
    sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
  }

  MOCK_NOTIFICATIONS.unshift(log)
  return log
}

export async function getFeeNotificationLogs(): Promise<FeeNotificationLog[]> {
  return [...MOCK_NOTIFICATIONS]
}
