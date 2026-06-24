import { usePermission } from '@/shared/hooks/usePermission'
import type { UserRole } from '@/shared/types'

interface CanProps {
  screen?: string
  roles?: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

function Can({ screen, roles, children, fallback = null }: CanProps) {
  const { canAccess, hasRole } = usePermission()

  if (roles && !hasRole(...roles)) return <>{fallback}</>
  if (screen && !canAccess(screen)) return <>{fallback}</>

  return <>{children}</>
}

export { Can }
