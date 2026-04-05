'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

interface SessionRow {
  id: string
  task_id: string
  started_at: string
  ended_at: string | null
  memo: string
  next_action: string
  tasks: { title: string } | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(startedAt: string, endedAt: string | null) {
  if (!endedAt) return '作業中...'
  const diff = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `${hours}時間${minutes}分`
  return `${minutes}分`
}

function groupByDate(sessions: SessionRow[]) {
  const groups: Record<string, SessionRow[]> = {}
  for (const s of sessions) {
    const dateKey = new Date(s.started_at).toLocaleDateString('ja-JP')
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(s)
  }
  return groups
}

function calcTotalMinutes(sessions: SessionRow[]) {
  let total = 0
  for (const s of sessions) {
    if (s.ended_at) {
      total += new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
    }
  }
  return Math.floor(total / 60000)
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from('work_sessions')
      .select('*, tasks(title)')
      .order('started_at', { ascending: false })
      .limit(100)

    if (data) setSessions(data as SessionRow[])
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-zinc-400">読み込み中...</div>
      </div>
    )
  }

  const grouped = groupByDate(sessions)
  const dateKeys = Object.keys(grouped)

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            作業履歴
          </h1>
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ← タスク一覧
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {sessions.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">作業履歴がありません</div>
        ) : (
          <div className="flex flex-col gap-8">
            {dateKeys.map((dateKey) => {
              const daySessions = grouped[dateKey]
              const totalMin = calcTotalMinutes(daySessions)
              const totalH = Math.floor(totalMin / 60)
              const totalM = totalMin % 60
              return (
                <div key={dateKey}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {formatDate(daySessions[0].started_at)}
                    </h2>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      合計: {totalH > 0 ? `${totalH}時間` : ''}{totalM}分
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {daySessions.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {s.tasks?.title ?? '削除されたタスク'}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                              {formatTime(s.started_at)}
                              {s.ended_at ? ` → ${formatTime(s.ended_at)}` : ''}
                            </p>
                          </div>
                          <span className={`shrink-0 text-sm font-medium ${s.ended_at ? 'text-zinc-700 dark:text-zinc-300' : 'text-blue-600 dark:text-blue-400'}`}>
                            {formatDuration(s.started_at, s.ended_at)}
                          </span>
                        </div>
                        {(s.memo || s.next_action) && (
                          <div className="mt-2 flex flex-col gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                            {s.memo && (
                              <div className="flex items-start gap-1.5">
                                <span className="mt-px text-[10px] font-medium text-zinc-400">memo:</span>
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">{s.memo}</span>
                              </div>
                            )}
                            {s.next_action && (
                              <div className="flex items-start gap-1.5">
                                <span className="mt-px text-[10px] font-medium text-amber-500">次:</span>
                                <span className="text-xs text-amber-700 dark:text-amber-400">{s.next_action}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
