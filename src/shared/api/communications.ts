import api from './client'
import { mockComms } from '@/mock/api'
import type { Thread, Message } from '@/shared/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const realCommsApi = {
  listThreads: () => api.get<Thread[]>('/communications/threads'),
  createThread: (data: { title?: string; participant_ids: number[]; is_group?: boolean }) =>
    api.post<Thread>('/communications/threads', data),
  getMessages: (threadId: number) =>
    api.get<Message[]>(`/communications/threads/${threadId}/messages`),
  sendMessage: (threadId: number, content: string) =>
    api.post<Message>(`/communications/threads/${threadId}/messages`, { content }),
}

export const commsApi: typeof realCommsApi = (USE_MOCK ? mockComms : realCommsApi) as typeof realCommsApi
