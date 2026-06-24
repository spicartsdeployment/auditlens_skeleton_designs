import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldAlert, AlertTriangle, Clock, ChevronRight, Plus, ExternalLink } from 'lucide-react'
import { format, parseISO, isAfter, differenceInDays } from 'date-fns'
import { mockComplianceApi } from '@/mock/api'
import { toast } from 'sonner'
import { G, GrayKpi, PageHeader, DarkBtn, OutlineBtn, FilterPills, ContentCard, StatusBadge } from '@/shared/components/GrayKpi'

const WORKFLOW_STEPS = ['Received', 'Assigned', 'Preparation', 'Review', 'Submission', 'Closure']
const STATUS_MAP: Record<string, string> = {
  response_preparation: 'Response Preparation', overdue: 'Overdue', assigned: 'Assigned', closed: 'Closed',
}

function WorkflowTracker({ currentStatus }: { currentStatus: string }) {
  const curIdx = WORKFLOW_STEPS.findIndex(s =>
    s.toLowerCase().includes(currentStatus.split('_')[0]) || (currentStatus === 'overdue' && s === 'Preparation'))
  return (
    <div className="flex items-center gap-0.5 flex-wrap mt-3">
      {WORKFLOW_STEPS.map((step, i) => {
        const done = i < curIdx; const active = i === curIdx
        return (
          <div key={step} className="flex items-center gap-0.5">
            <div className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
              style={{
                background: done ? '#0584C7' : active ? G.primary : G.canvas,
                color: (done || active) ? '#FFFFFF' : G.icon,
                border: `1px solid ${done ? '#0584C7' : active ? G.primary : G.border}`,
              }}>
              <span>{done ? '✓' : i + 1}</span><span>{step}</span>
            </div>
            {i < WORKFLOW_STEPS.length - 1 && <ChevronRight className="h-2.5 w-2.5" style={{ color: G.border }} />}
          </div>
        )
      })}
    </div>
  )
}

export function NoticesPage() {
  const [typeFilter, setTypeFilter] = useState('all')
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
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto" style={{ background: G.canvas }}>
      <PageHeader title="Notice Management" sub="GST, Income Tax, and Assessment notices — track and respond">
        <DarkBtn onClick={() => toast.info('Add new notice')}><Plus className="h-4 w-4" />Add Notice</DarkBtn>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <GrayKpi label="Total Notices" value={stats.total} icon={ShieldAlert} sub="All types" />
        <GrayKpi label="Active" value={stats.active} icon={Clock} sub="Open responses" />
        <GrayKpi label="Overdue" value={stats.overdue} icon={AlertTriangle} sub="Past deadline" urgent={stats.overdue > 0} />
        <GrayKpi label="Critical" value={stats.critical} icon={AlertTriangle} sub="High priority" urgent={stats.critical > 0} />
      </div>

      <FilterPills
        pills={['all', 'gst', 'income_tax']}
        active={typeFilter}
        onChange={setTypeFilter}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Notice list */}
        <div className="lg:col-span-3 space-y-3">
          {filtered.map((notice: any) => {
            const daysLeft = differenceInDays(parseISO(notice.due_date + 'T00:00:00'), today)
            const isOverdue = isAfter(today, parseISO(notice.due_date + 'T00:00:00'))
            const isSelected = selectedNotice?.id === notice.id
            return (
              <div key={notice.id}
                className="rounded-2xl p-5 cursor-pointer transition-all"
                style={{
                  background: G.white,
                  border: `1px solid ${isSelected ? G.primary : G.border}`,
                  boxShadow: isSelected ? `0 0 0 2px ${G.primary}22` : '0 1px 3px 0 rgba(15,23,42,0.06)',
                }}
                onClick={() => setSelectedNotice(notice)}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-[10px]" style={{ color: G.secondary }}>{notice.notice_no}</span>
                      {/* Type chip — gray, no color */}
                      <span className="rounded-full text-[10px] font-semibold uppercase"
                        style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary, padding: '1px 6px' }}>
                        {notice.type === 'income_tax' ? 'Income Tax' : 'GST'} · {notice.sub_type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: G.primary }}>{notice.subject}</p>
                    <p className="text-xs mt-0.5" style={{ color: G.secondary }}>{notice.client_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={notice.priority} />
                    <StatusBadge status={notice.status} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span style={{ color: G.secondary }}>Received: {format(parseISO(notice.received_date + 'T00:00:00'), 'd MMM yyyy')}</span>
                  <span className="font-semibold" style={{ color: isOverdue ? '#DC2626' : daysLeft <= 7 ? '#D97706' : G.secondary }}>
                    {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `Due in ${daysLeft}d`}
                  </span>
                </div>
                <WorkflowTracker currentStatus={notice.status} />
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selectedNotice ? (
            <ContentCard>
              <div className="p-10 flex flex-col items-center gap-3">
                <ShieldAlert className="h-12 w-12" style={{ color: G.icon }} />
                <p className="text-sm" style={{ color: G.secondary }}>Select a notice to view details</p>
              </div>
            </ContentCard>
          ) : (
            <ContentCard>
              <div className="p-5 space-y-5">
                <div>
                  <p className="font-mono text-xs mb-1" style={{ color: G.secondary }}>{selectedNotice.notice_no}</p>
                  <h3 className="text-base font-bold" style={{ color: G.primary }}>{selectedNotice.subject}</h3>
                  <p className="text-sm mt-1" style={{ color: G.secondary }}>{selectedNotice.client_name}</p>
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
                    <div key={item.label} className="rounded-xl p-3"
                      style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: G.icon }}>{item.label}</p>
                      <p className="text-sm font-medium capitalize" style={{ color: G.primary }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <DarkBtn className="w-full justify-center" onClick={() => toast.info('Opening response draft')}>
                    <ExternalLink className="h-4 w-4" /> Prepare Response
                  </DarkBtn>
                  <OutlineBtn className="w-full justify-center" onClick={() => toast.success('Notice marked as closed')}>
                    Mark as Closed
                  </OutlineBtn>
                </div>
              </div>
            </ContentCard>
          )}
        </div>
      </div>
    </div>
  )
}
