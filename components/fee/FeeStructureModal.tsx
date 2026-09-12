'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { FeeStructure, FeeCategory, BillingFrequency } from '@/types/fee'
import { createFeeStructure, updateFeeStructure, createFeeCategory } from '@/actions/fee-actions'
import {
  Plus,
  Trash2,
  X,
  Check,
  Loader2,
  Layers,
  AlertCircle,
  Sparkles,
  Calendar,
  Clock,
  Calculator,
  ShieldCheck,
  Tag,
  Zap,
  RefreshCw,
  Info,
  Sliders,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Percent,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'

interface CourseOption {
  id: string
  title: string
  category?: string
  price?: number
}

interface FeeStructureModalProps {
  isOpen: boolean
  onClose: () => void
  categories: FeeCategory[]
  editingStructure?: FeeStructure | null
  onSuccess: (structure: FeeStructure) => void
  courses?: CourseOption[]
  onCategoriesUpdated?: (categories: FeeCategory[]) => void
}

const DEFAULT_COURSES: CourseOption[] = [
  { id: 'crs_java_master', title: 'Java Programming Masterclass', category: 'Certification', price: 35000 },
  { id: 'crs_btech_cs', title: 'B.Tech Computer Science & Engineering', category: 'Degree', price: 95000 },
  { id: 'crs_mca', title: 'Master of Computer Applications (MCA)', category: 'Postgraduate', price: 75000 },
  { id: 'crs_bca', title: 'Bachelor of Computer Applications (BCA)', category: 'Degree', price: 60000 },
  { id: 'crs_mba', title: 'Master of Business Administration (MBA)', category: 'Postgraduate', price: 110000 },
  { id: 'crs_bba', title: 'Bachelor of Business Administration (BBA)', category: 'Degree', price: 55000 },
  { id: 'crs_fullstack', title: 'Full-Stack Web Development Bootcamp', category: 'Certification', price: 45000 },
  { id: 'crs_datasci', title: 'Data Science & Machine Learning', category: 'Certification', price: 50000 },
  { id: 'crs_cyber', title: 'Cybersecurity & Ethical Hacking', category: 'Certification', price: 40000 },
  { id: 'crs_python_ai', title: 'Python & AI Foundations', category: 'Certification', price: 30000 },
  { id: 'crs_diploma_it', title: 'Diploma in Information Technology', category: 'Diploma', price: 35000 },
]

const CATEGORY_COLORS = [
  'bg-emerald-500 text-emerald-100',
  'bg-blue-500 text-blue-100',
  'bg-amber-500 text-amber-100',
  'bg-purple-500 text-purple-100',
  'bg-rose-500 text-rose-100',
  'bg-cyan-500 text-cyan-100',
  'bg-indigo-500 text-indigo-100',
  'bg-teal-500 text-teal-100',
]

// Convert number to Indian currency words
function convertNumberToWordsIndian(num: number): string {
  if (num <= 0 || isNaN(num)) return 'Zero Rupees'
  num = Math.floor(num)

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const convertTwoDigits = (n: number): string => {
    if (n < 20) return a[n]
    const ten = Math.floor(n / 10)
    const rem = n % 10
    return b[ten] + (rem ? ' ' + a[rem] : '')
  }

  const convertThreeDigits = (n: number): string => {
    const hundred = Math.floor(n / 100)
    const rest = n % 100
    let str = ''
    if (hundred > 0) {
      str += a[hundred] + ' Hundred'
      if (rest > 0) str += ' and '
    }
    if (rest > 0) {
      str += convertTwoDigits(rest)
    }
    return str
  }

  const crores = Math.floor(num / 10000000)
  num %= 10000000
  const lakhs = Math.floor(num / 100000)
  num %= 100000
  const thousands = Math.floor(num / 1000)
  num %= 1000
  const hundreds = num

  const parts: string[] = []
  if (crores > 0) parts.push(`${convertTwoDigits(crores)} Crore`)
  if (lakhs > 0) parts.push(`${convertTwoDigits(lakhs)} Lakh`)
  if (thousands > 0) parts.push(`${convertTwoDigits(thousands)} Thousand`)
  if (hundreds > 0) parts.push(convertThreeDigits(hundreds))

  return parts.join(' ') + ' Rupees Only'
}

export function FeeStructureModal({
  isOpen,
  onClose,
  categories: propCategories,
  editingStructure,
  onSuccess,
  courses: propCourses,
  onCategoriesUpdated
}: FeeStructureModalProps) {
  const [categories, setCategories] = useState<FeeCategory[]>(propCategories)
  useEffect(() => {
    setCategories(propCategories)
  }, [propCategories])

  // Combine provided courses with defaults
  const availableCourses = useMemo(() => {
    const merged = [...(propCourses || [])]
    DEFAULT_COURSES.forEach(dc => {
      if (!merged.some(c => c.title.toLowerCase() === dc.title.toLowerCase())) {
        merged.push(dc)
      }
    })
    if (editingStructure?.courseName && !merged.some(c => c.title.toLowerCase() === editingStructure.courseName.toLowerCase())) {
      merged.unshift({
        id: editingStructure.courseId || `crs_${Date.now()}`,
        title: editingStructure.courseName,
        category: 'Custom'
      })
    }
    return merged
  }, [propCourses, editingStructure])

  const publishedGroup = useMemo(() => {
    return availableCourses.filter(c => c.category === 'Published' || (!['Degree', 'Postgraduate', 'Diploma', 'Certification', 'Custom'].includes(c.category || '')))
  }, [availableCourses])

  const degreeGroup = useMemo(() => {
    return availableCourses.filter(c => ['Degree', 'Postgraduate', 'Diploma'].includes(c.category || ''))
  }, [availableCourses])

  const certGroup = useMemo(() => {
    return availableCourses.filter(c => c.category === 'Certification')
  }, [availableCourses])

  // Current year calculations for dynamic chips
  const currentYear = new Date().getFullYear()
  const dynamicYearPresets = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
    `${currentYear + 2}-${currentYear + 3}`,
  ]

  // Default initial course
  const defaultInitialCourse = editingStructure?.courseName
    ? { id: editingStructure.courseId || '', title: editingStructure.courseName }
    : DEFAULT_COURSES[0]

  // Form states
  const [isCustomCourse, setIsCustomCourse] = useState(false)
  const [courseName, setCourseName] = useState(editingStructure?.courseName || defaultInitialCourse.title)
  const [courseId, setCourseId] = useState(editingStructure?.courseId || defaultInitialCourse.id)
  const [batchYear, setBatchYear] = useState(
    editingStructure?.batchYear || `${currentYear}-${currentYear + 1}`
  )
  const [frequency, setFrequency] = useState<BillingFrequency>(
    editingStructure?.frequency || 'semester'
  )
  const [dueDate, setDueDate] = useState(editingStructure?.dueDate || '')
  const [gracePeriodDays, setGracePeriodDays] = useState(editingStructure?.gracePeriodDays ?? 7)
  const [lateFinePerDay, setLateFinePerDay] = useState(editingStructure?.lateFinePerDay ?? 50)
  const [maxLateFine, setMaxLateFine] = useState(editingStructure?.maxLateFine ?? 1500)

  // Title with auto-sync option
  const [name, setName] = useState(editingStructure?.name || '')
  const [isTitleAutoSync, setIsTitleAutoSync] = useState(!editingStructure)

  // Itemized categories
  const [items, setItems] = useState<Array<{ categoryId: string; amount: number }>>(() => {
    if (editingStructure?.items && editingStructure.items.length > 0) {
      return editingStructure.items.map(i => ({ categoryId: i.categoryId, amount: i.amount }))
    }
    if (categories.length > 0) {
      return [
        { categoryId: categories[0]?.id || 'cat_tui', amount: 45000 },
        { categoryId: categories[1]?.id || categories[0]?.id || 'cat_adm', amount: 5000 }
      ]
    }
    return [{ categoryId: 'cat_tui', amount: 50000 }]
  })

  // Late fine interactive simulator state
  const [simulatedDaysLate, setSimulatedDaysLate] = useState(12)

  // Inline Category Creator state
  const [isAddingNewCat, setIsAddingNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatCode, setNewCatCode] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [newCatRefundable, setNewCatRefundable] = useState(false)
  const [isCreatingCat, setIsCreatingCat] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Frequency name helper
  const frequencyLabels: Record<BillingFrequency, { label: string; count: number; suffix: string }> = {
    semester: { label: 'Per Semester', count: 2, suffix: 'semesters/year' },
    annual: { label: 'Annual', count: 1, suffix: 'year' },
    quarterly: { label: 'Quarterly', count: 4, suffix: 'quarters/year' },
    monthly: { label: 'Monthly', count: 12, suffix: 'months/year' },
    one_time: { label: 'One-Time (Admission)', count: 1, suffix: 'total course' },
  }

  // Dynamic Title Auto-Generator
  const generatedTitle = useMemo(() => {
    const course = courseName.trim() || 'General Course'
    const freqLabel = frequencyLabels[frequency]?.label || frequency
    return `${course} - Batch ${batchYear} (${freqLabel})`
  }, [courseName, batchYear, frequency])

  // Sync title whenever parameters change if auto-sync is on
  useEffect(() => {
    if (isTitleAutoSync && !editingStructure) {
      setName(generatedTitle)
    }
  }, [generatedTitle, isTitleAutoSync, editingStructure])

  // Total amount calculation
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  }, [items])

  // Refundable vs non-refundable split
  const { refundableAmount, nonRefundableAmount } = useMemo(() => {
    let ref = 0
    let nonRef = 0
    items.forEach(item => {
      const cat = categories.find(c => c.id === item.categoryId)
      const amt = Number(item.amount) || 0
      if (cat?.isRefundable) {
        ref += amt
      } else {
        nonRef += amt
      }
    })
    return { refundableAmount: ref, nonRefundableAmount: nonRef }
  }, [items, categories])

  // Days remaining calculation for due date
  const dueDaysBadge = useMemo(() => {
    if (!dueDate) return null
    const target = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return { text: 'Due Today', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d Past Due`, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' }
    return { text: `Due in ${diffDays} days`, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' }
  }, [dueDate])

  // Calculated installment schedule
  const installmentInfo = useMemo(() => {
    const info = frequencyLabels[frequency]
    const count = info?.count || 1
    const perInstallment = Math.round(totalAmount / count)
    return { count, perInstallment, label: info?.label, suffix: info?.suffix }
  }, [frequency, totalAmount])

  // Late fine simulation calculation
  const simulatorResult = useMemo(() => {
    const billableDays = Math.max(0, simulatedDaysLate - gracePeriodDays)
    const rawFine = billableDays * lateFinePerDay
    const finalFine = maxLateFine > 0 ? Math.min(rawFine, maxLateFine) : rawFine
    const isCapped = maxLateFine > 0 && rawFine >= maxLateFine
    return { billableDays, rawFine, finalFine, isCapped }
  }, [simulatedDaysLate, gracePeriodDays, lateFinePerDay, maxLateFine])

  if (!isOpen) return null

  // Quick Due Date Offsets
  const setDueDateOffset = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    setDueDate(d.toISOString().split('T')[0])
  }

  // Late Fine Policy Presets
  const applyFinePreset = (preset: 'zero' | 'standard' | 'strict' | 'lenient') => {
    if (preset === 'zero') {
      setGracePeriodDays(0)
      setLateFinePerDay(0)
      setMaxLateFine(0)
    } else if (preset === 'standard') {
      setGracePeriodDays(7)
      setLateFinePerDay(50)
      setMaxLateFine(1500)
    } else if (preset === 'strict') {
      setGracePeriodDays(3)
      setLateFinePerDay(100)
      setMaxLateFine(3000)
    } else if (preset === 'lenient') {
      setGracePeriodDays(15)
      setLateFinePerDay(25)
      setMaxLateFine(600)
    }
  }

  // Add Item to Breakdown
  const handleAddItem = () => {
    const unselected = categories.find(c => !items.some(i => i.categoryId === c.id))
    const catId = unselected?.id || categories[0]?.id || 'cat_tui'
    setItems([...items, { categoryId: catId, amount: 5000 }])
  }

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, idx) => idx !== index))
  }

  // Change Item
  const handleItemChange = (index: number, field: 'categoryId' | 'amount', value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  // Quick Amount Booster for Item
  const handleBoostItemAmount = (index: number, delta: number) => {
    const current = Number(items[index].amount) || 0
    handleItemChange(index, 'amount', Math.max(0, current + delta))
  }

  // Split Evenly
  const handleSplitEvenly = () => {
    if (items.length === 0 || totalAmount <= 0) return
    const share = Math.round(totalAmount / items.length)
    setItems(items.map(item => ({ ...item, amount: share })))
  }

  // Handle Inline New Category Creation
  const handleCreateNewCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    const code = newCatCode.trim().toUpperCase() || newCatName.substring(0, 3).toUpperCase()
    try {
      setIsCreatingCat(true)
      const created = await createFeeCategory({
        name: newCatName.trim(),
        code,
        description: newCatDesc.trim() || undefined,
        isRefundable: newCatRefundable
      })
      const updatedCats = [...categories, created]
      setCategories(updatedCats)
      if (onCategoriesUpdated) onCategoriesUpdated(updatedCats)

      // Add as new item row
      setItems([...items, { categoryId: created.id, amount: 5000 }])

      // Reset inline form
      setNewCatName('')
      setNewCatCode('')
      setNewCatDesc('')
      setNewCatRefundable(false)
      setIsAddingNewCat(false)
    } catch (err: any) {
      setError(err.message || 'Failed to create category')
    } finally {
      setIsCreatingCat(false)
    }
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const finalName = name.trim() || generatedTitle
    if (!finalName) {
      setError('Please provide a structure title.')
      return
    }

    if (!courseName.trim()) {
      setError('Please choose or enter a target course/program.')
      return
    }

    if (totalAmount <= 0) {
      setError('Total fee structure amount must be greater than zero.')
      return
    }

    try {
      setIsSubmitting(true)
      const mappedItems = items.map((item, idx) => {
        const cat = categories.find(c => c.id === item.categoryId)
        return {
          id: `fsi_${idx}_${Date.now()}`,
          categoryId: item.categoryId,
          categoryName: cat?.name || 'General Fee',
          amount: Number(item.amount) || 0
        }
      })

      const finalCourseId = courseId.trim() || `crs_${Date.now()}`

      if (editingStructure) {
        const updated = await updateFeeStructure(editingStructure.id, {
          name: finalName,
          courseId: finalCourseId,
          courseName: courseName.trim(),
          batchYear: batchYear.trim(),
          frequency,
          totalAmount,
          dueDate: dueDate || new Date().toISOString().split('T')[0],
          gracePeriodDays: Number(gracePeriodDays),
          lateFinePerDay: Number(lateFinePerDay),
          maxLateFine: Number(maxLateFine),
          items: mappedItems
        })
        if (updated) {
          onSuccess(updated)
          onClose()
        }
      } else {
        const created = await createFeeStructure({
          name: finalName,
          courseId: finalCourseId,
          courseName: courseName.trim(),
          batchYear: batchYear.trim(),
          frequency,
          totalAmount,
          dueDate: dueDate || new Date().toISOString().split('T')[0],
          gracePeriodDays: Number(gracePeriodDays),
          lateFinePerDay: Number(lateFinePerDay),
          maxLateFine: Number(maxLateFine),
          items: mappedItems,
          isActive: true
        })
        onSuccess(created)
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Error saving fee structure.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header with Title & Blueprint Presets */}
        <div className="px-6 py-4 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                  {editingStructure ? 'Edit Fee Structure' : 'Create New Fee Structure'}
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Dynamic Configurator
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Define reactive course fees, installment schedules, fine policies, and itemized distributions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* SECTION 1: COURSE & STRUCTURE IDENTIFICATION */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wide">
                <Tag className="w-3.5 h-3.5 text-primary" />
                1. Course & Title Configuration
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTitleAutoSync(!isTitleAutoSync)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors ${
                    isTitleAutoSync
                      ? 'bg-primary/10 text-primary border-primary/30 font-medium'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                  title="Toggle automatic title generation"
                >
                  <RefreshCw className={`w-3 h-3 ${isTitleAutoSync ? 'animate-spin-once' : ''}`} />
                  {isTitleAutoSync ? 'Auto-Sync On' : 'Manual Title'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Target Course / Program Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    Target Course / Program
                    <span className="text-[10px] font-normal text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                      Dropdown
                    </span>
                  </label>
                  {isCustomCourse && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCourse(false)
                        setCourseId(DEFAULT_COURSES[0].id)
                        setCourseName(DEFAULT_COURSES[0].title)
                      }}
                      className="text-[10px] text-primary hover:underline font-medium"
                    >
                      ← Back to Course Dropdown
                    </button>
                  )}
                </div>

                <div className="relative">
                  <select
                    value={isCustomCourse ? '__custom__' : courseId}
                    onChange={e => {
                      const val = e.target.value
                      if (val === '__custom__') {
                        setIsCustomCourse(true)
                        setCourseName('')
                        setCourseId(`custom_${Date.now()}`)
                      } else {
                        setIsCustomCourse(false)
                        const sel = availableCourses.find(c => c.id === val)
                        if (sel) {
                          setCourseId(sel.id)
                          setCourseName(sel.title)
                          if (sel.price && items.length > 0) {
                            const newItems = [...items]
                            newItems[0] = { ...newItems[0], amount: sel.price }
                            setItems(newItems)
                          }
                        }
                      }
                    }}
                    className="w-full px-3 py-2 pr-9 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-medium cursor-pointer shadow-xs"
                  >
                    <option value="" disabled>-- Select Course / Program --</option>

                    {/* LMS / Published Courses */}
                    {publishedGroup.length > 0 && (
                      <optgroup label="Published Courses & LMS Programs">
                        {publishedGroup.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.title} {course.price ? `(₹${course.price.toLocaleString('en-IN')})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {/* Degree Programs */}
                    {degreeGroup.length > 0 && (
                      <optgroup label="Degrees & University Programs">
                        {degreeGroup.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {/* Certifications & Bootcamps */}
                    {certGroup.length > 0 && (
                      <optgroup label="Certifications & Bootcamps">
                        {certGroup.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    <optgroup label="Custom / Other">
                      <option value="__custom__">➕ Type Custom Course / Program...</option>
                    </optgroup>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                {/* Inline custom course text box if user selected custom */}
                {isCustomCourse && (
                  <div className="mt-2 animate-in fade-in">
                    <input
                      type="text"
                      value={courseName}
                      onChange={e => setCourseName(e.target.value)}
                      placeholder="e.g. Java Programming Masterclass"
                      required
                      className="w-full px-3 py-2 text-xs bg-background border border-primary/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Structure Title */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Structure Title
                  {isTitleAutoSync && (
                    <span className="ml-1 text-[10px] text-emerald-500 font-normal">
                      (Auto-generated)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={e => {
                      setIsTitleAutoSync(false)
                      setName(e.target.value)
                    }}
                    placeholder="e.g. B.Tech Computer Science 2026-27"
                    required
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                  />
                  {!isTitleAutoSync && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsTitleAutoSync(true)
                        setName(generatedTitle)
                      }}
                      className="absolute right-2 top-2 text-[10px] text-primary hover:underline flex items-center gap-0.5"
                      title="Reset to auto title"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Sync
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: SCHEDULE, BATCH & DUE DATE */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wide">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              2. Academic Year, Billing Schedule & Due Date
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Batch / Academic Year with Dynamic Chips */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Batch / Academic Year</label>
                <input
                  type="text"
                  value={batchYear}
                  onChange={e => setBatchYear(e.target.value)}
                  placeholder="2026-2027"
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 mb-1.5"
                />
                {/* Dynamic Year Chips */}
                <div className="flex items-center gap-1 flex-wrap">
                  {dynamicYearPresets.map(yr => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setBatchYear(yr)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-all ${
                        batchYear === yr
                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                          : 'bg-background hover:bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Billing Frequency */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Billing Frequency</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as BillingFrequency)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="semester">Per Semester (2 Terms / Yr)</option>
                  <option value="annual">Annual (1 Payment / Yr)</option>
                  <option value="quarterly">Quarterly (4 Terms / Yr)</option>
                  <option value="monthly">Monthly (12 Payments / Yr)</option>
                  <option value="one_time">One-Time (Admission / Full)</option>
                </select>
                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Calculator className="w-3 h-3 text-primary shrink-0" />
                  {installmentInfo.count} installment{installmentInfo.count > 1 ? 's' : ''} ({installmentInfo.suffix})
                </p>
              </div>

              {/* Payment Due Date with Shortcuts */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-foreground">Payment Due Date</label>
                  {dueDaysBadge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${dueDaysBadge.color}`}>
                      {dueDaysBadge.text}
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 mb-1.5"
                />
                {/* Dynamic Quick Date Pickers */}
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDueDateOffset(15)}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-background hover:bg-muted text-muted-foreground"
                  >
                    +15d
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDateOffset(30)}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-background hover:bg-muted text-muted-foreground"
                  >
                    +30d
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDateOffset(45)}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-background hover:bg-muted text-muted-foreground"
                  >
                    +45d
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDateOffset(60)}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-background hover:bg-muted text-muted-foreground"
                  >
                    +60d
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Installment Schedule Preview Box */}
            <div className="p-3 bg-card border border-border/80 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    Dynamic Installment Schedule: {installmentInfo.count} × ₹{installmentInfo.perInstallment.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Total Structure Fee ₹{totalAmount.toLocaleString('en-IN')} divided into {installmentInfo.label.toLowerCase()} installments
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-primary font-medium px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                ₹{installmentInfo.perInstallment.toLocaleString('en-IN')} / installment
              </div>
            </div>
          </div>

          {/* SECTION 3: GRACE PERIOD & LATE FINE RULES + LIVE SIMULATOR */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                3. Grace Period & Late Fine Policy
              </div>
              {/* Presets */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyFinePreset('zero')}
                  className="text-[10px] px-2 py-0.5 rounded border border-border bg-background hover:bg-muted text-muted-foreground"
                >
                  No Fine
                </button>
                <button
                  type="button"
                  onClick={() => applyFinePreset('standard')}
                  className="text-[10px] px-2 py-0.5 rounded border border-border bg-background hover:bg-muted text-muted-foreground"
                >
                  Standard (₹50/d)
                </button>
                <button
                  type="button"
                  onClick={() => applyFinePreset('strict')}
                  className="text-[10px] px-2 py-0.5 rounded border border-border bg-background hover:bg-muted text-muted-foreground"
                >
                  Strict (₹100/d)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Grace Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={gracePeriodDays}
                  onChange={e => setGracePeriodDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:ring-1 focus:ring-primary"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Zero penalty during first {gracePeriodDays} days
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Late Fine / Day (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={lateFinePerDay}
                  onChange={e => setLateFinePerDay(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:ring-1 focus:ring-primary"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Accumulates per day after grace period
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Max Late Fine Cap (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxLateFine}
                  onChange={e => setMaxLateFine(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:ring-1 focus:ring-primary"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Upper ceiling limit for late penalty
                </span>
              </div>
            </div>

            {/* Live Dynamic Fine Simulator Card */}
            <div className="p-3 bg-background border border-border/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Live Policy Simulator
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Simulated Overdue: <strong className="text-foreground">{simulatedDaysLate} days</strong>
                </span>
              </div>

              {/* Interactive slider for testing late fine scenarios */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="45"
                  value={simulatedDaysLate}
                  onChange={e => setSimulatedDaysLate(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-xs font-mono font-medium text-muted-foreground w-12 text-right">
                  {simulatedDaysLate}d late
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                <div>
                  <div className="text-muted-foreground text-[11px]">
                    {simulatedDaysLate <= gracePeriodDays ? (
                      <span className="text-emerald-500 font-medium">
                        ✓ Inside Grace Period ({simulatedDaysLate} ≤ {gracePeriodDays} days)
                      </span>
                    ) : (
                      <span>
                        {simulatorResult.billableDays} billable days × ₹{lateFinePerDay}/day
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    Simulated Penalty:{' '}
                    <span className={simulatorResult.finalFine > 0 ? 'text-amber-500' : 'text-emerald-500'}>
                      ₹{simulatorResult.finalFine.toLocaleString('en-IN')}
                    </span>
                    {simulatorResult.isCapped && (
                      <span className="ml-1 text-[10px] text-rose-500 font-normal">
                        (Capped at ₹{maxLateFine.toLocaleString('en-IN')})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                    {lateFinePerDay === 0 ? 'Zero Fine Rule' : `₹${lateFinePerDay}/day rule`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: FEE BREAKDOWN ITEMS & PROPORTIONAL VISUALIZER */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/60">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wide">
                <Percent className="w-3.5 h-3.5 text-primary" />
                4. Fee Breakdown Items & Proportional Allocation
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSplitEvenly}
                  className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
                  title="Evenly divide current total among categories"
                >
                  Split Evenly
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isAddingNewCat ? 'Cancel New Category' : '+ Create Category'}
                </button>
              </div>
            </div>

            {/* Inline New Category Creator */}
            {isAddingNewCat && (
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Create & Register New Fee Category
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCat(false)}
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Category Name (e.g. Lab Consumables)"
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={newCatCode}
                    onChange={e => setNewCatCode(e.target.value)}
                    placeholder="Short Code (e.g. LAB-C)"
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs uppercase"
                  />
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={e => setNewCatDesc(e.target.value)}
                    placeholder="Description (Optional)"
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCatRefundable}
                      onChange={e => setNewCatRefundable(e.target.checked)}
                      className="rounded border-border accent-primary"
                    />
                    Refundable Deposit / Security
                  </label>
                  <button
                    type="button"
                    disabled={isCreatingCat || !newCatName.trim()}
                    onClick={handleCreateNewCategory}
                    className="px-3 py-1 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {isCreatingCat ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Save & Add to Structure
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Proportional Distribution Progress Bar */}
            {totalAmount > 0 && (
              <div className="space-y-1.5">
                <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-muted/60 p-0.5">
                  {items.map((item, idx) => {
                    const pct = Math.max(0, ((Number(item.amount) || 0) / totalAmount) * 100)
                    if (pct === 0) return null
                    const colorClass = CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                    return (
                      <div
                        key={idx}
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-sm transition-all duration-300 ${colorClass}`}
                        title={`${categories.find(c => c.id === item.categoryId)?.name || 'Category'}: ${pct.toFixed(1)}%`}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                  {items.map((item, idx) => {
                    const pct = totalAmount > 0 ? (((Number(item.amount) || 0) / totalAmount) * 100).toFixed(1) : '0'
                    const cat = categories.find(c => c.id === item.categoryId)
                    const colorClass = CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                    return (
                      <span key={idx} className="flex items-center gap-1 font-medium">
                        <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                        {cat?.name || 'Item'}: {pct}%
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Itemized Rows */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const selectedCat = categories.find(c => c.id === item.categoryId)
                const sharePct = totalAmount > 0 ? (((Number(item.amount) || 0) / totalAmount) * 100).toFixed(1) : '0'

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-background border border-border flex items-center gap-2.5 transition-all hover:border-primary/30"
                  >
                    {/* Category Selector */}
                    <div className="flex-1 min-w-[160px]">
                      <select
                        value={item.categoryId}
                        onChange={e => handleItemChange(idx, 'categoryId', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.code}) {cat.isRefundable ? '• Refundable' : ''}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 mt-1 px-1">
                        {selectedCat?.isRefundable ? (
                          <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Refundable
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Non-refundable
                          </span>
                        )}
                        <span className="text-[10px] text-primary font-semibold">
                          ({sharePct}% of total)
                        </span>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="relative w-36 sm:w-44">
                      <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={item.amount}
                        onChange={e => handleItemChange(idx, 'amount', Number(e.target.value))}
                        placeholder="0"
                        className="w-full pl-6 pr-2 py-1.5 text-xs font-bold bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {/* Micro boosters */}
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <button
                          type="button"
                          onClick={() => handleBoostItemAmount(idx, 1000)}
                          className="text-[9px] px-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                        >
                          +1k
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBoostItemAmount(idx, 5000)}
                          className="text-[9px] px-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                        >
                          +5k
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBoostItemAmount(idx, 10000)}
                          className="text-[9px] px-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                        >
                          +10k
                        </button>
                      </div>
                    </div>

                    {/* Delete Item */}
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-muted-foreground hover:text-rose-500 disabled:opacity-30 rounded-lg hover:bg-muted transition-colors shrink-0"
                      title="Remove fee component"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2 border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Fee Breakdown Category
            </button>
          </div>

          {/* SECTION 5: DYNAMIC TOTAL & WORDS CONVERTER SUMMARY CARD */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-semibold text-foreground">Total Structure Fee:</span>
                <div className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex items-center gap-2 text-right">
                <div className="px-3 py-1.5 rounded-xl bg-background/80 border border-border shadow-sm text-right">
                  <span className="text-[10px] text-muted-foreground block">Per Installment</span>
                  <span className="text-xs font-bold text-foreground">
                    ₹{installmentInfo.perInstallment.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-background/80 border border-border shadow-sm text-right">
                  <span className="text-[10px] text-muted-foreground block">Refundable Port.</span>
                  <span className="text-xs font-bold text-emerald-500">
                    ₹{refundableAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Words Representation (Indian System) */}
            <div className="pt-2 border-t border-primary/10 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                In Words:{' '}
                <strong className="text-foreground capitalize font-medium">
                  {convertNumberToWordsIndian(totalAmount)}
                </strong>
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalAmount <= 0}
              className="px-6 py-2.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Structure...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {editingStructure ? 'Update Fee Structure' : 'Create Structure'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
