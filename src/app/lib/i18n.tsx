'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Lang = 'ja' | 'en'

interface I18nContextType {
  lang: Lang
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nContextType>({
  lang: 'ja',
  setLang: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ja')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('lang')
    if (saved === 'en' || saved === 'ja') setLangState(saved)
    setLoaded(true)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  if (!loaded) return null

  return (
    <I18nContext.Provider value={{ lang, setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useLang() {
  return useContext(I18nContext)
}

// Translations
const translations = {
  ja: {
    taskTracker: 'Task Tracker',
    tags: 'タグ集計',
    calendar: 'カレンダー',
    history: '作業履歴',
    logout: 'ログアウト',
    loading: '読み込み中...',
    loginTitle: 'Task Tracker',
    loginSub: 'ログインして始めましょう',
    loginGoogle: 'Googleでログイン',
    addTask: 'タスクを追加',
    title: 'タイトル',
    description: '説明（任意）',
    priority: '優先度',
    priorityHigh: '高',
    priorityMedium: '中',
    priorityLow: '低',
    add: '追加',
    all: 'すべて',
    active: '未完了',
    completed: '完了',
    sortCreated: '作成日順',
    sortPriority: '優先度順',
    working: '作業中',
    start: '作業開始',
    end: '終了',
    memo: 'やったこと・進捗メモ',
    memoPlaceholder: '今日はどこまで進めた？',
    nextAction: '次にやること',
    nextPlaceholder: '次はどこから始める？',
    skip: 'スキップ',
    saveAndEnd: 'メモを保存して終了',
    saveEnd: '保存して終了',
    noTasks: 'タスクがありません',
    deletedTask: '削除されたタスク',
    expand: '展開',
    // Calendar
    calendarTitle: 'カレンダー',
    historyList: '履歴一覧',
    backToTasks: '← タスク',
    today: '今日',
    workDays: '日稼��',
    total: '合計',
    noRecord: 'この日の作業記録はありません',
    workVolume: '作業量:',
    monthlyStats: '月間集計',
    totalWorkTime: '合計作業時間',
    workDayCount: '稼働日数',
    avgPerDay: '1日平均',
    tagBreakdown: 'タグ別内訳',
    allTimeStats: '累計集計',
    allTimeWork: '累計作業時間',
    allTimeWorkDays: '累計稼働日数',
    allTimeSessions: '累計セッション数',
    noTag: 'タグなし',
    tagFilter: 'タグ:',
    // History
    historyTitle: '作業履歴',
    backToTaskList: '← タスク一覧',
    noHistory: '作業履歴がありません',
    workingNow: '作業中...',
    // Tags
    tagsTitle: 'タグ別集計',
    thisWeek: '今週',
    thisMonth: '今月',
    allTime: '全期間',
    noRecords: '作業記録がありません',
    items: '件',
    times: '回',
    // Settings
    settings: '設定',
    language: '言語',
    howToUse: '使い方',
    account: 'アカウント',
    dangerZone: '危険な操作',
    deleteAccount: 'アカウントを削除',
    deleteWarning: 'アカウントとすべてのタスク・作業履歴が完全に削除されます。この操作は取り消せません。',
    deleteConfirm: '本当に削除しますか？すべてのデータが失われます。',
    deleting: '削除中...',
    cancel: 'キャンセル',
    // Pomodoro
    pomodoro: 'ポモドーロ',
    pomodoroOn: 'ON',
    pomodoroOff: 'OFF',
    pomWork: '作業',
    pomBreak: '休憩',
    pomTerm: 'ターム',
    pomBreakTime: '休憩しましょう！',
    pomWorkTime: '作業を再開しましょう！',
    guide: [
      { heading: 'タスク管理', body: 'トップ画面でタスクを追加・編集・削除できます。優先度（高・中・低）とタグで整理しましょう。' },
      { heading: '作業セッション', body: 'タスクの「作業開始」ボタンで作業時間を計測できます。終了時にメモと次にやることを記録できます。' },
      { heading: 'コンパクトモード', body: '作業中に縮小ボタン（PiPアイコン）を押すと、ウィンドウが自動で小さくなり画面右上にタイマーだけ表示されます。「展開」で元に戻ります。' },
      { heading: 'ポモドーロ', body: '作業中にポモドーロモードをONにすると、25分作業+5分休憩のサイクルで集中できます。切り替え時にアラームが鳴ります。' },
      { heading: 'カレンダー', body: '月間の作業量をカレンダー形式で確認できます。日付をクリックするとその日の詳細が見られます。' },
      { heading: 'タグ集計', body: 'タグ別の作業時間を期間ごと（今週・今月・全期間）に集計します。' },
      { heading: '作業履歴', body: '過去の作業セッションを日付順で確認できます。' },
      { heading: 'PWA', body: 'ブラウザのインストールボタンからデスクトップアプリとして利用できます。' },
    ],
  },
  en: {
    taskTracker: 'Task Tracker',
    tags: 'Tags',
    calendar: 'Calendar',
    history: 'History',
    logout: 'Logout',
    loading: 'Loading...',
    loginTitle: 'Task Tracker',
    loginSub: 'Sign in to get started',
    loginGoogle: 'Sign in with Google',
    addTask: 'Add Task',
    title: 'Title',
    description: 'Description (optional)',
    priority: 'Priority',
    priorityHigh: 'High',
    priorityMedium: 'Med',
    priorityLow: 'Low',
    add: 'Add',
    all: 'All',
    active: 'Active',
    completed: 'Done',
    sortCreated: 'By date',
    sortPriority: 'By priority',
    working: 'Working',
    start: 'Start',
    end: 'Stop',
    memo: 'What you did',
    memoPlaceholder: 'What did you accomplish?',
    nextAction: 'Next action',
    nextPlaceholder: 'What to do next?',
    skip: 'Skip',
    saveAndEnd: 'Save & Stop',
    saveEnd: 'Save & Stop',
    noTasks: 'No tasks',
    deletedTask: 'Deleted task',
    expand: 'Expand',
    // Calendar
    calendarTitle: 'Calendar',
    historyList: 'History',
    backToTasks: '\u2190 Tasks',
    today: 'Today',
    workDays: 'd worked',
    total: 'Total',
    noRecord: 'No work records for this day',
    workVolume: 'Volume:',
    monthlyStats: 'Monthly Stats',
    totalWorkTime: 'Total work time',
    workDayCount: 'Work days',
    avgPerDay: 'Avg/day',
    tagBreakdown: 'By tag',
    allTimeStats: 'All-time Stats',
    allTimeWork: 'Total work time',
    allTimeWorkDays: 'Total work days',
    allTimeSessions: 'Total sessions',
    noTag: 'No tag',
    tagFilter: 'Tag:',
    // History
    historyTitle: 'Work History',
    backToTaskList: '\u2190 Tasks',
    noHistory: 'No work history',
    workingNow: 'Working...',
    // Tags
    tagsTitle: 'Tag Stats',
    thisWeek: 'This week',
    thisMonth: 'This month',
    allTime: 'All time',
    noRecords: 'No work records',
    items: '',
    times: 'x',
    // Settings
    settings: 'Settings',
    language: 'Language',
    howToUse: 'How to Use',
    account: 'Account',
    dangerZone: 'Danger Zone',
    deleteAccount: 'Delete Account',
    deleteWarning: 'Your account and all tasks, work sessions will be permanently deleted. This cannot be undone.',
    deleteConfirm: 'Are you sure? All data will be lost permanently.',
    deleting: 'Deleting...',
    cancel: 'Cancel',
    // Pomodoro
    pomodoro: 'Pomodoro',
    pomodoroOn: 'ON',
    pomodoroOff: 'OFF',
    pomWork: 'Work',
    pomBreak: 'Break',
    pomTerm: 'Term',
    pomBreakTime: 'Time for a break!',
    pomWorkTime: 'Back to work!',
    guide: [
      { heading: 'Task Management', body: 'Add, edit, and delete tasks from the home screen. Organize with priority (high/medium/low) and tags.' },
      { heading: 'Work Sessions', body: 'Press "Start" on a task to track time. Record a memo and next action when you stop.' },
      { heading: 'Compact Mode', body: 'While working, press the PiP icon to shrink the window to a small timer in the top-right corner. Press "Expand" to restore.' },
      { heading: 'Pomodoro', body: 'Enable Pomodoro mode during a session for 25min work + 5min break cycles. An alarm sounds at each transition.' },
      { heading: 'Calendar', body: 'View monthly work volume in a calendar. Click a date to see session details.' },
      { heading: 'Tag Stats', body: 'See work time broken down by tag for this week, this month, or all time.' },
      { heading: 'Work History', body: 'Browse past work sessions in chronological order.' },
      { heading: 'PWA', body: 'Install as a desktop app using the browser\'s install button.' },
    ],
  },
}

type TranslationKey = keyof typeof translations.ja

export type Translations = {
  [K in TranslationKey]: (typeof translations.ja)[K]
}

export function useT() {
  const { lang } = useLang()
  return translations[lang] as Translations
}
