/**
 * Dashboard Home — 5-ratio gray depth system
 *
 * Ratio 1  #F8FAFC  slate-50   → app canvas background
 * Ratio 2  #E2E8F0  slate-200  → card borders, dividers
 * Ratio 3  #94A3B8  slate-400  → decorative icons, inactive / prev-month dates
 * Ratio 4  #475569  slate-600  → secondary text, timestamps, subheaders
 * Ratio 5  #0F172A  slate-900  → headings, metric numbers, active labels
 * Pure     #FFFFFF             → elevated card bodies (pop off canvas)
 */

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Briefcase, CheckSquare, FileText, AlertTriangle, Clock,
  Users, ShieldAlert, FolderOpen, CheckCircle2, Activity,
  Database, ChevronLeft, ChevronRight, MessageSquare, ChevronDown,
} from 'lucide-react'
import {
  format, parseISO, isAfter, differenceInDays,
  startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay,
  addMonths, subMonths, subHours,
} from 'date-fns'
import { dashboardApi } from '@/shared/api/dashboard'
import { mockComplianceApi } from '@/mock/api'
import { useAuthStore } from '@/shared/hooks/useAuthStore'
import { usePermission } from '@/shared/hooks/usePermission'
import { cn } from '@/shared/components/cn'
import { MOCK_THREADS } from '@/mock/data'

const MOCK_INBOX = [
  { id: 1, from: 'Sunrise Textiles', snippet: 'Audit documents pending — please upload balance sheet', channel: 'whatsapp', time: '2h', unread: true },
  { id: 2, from: 'Priya Sharma', snippet: 'GSTR-3B for May ready for your review', channel: 'internal', time: '4h', unread: true },
  { id: 3, from: 'BlueSky Tech', snippet: 'TDS challan receipt attached for Q4', channel: 'email', time: '1d', unread: false },
  { id: 4, from: 'Client Portal', snippet: 'New document uploaded: Bank Statement Apr 2026', channel: 'portal', time: '2d', unread: false },
]
const channelDot: Record<string, string> = {
  whatsapp: '#22C55E', internal: '#0F172A', email: '#3B82F6', portal: '#8B5CF6',
}

// ─── Gray palette constants ────────────────────────────────
const G = {
  canvas:  '#F8FAFC',   // R1 — app background
  white:   '#FFFFFF',   // elevated cards
  border:  '#E2E8F0',   // R2 — dividers
  muted:   '#94A3B8',   // R3 — decorative icons / inactive
  secondary:'#475569',  // R4 — secondary text / timestamps
  primary: '#0F172A',   // R5 — headings / numbers
} as const

// ─── Card wrapper ──────────────────────────────────────────
function Card({ children, className = '', onClick }: {
  children: React.ReactNode; className?: string; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn('rounded-2xl border', onClick && 'cursor-pointer', className)}
      style={{ background: G.white, borderColor: G.border, boxShadow: '0 1px 3px 0 rgba(15,23,42,0.06)' }}
    >
      {children}
    </div>
  )
}

// ─── Card section header ───────────────────────────────────
function CardHeader({ icon: Icon, title, action, onAction }: {
  icon: React.ElementType; title: string; action?: string; onAction?: () => void
}) {
  return (
    <div className="flex items-center justify-between pb-3 mb-1" style={{ borderBottom: `1px solid ${G.border}` }}>
      <div className="flex items-center gap-2">
        {/* Ratio 3: decorative icon */}
        <Icon className="h-4 w-4" style={{ color: G.muted }} aria-hidden />
        {/* Ratio 5: section heading */}
        <h2 className="text-sm font-semibold" style={{ color: G.primary }}>{title}</h2>
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs font-medium transition-colors"
          style={{ color: G.secondary }}
          onMouseEnter={e => (e.currentTarget.style.color = G.primary)}
          onMouseLeave={e => (e.currentTarget.style.color = G.secondary)}
        >
          {action}
        </button>
      )}
    </div>
  )
}

