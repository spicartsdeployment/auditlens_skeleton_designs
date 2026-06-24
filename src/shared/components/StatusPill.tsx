import { cn } from './cn'
import type { FilingStatus, TaskStatus } from '@/shared/types'

type Status = FilingStatus | TaskStatus | 'overdue' | 'active' | 'inactive'

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-neutral-100 text-neutral-600' },
  in_review: { label: 'In Review', className: 'bg-primary-50 text-primary-600' },
  submitted: { label: 'Submitted', className: 'bg-warning-50 text-warning-600' },
  filed: { label: 'Filed', className: 'bg-accent-50 text-accent-600' },
  todo: { label: 'To Do', className: 'bg-neutral-100 text-neutral-600' },
  in_progress: { label: 'In Progress', className: 'bg-primary-50 text-primary-600' },
  done: { label: 'Done', className: 'bg-accent-50 text-accent-600' },
  overdue: { label: 'Overdue', className: 'bg-danger-50 text-danger-600' },
  active: { label: 'Active', className: 'bg-accent-50 text-accent-600' },
  inactive: { label: 'Inactive', className: 'bg-neutral-100 text-neutral-500' },
}

interface StatusPillProps {
  status: Status | string
  className?: string
}

function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-neutral-100 text-neutral-600' }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

export { StatusPill }
