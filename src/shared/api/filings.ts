import api from './client'
import { mockFilings } from '@/mock/api'
import type { Filing } from '@/shared/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const realFilingsApi = {
  list: (params?: { client_id?: number; filing_type?: string }) =>
    api.get<Filing[]>('/filings', { params }),
  get: (id: number) => api.get<Filing>(`/filings/${id}`),
  create: (data: any) => api.post<Filing>('/filings', data),
  update: (id: number, data: Partial<Filing>) => api.patch<Filing>(`/filings/${id}`, data),
}

export const filingsApi: typeof realFilingsApi = (USE_MOCK ? mockFilings : realFilingsApi) as typeof realFilingsApi
