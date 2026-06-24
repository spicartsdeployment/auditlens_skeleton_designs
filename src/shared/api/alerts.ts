import api from './client'
import { mockAlerts } from '@/mock/api'
import type { Alert } from '@/shared/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const realAlertsApi = {
  list: (unreadOnly?: boolean) =>
    api.get<Alert[]>('/alerts', { params: unreadOnly ? { unread_only: true } : {} }),
  markRead: (id: number) => api.patch(`/alerts/${id}/read`),
  markAllRead: () => api.post('/alerts/read-all'),
}

export const alertsApi: typeof realAlertsApi = (USE_MOCK ? mockAlerts : realAlertsApi) as typeof realAlertsApi
