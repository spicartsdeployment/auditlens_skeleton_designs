import { type LucideIcon } from 'lucide-react'
import { cn } from './cn'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
  variant?: 'default' | 'warning' | 'danger' | 'success'
  className?: string
}

const variantClasses = {
  default: 'bg-primary-50 text-primary-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  success: 'bg-accent-50 text-accent-600',
}

function StatCard({ label, value, icon: Icon, trend, variant = 'default', className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-surface p-5 shadow-card',
        className
      )}
      role="region"
      aria-label={label}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
          {trend && (
            <p className={cn('mt-1 text-xs', trend.value >= 0 ? 'text-accent-600' : 'text-danger-500')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', variantClasses[variant])}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  )
}

export { StatCard }
