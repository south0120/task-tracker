'use client'

import { useState, useEffect, useRef } from 'react'
import type { Task, WorkSession } from '../types/task'
import { useT } from '../lib/i18n'

interface ActiveSessionProps {
  session: WorkSession
  task: Task | undefined
  onStop: (memo: string, nextAction: string) => void
  compact?: boolean
  onToggleCompact?: () => void
}

function formatElapsed(startedAt: string) {
  const diff = Date.now() - new Date(startedAt).getTime()
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const COMPACT_WIDTH = 340
const COMPACT_HEIGHT = 110

export default function ActiveSession({ session, task, onStop, compact, onToggleCompact }: ActiveSessionProps) {
  const t = useT()
  const [elapsed, setElapsed] = useState(() => formatElapsed(session.startedAt))
  const [showForm, setShowForm] = useState(false)
  const [memo, setMemo] = useState('')
  const [nextAction, setNextAction] = useState('')
  const prevSize = useRef<{ w: number; h: number; x: number; y: number } | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(session.startedAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [session.startedAt])

  useEffect(() => {
    if (compact) {
      prevSize.current = {
        w: window.outerWidth,
        h: window.outerHeight,
        x: window.screenX,
        y: window.screenY,
      }
      const formHeight = showForm ? 280 : 0
      const targetH = COMPACT_HEIGHT + formHeight
      const screenW = window.screen.availWidth
      window.resizeTo(COMPACT_WIDTH, targetH)
      window.moveTo(screenW - COMPACT_WIDTH - 16, 16)
    }
  }, [compact])

  useEffect(() => {
    if (compact) {
      const targetH = showForm ? COMPACT_HEIGHT + 280 : COMPACT_HEIGHT
      window.resizeTo(COMPACT_WIDTH, targetH)
    }
  }, [showForm, compact])

  const handleExpand = () => {
    if (prevSize.current) {
      window.resizeTo(prevSize.current.w, prevSize.current.h)
      window.moveTo(prevSize.current.x, prevSize.current.y)
    }
    onToggleCompact?.()
  }

  const handleStop = () => {
    if (!showForm) {
      setShowForm(true)
      return
    }
    if (compact && prevSize.current) {
      window.resizeTo(prevSize.current.w, prevSize.current.h)
      window.moveTo(prevSize.current.x, prevSize.current.y)
    }
    onStop(memo.trim(), nextAction.trim())
    setShowForm(false)
    setMemo('')
    setNextAction('')
  }

  const handleSkip = () => {
    if (compact && prevSize.current) {
      window.resizeTo(prevSize.current.w, prevSize.current.h)
      window.moveTo(prevSize.current.x, prevSize.current.y)
    }
    onStop('', '')
    setShowForm(false)
  }

  if (compact) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-1.5 bg-zinc-950 px-4 pb-5 pt-3 select-none">
        <p className="max-w-full truncate text-[11px] font-medium text-zinc-400">
          {task?.title ?? ''}
        </p>
        <div className="flex items-center gap-3">
          <p className="font-mono text-2xl font-bold tabular-nums text-blue-400">
            {elapsed}
          </p>
          {!showForm && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleStop}
                className="rounded-md bg-red-500 px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-red-600"
              >
                {t.end}
              </button>
              <button
                onClick={handleExpand}
                className="rounded-md border border-zinc-700 p-1 text-zinc-400 transition-colors hover:bg-zinc-800"
                title={t.expand}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </button>
            </div>
          )}
        </div>
        {showForm && (
          <div className="flex w-full flex-col gap-2">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={t.memoPlaceholder}
              rows={2}
              autoFocus
              className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-blue-500"
            />
            <textarea
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder={t.nextPlaceholder}
              rows={2}
              className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-blue-500"
            />
            <div className="flex justify-center gap-2">
              <button
                onClick={handleSkip}
                className="rounded-md px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-800"
              >
                {t.skip}
              </button>
              <button
                onClick={handleStop}
                className="rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
              >
                {t.saveEnd}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-3 sm:px-5 sm:py-4 dark:border-blue-400 dark:bg-blue-950/30">
      {/* Row 1: working label + task name */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
        </span>
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t.working}</span>
        <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {task?.title ?? ''}
        </span>
      </div>
      {/* Row 2: elapsed time + buttons */}
      <div className="mt-2 flex items-center gap-2">
        <span className="font-mono text-lg font-bold tabular-nums text-blue-700 sm:text-xl dark:text-blue-300">
          {elapsed}
        </span>
        {!showForm && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onToggleCompact}
              className="hidden rounded-md border border-zinc-200 p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 sm:block dark:border-zinc-700 dark:hover:bg-zinc-800"
              title={t.expand}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="2" width="20" height="20" rx="2" strokeOpacity="0.3" />
                <rect x="11" y="11" width="11" height="11" rx="1.5" fill="currentColor" opacity="0.6" stroke="currentColor" />
              </svg>
            </button>
            <button
              onClick={handleStop}
              className="whitespace-nowrap rounded-md bg-red-500 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              {t.end}
            </button>
          </div>
        )}
      </div>
      {showForm && (
        <div className="mt-3 flex flex-col gap-3 border-t border-blue-200 pt-3 dark:border-blue-800">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t.memo}
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={t.memoPlaceholder}
              rows={2}
              autoFocus
              className="w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t.nextAction}
            </label>
            <textarea
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder={t.nextPlaceholder}
              rows={2}
              className="w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleSkip}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {t.skip}
            </button>
            <button
              onClick={handleStop}
              className="whitespace-nowrap rounded-md bg-red-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              {t.saveAndEnd}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
