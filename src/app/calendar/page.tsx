'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import AuthGuard from '../components/AuthGuard'
import { useT } from '../lib/i18n'

interface SessionRow {
  id: string
  task_id: string
  started_at: string
  ended_at: string | null
  memo: string
  next_action: string
  tasks: { title: string; tags: string[] } | null
}

function formatDurationShort(ms: number) {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (hours > 0) return `${hours}h${minutes}m`
  return `${minutes}m`
}

function formatDurationLong(ms: number) {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (hours > 0) return `${hours}時間${minutes}分`
  return `${minutes}分`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function totalMs(sessions: SessionRow[]) {
  let total = 0
  for (const s of sessions) {
    if (s.ended_at) {
      total += new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
    }
  }
  return total
}

function intensityClass(ms: number) {
  if (ms === 0) return ''
  const hours = ms / 3600000
  if (hours < 1) return 'bg-blue-100 dark:bg-blue-900/30'
  if (hours < 3) return 'bg-blue-200 dark:bg-blue-900/50'
  if (hours < 5) return 'bg-blue-300 dark:bg-blue-800/60'
  return 'bg-blue-400 dark:bg-blue-700/70'
}

function getSessionTags(s: SessionRow): string[] {
  return s.tasks?.tags?.length ? s.tasks.tags : []
}

export default function CalendarPage() {
  return (
    <AuthGuard>
      <CalendarContent />
    </AuthGuard>
  )
}

function CalendarContent() {
  const t = useT()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [allSessions, setAllSessions] = useState<SessionRow[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 1).toISOString()

    const [monthRes, allRes] = await Promise.all([
      supabase
        .from('work_sessions')
        .select('*, tasks(title, tags)')
        .gte('started_at', start)
        .lt('started_at', end)
        .order('started_at', { ascending: true }),
      supabase
        .from('work_sessions')
        .select('*, tasks(title, tags)')
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false }),
    ])

    if (monthRes.data) setSessions(monthRes.data as SessionRow[])
    if (allRes.data) setAllSessions(allRes.data as SessionRow[])
    setIsLoaded(true)
  }, [year, month])

  useEffect(() => {
    setIsLoaded(false)
    fetchSessions()
  }, [fetchSessions])

  // All tags from all sessions
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const s of allSessions) {
      for (const tag of getSessionTags(s)) tagSet.add(tag)
    }
    return Array.from(tagSet).sort()
  }, [allSessions])

  // Filter sessions by selected tag
  const filteredSessions = useMemo(() => {
    if (!selectedTag) return sessions
    return sessions.filter((s) => getSessionTags(s).includes(selectedTag))
  }, [sessions, selectedTag])

  const filteredAllSessions = useMemo(() => {
    if (!selectedTag) return allSessions
    return allSessions.filter((s) => getSessionTags(s).includes(selectedTag))
  }, [allSessions, selectedTag])

  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionRow[]> = {}
    for (const s of filteredSessions) {
      const key = toDateKey(new Date(s.started_at))
      if (!map[key]) map[key] = []
      map[key].push(s)
    }
    return map
  }, [filteredSessions])

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11) }
    else setMonth(month - 1)
    setSelectedDate(null)
  }

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0) }
    else setMonth(month + 1)
    setSelectedDate(null)
  }

  const goToday = () => {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedDate(null)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const todayKey = toDateKey(today)

  // Monthly stats
  const monthTotalMs = totalMs(filteredSessions.filter((s) => s.ended_at))
  const workDays = new Set(filteredSessions.map((s) => toDateKey(new Date(s.started_at)))).size
  const avgPerDay = workDays > 0 ? monthTotalMs / workDays : 0

  // Monthly tag breakdown
  const monthTagStats = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of filteredSessions) {
      if (!s.ended_at) continue
      const dur = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
      const tags = getSessionTags(s)
      if (tags.length === 0) {
        map['タグなし'] = (map['タグなし'] ?? 0) + dur
      } else {
        for (const tag of tags) {
          map[tag] = (map[tag] ?? 0) + dur
        }
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filteredSessions])

  // All-time stats
  const allTimeTotalMs = totalMs(filteredAllSessions)
  const allTimeWorkDays = new Set(filteredAllSessions.map((s) => toDateKey(new Date(s.started_at)))).size

  // All-time tag breakdown
  const allTimeTagStats = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of filteredAllSessions) {
      if (!s.ended_at) continue
      const dur = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
      const tags = getSessionTags(s)
      if (tags.length === 0) {
        map['タグなし'] = (map['タグなし'] ?? 0) + dur
      } else {
        for (const tag of tags) {
          map[tag] = (map[tag] ?? 0) + dur
        }
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filteredAllSessions])

  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] ?? []) : []

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t.calendarTitle}
          </h1>
          <div className="flex gap-2">
            <Link
              href="/history"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {t.historyList}
            </Link>
            <Link
              href="/"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {t.backToTasks}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">タグ:</span>
            <button
              onClick={() => setSelectedTag(null)}
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
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
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

        {/* Month nav */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {year}年 {MONTH_NAMES[month]}
            </h2>
            <button onClick={nextMonth} className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button onClick={goToday} className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
              今日
            </button>
          </div>
          <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
            <span>{workDays}日稼働</span>
            <span className="mx-1.5">·</span>
            <span>合計 {formatDurationLong(monthTotalMs)}</span>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="mb-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={`py-2 text-center text-xs font-medium ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="border-b border-r border-zinc-100 p-2 dark:border-zinc-800" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const daySessions = sessionsByDate[dateKey] ?? []
              const dayMs = totalMs(daySessions)
              const isToday = dateKey === todayKey
              const isSelected = dateKey === selectedDate
              const dayOfWeek = (firstDay + i) % 7

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  className={`relative flex min-h-[72px] flex-col border-b border-r border-zinc-100 p-1.5 text-left transition-colors dark:border-zinc-800 ${
                    intensityClass(dayMs)
                  } ${isSelected ? 'ring-2 ring-inset ring-blue-500' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                >
                  <span className={`text-xs font-medium ${
                    isToday
                      ? 'flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white'
                      : dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
                  }`}>
                    {day}
                  </span>
                  {daySessions.length > 0 && (
                    <div className="mt-auto">
                      <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300">
                        {formatDurationShort(dayMs)}
                      </span>
                      <span className="ml-1 text-[10px] text-zinc-400">
                        {daySessions.length}件
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected date detail */}
        {selectedDate && (
          <div className="mb-8 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </h3>
            {selectedSessions.length === 0 ? (
              <p className="text-sm text-zinc-400">この日の作業記録はありません</p>
            ) : (
              selectedSessions.map((s) => (
                <div key={s.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {s.tasks?.title ?? '削除されたタスク'}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatTime(s.started_at)}
                        {s.ended_at ? ` → ${formatTime(s.ended_at)}` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-medium ${s.ended_at ? 'text-zinc-700 dark:text-zinc-300' : 'text-blue-600 dark:text-blue-400'}`}>
                      {s.ended_at ? formatDurationShort(new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) : '作業中...'}
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
              ))
            )}
          </div>
        )}

        {/* Legend */}
        {!selectedDate && isLoaded && (
          <div className="mb-8 flex items-center gap-3 text-[10px] text-zinc-400">
            <span>作業量:</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-blue-100 dark:bg-blue-900/30" /> &lt;1h</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-blue-200 dark:bg-blue-900/50" /> 1-3h</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-blue-300 dark:bg-blue-800/60" /> 3-5h</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-blue-400 dark:bg-blue-700/70" /> 5h+</span>
          </div>
        )}

        {/* Monthly summary */}
        {isLoaded && (
          <div className="mb-8">
            <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {MONTH_NAMES[month]} 月間集計{selectedTag ? ` — ${selectedTag}` : ''}
            </h3>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatDurationLong(monthTotalMs)}</p>
                <p className="text-[10px] text-zinc-500">合計作業時間</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{workDays}<span className="text-sm font-normal text-zinc-500">日</span></p>
                <p className="text-[10px] text-zinc-500">稼働日数</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatDurationLong(avgPerDay)}</p>
                <p className="text-[10px] text-zinc-500">1日平均</p>
              </div>
            </div>
            {monthTagStats.length > 0 && !selectedTag && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">タグ別内訳</p>
                {monthTagStats.map(([tag, ms]) => {
                  const pct = monthTotalMs > 0 ? Math.round((ms / monthTotalMs) * 100) : 0
                  return (
                    <div key={tag} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-center text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        {tag}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-24 shrink-0 text-right text-xs text-zinc-600 dark:text-zinc-400">
                        {formatDurationLong(ms)} <span className="text-zinc-400">({pct}%)</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* All-time summary */}
        {isLoaded && (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              累計集計{selectedTag ? ` — ${selectedTag}` : ''}
            </h3>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatDurationLong(allTimeTotalMs)}</p>
                <p className="text-[10px] text-zinc-500">累計作業時間</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{allTimeWorkDays}<span className="text-sm font-normal text-zinc-500">日</span></p>
                <p className="text-[10px] text-zinc-500">累計稼働日数</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{filteredAllSessions.length}<span className="text-sm font-normal text-zinc-500">件</span></p>
                <p className="text-[10px] text-zinc-500">累計セッション数</p>
              </div>
            </div>
            {allTimeTagStats.length > 0 && !selectedTag && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">タグ別内訳</p>
                {allTimeTagStats.map(([tag, ms]) => {
                  const pct = allTimeTotalMs > 0 ? Math.round((ms / allTimeTotalMs) * 100) : 0
                  return (
                    <div key={tag} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-center text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        {tag}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-24 shrink-0 text-right text-xs text-zinc-600 dark:text-zinc-400">
                        {formatDurationLong(ms)} <span className="text-zinc-400">({pct}%)</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
