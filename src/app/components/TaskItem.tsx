'use client'

import { useState, useRef, useEffect } from 'react'
import type { Task } from '../types/task'
import { useT } from '../lib/i18n'

const priorityStyles = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

function formatShortDate(iso: string) {
  const d = new Date(iso)
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${m}/${day}`
}

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onStartWork: (id: string) => void
  onUpdateTitle: (id: string, title: string) => void
  onUpdateTags: (id: string, tags: string[]) => void
  allTags: string[]
  isWorking: boolean
  canStartWork: boolean
}

export default function TaskItem({ task, onToggle, onDelete, onStartWork, onUpdateTitle, onUpdateTags, allTags, isWorking, canStartWork }: TaskItemProps) {
  const t = useT()
  const priorityLabels = {
    high: t.priorityHigh,
    medium: t.priorityMedium,
    low: t.priorityLow,
  }
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  useEffect(() => {
    if (isEditingTags) tagInputRef.current?.focus()
  }, [isEditingTags])

  const handleSaveTitle = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== task.title) {
      onUpdateTitle(task.id, trimmed)
    } else {
      setEditTitle(task.title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveTitle()
    if (e.key === 'Escape') {
      setEditTitle(task.title)
      setIsEditing(false)
    }
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !task.tags.includes(trimmed)) {
      onUpdateTags(task.id, [...task.tags, trimmed])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    onUpdateTags(task.id, task.tags.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(tagInput)
    }
    if (e.key === 'Escape') {
      setIsEditingTags(false)
      setTagInput('')
    }
    if (e.key === 'Backspace' && tagInput === '' && task.tags.length > 0) {
      removeTag(task.tags[task.tags.length - 1])
    }
  }

  const suggestedTags = allTags.filter(
    (tag) => !task.tags.includes(tag) && tag.toLowerCase().includes(tagInput.toLowerCase())
  )

  return (
    <div className={`group flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
      isWorking
        ? 'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/20'
        : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
    } ${task.completed ? 'opacity-60' : ''}`}>
      {/* Checkbox + Priority badge below it */}
      <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
        <button
          onClick={() => onToggle(task.id)}
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
            task.completed
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-zinc-300 hover:border-blue-400 dark:border-zinc-600'
          }`}
        >
          {task.completed && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-none ${priorityStyles[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              className="w-full rounded border border-blue-400 bg-transparent px-1 py-0.5 text-base font-bold outline-none"
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditing(true)}
              className={`cursor-text text-base font-bold ${task.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}
            >
              {task.title}
            </span>
          )}
          {isWorking && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              {t.working}
            </span>
          )}
        </div>
        {task.description && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{task.description}</p>
        )}
        {task.lastNextAction && !task.completed && (
          <div className="mt-1.5 flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1 dark:bg-amber-900/10">
            <span className="mt-px text-[10px] font-medium text-amber-600 dark:text-amber-400">&#x27A1;</span>
            <span className="text-xs text-amber-800 dark:text-amber-300">{task.lastNextAction}</span>
          </div>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
            >
              {tag}
              {isEditingTags && (
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 hover:text-violet-900 dark:hover:text-violet-200"
                >
                  &times;
                </button>
              )}
            </span>
          ))}
          {isEditingTags ? (
            <div className="flex flex-col">
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { if (!tagInput) setIsEditingTags(false) }}
                placeholder="+ tag"
                className="min-w-[130px] rounded border border-violet-300 bg-transparent px-1.5 py-0.5 text-[11px] outline-none focus:border-violet-500"
              />
              {tagInput && suggestedTags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {suggestedTags.slice(0, 5).map((tag) => (
                    <button
                      key={tag}
                      onMouseDown={(e) => { e.preventDefault(); addTag(tag) }}
                      className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] text-zinc-500 transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-zinc-700 dark:hover:border-violet-600"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsEditingTags(true)}
              className="rounded-full border border-dashed border-zinc-300 px-1.5 py-0.5 text-[10px] text-zinc-400 transition-colors hover:border-violet-400 hover:text-violet-500 dark:border-zinc-600 dark:hover:border-violet-500"
            >
              + tag
            </button>
          )}
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {formatShortDate(task.createdAt)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!task.completed && !isWorking && canStartWork && (
          <button
            onClick={() => onStartWork(task.id)}
            className="rounded px-2 py-1 text-xs font-medium text-blue-600 transition-all hover:bg-blue-50 sm:opacity-0 sm:group-hover:opacity-100 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            {t.start}
          </button>
        )}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="shrink-0 rounded p-1 text-zinc-400 opacity-0 transition-all hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="shrink-0 rounded p-1 text-zinc-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onDelete(task.id); setShowDeleteConfirm(false) }}
              className="shrink-0 rounded bg-red-500 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-600"
            >
              OK
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="shrink-0 rounded bg-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
            >
              {t.cancel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
