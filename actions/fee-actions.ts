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
  DEFAULT_RECEIPT_SETTINGS,
  FeeStructureItem,
  BillingFrequency,
  DiscountType
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
 * - Loads persisted fee profiles and installments directly from Supabase.
 * - New students have fee profiles automatically initialized and synced.
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
      // 1. Ensure master fee structures & discounts are loaded from Supabase
      const [structures, discounts, directoryStudents] = await Promise.all([
        getFeeStructures(),
        getFeeDiscounts(),
        getDirectoryStudents()
      ])

      const supabase = createAdminClient()

      // 2. Fetch courses for course title mapping
      const { data: dbCourses } = await supabase.from('courses').select('id, title')
      const courseMap = new Map<string, string>()
      if (dbCourses) {
        dbCourses.forEach(c => courseMap.set(c.id, c.title))
      }

      // 3. Fetch saved student fee profiles from Supabase
      const { data: dbProfiles, error: profError } = await supabase
        .from('student_fee_profiles')
        .select(`
          *,
          fee_structures (
            id,
            name,
            course_id,
            batch_year,
            frequency,
            total_amount,
            due_date,
            grace_period_days,
            late_fine_per_day,
            max_late_fine,
            is_active
          ),
          fee_discounts (
            id,
            name,
            discount_type,
            value
          )
        `)

      if (profError) {
        console.warn('Error fetching student_fee_profiles from Supabase:', profError)
      }

      // 4. Fetch fee installments from Supabase
      const { data: dbInstallments } = await supabase
        .from('fee_installments')
        .select('*')
        .order('installment_number', { ascending: true })

      const installmentsMap = new Map<string, any[]>()
      if (dbInstallments) {
        dbInstallments.forEach(inst => {
          const list = installmentsMap.get(inst.student_id) || []
          list.push(inst)
          installmentsMap.set(inst.student_id, list)
        })
      }

      const dbProfileMap = new Map<string, any>()
      if (dbProfiles) {
        dbProfiles.forEach(p => {
          if (p.student_id) {
            dbProfileMap.set(p.student_id, p)
          }
        })
      }

      let newlyDetectedCount = 0
      const profileMap = new Map<string, StudentFeeProfile>()

      // Match each student from directory
      for (const student of directoryStudents) {
        const displayName = student.full_name || student.email.split('@')[0]
        const rollNumber = `GVM-2026-${student.id.replace(/-/g, '').slice(-4).toUpperCase()}`
        const savedDbProfile = dbProfileMap.get(student.id)

        if (savedDbProfile) {
          // Student fee profile already exists in Supabase!
          const struct = savedDbProfile.fee_structures
          const discount = savedDbProfile.fee_discounts

          const structId = savedDbProfile.structure_id || ''
          const structName = struct?.name || 'No Fee Structure Assigned'
          const courseId = struct?.course_id || ''
          const courseName = courseMap.get(courseId) || (struct ? struct.name : 'General Curriculum')

          const netFee = Number(savedDbProfile.net_fee) || 0
          const paidFee = Number(savedDbProfile.paid_fee) || 0
          const dueFee = Number(savedDbProfile.due_fee) || 0
          const lateFineAccrued = Number(savedDbProfile.late_fine_accrued) || 0
          const customAdjustment = Number(savedDbProfile.custom_adjustment) || 0

          let discountAmount = 0
          if (discount && struct) {
            discountAmount = discount.discount_type === 'percentage'
              ? Math.round((Number(struct.total_amount) * Number(discount.value)) / 100)
              : Number(discount.value) || 0
          }

          // Fetch or generate installments
          const studentDbInsts = installmentsMap.get(student.id) || []
          let installments: FeeInstallment[] = []

          if (studentDbInsts.length > 0) {
            installments = studentDbInsts.map(i => ({
              id: i.id,
              studentId: student.id,
              installmentNumber: i.installment_number,
              title: `Term ${i.installment_number} Installment`,
              amount: Number(i.amount) || 0,
              dueDate: i.due_date,
              paidAmount: Number(i.paid_amount) || 0,
              lateFine: Number(i.late_fine) || 0,
              status: (i.status as FeePaymentStatus) || 'unpaid',
              paidAt: i.paid_at || undefined
            }))
          } else if (netFee > 0 && struct) {
            const inst1Amount = Math.ceil(netFee / 2)
            const inst2Amount = netFee - inst1Amount
            const instsToInsert = [
              {
                student_id: student.id,
                installment_number: 1,
                amount: inst1Amount,
                due_date: struct.due_date || new Date().toISOString().split('T')[0],
                paid_amount: Math.min(paidFee, inst1Amount),
                late_fine: 0,
                status: paidFee >= inst1Amount ? 'paid' : paidFee > 0 ? 'partial' : 'unpaid'
              },
              {
                student_id: student.id,
                installment_number: 2,
                amount: inst2Amount,
                due_date: '2026-12-15',
                paid_amount: Math.max(0, paidFee - inst1Amount),
                late_fine: 0,
                status: paidFee >= netFee ? 'paid' : (paidFee - inst1Amount) > 0 ? 'partial' : 'unpaid'
              }
            ]

            // Persist newly generated installments to Supabase
            supabase.from('fee_installments').insert(instsToInsert).select().then(() => {})

            installments = instsToInsert.map((i, idx) => ({
              id: `inst_${student.id}_${idx + 1}`,
              studentId: student.id,
              installmentNumber: i.installment_number,
              title: `Term ${i.installment_number} Installment`,
              amount: i.amount,
              dueDate: i.due_date,
              paidAmount: i.paid_amount,
              lateFine: 0,
              status: i.status as FeePaymentStatus
            }))
          }

          const profile: StudentFeeProfile = {
            id: savedDbProfile.id || `sfp_${student.id}`,
            studentId: student.id,
            studentName: displayName,
            studentAvatar: student.avatar_url || undefined,
            rollNumber,
            email: student.email,
            courseId,
            courseName,
            className: 'Class of 2026',
            structureId: structId,
            structureName: structName,
            discountId: savedDbProfile.discount_id || undefined,
            discountName: discount?.name || undefined,
            discountAmount,
            customAdjustment,
            netFee,
            paidFee,
            dueFee,
            lateFineAccrued,
            status: savedDbProfile.status as FeePaymentStatus,
            lastPaymentDate: savedDbProfile.last_payment_date ? savedDbProfile.last_payment_date.split('T')[0] : undefined,
            installments,
            isAutoDetected: true,
            syncedAt: savedDbProfile.updated_at || new Date().toISOString()
          }

          profileMap.set(student.id, profile)
        } else {
          // Auto-detect newly registered student not in student_fee_profiles yet
          newlyDetectedCount++

          // Determine course association: check enrollment or alternate across structures
          const enrollments = dataStore.getStudentEnrollments(student.id)
          const enrolledCourse = enrollments.length > 0 ? enrollments[0] : null

          let matchedStructure = structures.find(
            s => enrolledCourse && (s.courseId === enrolledCourse.id || (s.courseIds && s.courseIds.includes(enrolledCourse.id)))
          )
          if (!matchedStructure && structures.length > 0) {
            matchedStructure = structures[0]
          }

          const baseFee = matchedStructure ? matchedStructure.totalAmount : 0
          const netFee = baseFee
          const dueFee = baseFee
          const status: FeePaymentStatus = dueFee > 0 ? 'unpaid' : 'paid'

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

          const courseId = matchedStructure ? matchedStructure.courseId : (enrolledCourse ? enrolledCourse.id : '')
          const courseName = enrolledCourse ? enrolledCourse.title : (matchedStructure ? matchedStructure.courseName : (courseMap.get(courseId) || 'General Curriculum'))

          const newProfile: StudentFeeProfile = {
            id: `sfp_${student.id}`,
            studentId: student.id,
            studentName: displayName,
            studentAvatar: student.avatar_url || undefined,
            rollNumber,
            email: student.email,
            courseId,
            courseName,
            className: 'Class of 2026',
            structureId: matchedStructure ? matchedStructure.id : '',
            structureName: matchedStructure ? matchedStructure.name : 'No Fee Structure Assigned',
            discountAmount: 0,
            customAdjustment: 0,
            netFee,
            paidFee: 0,
            dueFee,
            lateFineAccrued: 0,
            status,
            installments,
            isAutoDetected: true,
            syncedAt: new Date().toISOString()
          }

          // Auto-persist new profile into Supabase if a structure is matched
          if (matchedStructure) {
            supabase.from('student_fee_profiles').upsert({
              student_id: student.id,
              structure_id: matchedStructure.id,
              custom_adjustment: 0,
              net_fee: netFee,
              paid_fee: 0,
              due_fee: dueFee,
              late_fine_accrued: 0,
              status,
              updated_at: new Date().toISOString()
            }, { onConflict: 'student_id' }).then(() => {})
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

// ============================================================
// SERVER ACTIONS: CATEGORIES & STRUCTURES (SUPABASE PERSISTED)
// ============================================================

export async function getFeeCategories(): Promise<FeeCategory[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('fee_categories')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data && data.length > 0) {
      MOCK_CATEGORIES = data.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        description: c.description || undefined,
        isRefundable: c.is_refundable ?? false
      }))
      return [...MOCK_CATEGORIES]
    }
  } catch (err) {
    console.warn('Supabase getFeeCategories error, falling back:', err)
  }
  return [...MOCK_CATEGORIES]
}

