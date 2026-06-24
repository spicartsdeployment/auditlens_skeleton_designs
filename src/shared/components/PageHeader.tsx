import * as React from 'react'
import { cn } from './cn'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 mb-6', className)}>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-neutral-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export { PageHeader }
