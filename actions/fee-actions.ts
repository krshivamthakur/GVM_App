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

let MOCK_DISCOUNTS: FeeDiscount[] = [
  { id: 'dsc_merit', name: 'Merit Scholarship (Top 10%)', discountType: 'percentage', value: 20, description: '20% off total tuition fee for rank holders', isActive: true },
  { id: 'dsc_need', name: 'Financial Need Grant', discountType: 'fixed_amount', value: 15000, description: 'Direct waiver of ₹15,000 for verified candidates', isActive: true },
  { id: 'dsc_sibling', name: 'Sibling Concession', discountType: 'percentage', value: 10, description: '10% discount when siblings are co-enrolled', isActive: true },
  { id: 'dsc_early', name: 'Early Bird Enrollment', discountType: 'fixed_amount', value: 5000, description: 'Flat ₹5,000 rebate on admissions before July', isActive: true },
]

let MOCK_STRUCTURES: FeeStructure[] = [
  {
    id: 'struct_java_2026',
    name: 'B.Tech CSE / Java Masterclass 2026',
    courseId: '11111111-1111-1111-1111-111111111111',
    courseName: 'Java Programming Complete Masterclass',
    batchYear: '2026-2027',
    frequency: 'semester',
    totalAmount: 65000,
    dueDate: '2026-09-30',
    gracePeriodDays: 7,
    lateFinePerDay: 50,
    maxLateFine: 2000,
    isActive: true,
    createdAt: '2026-06-01',
    items: [
      { id: 'fsi_1', categoryId: 'cat_tui', categoryName: 'Tuition Fee', amount: 45000 },
      { id: 'fsi_2', categoryId: 'cat_lab', categoryName: 'Laboratory & Tech Infrastructure', amount: 10000 },
      { id: 'fsi_3', categoryId: 'cat_exm', categoryName: 'Examination & Evaluation', amount: 5000 },
      { id: 'fsi_4', categoryId: 'cat_lib', categoryName: 'Library & Digital Resources', amount: 5000 },
    ]
  },
  {
    id: 'struct_phy_2026',
    name: 'Physics Class 12 & JEE Advanced 2026',
    courseId: '22222222-2222-2222-2222-222222222222',
    courseName: 'Physics Class 12 & JEE',
    batchYear: '2026-2027',
    frequency: 'semester',
    totalAmount: 48000,
    dueDate: '2026-09-15',
    gracePeriodDays: 5,
    lateFinePerDay: 40,
    maxLateFine: 1500,
    isActive: true,
    createdAt: '2026-06-01',
    items: [
      { id: 'fsi_5', categoryId: 'cat_tui', categoryName: 'Tuition Fee', amount: 35000 },
      { id: 'fsi_6', categoryId: 'cat_lab', categoryName: 'Laboratory & Tech Infrastructure', amount: 8000 },
      { id: 'fsi_7', categoryId: 'cat_exm', categoryName: 'Examination & Evaluation', amount: 5000 },
    ]
  },
  {
    id: 'struct_web_2026',
    name: 'Full Stack Web Development Professional',
    courseId: '33333333-3333-3333-3333-333333333333',
    courseName: 'Modern Full Stack Web Development',
    batchYear: '2026-2027',
    frequency: 'semester',
    totalAmount: 55000,
    dueDate: '2026-10-10',
    gracePeriodDays: 7,
    lateFinePerDay: 50,
    maxLateFine: 2000,
    isActive: true,
    createdAt: '2026-06-01',
    items: [
      { id: 'fsi_8', categoryId: 'cat_tui', categoryName: 'Tuition Fee', amount: 40000 },
      { id: 'fsi_9', categoryId: 'cat_lab', categoryName: 'Laboratory & Tech Infrastructure', amount: 10000 },
      { id: 'fsi_10', categoryId: 'cat_exm', categoryName: 'Examination & Evaluation', amount: 5000 },
    ]
  }
]

