'use client'

import { useState } from 'react'
import type { Priority } from '../types/task'
import { useT } from '../lib/i18n'

interface TaskFormProps {
  onAdd: (title: string, description: string, priority: Priority, tags: string[]) => void
  allTags: string[]
}

export default function TaskForm({ onAdd, allTags }: TaskFormProps) {
  const t = useT()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim(), description.trim(), priority, tags)
    setTitle('')
    setDescription('')
    setPriority('medium')
    setTags([])
    setTagInput('')
    setIsOpen(false)
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setTagInput('')
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const suggestedTags = allTags.filter(
    (tag) => !tags.includes(tag) && tag.toLowerCase().includes(tagInput.toLowerCase())
  )

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-lg border-2 border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
      >
        + {t.addTask}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <input
        type="text"
        placeholder={t.title}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        className="mb-2 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700"
      />
      <textarea
        placeholder={t.description}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="mb-3 w-full resize-none rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700"
      />
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-violet-900 dark:hover:text-violet-200">
                &times;
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="+ tag (Enter)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="min-w-[140px] flex-1 bg-transparent px-1 py-0.5 text-xs outline-none"
          />
        </div>
        {tagInput && suggestedTags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {suggestedTags.slice(0, 5).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] text-zinc-500 transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-zinc-700 dark:hover:border-violet-600"
              >
                + {tag}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">{t.priority}:</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-xs outline-none dark:border-zinc-700"
          >
            <option value="high">{t.priorityHigh}</option>
            <option value="medium">{t.priorityMedium}</option>
            <option value="low">{t.priorityLow}</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t.add}
          </button>
        </div>
      </div>
    </form>
  )
}
