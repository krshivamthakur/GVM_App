'use client'

import React, { useState } from 'react'
import { LeaveRequest } from '@/types/attendance'
import { CheckCircle2, XCircle, Clock, ExternalLink, MessageSquare, Filter } from 'lucide-react'
import { reviewLeaveRequest } from '@/actions/attendance-actions'

interface LeaveApprovalPanelProps {
  initialLeaves: LeaveRequest[]
  reviewerId: string
  role: 'teacher' | 'admin'
}

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', icon: Clock, className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  approved: { label: 'Approved', icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' },
}

export function LeaveApprovalPanel({ initialLeaves, reviewerId, role }: LeaveApprovalPanelProps) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>(initialLeaves)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredLeaves = filter === 'all' ? leaves : leaves.filter(l => l.status === filter)

  const handleReview = async (leaveId: string, status: 'approved' | 'rejected') => {
    setProcessing(leaveId)
    const note = reviewNote[leaveId] || ''
    await reviewLeaveRequest(leaveId, status, reviewerId, note)
    setLeaves(prev => prev.map(l =>
      l.id === leaveId
        ? { ...l, status, reviewedBy: reviewerId, reviewedAt: new Date().toISOString(), reviewNote: note }
        : l
    ))
    setExpandedId(null)
    setProcessing(null)
  }

  const pendingCount = leaves.filter(l => l.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Leave Requests</h3>
          <p className="text-xs text-muted-foreground">{pendingCount} pending approval</p>
        </div>
        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 text-[11px] font-medium">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                filter === f ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-1 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Leave cards */}
      {filteredLeaves.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="p-4 rounded-full bg-muted/50">
            <Filter className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No leave requests found</p>
          <p className="text-xs text-muted-foreground">No {filter !== 'all' ? filter : ''} leave requests to display.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeaves.map(leave => {
            const config = STATUS_CONFIG[leave.status]
            const Icon = config.icon
            const isExpanded = expandedId === leave.id
            const isPending = leave.status === 'pending'

            return (
              <div
                key={leave.id}
                className={`rounded-xl border bg-card transition-all ${isPending ? 'border-amber-500/30 shadow-sm' : 'border-border'}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <img
                      src={leave.studentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop'}
                      alt={leave.studentName}
                      className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-xs font-bold text-foreground">{leave.studentName}</p>
                          <p className="text-[10px] text-muted-foreground">{leave.className}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${config.className}`}>
                          <Icon className="w-2.5 h-2.5" />
                          {config.label}
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          📅 {leave.fromDate} → {leave.toDate}
                        </span>
                        {leave.documentUrl && (
                          <a href={leave.documentUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline">
                            <ExternalLink className="w-2.5 h-2.5" />
                            Document
                          </a>
                        )}
                      </div>

                      {/* Reason */}
                      <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-2">{leave.reason}</p>

                      {/* Review note (if reviewed) */}
                      {leave.reviewNote && (
                        <div className="mt-2 p-2 rounded-lg bg-muted/50 border border-border">
                          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5" /> Review note:
                          </p>
                          <p className="text-[11px] text-foreground mt-0.5">{leave.reviewNote}</p>
                        </div>
                      )}

                      {/* Actions for pending */}
                      {isPending && (
                        <div className="mt-3">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : leave.id)}
                            className="text-[10px] text-primary hover:underline cursor-pointer"
                          >
                            {isExpanded ? 'Collapse ▲' : 'Review & Respond ▼'}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                              <textarea
                                placeholder="Optional review note (feedback to student)..."
                                value={reviewNote[leave.id] || ''}
                                onChange={e => setReviewNote(prev => ({ ...prev, [leave.id]: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReview(leave.id, 'approved')}
                                  disabled={processing === leave.id}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Approve Leave
                                </button>
                                <button
                                  onClick={() => handleReview(leave.id, 'rejected')}
                                  disabled={processing === leave.id}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