let MOCK_STUDENT_PROFILES: StudentFeeProfile[] = [
  {
    id: 'sfp_001',
    studentId: 'stu_001',
    studentName: 'Arjun Mehta',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop',
    rollNumber: 'CSE2024001',
    email: 'arjun.mehta@example.com',
    courseId: '11111111-1111-1111-1111-111111111111',
    courseName: 'Java Programming Complete Masterclass',
    className: 'Java Programming Masterclass',
    structureId: 'struct_java_2026',
    structureName: 'B.Tech CSE / Java Masterclass 2026',
    discountId: 'dsc_merit',
    discountName: 'Merit Scholarship (Top 10%)',
    discountAmount: 13000, // 20% of 65000
    customAdjustment: 0,
    netFee: 52000,
    paidFee: 52000,
    dueFee: 0,
    lateFineAccrued: 0,
    status: 'paid',
    lastPaymentDate: '2026-08-15',
    installments: [
      { id: 'inst_001_1', studentId: 'stu_001', installmentNumber: 1, title: 'Installment 1 (50%)', amount: 26000, dueDate: '2026-07-31', paidAmount: 26000, lateFine: 0, status: 'paid', paidAt: '2026-07-28' },
      { id: 'inst_001_2', studentId: 'stu_001', installmentNumber: 2, title: 'Installment 2 (50%)', amount: 26000, dueDate: '2026-09-30', paidAmount: 26000, lateFine: 0, status: 'paid', paidAt: '2026-08-15' },
    ]
  },
  {
    id: 'sfp_002',
    studentId: 'stu_002',
    studentName: 'Priya Sharma',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop',
    rollNumber: 'CSE2024002',
    email: 'priya.sharma@example.com',
    courseId: '11111111-1111-1111-1111-111111111111',
    courseName: 'Java Programming Complete Masterclass',
    className: 'Java Programming Masterclass',
    structureId: 'struct_java_2026',
    structureName: 'B.Tech CSE / Java Masterclass 2026',
    discountAmount: 0,
    customAdjustment: 0,
    netFee: 65000,
    paidFee: 35000,
    dueFee: 30000,
    lateFineAccrued: 0,
    status: 'partial',
    lastPaymentDate: '2026-08-01',
    installments: [
      { id: 'inst_002_1', studentId: 'stu_002', installmentNumber: 1, title: 'Installment 1 (Term 1)', amount: 35000, dueDate: '2026-07-31', paidAmount: 35000, lateFine: 0, status: 'paid', paidAt: '2026-08-01' },
      { id: 'inst_002_2', studentId: 'stu_002', installmentNumber: 2, title: 'Installment 2 (Term 2)', amount: 30000, dueDate: '2026-09-30', paidAmount: 0, lateFine: 0, status: 'unpaid' },
    ]
  },
  {
    id: 'sfp_003',
    studentId: 'stu_003',
    studentName: 'Rohan Verma',
    studentAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop',
    rollNumber: 'CSE2024003',
    email: 'rohan.verma@example.com',
    courseId: '11111111-1111-1111-1111-111111111111',
    courseName: 'Java Programming Complete Masterclass',
    className: 'Java Programming Masterclass',
    structureId: 'struct_java_2026',
    structureName: 'B.Tech CSE / Java Masterclass 2026',
    discountAmount: 0,
    customAdjustment: 0,
    netFee: 65000,
    paidFee: 0,
    dueFee: 65000,
    lateFineAccrued: 450,
    status: 'overdue',
    installments: [
      { id: 'inst_003_1', studentId: 'stu_003', installmentNumber: 1, title: 'Installment 1 (Term 1)', amount: 32500, dueDate: '2026-08-31', paidAmount: 0, lateFine: 450, status: 'overdue' },
      { id: 'inst_003_2', studentId: 'stu_003', installmentNumber: 2, title: 'Installment 2 (Term 2)', amount: 32500, dueDate: '2026-10-31', paidAmount: 0, lateFine: 0, status: 'unpaid' },
    ]
  },
  {
    id: 'sfp_004',
    studentId: 'stu_004',
    studentName: 'Sneha Patel',
    studentAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop',
    rollNumber: 'CSE2024004',
    email: 'sneha.patel@example.com',
    courseId: '11111111-1111-1111-1111-111111111111',
    courseName: 'Java Programming Complete Masterclass',
    className: 'Java Programming Masterclass',
    structureId: 'struct_java_2026',
    structureName: 'B.Tech CSE / Java Masterclass 2026',
    discountId: 'dsc_need',
    discountName: 'Financial Need Grant',
    discountAmount: 15000,
    customAdjustment: 0,
    netFee: 50000,
    paidFee: 25000,
    dueFee: 25000,
    lateFineAccrued: 0,
    status: 'partial',
    lastPaymentDate: '2026-08-10',
    installments: [
      { id: 'inst_004_1', studentId: 'stu_004', installmentNumber: 1, title: 'Installment 1', amount: 25000, dueDate: '2026-08-15', paidAmount: 25000, lateFine: 0, status: 'paid', paidAt: '2026-08-10' },
      { id: 'inst_004_2', studentId: 'stu_004', installmentNumber: 2, title: 'Installment 2', amount: 25000, dueDate: '2026-10-15', paidAmount: 0, lateFine: 0, status: 'unpaid' },
    ]
  },
  {
    id: 'sfp_007',
    studentId: 'stu_007',
    studentName: 'Kavya Nair',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c4?w=80&auto=format&fit=crop',
    rollNumber: 'SCI2024001',
    email: 'kavya.nair@example.com',
    courseId: '22222222-2222-2222-2222-222222222222',
    courseName: 'Physics Class 12 & JEE',
    className: 'Physics — Electromagnetism & Optics',
    structureId: 'struct_phy_2026',
    structureName: 'Physics Class 12 & JEE Advanced 2026',
    discountAmount: 0,
    customAdjustment: 0,
    netFee: 48000,
    paidFee: 48000,
    dueFee: 0,
    lateFineAccrued: 0,
    status: 'paid',
    lastPaymentDate: '2026-08-20',
    installments: [
      { id: 'inst_007_1', studentId: 'stu_007', installmentNumber: 1, title: 'Term 1 Fee', amount: 24000, dueDate: '2026-08-01', paidAmount: 24000, lateFine: 0, status: 'paid', paidAt: '2026-07-29' },
      { id: 'inst_007_2', studentId: 'stu_007', installmentNumber: 2, title: 'Term 2 Fee', amount: 24000, dueDate: '2026-09-15', paidAmount: 24000, lateFine: 0, status: 'paid', paidAt: '2026-08-20' },
    ]
  },
  {
    id: 'sfp_008',
    studentId: 'stu_008',
    studentName: 'Aditya Kumar',
    studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop',
    rollNumber: 'SCI2024002',
    email: 'aditya.kumar@example.com',
    courseId: '22222222-2222-2222-2222-222222222222',
    courseName: 'Physics Class 12 & JEE',
    className: 'Physics — Electromagnetism & Optics',
    structureId: 'struct_phy_2026',
    structureName: 'Physics Class 12 & JEE Advanced 2026',
    discountAmount: 0,
    customAdjustment: 0,
    netFee: 48000,
    paidFee: 0,
    dueFee: 48000,
    lateFineAccrued: 600,
    status: 'overdue',
    installments: [
      { id: 'inst_008_1', studentId: 'stu_008', installmentNumber: 1, title: 'Term 1 Fee', amount: 24000, dueDate: '2026-08-15', paidAmount: 0, lateFine: 600, status: 'overdue' },
      { id: 'inst_008_2', studentId: 'stu_008', installmentNumber: 2, title: 'Term 2 Fee', amount: 24000, dueDate: '2026-10-15', paidAmount: 0, lateFine: 0, status: 'unpaid' },
    ]
  }
]

