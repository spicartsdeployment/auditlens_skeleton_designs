import api from './client'
import type { User, PermissionOverride } from '@/shared/types'

export const usersApi = {
  list: () => api.get<User[]>('/users'),
  get: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: Partial<User> & { password: string }) => api.post<User>('/users', data),
  update: (id: number, data: Partial<User>) => api.patch<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  setPermissions: (id: number, permissions: PermissionOverride[]) =>
    api.put<PermissionOverride[]>(`/users/${id}/permissions`, permissions),
}
