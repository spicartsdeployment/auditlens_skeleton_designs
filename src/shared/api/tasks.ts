import api from './client'
import { mockTasks } from '@/mock/api'
import type { Task } from '@/shared/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const realTasksApi = {
  list: () => api.get<Task[]>('/tasks'),
  get: (id: number) => api.get<Task>(`/tasks/${id}`),
  create: (data: any) => api.post<Task>('/tasks', data),
  update: (id: number, data: Partial<Task>) => api.patch<Task>(`/tasks/${id}`, data),
  markDocUploaded: (taskId: number, docId: number) =>
    api.patch(`/tasks/${taskId}/documents/${docId}/upload`),
}

export const tasksApi: typeof realTasksApi = (USE_MOCK ? mockTasks : realTasksApi) as typeof realTasksApi