export async function createFeeCategory(category: Omit<FeeCategory, 'id'>): Promise<FeeCategory> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('fee_categories')
      .insert({
        name: category.name,
        code: category.code,
        description: category.description || null,
        is_refundable: category.isRefundable ?? false
      })
      .select()
      .single()

    if (!error && data) {
      const newCat: FeeCategory = {
        id: data.id,
        name: data.name,
        code: data.code,
        description: data.description || undefined,
        isRefundable: data.is_refundable ?? false
      }
      MOCK_CATEGORIES = [...MOCK_CATEGORIES.filter(c => c.id !== newCat.id), newCat]
      revalidatePath('/admin/fees')
      return newCat
    }
  } catch (err) {
    console.warn('Supabase createFeeCategory error, fallback to memory:', err)
  }

  const fallbackCat: FeeCategory = {
    ...category,
    id: `cat_${Date.now()}`
  }
  MOCK_CATEGORIES.push(fallbackCat)
  revalidatePath('/admin/fees')
  return fallbackCat
}

export async function getFeeStructures(): Promise<FeeStructure[]> {
  try {
    const supabase = createAdminClient()

    // 1. Fetch fee structures with itemized categories joined
    const { data: dbStructures, error: structError } = await supabase
      .from('fee_structures')
      .select(`
        *,
        fee_structure_items (
          id,
          amount,
          is_optional,
          category_id,
          fee_categories (
            id,
            name,
            code
          )
        )
      `)
      .order('created_at', { ascending: false })

    // 2. Fetch courses to resolve course names
    const { data: dbCourses } = await supabase.from('courses').select('id, title')
    const courseMap = new Map<string, string>()
    if (dbCourses) {
      dbCourses.forEach(c => courseMap.set(c.id, c.title))
    }

    if (!structError && dbStructures && dbStructures.length > 0) {
      MOCK_STRUCTURES = dbStructures.map((s: any) => {
        const items: FeeStructureItem[] = (s.fee_structure_items || []).map((item: any) => ({
          id: item.id,
          categoryId: item.category_id,
          categoryName: item.fee_categories?.name || 'General Fee',
          amount: Number(item.amount) || 0,
          isOptional: item.is_optional ?? false
        }))

        const resolvedCourseName = courseMap.get(s.course_id) || s.course_id || 'General Curriculum'

        return {
          id: s.id,
          name: s.name,
          courseId: s.course_id,
          courseName: resolvedCourseName,
          courseIds: [s.course_id],
          courseNames: [resolvedCourseName],
          batchYear: s.batch_year,
          frequency: (s.frequency as BillingFrequency) || 'semester',
          totalAmount: Number(s.total_amount) || 0,
          dueDate: s.due_date,
          gracePeriodDays: Number(s.grace_period_days) ?? 7,
          lateFinePerDay: Number(s.late_fine_per_day) ?? 50,
          maxLateFine: Number(s.max_late_fine) ?? 1500,
          items,
          isActive: s.is_active ?? true,
          createdAt: s.created_at ? s.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
        }
      })
      return [...MOCK_STRUCTURES]
    }
  } catch (err) {
    console.warn('Supabase getFeeStructures error, falling back:', err)
  }

  return [...MOCK_STRUCTURES]
}

