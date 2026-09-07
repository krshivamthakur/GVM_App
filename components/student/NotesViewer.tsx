'use client'

import { Note } from '@/types/database'
import { FileText, Download, ExternalLink, BookOpen } from 'lucide-react'

interface NotesViewerProps {
  notes?: Note[]
  lectureTitle?: string
}

export function NotesViewer({ notes = [], lectureTitle }: NotesViewerProps) {
  if (notes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center bg-zinc-50/50 dark:bg-zinc-900/30">
        <FileText className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No Lecture Notes Attached</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          The instructor has not uploaded supplementary PDF slides or notes for this specific lecture yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Study Notes & PDF Material ({notes.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0 pr-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {note.title}
                </h4>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wide">
                  {note.file_type?.split('/')[1] || 'PDF Document'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={note.file_path}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-zinc-600 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                title="View PDF Online"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <a
                href={note.file_path}
                download
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-900/50 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
