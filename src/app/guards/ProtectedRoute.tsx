import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/shared/hooks/useAuthStore'
import { usePermission } from '@/shared/hooks/usePermission'

interface ProtectedRouteProps {
  screen?: string
}

export function ProtectedRoute({ screen }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user)
  const { canAccess } = usePermission()

  if (!user) return <Navigate to="/login" replace />
  if (screen && !canAccess(screen)) return <Navigate to="/403" replace />

  return <Outlet />
}
