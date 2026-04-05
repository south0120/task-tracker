'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AuthGuard from '../components/AuthGuard'
import { useAuth } from '../lib/AuthContext'
import { useT } from '../lib/i18n'
import { supabase } from '../lib/supabase'

interface DeletedTask {
  id: string
  title: string
  priority: string
  tags: string[]
  deleted_at: string
  created_at: string
}

export default function TrashPage() {
  return (
    <AuthGuard>
      <TrashContent />
    </AuthGuard>
  )
}

function TrashContent() {
  const { user } = useAuth()
  const t = useT()
  const [tasks, setTasks] = useState<DeletedTask[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchDeleted = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('id, title, priority, tags, deleted_at, created_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (data) setTasks(data as DeletedTask[])
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    fetchDeleted()
  }, [fetchDeleted])

  const restoreTask = async (id: string) => {
    await supabase
      .from('tasks')
      .update({ deleted_at: null })
      .eq('id', id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const permanentDelete = async (id: string) => {
    await supabase.from('work_sessions').delete().eq('task_id', id)
    await supabase.from('tasks').delete().eq('id', id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const emptyTrash = async () => {
    for (const task of tasks) {
      await supabase.from('work_sessions').delete().eq('task_id', task.id)
      await supabase.from('tasks').delete().eq('id', task.id)
    }
    setTasks([])
  }

  const isJa = t.taskTracker === 'Task Tracker' && t.tags === '\u30bf\u30b0\u96c6\u8a08'

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isJa ? '\u30b4\u30df\u7bb1' : 'Trash'}
          </h1>
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {t.backToTasks}
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {!isLoaded ? (
          <div className="py-12 text-center text-sm text-zinc-400">{t.loading}</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">
            {isJa ? '\u30b4\u30df\u7bb1\u306f\u7a7a\u3067\u3059' : 'Trash is empty'}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-zinc-500">{tasks.length} {isJa ? '\u4ef6' : 'items'}</p>
              <button
                onClick={emptyTrash}
                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
              >
                {isJa ? '\u30b4\u30df\u7bb1\u3092\u7a7a\u306b\u3059\u308b' : 'Empty Trash'}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{task.title}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-400">
                      {isJa ? '\u524a\u9664\u65e5: ' : 'Deleted: '}
                      {new Date(task.deleted_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => restoreTask(task.id)}
                      className="whitespace-nowrap rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600"
                    >
                      {isJa ? '\u5fa9\u5143' : 'Restore'}
                    </button>
                    <button
                      onClick={() => permanentDelete(task.id)}
                      className="whitespace-nowrap rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                    >
                      {isJa ? '\u5b8c\u5168\u524a\u9664' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}
