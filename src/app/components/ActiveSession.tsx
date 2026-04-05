'use client'

import { useState, useEffect } from 'react'
import type { Task, WorkSession } from '../types/task'

interface ActiveSessionProps {
  session: WorkSession
  task: Task | undefined
  onStop: (memo: string, nextAction: string) => void
}

function formatElapsed(startedAt: string) {
  const diff = Date.now() - new Date(startedAt).getTime()
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function ActiveSession({ session, task, onStop }: ActiveSessionProps) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(session.startedAt))
  const [showForm, setShowForm] = useState(false)
  const [memo, setMemo] = useState('')
  const [nextAction, setNextAction] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(session.startedAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [session.startedAt])

  const handleStop = () => {
    if (!showForm) {
      setShowForm(true)
      return
    }
    onStop(memo.trim(), nextAction.trim())
    setShowForm(false)
    setMemo('')
    setNextAction('')
  }

  const handleSkip = () => {
    onStop('', '')
    setShowForm(false)
  }

  return (
    <div className="rounded-lg border-2 border-blue-500 bg-blue-50 px-5 py-4 dark:border-blue-400 dark:bg-blue-950/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
          </span>
          <div>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">作業中</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {task?.title ?? '不明なタスク'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-lg font-bold tabular-nums text-blue-700 dark:text-blue-300">
            {elapsed}
          </span>
          {!showForm && (
            <button
              onClick={handleStop}
              className="rounded-md bg-red-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              終了
            </button>
          )}
        </div>
      </div>
      {showForm && (
        <div className="mt-4 flex flex-col gap-3 border-t border-blue-200 pt-4 dark:border-blue-800">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              やったこと・進捗メモ
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="今日はどこまで進めた？"
              rows={2}
              autoFocus
              className="w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              次にやること
            </label>
            <textarea
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="次はどこから始める？"
              rows={2}
              className="w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleSkip}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              スキップ
            </button>
            <button
              onClick={handleStop}
              className="rounded-md bg-red-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              メモを保存して終了
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