let MOCK_PAYMENTS: FeePayment[] = [
  {
    id: 'pay_001',
    receiptNumber: 'REC-2026-01041',
    studentId: 'stu_001',
    studentName: 'Arjun Mehta',
    rollNumber: 'CSE2024001',
    courseName: 'Java Programming Complete Masterclass',
    installmentId: 'inst_001_1',
    installmentTitle: 'Installment 1 (50%)',
    amountPaid: 26000,
    paymentMode: 'upi',
    transactionRef: 'UPI-REF-9923841120',
    paymentDate: '2026-07-28 11:30:00',
    receivedBy: 'Admin Accounts',
    notes: 'Paid via GPay',
    status: 'verified'
  },
  {
    id: 'pay_002',
    receiptNumber: 'REC-2026-01290',
    studentId: 'stu_001',
    studentName: 'Arjun Mehta',
    rollNumber: 'CSE2024001',
    courseName: 'Java Programming Complete Masterclass',
    installmentId: 'inst_001_2',
    installmentTitle: 'Installment 2 (50%)',
    amountPaid: 26000,
    paymentMode: 'bank_transfer',
    transactionRef: 'NEFT-HDFC-9938101',
    paymentDate: '2026-08-15 14:20:00',
    receivedBy: 'Admin Accounts',
    notes: 'HDFC NetBanking Direct Credit',
    status: 'verified'
  },
  {
    id: 'pay_003',
    receiptNumber: 'REC-2026-01188',
    studentId: 'stu_002',
    studentName: 'Priya Sharma',
    rollNumber: 'CSE2024002',
    courseName: 'Java Programming Complete Masterclass',
    installmentId: 'inst_002_1',
    installmentTitle: 'Installment 1 (Term 1)',
    amountPaid: 35000,
    paymentMode: 'card',
    transactionRef: 'POS-TXN-77319022',
    paymentDate: '2026-08-01 10:15:00',
    receivedBy: 'Cashier Counter 2',
    notes: 'Debit card POS swipe',
    status: 'verified'
  },
  {
    id: 'pay_004',
    receiptNumber: 'REC-2026-01244',
    studentId: 'stu_004',
    studentName: 'Sneha Patel',
    rollNumber: 'CSE2024004',
    courseName: 'Java Programming Complete Masterclass',
    installmentId: 'inst_004_1',
    installmentTitle: 'Installment 1',
    amountPaid: 25000,
    paymentMode: 'cash',
    transactionRef: 'CASH-RCPT-0041',
    paymentDate: '2026-08-10 16:45:00',
    receivedBy: 'Accounts Bursar',
    notes: 'Offline cash collection verified',
    status: 'verified'
  },
  {
    id: 'pay_005',
    receiptNumber: 'REC-2026-01302',
    studentId: 'stu_007',
    studentName: 'Kavya Nair',
    rollNumber: 'SCI2024001',
    courseName: 'Physics Class 12 & JEE',
    installmentId: 'inst_007_1',
    installmentTitle: 'Term 1 Fee',
    amountPaid: 24000,
    paymentMode: 'upi',
    transactionRef: 'UPI-REF-339102837',
    paymentDate: '2026-07-29 09:10:00',
    receivedBy: 'Admin Accounts',
    notes: 'PhonePe QR code',
    status: 'verified'
  },
  {
    id: 'pay_006',
    receiptNumber: 'REC-2026-01355',
    studentId: 'stu_007',
    studentName: 'Kavya Nair',
    rollNumber: 'SCI2024001',
    courseName: 'Physics Class 12 & JEE',
    installmentId: 'inst_007_2',
    installmentTitle: 'Term 2 Fee',
    amountPaid: 24000,
    paymentMode: 'bank_transfer',
    transactionRef: 'IMPS-ICICI-001928',
    paymentDate: '2026-08-20 12:00:00',
    receivedBy: 'Admin Accounts',
    notes: 'IMPS bank transfer',
    status: 'verified'
  }
]

