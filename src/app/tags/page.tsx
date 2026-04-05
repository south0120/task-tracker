'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

interface SessionRow {
  id: string
  task_id: string
  started_at: string
  ended_at: string | null
  tasks: { title: string; tags: string[] } | null
}

type Period = 'week' | 'month' | 'all'

function startOfWeek() {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDuration(ms: number) {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (hours > 0) return `${hours}時間${minutes}分`
  return `${minutes}分`
}

function formatHours(ms: number) {
  return (ms / 3600000).toFixed(1)
}

export default function TagsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [period, setPeriod] = useState<Period>('month')
  const [expandedTag, setExpandedTag] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    let query = supabase
      .from('work_sessions')
      .select('*, tasks(title, tags)')
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })

    if (period === 'week') {
      query = query.gte('started_at', startOfWeek().toISOString())
    } else if (period === 'month') {
      query = query.gte('started_at', startOfMonth().toISOString())
    }

    const { data } = await query
    if (data) setSessions(data as SessionRow[])
    setIsLoaded(true)
  }, [period])

  useEffect(() => {
    setIsLoaded(false)
    fetchSessions()
  }, [fetchSessions])

  const tagStats = useMemo(() => {
    const map: Record<string, { totalMs: number; count: number; tasks: Record<string, { title: string; totalMs: number; count: number }> }> = {}

    for (const s of sessions) {
      if (!s.ended_at || !s.tasks) continue
      const duration = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
      const tags = s.tasks.tags?.length > 0 ? s.tasks.tags : ['タグなし']

      for (const tag of tags) {
        if (!map[tag]) map[tag] = { totalMs: 0, count: 0, tasks: {} }
        map[tag].totalMs += duration
        map[tag].count += 1

        const taskKey = s.task_id
        if (!map[tag].tasks[taskKey]) map[tag].tasks[taskKey] = { title: s.tasks.title, totalMs: 0, count: 0 }
        map[tag].tasks[taskKey].totalMs += duration
        map[tag].tasks[taskKey].count += 1
      }
    }

    return Object.entries(map)
      .map(([tag, data]) => ({
        tag,
        ...data,
        taskList: Object.values(data.tasks).sort((a, b) => b.totalMs - a.totalMs),
      }))
      .sort((a, b) => b.totalMs - a.totalMs)
  }, [sessions])

  const grandTotal = useMemo(() => {
    let total = 0
    for (const s of sessions) {
      if (s.ended_at) total += new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
    }
    return total
  }, [sessions])

  const maxMs = tagStats.length > 0 ? tagStats[0].totalMs : 1

  const periodLabels: Record<Period, string> = { week: '今週', month: '今月', all: '全期間' }

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            タグ別集計
          </h1>
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ← タスク
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {/* Period selector + total */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {(['week', 'month', 'all'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setExpandedTag(null) }}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
          {isLoaded && (
            <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
              合計 <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatDuration(grandTotal)}</span>
              <span className="ml-1.5">({sessions.length}件)</span>
            </div>
          )}
        </div>

        {!isLoaded ? (
          <div className="py-12 text-center text-sm text-zinc-400">読み込み中...</div>
        ) : tagStats.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">作業記録がありません</div>
        ) : (
          <div className="flex flex-col gap-3">
            {tagStats.map(({ tag, totalMs, count, taskList }) => {
              const pct = Math.round((totalMs / grandTotal) * 100)
              const barWidth = Math.max((totalMs / maxMs) * 100, 2)
              const isExpanded = expandedTag === tag

              return (
                <div key={tag}>
                  <button
                    onClick={() => setExpandedTag(isExpanded ? null : tag)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                          {tag}
                        </span>
                        <span className="text-xs text-zinc-400">{count}件</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatDuration(totalMs)}
                        </span>
                        <span className="text-xs text-zinc-400">({pct}%)</span>
                        <svg className={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-violet-200 pl-4 dark:border-violet-800">
                      {taskList.map((t, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-700 dark:text-zinc-300">{t.title}</span>
                            <span className="text-[10px] text-zinc-400">{t.count}回</span>
                          </div>
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            {formatDuration(t.totalMs)}
                            <span className="ml-1 text-[10px] text-zinc-400">({formatHours(t.totalMs)}h)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
