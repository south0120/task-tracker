'use client'

import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'

export default function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Task Tracker
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/tags"
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            タグ集計
          </Link>
          <Link
            href="/calendar"
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            カレンダー
          </Link>
          <Link
            href="/history"
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            作業履歴
          </Link>
          {user && (
            <button
              onClick={signOut}
              className="ml-2 rounded-md border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              ログアウト
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
