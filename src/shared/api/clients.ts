import api from './client'
import { mockClients } from '@/mock/api'
import type { Client } from '@/shared/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const realClientsApi = {
  list: () => api.get<Client[]>('/clients'),
  get: (id: number) => api.get<Client>(`/clients/${id}`),
  create: (data: Partial<Client>) => api.post<Client>('/clients', data),
  update: (id: number, data: Partial<Client>) => api.patch<Client>(`/clients/${id}`, data),
  getActivity: (id: number) => api.get<any[]>(`/clients/${id}/activity`),
}

export const clientsApi: typeof realClientsApi = (USE_MOCK ? mockClients : realClientsApi) as typeof realClientsApi
