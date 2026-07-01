import api from './client'
import type { Thread, Message } from '@/shared/types'

export const commsApi = {
  listThreads: () => api.get<Thread[]>('/communications/threads'),
  createThread: (data: { title?: string; participant_ids: number[]; is_group?: boolean }) =>
    api.post<Thread>('/communications/threads', data),
  getMessages: (threadId: number) =>
    api.get<Message[]>(`/communications/threads/${threadId}/messages`),
  sendMessage: (threadId: number, content: string) =>
    api.post<Message>(`/communications/threads/${threadId}/messages`, { content }),
}