export async function createFeeStructure(structure: Omit<FeeStructure, 'id' | 'createdAt'>): Promise<FeeStructure> {
  try {
    const supabase = createAdminClient()

    // 1. Insert fee structure record into Supabase
    const { data: dbStruct, error: structErr } = await supabase
      .from('fee_structures')
      .insert({
        name: structure.name,
        course_id: (structure.courseId || '').slice(0, 50),
        batch_year: structure.batchYear,
        frequency: structure.frequency,
        total_amount: structure.totalAmount,
        due_date: structure.dueDate || new Date().toISOString().split('T')[0],
        grace_period_days: structure.gracePeriodDays ?? 7,
        late_fine_per_day: structure.lateFinePerDay ?? 50,
        max_late_fine: structure.maxLateFine ?? 1500,
        is_active: structure.isActive ?? true
      })
      .select()
      .single()

    if (structErr || !dbStruct) {
      console.error('Failed to create fee_structures row in Supabase:', structErr)
      throw new Error(structErr?.message || 'Database error creating fee structure')
    }

    // 2. Fetch categories to link/resolve category UUIDs for items
    const { data: existingCats } = await supabase.from('fee_categories').select('*')
    const cats = existingCats || []

    const insertedItems: FeeStructureItem[] = []
    if (structure.items && structure.items.length > 0) {
      for (const item of structure.items) {
        let matchedCat = cats.find(c => c.id === item.categoryId || c.name.toLowerCase() === item.categoryName.toLowerCase())
        if (!matchedCat && cats.length > 0) {
          // If category not found, create it in fee_categories to satisfy foreign key
          const { data: newCat } = await supabase
            .from('fee_categories')
            .insert({
              name: item.categoryName || 'General Fee',
              code: (item.categoryName || 'GEN').substring(0, 4).toUpperCase(),
              description: item.categoryName,
              is_refundable: false
            })
            .select()
            .single()
          if (newCat) {
            matchedCat = newCat
            cats.push(newCat)
          } else {
            matchedCat = cats[0]
          }
        }

        const validCatId = matchedCat?.id || cats[0]?.id
        if (validCatId) {
          const { data: insertedItem, error: itemErr } = await supabase
            .from('fee_structure_items')
            .insert({
              structure_id: dbStruct.id,
              category_id: validCatId,
              amount: item.amount,
              is_optional: item.isOptional ?? false
            })
            .select()
            .single()

          if (!itemErr && insertedItem) {
            insertedItems.push({
              id: insertedItem.id,
              categoryId: validCatId,
              categoryName: matchedCat?.name || item.categoryName,
              amount: Number(insertedItem.amount) || item.amount,
              isOptional: insertedItem.is_optional ?? false
            })
          }
        }
      }
    }

    const newStructure: FeeStructure = {
      id: dbStruct.id,
      name: dbStruct.name,
      courseId: dbStruct.course_id,
      courseName: structure.courseName,
      courseIds: structure.courseIds || [dbStruct.course_id],
      courseNames: structure.courseNames || [structure.courseName],
      batchYear: dbStruct.batch_year,
      frequency: (dbStruct.frequency as BillingFrequency) || structure.frequency,
      totalAmount: Number(dbStruct.total_amount) || structure.totalAmount,
      dueDate: dbStruct.due_date,
      gracePeriodDays: Number(dbStruct.grace_period_days),
      lateFinePerDay: Number(dbStruct.late_fine_per_day),
      maxLateFine: Number(dbStruct.max_late_fine),
      items: insertedItems.length > 0 ? insertedItems : structure.items,
      isActive: dbStruct.is_active ?? true,
      createdAt: dbStruct.created_at ? dbStruct.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
    }

    MOCK_STRUCTURES = [newStructure, ...MOCK_STRUCTURES.filter(s => s.id !== newStructure.id)]
    revalidatePath('/admin/fees')
    revalidatePath('/student/fees')
    return newStructure
  } catch (err: any) {
    console.error('createFeeStructure Supabase error:', err)
    throw new Error(err.message || 'Failed to create fee structure in database')
  }
}

