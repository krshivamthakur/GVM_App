'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

const CATEGORIES = ['All', 'Programming', 'Physics', 'Chemistry', 'Mathematics', 'General']

export function CourseFilter({ initialCategory = 'All', initialSearch = '' }: { initialCategory?: string; initialSearch?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get('category') || initialCategory
  const currentSearch = searchParams.get('search') || initialSearch

  const updateFilters = (cat?: string, search?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (cat) {
      if (cat === 'All') params.delete('category')
      else params.set('category', cat)
    }
    if (search !== undefined) {
      if (!search.trim()) params.delete('search')
      else params.set('search', search)
    }
    router.push(`/student/courses?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Search Input & Category Pills */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Search courses, topics or instructors..."
            onChange={(e) => updateFilters(undefined, e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((category) => {
            const isSelected = currentCategory === category
            return (
              <button
                key={category}
                onClick={() => updateFilters(category, undefined)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
