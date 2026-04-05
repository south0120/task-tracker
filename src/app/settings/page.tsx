'use client'

import Link from 'next/link'
import AuthGuard from '../components/AuthGuard'
import { useAuth } from '../lib/AuthContext'
import { useLang, useT } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  )
}

function SettingsContent() {
  const { user, signOut } = useAuth()
  const { lang, setLang } = useLang()
  const t = useT()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
            {t.settings}
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
        {/* Language */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t.language}</h2>
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
          <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t.howToUse}</h2>
          <div className="flex flex-col gap-3">
            {t.guide.map((item, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.heading}</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t.account}</h2>
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{user?.email}</p>
          </div>
        </div>

        {/* Danger zone */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-red-600">{t.dangerZone}</h2>
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 dark:border-red-900 dark:bg-red-950/30">
            <p className="mb-3 text-xs text-red-600 dark:text-red-400">{t.deleteWarning}</p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                {t.deleteAccount}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{t.deleteConfirm}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? t.deleting : t.deleteAccount}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-md px-4 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {t.cancel}
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