export async function updateFeeStructure(id: string, updates: Partial<FeeStructure>): Promise<FeeStructure | null> {
  try {
    const supabase = createAdminClient()

    const dbUpdates: Record<string, any> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.courseId !== undefined) dbUpdates.course_id = updates.courseId.slice(0, 50)
    if (updates.batchYear !== undefined) dbUpdates.batch_year = updates.batchYear
    if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
    if (updates.gracePeriodDays !== undefined) dbUpdates.grace_period_days = updates.gracePeriodDays
    if (updates.lateFinePerDay !== undefined) dbUpdates.late_fine_per_day = updates.lateFinePerDay
    if (updates.maxLateFine !== undefined) dbUpdates.max_late_fine = updates.maxLateFine
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('fee_structures').update(dbUpdates).eq('id', id)
    }

    if (updates.items && updates.items.length > 0) {
      await supabase.from('fee_structure_items').delete().eq('structure_id', id)
      const { data: existingCats } = await supabase.from('fee_categories').select('*')
      const cats = existingCats || []

      for (const item of updates.items) {
        let matchedCat = cats.find(c => c.id === item.categoryId || c.name.toLowerCase() === item.categoryName.toLowerCase())
        if (!matchedCat && cats.length > 0) {
          const { data: newCat } = await supabase
            .from('fee_categories')
            .insert({
              name: item.categoryName || 'General Fee',
              code: (item.categoryName || 'GEN').substring(0, 4).toUpperCase(),
              description: item.categoryName,
              is_refundable: false
            })
            .select()
            .single()
          if (newCat) {
            matchedCat = newCat
            cats.push(newCat)
          } else {
            matchedCat = cats[0]
          }
        }
        const validCatId = matchedCat?.id || cats[0]?.id
        if (validCatId) {
          await supabase.from('fee_structure_items').insert({
            structure_id: id,
            category_id: validCatId,
            amount: item.amount,
            is_optional: item.isOptional ?? false
          })
        }
      }
    }

    const index = MOCK_STRUCTURES.findIndex(s => s.id === id)
    if (index !== -1) {
      MOCK_STRUCTURES[index] = { ...MOCK_STRUCTURES[index], ...updates }
    }
    revalidatePath('/admin/fees')
    revalidatePath('/student/fees')
    return MOCK_STRUCTURES[index] || null
  } catch (err) {
    console.error('updateFeeStructure Supabase error:', err)
    return null
  }
}

