'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Header from './components/Header'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import FilterBar, { type FilterType, type SortType } from './components/FilterBar'
import ActiveSession from './components/ActiveSession'
import AuthGuard from './components/AuthGuard'
import { supabase } from './lib/supabase'
import { useAuth } from './lib/AuthContext'
import type { Task, Priority, WorkSession } from './types/task'

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  )
}

function HomeContent() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('created')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    const [tasksRes, sessionRes, nextActionsRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('work_sessions').select('*').is('ended_at', null).limit(1).maybeSingle(),
      supabase.from('work_sessions').select('task_id, next_action, started_at').not('next_action', 'eq', '').order('started_at', { ascending: false }),
    ])

    const latestNextAction: Record<string, string> = {}
    if (nextActionsRes.data) {
      for (const row of nextActionsRes.data) {
        if (!latestNextAction[row.task_id]) {
          latestNextAction[row.task_id] = row.next_action
        }
      }
    }

    if (tasksRes.data) {
      setTasks(tasksRes.data.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description ?? '',
        completed: row.completed ?? false,
        priority: row.priority ?? 'medium',
        category: row.category ?? '',
        tags: row.tags ?? [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastNextAction: latestNextAction[row.id] ?? '',
      })))
    }

    if (sessionRes.data) {
      setActiveSession({
        id: sessionRes.data.id,
        taskId: sessionRes.data.task_id,
        startedAt: sessionRes.data.started_at,
        endedAt: sessionRes.data.ended_at,
      })
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addTask = async (title: string, description: string, priority: Priority, tags: string[]) => {
    const { data } = await supabase
      .from('tasks')
      .insert({ title, description, priority, tags, user_id: user!.id })
      .select()
      .single()

    if (data) {
      setTasks((prev) => [{
        id: data.id,
        title: data.title,
        description: data.description ?? '',
        completed: data.completed ?? false,
        priority: data.priority ?? 'medium',
        category: data.category ?? '',
        tags: data.tags ?? [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lastNextAction: '',
      }, ...prev])
    }
  }

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    await supabase
      .from('tasks')
      .update({ completed: !task.completed, updated_at: new Date().toISOString() })
      .eq('id', id)

    setTasks((prev) => prev.map((t) =>
      t.id === id ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() } : t
    ))
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const updateTitle = async (id: string, title: string) => {
    await supabase
      .from('tasks')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id)

    setTasks((prev) => prev.map((t) =>
      t.id === id ? { ...t, title, updatedAt: new Date().toISOString() } : t
    ))
  }

  const updateTags = async (id: string, tags: string[]) => {
    await supabase
      .from('tasks')
      .update({ tags, updated_at: new Date().toISOString() })
      .eq('id', id)

    setTasks((prev) => prev.map((t) =>
      t.id === id ? { ...t, tags, updatedAt: new Date().toISOString() } : t
    ))
  }

  const startWork = async (taskId: string) => {
    const { data } = await supabase
      .from('work_sessions')
      .insert({ task_id: taskId, user_id: user!.id })
      .select()
      .single()

    if (data) {
      setActiveSession({
        id: data.id,
        taskId: data.task_id,
        startedAt: data.started_at,
        endedAt: data.ended_at,
      })
    }
  }

  const stopWork = async (memo: string, nextAction: string) => {
    if (!activeSession) return
    const taskId = activeSession.taskId

    await supabase
      .from('work_sessions')
      .update({ ended_at: new Date().toISOString(), memo, next_action: nextAction })
      .eq('id', activeSession.id)

    if (nextAction) {
      setTasks((prev) => prev.map((t) =>
        t.id === taskId ? { ...t, lastNextAction: nextAction } : t
      ))
    }

    setActiveSession(null)
  }

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    tasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [tasks])

  const counts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter((t) => !t.completed).length,
    completed: tasks.filter((t) => t.completed).length,
  }), [tasks])

  const filteredAndSorted = useMemo(() => {
    let result = tasks
    if (filter === 'active') result = result.filter((t) => !t.completed)
    if (filter === 'completed') result = result.filter((t) => t.completed)
    if (selectedTag) result = result.filter((t) => t.tags.includes(selectedTag))
    if (sort === 'priority') {
      result = [...result].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    }
    return result
  }, [tasks, filter, sort, selectedTag])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-zinc-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="flex flex-col gap-6">
          {activeSession && (
            <ActiveSession
              session={activeSession}
              task={tasks.find((t) => t.id === activeSession.taskId)}
              onStop={stopWork}
            />
          )}
          <TaskForm onAdd={addTask} allTags={allTags} />
          <FilterBar
            filter={filter}
            sort={sort}
            selectedTag={selectedTag}
            allTags={allTags}
            onFilterChange={setFilter}
            onSortChange={setSort}
            onTagChange={setSelectedTag}
            counts={counts}
          />
          <TaskList
            tasks={filteredAndSorted}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onStartWork={startWork}
            onUpdateTitle={updateTitle}
            onUpdateTags={updateTags}
            allTags={allTags}
            activeTaskId={activeSession?.taskId ?? null}
          />
        </div>
      </main>
    </>
  )
}
