'use client'

export type FilterType = 'all' | 'active' | 'completed'
export type SortType = 'created' | 'priority'

interface FilterBarProps {
  filter: FilterType
  sort: SortType
  selectedTag: string | null
  allTags: string[]
  onFilterChange: (filter: FilterType) => void
  onSortChange: (sort: SortType) => void
  onTagChange: (tag: string | null) => void
  counts: { all: number; active: number; completed: number }
}

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'active', label: '未完了' },
  { value: 'completed', label: '完了' },
]

export default function FilterBar({ filter, sort, selectedTag, allTags, onFilterChange, onSortChange, onTagChange, counts }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange(opt.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
              }`}
            >
              {opt.label} ({counts[opt.value]})
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortType)}
          className="rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-xs outline-none dark:border-zinc-700"
        >
          <option value="created">作成日順</option>
          <option value="priority">優先度順</option>
        </select>
      </div>
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">タグ:</span>
          <button
            onClick={() => onTagChange(null)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              selectedTag === null
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            すべて
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagChange(selectedTag === tag ? null : tag)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                selectedTag === tag
                  ? 'bg-violet-600 text-white'
                  : 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
