import api from './client'
import { mockDashboard } from '@/mock/api'
import type { DashboardData } from '@/shared/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const realDashboardApi = {
  get: () => api.get<DashboardData>('/dashboard'),
}

export const dashboardApi: typeof realDashboardApi = (USE_MOCK ? mockDashboard : realDashboardApi) as typeof realDashboardApi
