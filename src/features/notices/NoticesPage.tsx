import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldAlert, AlertTriangle, Clock, CheckCircle2, ChevronRight, Plus, ExternalLink } from 'lucide-react'
import { format, parseISO, isAfter, differenceInDays } from 'date-fns'
import { mockComplianceApi } from '@/mock/api'
import { cn } from '@/shared/components/cn'
import { toast } from 'sonner'

const WORKFLOW_STEPS = ['Notice Received', 'Assigned', 'Response Preparation', 'Review', 'Submission', 'Closure']

const STATUS_MAP: Record<string, string> = {
  'response_preparation': 'Response Preparation',
  'overdue': 'Overdue',
  'assigned': 'Assigned',
  'closed': 'Closed',
}

function SeverityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = { critical: 'severity-critical', high: 'severity-high', medium: 'severity-medium', low: 'severity-low' }
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', map[priority] ?? 'severity-info')}>{priority}</span>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { response_preparation: 'badge-inprogress', overdue: 'badge-overdue', assigned: 'badge-pending', closed: 'badge-done' }
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', map[status] ?? 'badge-draft')}>{STATUS_MAP[status] ?? status.replace(/_/g, ' ')}</span>
}

function WorkflowTracker({ currentStatus }: { currentStatus: string }) {
  const currentIdx = WORKFLOW_STEPS.findIndex(s => s.toLowerCase().replace(' ', '_').includes(currentStatus.split('_')[0]) || (currentStatus === 'overdue' && s === 'Response Preparation'))
  return (
    <div className="flex items-center gap-1 flex-wrap mt-3">
      {WORKFLOW_STEPS.map((step, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <div key={step} className="flex items-center gap-1">
            <div className={cn('flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors', done ? 'bg-accent-500 text-white' : active ? 'bg-primary-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-muted-content')}>
              <span>{done ? '✓' : i + 1}</span>
              <span>{step}</span>
            </div>
            {i < WORKFLOW_STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-neutral-400" />}
          </div>
        )
      })}
    </div>
  )
}

export function NoticesPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'gst' | 'income_tax'>('all')
  const [selectedNotice, setSelectedNotice] = useState<any>(null)
  const today = new Date()

  const { data: notices = [] } = useQuery({ queryKey: ['notices'], queryFn: () => mockComplianceApi.notices().then(r => r.data) })

  const filtered = typeFilter === 'all' ? notices as any[] : (notices as any[]).filter((n: any) => n.type === typeFilter)

  const stats = {
    total: (notices as any[]).length,
    active: (notices as any[]).filter((n: any) => n.status !== 'closed').length,
    overdue: (notices as any[]).filter((n: any) => n.status === 'overdue').length,
    critical: (notices as any[]).filter((n: any) => n.priority === 'critical').length,
  }

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary-content">Notice Management</h1>
          <p className="text-sm text-secondary-content">GST, Income Tax, and Assessment notices — track and respond</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          onClick={() => toast.info('Add new notice')}>
          <Plus className="h-4 w-4" /> Add Notice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Notices', value: stats.total, icon: ShieldAlert, variant: 'default' },
          { label: 'Active', value: stats.active, icon: Clock, variant: 'warning' },
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, variant: 'danger' },
          { label: 'Critical', value: stats.critical, icon: AlertTriangle, variant: 'danger' },
        ].map(s => (
          <div key={s.label} className={cn('card rounded-xl border p-4 flex items-center gap-3', `stat-card-${s.variant}`)}>
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', { 'bg-primary-50 text-primary-600 dark:bg-primary-900/30': s.variant === 'default', 'bg-warning-50 text-warning-600 dark:bg-amber-900/30': s.variant === 'warning', 'bg-danger-50 text-danger-600 dark:bg-red-900/30': s.variant === 'danger' })}>
              <s.icon className="h-5 w-5" />
            </div>
            <div><p className="text-xl font-bold text-primary-content">{s.value}</p><p className="text-xs text-secondary-content">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-5">
        {(['all', 'gst', 'income_tax'] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={cn('rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors', typeFilter === t ? 'bg-primary-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-secondary-content hover:text-primary-content')}>
            {t === 'income_tax' ? 'Income Tax' : t === 'all' ? 'All Notices' : t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Notice list */}
        <div className="lg:col-span-3 space-y-3">
          {filtered.map((notice: any) => {
            const daysLeft = differenceInDays(parseISO(notice.due_date + 'T00:00:00'), today)
            const isOverdue = isAfter(today, parseISO(notice.due_date + 'T00:00:00'))
            return (
              <div key={notice.id}
                className={cn('card rounded-xl border p-5 cursor-pointer hover:border-primary-200 dark:hover:border-primary-800 transition-all', selectedNotice?.id === notice.id && 'border-primary-300 dark:border-primary-700 ring-1 ring-primary-200 dark:ring-primary-800')}
                style={{ borderColor: selectedNotice?.id === notice.id ? undefined : 'var(--color-border)' }}
                onClick={() => setSelectedNotice(notice)}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-financial text-[10px] text-secondary-content">{notice.notice_no}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', notice.type === 'gst' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300')}>
                        {notice.type === 'income_tax' ? 'Income Tax' : 'GST'} · {notice.sub_type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-primary-content">{notice.subject}</p>
                    <p className="text-xs text-secondary-content mt-0.5">{notice.client_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <SeverityBadge priority={notice.priority} />
                    <StatusBadge status={notice.status} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-secondary-content">Received: {format(parseISO(notice.received_date + 'T00:00:00'), 'd MMM yyyy')}</span>
                  <span className={cn('font-semibold', isOverdue ? 'text-danger-600' : daysLeft <= 7 ? 'text-warning-600' : 'text-secondary-content')}>
                    {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `Due in ${daysLeft}d`}
                  </span>
                </div>
                <WorkflowTracker currentStatus={notice.status} />
              </div>
            )
          })}
        </div>

        {/* Notice detail */}
        <div className="lg:col-span-2">
          {!selectedNotice ? (
            <div className="card rounded-xl border p-10 flex flex-col items-center gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <ShieldAlert className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm text-secondary-content">Select a notice to view details</p>
            </div>
          ) : (
            <div className="card rounded-xl border p-5 space-y-5" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <p className="font-financial text-xs text-secondary-content mb-1">{selectedNotice.notice_no}</p>
                <h3 className="text-base font-bold text-primary-content">{selectedNotice.subject}</h3>
                <p className="text-sm text-secondary-content mt-1">{selectedNotice.client_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Notice Type', value: selectedNotice.type === 'income_tax' ? 'Income Tax' : 'GST' },
                  { label: 'Sub Type', value: selectedNotice.sub_type },
                  { label: 'Received', value: format(parseISO(selectedNotice.received_date + 'T00:00:00'), 'd MMM yyyy') },
                  { label: 'Due Date', value: format(parseISO(selectedNotice.due_date + 'T00:00:00'), 'd MMM yyyy') },
                  { label: 'Priority', value: selectedNotice.priority },
                  { label: 'Status', value: STATUS_MAP[selectedNotice.status] ?? selectedNotice.status },
                ].map(item => (
                  <div key={item.label} className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-content mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-primary-content capitalize">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <button className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 flex items-center justify-center gap-2"
                  onClick={() => toast.info('Opening response draft')}>
                  <ExternalLink className="h-4 w-4" /> Prepare Response
                </button>
                <button className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 py-2.5 text-sm font-semibold text-secondary-content hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  onClick={() => toast.success('Notice marked as closed')}>
                  Mark as Closed
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
