import { useAuthStore } from './useAuthStore'
import type { UserRole } from '@/shared/types'

export function usePermission() {
  const user = useAuthStore((s) => s.user)

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const isSuperAdmin = () => hasRole('super_admin')
  const isAdmin = () => hasRole('admin', 'super_admin')
  const isArticle = () => hasRole('article')

  const canAccess = (screen: string): boolean => {
    if (!user) return false
    const override = user.permissions?.find((p) => p.screen === screen)
    if (override) return override.can_view

    // Default RBAC
    // Super Admin: firm management only — no operational filing/task work
    const superAdminScreens = [
      'dashboard', 'workspace', 'clients', 'users', 'notices',
      'communication', 'documents', 'calendar', 'reports', 'subscription',
    ]
    // Admin (CA): full operational access
    const adminScreens = [
      'dashboard', 'workspace', 'clients', 'tasks', 'gst', 'tds', 'audit',
      'users', 'communication', 'documents', 'calendar', 'reports', 'notices',
    ]
    // Article: limited to assigned work
    const articleScreens = [
      'dashboard', 'workspace', 'tasks', 'gst', 'tds', 'audit',
      'communication', 'documents', 'calendar', 'notices',
    ]

    if (user.role === 'super_admin') return superAdminScreens.includes(screen)
    if (user.role === 'admin') return adminScreens.includes(screen)
    return articleScreens.includes(screen)
  }

  return { user, hasRole, isSuperAdmin, isAdmin, isArticle, canAccess }
}