export async function deleteFeeStructure(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    await supabase.from('fee_structure_items').delete().eq('structure_id', id)
    const { error } = await supabase.from('fee_structures').delete().eq('id', id)
    if (!error) {
      MOCK_STRUCTURES = MOCK_STRUCTURES.filter(s => s.id !== id)
      revalidatePath('/admin/fees')
      revalidatePath('/student/fees')
      return true
    }
  } catch (err) {
    console.error('deleteFeeStructure Supabase error:', err)
  }
  const before = MOCK_STRUCTURES.length
  MOCK_STRUCTURES = MOCK_STRUCTURES.filter(s => s.id !== id)
  revalidatePath('/admin/fees')
  revalidatePath('/student/fees')
  return MOCK_STRUCTURES.length < before
}

export async function getFeeDiscounts(): Promise<FeeDiscount[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('fee_discounts')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data && data.length > 0) {
      MOCK_DISCOUNTS = data.map(d => ({
        id: d.id,
        name: d.name,
        discountType: (d.discount_type as DiscountType) || 'percentage',
        value: Number(d.value) || 0,
        description: d.description || undefined,
        isActive: d.is_active ?? true
      }))
      return [...MOCK_DISCOUNTS]
    }
  } catch (err) {
    console.warn('Supabase getFeeDiscounts error, falling back:', err)
  }
  return [...MOCK_DISCOUNTS]
}

