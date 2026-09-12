// Fee Management System — Type Definitions

export type FeePaymentStatus = 'paid' | 'partial' | 'unpaid' | 'overdue'
export type TransactionStatus = 'verified' | 'pending' | 'refunded' | 'cancelled'
export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque'
export type BillingFrequency = 'annual' | 'semester' | 'quarterly' | 'monthly' | 'one_time'
export type DiscountType = 'percentage' | 'fixed_amount'

export interface FeeCategory {
  id: string
  name: string
  code: string
  description?: string
  isRefundable?: boolean
}

export interface FeeStructureItem {
  id: string
  categoryId: string
  categoryName: string
  amount: number
  isOptional?: boolean
}

export interface FeeStructure {
  id: string
  name: string
  courseId: string
  courseName: string
  batchYear: string
  frequency: BillingFrequency
  totalAmount: number
  dueDate: string // YYYY-MM-DD
  gracePeriodDays: number
  lateFinePerDay: number
  maxLateFine: number
  items: FeeStructureItem[]
  isActive: boolean
  createdAt: string
}

export interface FeeDiscount {
  id: string
  name: string
  discountType: DiscountType
  value: number // percentage (e.g. 20) or fixed amount (e.g. 10000)
  description?: string
  isActive: boolean
}

export interface FeeInstallment {
  id: string
  studentId: string
  installmentNumber: number
  title: string
  amount: number
  dueDate: string
  paidAmount: number
  lateFine: number
  status: FeePaymentStatus
  paidAt?: string
}

export interface StudentFeeProfile {
  id: string
  studentId: string
  studentName: string
  studentAvatar?: string
  rollNumber: string
  email: string
  courseId: string
  courseName: string
  className?: string
  structureId: string
  structureName: string
  discountId?: string
  discountName?: string
  discountAmount: number
  customAdjustment: number
  netFee: number
  paidFee: number
  dueFee: number
  lateFineAccrued: number
  status: FeePaymentStatus
  lastPaymentDate?: string
  installments: FeeInstallment[]
}

export interface FeePayment {
  id: string
  receiptNumber: string
  studentId: string
  studentName: string
  rollNumber: string
  courseName: string
  installmentId?: string
  installmentTitle?: string
  amountPaid: number
  paymentMode: PaymentMode
  transactionRef?: string
  paymentDate: string
  receivedBy: string
  notes?: string
  status: TransactionStatus
}

export interface FeeFinancialSummary {
  totalStudentsBilled: number
  totalRevenueExpected: number
  totalRevenueCollected: number
  totalOutstandingDues: number
  totalFinesAccrued: number
  overdueDefaultersCount: number
  collectionEfficiency: number // percentage
  paymentModeDistribution: {
    mode: PaymentMode
    totalAmount: number
    count: number
  }[]
  monthlyCollection: {
    month: string
    collected: number
    due: number
  }[]
  courseCollection: {
    courseId: string
    courseName: string
    enrolledCount: number
    demanded: number
    collected: number
    pending: number
    recoveryRate: number
  }[]
}

export interface FeeNotificationLog {
  id: string
  studentId: string
  studentName: string
  email: string
  type: 'due_reminder' | 'payment_confirmation' | 'overdue_alert' | 'installment_reminder'
  amountDue: number
  dueDate: string
  channel: 'email' | 'sms' | 'in_app'
  sentAt: string
}
