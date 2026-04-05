# Task Tracker - 実装計画書

## 概要
Next.js 16 + React 19 + Tailwind CSS 4 で構築するタスク管理アプリ。
シンプルで使いやすいUIを重視し、ローカルストレージでデータを永続化する。

## 技術スタック
- Next.js 16.2.2 (App Router)
- React 19.2.4
- Tailwind CSS 4
- Supabase（データ永続化・PostgreSQL）

## 機能一覧

### Phase 1: コア機能 ✅基本のタスクCRUD
- [x] タスクの追加（タイトル必須、説明任意）
- [x] タスクの一覧表示
- [x] タスクの完了/未完了トグル
- [x] タスクの削除
- [x] LocalStorageへの保存・読み込み

### Phase 2: 整理・分類機能
- [x] 優先度（高・中・低）の設定
- [ ] カテゴリ/ラベルの追加
- [x] フィルター（全て / 未完了 / 完了済み）
- [x] ソート（作成日 / 優先度）

### Phase 3: UX向上
- [ ] タスクの編集（インライン編集）
- [ ] ドラッグ＆ドロップで並び替え
- [ ] ダークモード対応
- [ ] レスポンシブデザイン

### Phase 4: 勤怠管理機能
- [x] 作業開始/終了ボタン（タスクごと）
- [x] アクティブセッション表示（経過時間リアルタイム）
- [x] work_sessionsテーブル（Supabase）
- [ ] 作業履歴の一覧表示
- [ ] 日別/週別の作業時間集計

### Phase 5: 発展機能（任意）
- [ ] 期限の設定と期限切れ警告
- [ ] 検索機能
- [ ] データのエクスポート/インポート（JSON）

## ファイル構成（予定）
```
src/app/
├── layout.tsx          # 共通レイアウト
├── page.tsx            # メインページ
├── globals.css         # グローバルスタイル
├── components/
│   ├── TaskForm.tsx     # タスク追加フォーム
│   ├── TaskList.tsx     # タスク一覧
│   ├── TaskItem.tsx     # 個別タスク
│   ├── FilterBar.tsx    # フィルター・ソートバー
│   └── Header.tsx       # ヘッダー
├── hooks/
│   └── useLocalStorage.ts  # LocalStorage用カスタムフック
└── types/
    └── task.ts          # 型定義
```

## データ構造
```typescript
type Priority = 'high' | 'medium' | 'low'

interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  priority: Priority
  category: string
  createdAt: string   // ISO 8601
  updatedAt: string   // ISO 8601
}
```

## 進捗状況
- Phase 1: **完了**
- Phase 2: 進行中（カテゴリ/ラベル未実装）
- Phase 3: 未着手
- Phase 4: 進行中（作業開始/終了は完了、履歴・集計は未着手）
- Phase 5: 未着手