// ─── Mini Calendar ─────────────────────────────────────────
function MiniCalendar({ events }: { events: any[] }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(startOfMonth(today))
  const [tooltip, setTooltip] = useState<{ day: Date; events: any[]; x: number; y: number } | null>(null)

  const monthStart = startOfMonth(viewDate)
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(viewDate) })
  const startPad = monthStart.getDay()
  const isCurrentMonth = format(viewDate, 'yyyyMM') === format(today, 'yyyyMM')

  const dotColors: Record<string, string> = {
    gst: '#3B82F6', tds: '#F59E0B', audit: '#10B981',
    notice: '#EF4444', meeting: '#8B5CF6',
  }

  const typeLabels: Record<string, string> = {
    gst: 'GST Filing', tds: 'TDS Filing', audit: 'Audit', notice: 'Notice', meeting: 'Meeting',
  }

  return (
    <Card>
      <div className="p-6 flex flex-col">
        {/* Header with prev/next */}
        <div className="flex items-center justify-between mb-5">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ background: G.canvas, border: `1px solid ${G.border}` }}
            onClick={() => setViewDate(d => subMonths(d, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" style={{ color: G.secondary }} />
          </button>

          <div className="text-center">
            <h2 className="text-sm font-semibold" style={{ color: G.primary }}>
              {format(viewDate, 'MMMM yyyy')}
            </h2>
            <p className="text-[10px] mt-0.5" style={{ color: G.secondary }}>
              {days.filter(d => events.some(e => isSameDay(parseISO(e.date), d))).length} events
            </p>
          </div>

          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ background: G.canvas, border: `1px solid ${G.border}` }}
            onClick={() => setViewDate(d => addMonths(d, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" style={{ color: G.secondary }} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold uppercase py-2" style={{ color: G.muted }}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 relative">
          {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}

          {days.map(day => {
            const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day))
            const isCurrentDay = isToday(day)
            const hasEvents = dayEvents.length > 0

            return (
              <div
                key={day.toISOString()}
                className="relative flex flex-col items-center rounded-md py-2 transition-colors cursor-default"
                style={isCurrentDay ? { background: G.primary, borderRadius: '6px' } : {}}
                onMouseEnter={hasEvents ? (e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setTooltip({ day, events: dayEvents, x: rect.left, y: rect.bottom })
                } : undefined}
                onMouseLeave={() => setTooltip(null)}
              >
                <span
                  className="text-xs font-semibold leading-none"
                  style={{ color: isCurrentDay ? G.white : isCurrentMonth ? G.secondary : G.muted }}
                >
                  {format(day, 'd')}
                </span>
                {hasEvents && (
                  <div className="flex gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((ev, i) => (
                      <div key={i} className="h-1 w-1 rounded-full"
                        style={{ background: isCurrentDay ? 'rgba(255,255,255,0.8)' : (dotColors[ev.type] ?? G.muted) }} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 flex flex-wrap gap-x-2.5 gap-y-1" style={{ borderTop: `1px solid ${G.border}` }}>
          {Object.entries(dotColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              <span className="text-[9px] capitalize" style={{ color: G.muted }}>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hover tooltip — fixed portal-style */}
      {tooltip && (
        <div
          className="fixed z-50 rounded-xl p-3 shadow-xl min-w-[180px] max-w-[240px]"
          style={{
            background: G.white, border: `1px solid ${G.border}`,
            boxShadow: '0 8px 24px rgba(15,23,42,0.14)',
            top: tooltip.y + 8, left: Math.min(tooltip.x, window.innerWidth - 260),
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: G.muted }}>
            {format(tooltip.day, 'd MMMM')}
          </p>
          <div className="space-y-1.5">
            {tooltip.events.map((ev, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: dotColors[ev.type] ?? G.muted }} />
                <div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: G.primary }}>{ev.title}</p>
                  <p className="text-[10px]" style={{ color: G.secondary }}>{typeLabels[ev.type] ?? ev.type}{ev.client_name ? ` · ${ev.client_name}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── KPI Metric Card ───────────────────────────────────────
// Pure white, gray scale only — no color pastels
function KpiCard({ label, value, icon: Icon, sub, urgent, onClick }: {
  label: string; value: number | string; icon: React.ElementType
  sub?: string; urgent?: boolean; onClick?: () => void
}) {
  return (
    <button
      className="rounded-2xl border text-left w-full transition-all group self-start"
      style={{
        background: G.white,
        borderColor: G.border,
        boxShadow: '0 1px 3px 0 rgba(15,23,42,0.06)',
        padding: '12px 12px 10px',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px 0 rgba(15,23,42,0.10)'
        ;(e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px 0 rgba(15,23,42,0.06)'
        ;(e.currentTarget as HTMLElement).style.borderColor = G.border
      }}
    >
      {/* Icon */}
      <div
        className="flex h-6 w-6 items-center justify-center rounded-lg mb-2"
        style={{ background: G.canvas, border: `1px solid ${G.border}` }}
      >
        <Icon className="h-3 w-3" style={{ color: urgent ? '#DC2626' : G.muted }} aria-hidden />
      </div>

      {/* Metric number */}
      <p
        className="text-xl font-bold leading-none mb-1 tabular-nums"
        style={{ color: urgent ? '#DC2626' : G.primary }}
      >
        {value}
      </p>

      {/* Label */}
      <p className="text-[11px] font-semibold leading-tight" style={{ color: G.secondary }}>{label}</p>

      {/* Sub note */}
      {sub && (
        <p className="text-[10px] mt-1 leading-none" style={{ color: G.muted }}>{sub}</p>
      )}
    </button>
  )
}

// ─── Activity item ─────────────────────────────────────────
function ActivityItem({ action, description, user_name, created_at }: any) {
  // Map action types to icons — all icons use Ratio 3 (muted)
  const iconMap: Record<string, React.ElementType> = {
    filing: FileText, document: FolderOpen, notice: AlertTriangle,
    create: CheckCircle2, assign: Users, update: Activity,
  }
  const Icon = iconMap[action] ?? Activity

  const daysAgo = differenceInDays(new Date(), new Date(created_at))
  const timeLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`

  return (
    <li
      className="flex items-start gap-3 py-2.5"
      style={{ borderBottom: `1px solid ${G.border}` }}
    >
      {/* Ratio 3 icon container */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5"
        style={{ background: G.canvas, border: `1px solid ${G.border}` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: G.muted }} aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        {/* Ratio 5: activity description */}
        <p className="text-sm leading-snug" style={{ color: G.primary }}>{description}</p>
        {/* Ratio 4: user · timestamp */}
        <p className="text-[11px] mt-0.5" style={{ color: G.secondary }}>
          {user_name}
          <span className="mx-1" style={{ color: G.muted }}>·</span>
          {timeLabel}
        </p>
      </div>
    </li>
  )
}

// ─── Alert item ────────────────────────────────────────────
function AlertItem({ alert }: { alert: any }) {
  // Severity dots retain semantic color — they carry functional meaning
  const severityDot: Record<string, string> = {
    danger: '#EF4444', warning: '#F59E0B', info: '#64748B',
  }
  const dot = severityDot[alert.severity as keyof typeof severityDot] ?? G.muted

  const daysAgo = differenceInDays(new Date(), new Date(alert.created_at))
  const timeLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`

  return (
    <li
      className="flex items-start gap-3 py-2.5"
      style={{ borderBottom: `1px solid ${G.border}` }}
    >
      {/* Semantic severity dot (not decorative — retains color) */}
      <div className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />

      <div className="min-w-0 flex-1">
        {/* Ratio 5: alert title */}
        <p className="text-sm font-semibold" style={{ color: G.primary }}>{alert.title}</p>
        {/* Ratio 4: message */}
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: G.secondary }}>{alert.message}</p>
      </div>

      {/* Ratio 4: timestamp */}
      <span className="shrink-0 text-[10px] whitespace-nowrap mt-0.5" style={{ color: G.muted }}>
        {timeLabel}
      </span>
    </li>
  )
}

// ─── Deadline item ─────────────────────────────────────────
function DeadlineItem({ task, onClick }: { task: any; onClick: () => void }) {
  const due = parseISO(task.deadline)
  const today = new Date()
  const days = differenceInDays(due, today)
  const isOverdue = isAfter(today, due)

  // Ratio 3 type labels — no colored badges
  const typeLabel: Record<string, string> = { gst: 'GST', tds: 'TDS', audit: 'Audit' }

  return (
    <li
      className="flex items-center gap-3 py-2.5 rounded-lg px-1 transition-colors cursor-pointer"
      style={{ borderBottom: `1px solid ${G.border}` }}
      onMouseEnter={e => (e.currentTarget.style.background = G.canvas)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      onClick={onClick}
    >
      {/* Date column */}
      <div className="flex flex-col items-center w-9 shrink-0 text-center">
        {/* Ratio 3: month */}
        <span className="text-[9px] font-semibold uppercase" style={{ color: G.muted }}>
          {format(due, 'MMM')}
        </span>
        {/* Ratio 5: day (red if overdue) */}
        <span
          className="text-lg font-bold leading-tight tabular-nums"
          style={{ color: isOverdue ? '#DC2626' : G.primary }}
        >
          {format(due, 'd')}
        </span>
      </div>

      {/* Ratio 2 vertical divider */}
      <div className="w-px h-8 shrink-0" style={{ background: G.border }} />

      <div className="min-w-0 flex-1">
        {/* Ratio 5: task title */}
        <p className="text-xs font-medium truncate" style={{ color: G.primary }}>{task.title}</p>

        <div className="flex items-center gap-2 mt-0.5">
          {/* Ratio 3: type label — plain, no color badge */}
          <span className="text-[9px] font-bold uppercase" style={{ color: G.muted }}>
            {typeLabel[task.task_type] ?? task.task_type}
          </span>
          {/* Ratio 4: countdown */}
          <span
            className="text-[10px] font-medium"
            style={{ color: isOverdue ? '#DC2626' : days <= 3 ? '#D97706' : G.secondary }}
          >
            {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
          </span>
        </div>
      </div>
    </li>
  )
}

// ─── Empty state ───────────────────────────────────────────
function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8">
      <Icon className="h-8 w-8" style={{ color: G.muted }} />
      <p className="text-sm" style={{ color: G.secondary }}>{text}</p>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { isSuperAdmin } = usePermission()
  const today = new Date()
  const [activityOpen, setActivityOpen] = useState(false)

  const { data: dashData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then(r => r.data),
  })
  const { data: calEvents = [] } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => mockComplianceApi.calendarEvents().then(r => r.data),
  })
  const { data: firmData } = useQuery({
    queryKey: ['firm'],
    queryFn: () => mockComplianceApi.firm().then(r => r.data),
  })
  const { data: activity = [] } = useQuery({
    queryKey: ['activity-all'],
    queryFn: async () => {
      const { MOCK_ACTIVITY } = await import('@/mock/data')
      return Object.values(MOCK_ACTIVITY).flat()
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },
  })

  const stats = dashData?.stats

  // ── Role-aware 6 KPI cards ────────────────────────────
  const saKpis = [
    { label: 'Total Clients',    value: stats?.total_clients ?? 5,   icon: Briefcase,     sub: '4 active',            path: '/clients',   urgent: false },
    { label: 'Open Notices',     value: 3,                            icon: ShieldAlert,   sub: '1 overdue',           path: '/workcenter', urgent: false },
    { label: 'Overdue Items',    value: stats?.overdue_count ?? 2,    icon: AlertTriangle, sub: 'Action needed',       path: '/workcenter', urgent: true  },
    { label: 'Pending Approvals',value: 3,                            icon: CheckCircle2,  sub: 'Awaiting sign-off',   path: '/workcenter', urgent: false },
    { label: 'Active Users',     value: firmData?.active_users ?? 4,  icon: Users,         sub: '1 super admin',       path: '/users',     urgent: false },
    { label: 'PANs Used',        value: `${firmData?.used_pans ?? 37}/${firmData?.max_pans ?? 50}`, icon: Database, sub: 'Subscription', path: '/settings', urgent: false },
  ]
  const adminKpis = [
    { label: 'Overdue',           value: stats?.overdue_count ?? 2,   icon: AlertTriangle, sub: 'Immediate action',    path: '/workcenter', urgent: true  },
    { label: 'Missing Docs',      value: 6,                            icon: FolderOpen,    sub: 'Blocking filings',    path: '/workcenter', urgent: false },
    { label: 'Pending Approvals', value: 3,                            icon: CheckCircle2,  sub: 'By articles',         path: '/workcenter', urgent: false },
    { label: 'Pending Filings',   value: stats?.pending_filings ?? 3,  icon: FileText,      sub: '3 GST · 2 TDS',      path: '/gst',       urgent: false },
    { label: 'Active Tasks',      value: stats?.active_tasks ?? 4,     icon: CheckSquare,   sub: 'In progress',         path: '/workcenter', urgent: false },
    { label: 'Total Clients',     value: stats?.total_clients ?? 5,    icon: Briefcase,     sub: '4 active',            path: '/clients',   urgent: false },
  ]
  const articleKpis = [
    { label: 'My Tasks',       value: 3, icon: CheckSquare,   sub: 'Assigned to me',       path: '/workcenter', urgent: false },
    { label: 'Overdue Tasks',  value: 1, icon: AlertTriangle, sub: 'Past deadline',         path: '/workcenter', urgent: true  },
    { label: 'Pending Docs',   value: 4, icon: FolderOpen,    sub: 'Uploads needed',        path: '/workcenter', urgent: false },
    { label: 'In Review',      value: 1, icon: Clock,         sub: 'Awaiting admin',        path: '/workcenter', urgent: false },
    { label: 'Queries Raised', value: 0, icon: ShieldAlert,   sub: 'Open queries',          path: '/workcenter', urgent: false },
    { label: 'My Clients',     value: 3, icon: Briefcase,     sub: 'Assigned',              path: '/clients',   urgent: false },
  ]
  const kpis = isSuperAdmin() ? saKpis : (user?.role === 'admin' ? adminKpis : articleKpis)

  // ── Last-24-hour activity ───────────────────────────
  const cutoff24h = subHours(new Date(), 24)

  const activity24h = (activity as any[]).filter(a => new Date(a.created_at) > cutoff24h)
  const activityOlder = (activity as any[]).filter(a => new Date(a.created_at) <= cutoff24h)
  const unreadCount = MOCK_THREADS.reduce((n, t) => n + (t.unread_count ?? 0), 0)
  const alertCount = dashData?.recent_alerts?.length ?? 0
  const deadlineCount = dashData?.upcoming_deadlines?.length ?? 0

  return (
    <div className="p-3 md:p-4 max-w-[1440px] mx-auto" style={{ background: G.canvas }}>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">

        {/* Left — KPIs + Alerts/Deadlines + Communication */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2 items-start">
            {kpis.map(kpi => (
              <KpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                sub={kpi.sub}
                urgent={kpi.urgent}
                onClick={() => navigate(kpi.path)}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Alerts + Deadlines merged */}
            <div
              className="rounded-2xl border flex flex-col md:col-span-1"
              style={{ background: G.white, borderColor: G.border, boxShadow: '0 1px 3px rgba(15,23,42,0.06)', maxHeight: 420 }}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0" style={{ borderBottom: `1px solid ${G.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" style={{ color: '#EF4444' }} />
                    <span className="text-sm font-semibold" style={{ color: G.primary }}>Alerts</span>
                    {alertCount > 0 && (
                      <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: '#FEF2F2', color: '#EF4444' }}>{alertCount}</span>
                    )}
                  </div>
                  <div className="h-3.5 w-px" style={{ background: G.border }} />
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" style={{ color: '#F59E0B' }} />
                    <span className="text-sm font-semibold" style={{ color: G.primary }}>Deadlines</span>
                    {deadlineCount > 0 && (
                      <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: '#FFFBEB', color: '#D97706' }}>{deadlineCount}</span>
                    )}
                  </div>
                </div>
                <button type="button" onClick={() => navigate('/workcenter')} className="text-xs font-medium" style={{ color: G.secondary }}>View all</button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: `${G.border} transparent` }}>
                <div className="flex items-center gap-2 mt-3 mb-1">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: '#EF4444' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#EF4444' }}>Alerts</span>
                </div>
                <ul>
                  {!dashData?.recent_alerts?.length ? (
                    <Empty icon={CheckCircle2} text="All clear — no alerts" />
                  ) : dashData.recent_alerts.map((alert: any) => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))}
                </ul>
                <div className="my-3" style={{ borderTop: `1px dashed ${G.border}` }} />
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: '#F59E0B' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#D97706' }}>Upcoming Deadlines</span>
                </div>
                <ul>
                  {!dashData?.upcoming_deadlines?.length ? (
                    <Empty icon={CheckCircle2} text="No upcoming deadlines" />
                  ) : dashData.upcoming_deadlines.map((task: any) => (
                    <DeadlineItem key={task.id} task={task} onClick={() => navigate('/workcenter')} />
                  ))}
                </ul>
              </div>
            </div>

            {/* Communication */}
            <Card className="md:col-span-1">
              <div className="p-4">
                <div className="flex items-center justify-between pb-3 mb-1" style={{ borderBottom: `1px solid ${G.border}` }}>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" style={{ color: G.muted }} aria-hidden />
                    <h2 className="text-sm font-semibold" style={{ color: G.primary }}>Communication</h2>
                    {unreadCount > 0 && (
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                </div>
                <ul className="mt-3">
                  {MOCK_INBOX.map(msg => (
                    <li key={msg.id} className="flex items-start gap-3 py-2.5" style={{ borderBottom: `1px solid ${G.border}` }}>
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: channelDot[msg.channel] ?? G.muted }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-snug truncate" style={{ color: G.primary, fontWeight: msg.unread ? 600 : 400 }}>{msg.from}</p>
                        <p className="text-[11px] truncate mt-0.5" style={{ color: G.secondary }}>{msg.snippet}</p>
                      </div>
                      <span className="shrink-0 text-[10px] whitespace-nowrap mt-0.5" style={{ color: G.muted }}>{msg.time}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3">
                  <button
                    type="button"
                    className="w-full rounded-lg py-2 text-xs font-semibold transition-colors"
                    style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}
                    onClick={() => navigate('/communication')}
                  >
                    Open Communication →
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Right — Calendar + collapsible Recent Activity */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <MiniCalendar events={calEvents as any[]} />

          <Card>
            <div className="px-4 pt-4 pb-3">
              <button type="button" className="w-full flex items-center justify-between" onClick={() => setActivityOpen(v => !v)}>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" style={{ color: G.muted }} aria-hidden />
                  <h2 className="text-sm font-semibold" style={{ color: G.primary }}>Recent Activity</h2>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: '#F0FDF4', color: '#166534' }}>
                    {activity24h.length} new
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200" style={{ color: G.muted, transform: activityOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
            </div>
            {activityOpen && (
              <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: 320, scrollbarWidth: 'thin', scrollbarColor: `${G.border} transparent` }}>
                {activity24h.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-2 py-1 sticky top-0 z-10" style={{ background: G.white }}>
                      <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#166534' }}>Last 24 hours</span>
                    </div>
                    <ul>{activity24h.map((item: any) => <ActivityItem key={item.id} {...item} />)}</ul>
                  </>
                )}
                {activityOlder.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mt-3 mb-2 py-1 sticky top-0 z-10" style={{ background: G.white }}>
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: G.muted }}>Earlier</span>
                    </div>
                    <ul>{activityOlder.map((item: any) => <ActivityItem key={item.id} {...item} />)}</ul>
                  </>
                )}
                {(activity as any[]).length === 0 && <Empty icon={Activity} text="No recent activity" />}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick navigation strip */}
      <div className="mt-3 flex items-center gap-1 px-1 py-1 rounded-2xl" style={{ background: G.white, border: `1px solid ${G.border}` }}>
        <span className="px-3 text-[9px] font-bold uppercase tracking-wider" style={{ color: G.muted }}>Jump to</span>
        <div className="h-4 w-px mx-1" style={{ background: G.border }} />
        {[
          { label: 'Work Center', path: '/workcenter' },
          { label: 'Clients', path: '/clients' },
          { label: 'Documents', path: '/documents' },
          { label: 'Team', path: '/users' },
        ].map(item => (
          <button key={item.label} type="button" onClick={() => navigate(item.path)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all" style={{ color: G.secondary }}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
