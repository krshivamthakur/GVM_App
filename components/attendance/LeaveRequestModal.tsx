'use client'

import React, { useState } from 'react'
import { LeaveRequest } from '@/types/attendance'
import { X, FileText, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { submitLeaveRequest } from '@/actions/attendance-actions'

interface LeaveRequestModalProps {
  studentId: string
  studentName: string
  studentAvatar?: string
  classes: Array<{ id: string; name: string }>
  onClose: () => void
  onSubmitted: (leave: LeaveRequest) => void
}

export function LeaveRequestModal({
  studentId,
  studentName,
  studentAvatar,
  classes,
  onClose,
  onSubmitted,
}: LeaveRequestModalProps) {
  const [classId, setClassId] = useState(classes[0]?.id || '')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reason, setReason] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!classId || !fromDate || !toDate || !reason.trim()) {
      setError('Please fill all required fields.')
      return
    }
    if (fromDate > toDate) {
      setError('End date must be after start date.')
      return
    }
    setLoading(true)
    try {
      const leave = await submitLeaveRequest(
        studentId,
        studentName,
        studentAvatar,
        classId,
        fromDate,
        toDate,
        reason.trim(),
        docUrl.trim() || undefined
      )
      setSuccess(true)
      setTimeout(() => {
        onSubmitted(leave)
        onClose()
      }, 1500)
    } catch {
      setError('Failed to submit leave request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Submit Leave Request</h2>
              <p className="text-[11px] text-muted-foreground">Request will be reviewed by your teacher</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-foreground">Leave request submitted!</p>
              <p className="text-xs text-muted-foreground text-center">Your teacher will review and respond shortly.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Class */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Class / Course <span className="text-rose-500">*</span></label>
                <select
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />From Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    min={today}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    To Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    min={fromDate || today}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Reason <span className="text-rose-500">*</span></label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  placeholder="Describe your reason for leave (medical, personal, family, etc.)"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  required
                />
              </div>

              {/* Document URL */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Supporting Document URL <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={docUrl}
                  onChange={e => setDocUrl(e.target.value)}
                  placeholder="https://drive.google.com/... (medical certificate, etc.)"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
