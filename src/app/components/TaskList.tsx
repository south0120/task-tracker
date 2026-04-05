'use client'

import type { Task } from '../types/task'
import TaskItem from './TaskItem'
import { useT } from '../lib/i18n'

interface TaskListProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onStartWork: (id: string) => void
  onUpdateTitle: (id: string, title: string) => void
  onUpdateTags: (id: string, tags: string[]) => void
  allTags: string[]
  activeTaskId: string | null
}

export default function TaskList({ tasks, onToggle, onDelete, onStartWork, onUpdateTitle, onUpdateTags, allTags, activeTaskId }: TaskListProps) {
  const t = useT()

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
        {t.noTasks}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onStartWork={onStartWork}
          onUpdateTitle={onUpdateTitle}
          onUpdateTags={onUpdateTags}
          allTags={allTags}
          isWorking={task.id === activeTaskId}
          canStartWork={activeTaskId === null}
        />
      ))}
    </div>
  )
}
