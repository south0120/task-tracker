'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

function formatMmSs(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const COMPACT_WIDTH = 340
const COMPACT_HEIGHT = 110

const WORK_DURATION = 25 * 60
const BREAK_DURATION = 5 * 60

export default function ActiveSession({ session, task, onStop, compact, onToggleCompact }: ActiveSessionProps) {
  const t = useT()
  const [elapsed, setElapsed] = useState(() => formatElapsed(session.startedAt))
  const [showForm, setShowForm] = useState(false)
  const [memo, setMemo] = useState('')
  const [nextAction, setNextAction] = useState('')
  const prevSize = useRef<{ w: number; h: number; x: number; y: number } | null>(null)

  // Pomodoro state
  const [pomEnabled, setPomEnabled] = useState(false)
  const [pomSecondsLeft, setPomSecondsLeft] = useState(WORK_DURATION)
  const [pomIsBreak, setPomIsBreak] = useState(false)
  const [pomTerm, setPomTerm] = useState(1)
  const [pomMessage, setPomMessage] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playAlarm = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/alarm.wav')
    }
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(session.startedAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [session.startedAt])

  // Pomodoro timer
  useEffect(() => {
    if (!pomEnabled) return
    const interval = setInterval(() => {
      setPomSecondsLeft((prev) => {
        if (prev <= 1) {
          // Transition
          if (pomIsBreak) {
            setPomIsBreak(false)
            setPomTerm((t) => t + 1)
            setPomMessage('')
            playAlarm()
            return WORK_DURATION
          } else {
            setPomIsBreak(true)
            setPomMessage(t.pomBreakTime)
            playAlarm()
            return BREAK_DURATION
          }
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [pomEnabled, pomIsBreak, playAlarm, t.pomBreakTime])

  // Clear message after 5 seconds
  useEffect(() => {
    if (!pomMessage) return
    const timer = setTimeout(() => setPomMessage(''), 5000)
    return () => clearTimeout(timer)
  }, [pomMessage])

  const togglePomodoro = () => {
    if (!pomEnabled) {
      setPomEnabled(true)
      setPomSecondsLeft(WORK_DURATION)
      setPomIsBreak(false)
      setPomTerm(1)
      setPomMessage('')
    } else {
      setPomEnabled(false)
      setPomMessage('')
    }
  }

  useEffect(() => {
    if (compact) {
      prevSize.current = {
        w: window.outerWidth,
        h: window.outerHeight,
        x: window.screenX,
        y: window.screenY,
      }
      const formHeight = showForm ? 280 : 0
      const pomHeight = pomEnabled ? 30 : 0
      const targetH = COMPACT_HEIGHT + formHeight + pomHeight
      const screenW = window.screen.availWidth
      window.resizeTo(COMPACT_WIDTH, targetH)
      window.moveTo(screenW - COMPACT_WIDTH - 16, 16)
    }
  }, [compact])

  useEffect(() => {
    if (compact) {
      const pomHeight = pomEnabled ? 30 : 0
      const targetH = showForm ? COMPACT_HEIGHT + 280 + pomHeight : COMPACT_HEIGHT + pomHeight
      window.resizeTo(COMPACT_WIDTH, targetH)
    }
  }, [showForm, compact, pomEnabled])

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

  // Pomodoro status bar (shared between compact and normal)
  const pomBar = pomEnabled ? (
    <div className={`flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-medium ${
      pomIsBreak
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    }`}>
      <span>{pomIsBreak ? t.pomBreak : t.pomWork}</span>
      <span className="font-mono tabular-nums">{formatMmSs(pomSecondsLeft)}</span>
      <span className="text-[10px] opacity-70">{t.pomTerm} {pomTerm}</span>
    </div>
  ) : null

  if (compact) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-1.5 bg-zinc-950 px-4 pb-5 pt-3 select-none">
        <p className="max-w-full truncate text-[11px] font-medium text-zinc-400">
          {task?.title ?? ''}
        </p>
        {pomMessage && (
          <p className={`text-xs font-bold ${pomIsBreak ? 'text-orange-400' : 'text-green-400'}`}>
            {pomMessage}
          </p>
        )}
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
        {pomEnabled && (
          <div className={`flex items-center gap-1.5 text-[10px] font-medium ${
            pomIsBreak ? 'text-green-400' : 'text-orange-400'
          }`}>
            <span>{pomIsBreak ? t.pomBreak : t.pomWork}</span>
            <span className="font-mono tabular-nums">{formatMmSs(pomSecondsLeft)}</span>
            <span className="opacity-60">#{pomTerm}</span>
          </div>
        )}
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
    <div className={`rounded-lg border-2 px-4 py-3 sm:px-5 sm:py-4 ${
      pomIsBreak && pomEnabled
        ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-950/30'
        : 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
    }`}>
      {/* Pomodoro message banner */}
      {pomMessage && (
        <div className={`mb-2 rounded-md px-3 py-2 text-center text-sm font-bold ${
          pomIsBreak
            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {pomMessage}
        </div>
      )}
      {/* Row 1: working label + task name */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
            pomIsBreak && pomEnabled ? 'bg-green-400' : 'bg-blue-400'
          }`} />
          <span className={`relative inline-flex h-3 w-3 rounded-full ${
            pomIsBreak && pomEnabled ? 'bg-green-500' : 'bg-blue-500'
          }`} />
        </span>
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {pomEnabled && pomIsBreak ? t.pomBreak : t.working}
        </span>
        <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {task?.title ?? ''}
        </span>
      </div>
      {/* Row 2: elapsed time + pomodoro + buttons */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-lg font-bold tabular-nums text-blue-700 sm:text-xl dark:text-blue-300">
          {elapsed}
        </span>
        {pomBar}
        {!showForm && (
          <div className="ml-auto flex items-center gap-2">
            {/* Pomodoro toggle */}
            <button
              onClick={togglePomodoro}
              className={`whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                pomEnabled
                  ? 'border-orange-300 bg-orange-100 text-orange-700 hover:bg-orange-200 dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'
              }`}
              title={t.pomodoro}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="13" r="8" /><path strokeLinecap="round" d="M12 5V3m-2 2.5C8 4 9 2 12 2.5M14 5.5C16 4 15 2 12 2.5" /></svg>
              {pomEnabled ? t.pomodoroOn : t.pomodoroOff}
            </button>
            <button
              onClick={onToggleCompact}
              className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
