import api from './client'
import { mockAuth } from '@/mock/api'
import type { User } from '@/shared/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const realAuthApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string }>('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
  seedDemo: () => api.post<{ message: string; users: any[] }>('/auth/seed-demo'),
}

export const authApi: typeof realAuthApi = (USE_MOCK ? mockAuth : realAuthApi) as typeof realAuthApi
