'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthGuard from '../components/AuthGuard'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

type Lang = 'ja' | 'en'

const t = {
  ja: {
    title: '設定',
    back: '\u2190 \u30bf\u30b9\u30af',
    howToUse: '使い方',
    guide: [
      { heading: 'タスク管理', body: 'トップ画面でタスクを��加・編集・削除できます。優先度（高・中・低）とタグで整理しましょう。' },
      { heading: '作業セッション', body: 'タスクの「作業開始」ボタンで作業時間を計測できます。終了時にメモと次にやることを記録できます。' },
      { heading: 'コンパクトモード', body: '作業中に縮小ボタン（PiPアイコン）を押すと、ウィンド���が自動で小さくなり画面右上にタイマーだけ表示されます。「展開」で元に戻ります。' },
      { heading: 'カレンダー', body: '月間の作業量をカレンダー形式で確認できます。日付をクリックするとその日の詳細が見られます。' },
      { heading: 'タグ集計', body: 'タグ別の作業時間を期間ごと（今週・今月・全期間）に集計します。' },
      { heading: '作業履歴', body: '過去の���業セッションを日付順で確認できます。' },
      { heading: 'PWA', body: 'ブラウザのインストールボタンからデスクトップアプリとして利用できます。' },
    ],
    dangerZone: '危険な操作',
    deleteAccount: 'アカウントを削除',
    deleteWarning: 'アカウントとすべてのタスク・作業履歴が完全に削除されます。この操作は取り消せません。',
    deleteConfirm: '本当に削除しますか？すべてのデータが失われます。',
    deleting: '削除中...',
    language: '言語',
  },
  en: {
    title: 'Settings',
    back: '\u2190 Tasks',
    howToUse: 'How to Use',
    guide: [
      { heading: 'Task Management', body: 'Add, edit, and delete tasks from the home screen. Organize with priority (high/medium/low) and tags.' },
      { heading: 'Work Sessions', body: 'Press "Start Work" on a task to track time. Record a memo and next action when you stop.' },
      { heading: 'Compact Mode', body: 'While working, press the PiP icon to shrink the window to a small timer in the top-right corner. Press "Expand" to restore.' },
      { heading: 'Calendar', body: 'View monthly work volume in a calendar. Click a date to see session details.' },
      { heading: 'Tag Stats', body: 'See work time broken down by tag for this week, this month, or all time.' },
      { heading: 'Work History', body: 'Browse past work sessions in chronological order.' },
      { heading: 'PWA', body: 'Install as a desktop app using the browser\'s install button.' },
    ],
    dangerZone: 'Danger Zone',
    deleteAccount: 'Delete Account',
    deleteWarning: 'Your account and all tasks, work sessions will be permanently deleted. This cannot be undone.',
    deleteConfirm: 'Are you sure? All data will be lost permanently.',
    deleting: 'Deleting...',
    language: 'Language',
  },
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  )
}

function SettingsContent() {
  const { user, signOut } = useAuth()
  const [lang, setLang] = useState<Lang>('ja')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const s = t[lang]

  const handleDeleteAccount = async () => {
    if (!user) return
    setDeleting(true)

    await supabase.from('work_sessions').delete().eq('user_id', user.id)
    await supabase.from('tasks').delete().eq('user_id', user.id)

    await signOut()
    setDeleting(false)
  }

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {s.title}
          </h1>
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {s.back}
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {/* Language */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{s.language}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setLang('ja')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                lang === 'ja'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              日本語
            </button>
            <button
              onClick={() => setLang('en')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                lang === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* How to use */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{s.howToUse}</h2>
          <div className="flex flex-col gap-3">
            {s.guide.map((item, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.heading}</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {lang === 'ja' ? 'アカウント' : 'Account'}
          </h2>
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{user?.email}</p>
          </div>
        </div>

        {/* Danger zone */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-red-600">{s.dangerZone}</h2>
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 dark:border-red-900 dark:bg-red-950/30">
            <p className="mb-3 text-xs text-red-600 dark:text-red-400">{s.deleteWarning}</p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                {s.deleteAccount}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{s.deleteConfirm}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? s.deleting : s.deleteAccount}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-md px-4 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {lang === 'ja' ? 'キャンセル' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