export async function createFeeDiscount(discount: Omit<FeeDiscount, 'id'>): Promise<FeeDiscount> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('fee_discounts')
      .insert({
        name: discount.name,
        discount_type: discount.discountType,
        value: discount.value,
        description: discount.description || null,
        is_active: discount.isActive ?? true
      })
      .select()
      .single()

    if (!error && data) {
      const newDsc: FeeDiscount = {
        id: data.id,
        name: data.name,
        discountType: data.discount_type as DiscountType,
        value: Number(data.value),
        description: data.description || undefined,
        isActive: data.is_active ?? true
      }
      MOCK_DISCOUNTS = [...MOCK_DISCOUNTS.filter(d => d.id !== newDsc.id), newDsc]
      revalidatePath('/admin/fees')
      return newDsc
    }
  } catch (err) {
    console.warn('Supabase createFeeDiscount error:', err)
  }

  const fallbackDsc: FeeDiscount = {
    ...discount,
    id: `dsc_${Date.now()}`
  }
  MOCK_DISCOUNTS.push(fallbackDsc)
  revalidatePath('/admin/fees')
  return fallbackDsc
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
  const supabase = createAdminClient()
  const newProfile: StudentFeeProfile = {
    ...profile,
    id: `sfp_${Date.now()}`,
    isAutoDetected: true,
    syncedAt: new Date().toISOString()
  }

  try {
    if (profile.structureId) {
      await supabase.from('student_fee_profiles').upsert({
        student_id: profile.studentId,
        structure_id: profile.structureId,
        discount_id: profile.discountId || null,
        custom_adjustment: profile.customAdjustment || 0,
        net_fee: profile.netFee,
        paid_fee: profile.paidFee,
        due_fee: profile.dueFee,
        late_fine_accrued: profile.lateFineAccrued,
        status: profile.status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_id' })
    }
  } catch (err) {
    console.warn('Supabase createStudentFeeProfile error:', err)
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
  const supabase = createAdminClient()

  // 1. Ensure master fee structures are available
  if (MOCK_STRUCTURES.length === 0) {
    await getFeeStructures()
  }

  let structure = MOCK_STRUCTURES.find(s => s.id === params.structureId)
  if (!structure) {
    const { data: dbStruct } = await supabase.from('fee_structures').select('*').eq('id', params.structureId).single()
    if (dbStruct) {
      structure = {
        id: dbStruct.id,
        name: dbStruct.name,
        courseId: dbStruct.course_id,
        courseName: params.courseName || 'General Curriculum',
        batchYear: dbStruct.batch_year,
        frequency: dbStruct.frequency,
        totalAmount: Number(dbStruct.total_amount) || 0,
        dueDate: dbStruct.due_date,
        gracePeriodDays: Number(dbStruct.grace_period_days) || 7,
        lateFinePerDay: Number(dbStruct.late_fine_per_day) || 50,
        maxLateFine: Number(dbStruct.max_late_fine) || 1500,
        items: [],
        isActive: dbStruct.is_active ?? true,
        createdAt: dbStruct.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      }
    }
  }

  if (!structure) {
    throw new Error('Selected fee structure does not exist')
  }

  // 2. Ensure discounts are available if requested
  if (params.discountId && params.discountId !== 'none' && MOCK_DISCOUNTS.length === 0) {
    await getFeeDiscounts()
  }

  let discountAmount = 0
  let discountName: string | undefined = undefined
  if (params.discountId && params.discountId !== 'none') {
    const discount = MOCK_DISCOUNTS.find(d => d.id === params.discountId)
    if (discount) {
      discountName = discount.name
      discountAmount = discount.discountType === 'percentage'
        ? Math.round((Number(structure.totalAmount) * Number(discount.value)) / 100)
        : Number(discount.value) || 0
    }
  }

  // 3. Find current profile for this student
  let profile = MOCK_STUDENT_PROFILES.find(p => p.studentId === params.studentId)
  if (!profile) {
    const syncRes = await syncStudentsFromDirectory()
    profile = syncRes.profiles.find(p => p.studentId === params.studentId)
  }

  const paidFee = profile?.paidFee || 0
  const lateFineAccrued = profile?.lateFineAccrued || 0
  const customAdjustment = Number(params.customAdjustment || 0)
  const netFee = Math.max(0, structure.totalAmount - discountAmount + customAdjustment)
  const remainingDue = Math.max(0, netFee + lateFineAccrued - paidFee)
  const status: FeePaymentStatus = remainingDue === 0 ? 'paid' : (paidFee > 0 ? 'partial' : 'unpaid')

  // 4. Upsert student fee profile into Supabase
  const { error: profileUpsertError } = await supabase.from('student_fee_profiles').upsert({
    student_id: params.studentId,
    structure_id: structure.id,
    discount_id: params.discountId && params.discountId !== 'none' ? params.discountId : null,
    custom_adjustment: customAdjustment,
    net_fee: netFee,
    paid_fee: paidFee,
    due_fee: remainingDue,
    late_fine_accrued: lateFineAccrued,
    status: status,
    updated_at: new Date().toISOString()
  }, { onConflict: 'student_id' })

  if (profileUpsertError) {
    console.error('Supabase assignFeeStructureToStudent error:', profileUpsertError)
    throw new Error(`Database error saving student fee structure: ${profileUpsertError.message}`)
  }

  // 5. Replace installments in fee_installments table
  await supabase.from('fee_installments').delete().eq('student_id', params.studentId)

  const inst1Amount = Math.ceil(netFee / 2)
  const inst2Amount = netFee - inst1Amount

  const installmentsToInsert = [
    {
      student_id: params.studentId,
      installment_number: 1,
      amount: inst1Amount,
      due_date: structure.dueDate || new Date().toISOString().split('T')[0],
      paid_amount: Math.min(paidFee, inst1Amount),
      late_fine: 0,
      status: paidFee >= inst1Amount ? 'paid' : paidFee > 0 ? 'partial' : 'unpaid'
    },
    {
      student_id: params.studentId,
      installment_number: 2,
      amount: inst2Amount,
      due_date: '2026-12-15',
      paid_amount: Math.max(0, paidFee - inst1Amount),
      late_fine: 0,
      status: paidFee >= netFee ? 'paid' : (paidFee - inst1Amount) > 0 ? 'partial' : 'unpaid'
    }
  ]

  const { data: dbInsts } = await supabase
    .from('fee_installments')
    .insert(installmentsToInsert)
    .select()

  const installments: FeeInstallment[] = (dbInsts || installmentsToInsert).map((i: any, idx: number) => ({
    id: i.id || `inst_${params.studentId}_${idx + 1}`,
    studentId: params.studentId,
    installmentNumber: i.installment_number,
    title: `Term ${i.installment_number} Installment`,
    amount: Number(i.amount) || 0,
    dueDate: i.due_date,
    paidAmount: Number(i.paid_amount) || 0,
    lateFine: Number(i.late_fine) || 0,
    status: (i.status as FeePaymentStatus) || 'unpaid',
    paidAt: i.paid_at || undefined
  }))

  const courseId = params.courseId || structure.courseId
  const courseName = params.courseName || structure.courseName

  const updated: StudentFeeProfile = {
    id: profile?.id || `sfp_${params.studentId}`,
    studentId: params.studentId,
    studentName: profile?.studentName || 'Student',
    studentAvatar: profile?.studentAvatar,
    rollNumber: profile?.rollNumber || `GVM-2026-${params.studentId.replace(/-/g, '').slice(-4).toUpperCase()}`,
    email: profile?.email || '',
    structureId: structure.id,
    structureName: structure.name,
    courseId,
    courseName,
    className: profile?.className || 'Class of 2026',
    discountId: params.discountId === 'none' ? undefined : params.discountId,
    discountName,
    discountAmount,
    customAdjustment,
    netFee,
    paidFee,
    dueFee: remainingDue,
    lateFineAccrued,
    status,
    installments,
    isAutoDetected: true,
    syncedAt: new Date().toISOString()
  }

  const existingIdx = MOCK_STUDENT_PROFILES.findIndex(p => p.studentId === params.studentId)
  if (existingIdx !== -1) {
    MOCK_STUDENT_PROFILES[existingIdx] = updated
  } else {
    MOCK_STUDENT_PROFILES.push(updated)
  }

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

  // Persist to Supabase fee_payments & update student_fee_profiles
  try {
    const supabase = createAdminClient()
    const { data: dbPayment } = await supabase.from('fee_payments').insert({
      receipt_number: receiptNum,
      student_id: profile.studentId,
      installment_id: params.installmentId || null,
      amount_paid: params.amount,
      payment_mode: params.paymentMode,
      transaction_ref: newPayment.transactionRef,
      received_by: newPayment.receivedBy,
      notes: params.notes || null,
      status: 'verified'
    }).select().single()

    if (dbPayment) {
      newPayment.id = dbPayment.id
    }

    await supabase.from('student_fee_profiles').upsert({
      student_id: profile.studentId,
      structure_id: profile.structureId,
      discount_id: profile.discountId || null,
      custom_adjustment: profile.customAdjustment || 0,
      net_fee: profile.netFee,
      paid_fee: profile.paidFee + params.amount,
      due_fee: Math.max(0, profile.netFee + profile.lateFineAccrued - (profile.paidFee + params.amount)),
      late_fine_accrued: profile.lateFineAccrued,
      last_payment_date: newPayment.paymentDate.split(' ')[0],
      status: Math.max(0, profile.netFee + profile.lateFineAccrued - (profile.paidFee + params.amount)) === 0 ? 'paid' : 'partial'
    }, { onConflict: 'student_id' })
  } catch (err) {
    console.warn('Supabase recordFeePayment error:', err)
  }

  MOCK_PAYMENTS.unshift(newPayment)

  // Update profile totals in memory
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
  try {
    const supabase = createAdminClient()
    let query = supabase.from('fee_payments').select('*').order('created_at', { ascending: false })
    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.paymentMode) {
      query = query.eq('payment_mode', filters.paymentMode)
    }
    const { data, error } = await query
    if (!error && data && data.length > 0) {
      const studentMap = new Map<string, { name: string; rollNumber: string; courseName: string }>()
      for (const p of MOCK_STUDENT_PROFILES) {
        studentMap.set(p.studentId, { name: p.studentName, rollNumber: p.rollNumber, courseName: p.courseName })
      }

      MOCK_PAYMENTS = data.map((pay: any) => {
        const studentInfo = studentMap.get(pay.student_id)
        return {
          id: pay.id,
          receiptNumber: pay.receipt_number,
          studentId: pay.student_id,
          studentName: studentInfo?.name || 'Student',
          rollNumber: studentInfo?.rollNumber || 'GVM-2026',
          courseName: studentInfo?.courseName || 'General Curriculum',
          installmentId: pay.installment_id || undefined,
          amountPaid: Number(pay.amount_paid) || 0,
          paymentMode: (pay.payment_mode as PaymentMode) || 'cash',
          transactionRef: pay.transaction_ref || undefined,
          paymentDate: pay.payment_date ? pay.payment_date.replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19),
          receivedBy: pay.received_by || 'Admin Accounts',
          notes: pay.notes || undefined,
          status: (pay.status as TransactionStatus) || 'verified'
        }
      })
    }
  } catch (err) {
    console.warn('Supabase getFeePayments error:', err)
  }

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