let MOCK_NOTIFICATIONS: FeeNotificationLog[] = [
  {
    id: 'notif_1',
    studentId: 'stu_003',
    studentName: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    type: 'overdue_alert',
    amountDue: 32950,
    dueDate: '2026-08-31',
    channel: 'email',
    sentAt: '2026-09-02 10:00:00'
  },
  {
    id: 'notif_2',
    studentId: 'stu_008',
    studentName: 'Aditya Kumar',
    email: 'aditya.kumar@example.com',
    type: 'overdue_alert',
    amountDue: 24600,
    dueDate: '2026-08-15',
    channel: 'sms',
    sentAt: '2026-09-01 11:30:00'
  },
  {
    id: 'notif_3',
    studentId: 'stu_002',
    studentName: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    type: 'due_reminder',
    amountDue: 30000,
    dueDate: '2026-09-30',
    channel: 'in_app',
    sentAt: '2026-09-10 09:00:00'
  }
]

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

  const monthlyCollection = [
    { month: 'Jun 2026', collected: 25000, due: 60000 },
    { month: 'Jul 2026', collected: 50000, due: 55000 },
    { month: 'Aug 2026', collected: 111000, due: 95000 },
    { month: 'Sep 2026', collected: totalCollected - 186000 > 0 ? totalCollected - 186000 : 35000, due: totalDues }
  ]

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
