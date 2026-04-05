export type Priority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  priority: Priority
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  lastNextAction: string
}

export interface WorkSession {
  id: string
  taskId: string
  startedAt: string
  endedAt: string | null
}
