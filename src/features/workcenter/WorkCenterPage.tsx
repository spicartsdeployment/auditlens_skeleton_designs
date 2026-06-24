/**
 * Work Center — Unified Compliance Operating System
 * Replaces: Workspace + Tasks + Notices
 */
import { useState, useMemo } from 'react'
import {
  Circle, Clock3, ScanEye, CheckCircle2, Plus,
  Search, X, Send,
  FileText, ReceiptText, Scale, ShieldAlert, FolderOpen,
  Users, MessageSquare, AlertCircle, Paperclip, Activity,
  TrendingUp, BarChart2, ChevronDown, Star, Calendar,
  Layers, CalendarClock, Bell, FileUp, ArrowRight,
  ChevronRight, Lock,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { G } from '@/shared/components/GrayKpi'
import { cn } from '@/shared/components/cn'
import { usePermission } from '@/shared/hooks/usePermission'
import { useAuthStore } from '@/shared/hooks/useAuthStore'

// ─── Pending Actions (module-level shared state) ─────────────────────────────
interface PendingAction {
  id: string
  type: 'extension_request' | 'in_review' | 'query' | 'doc_request'
  workItemId: string
  workItemTitle: string
  client: string
  requestedBy: string
  assignedTo: string
  note?: string
  newDate?: string
  createdAt: string
  resolved: boolean
}

const PENDING_ACTIONS: PendingAction[] = [
  {
    id: 'pa1', type: 'in_review', workItemId: 'w2',
    workItemTitle: 'GSTR-1 — April 2026', client: 'BlueSky Software',
    requestedBy: 'Sneha Iyer', assignedTo: 'Sneha Iyer',
    createdAt: '10 min ago', resolved: false,
  },
  {
    id: 'pa2', type: 'extension_request', workItemId: 'w3',
    workItemTitle: 'TDS 140-TDS — Q4 FY 2025-26', client: 'Redwood Constructions',
    requestedBy: 'Rohan Verma', assignedTo: 'Rohan Verma',
    note: 'Client documents not yet received.', newDate: '2026-07-05',
    createdAt: '1 hour ago', resolved: false,
  },
]

// ─── Types ───────────────────────────────────────────────────────────────────
type WorkType = 'gst_filing' | 'tds_filing' | 'audit' | 'notice' | 'doc_request' | 'client_followup' | 'internal'
type Priority  = 'critical' | 'high' | 'medium' | 'low'
type QueueId   = 'todo' | 'in_progress' | 'in_review' | 'done'

interface WorkItem {
  id: string
  type: WorkType
  title: string
  client: string
  priority: Priority
  score: number
  due_date: string
  days_remaining: number
  assigned_to: string
  assigned_by: string
  progress: number
  open_queries: number
  pending_docs: number
  status: string
  queue: QueueId
  tags: string[]
  description: string
  // Type-specific
  gstin?: string
  return_period?: string
  ack_no?: string
  quarter?: string
  form_type?: string
  notice_no?: string
  authority?: string
  severity?: string
  workflow_stage?: string
  audit_type?: string
}

// ─── Priority config ─────────────────────────────────────────────────────────
const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: 'Critical', color: '#DC2626', bg: '#FEF2F2', dot: '#DC2626' },
  high:     { label: 'High',     color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' },
  medium:   { label: 'Medium',   color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' },
  low:      { label: 'Low',      color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8' },
}

const QUEUE_CFG: Record<QueueId, { label: string; icon: React.ElementType }> = {
  todo:        { label: 'To Do',       icon: Circle       },
  in_progress: { label: 'In Progress', icon: Clock3       },
  in_review:   { label: 'In Review',   icon: ScanEye      },
  done:        { label: 'Done',        icon: CheckCircle2 },
}

const TYPE_CFG: Record<WorkType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  gst_filing:      { label: 'GST Filing',      icon: FileText,     color: '#0584C7', bg: '#EFF8FF' },
  tds_filing:      { label: 'TDS Filing',      icon: ReceiptText,  color: '#7C3AED', bg: '#F5F3FF' },
  audit:           { label: 'Audit',           icon: Scale,        color: '#0D9488', bg: '#F0FDFA' },
  notice:          { label: 'Notice',          icon: ShieldAlert,  color: '#DC2626', bg: '#FEF2F2' },
  doc_request:     { label: 'Document Req.',   icon: FolderOpen,   color: '#D97706', bg: '#FFFBEB' },
  client_followup: { label: 'Client Follow-up',icon: Users,        color: '#2563EB', bg: '#EFF6FF' },
  internal:        { label: 'Internal Task',   icon: Layers,       color: '#64748B', bg: '#F1F5F9' },
}

// ─── Mock work items ─────────────────────────────────────────────────────────
const RAW_ITEMS: WorkItem[] = [
  {
    id: 'w1', type: 'notice', title: 'GST SCN — Excess ITC Claim FY 2024-25',
    client: 'Sunrise Textiles', priority: 'critical', score: 98, due_date: '2026-06-26',
    days_remaining: 1, assigned_to: 'Rohan Verma', assigned_by: 'Priya Sharma', progress: 35, open_queries: 2,
    pending_docs: 3, status: 'Response Preparation', queue: 'in_progress',
    tags: ['GST', 'SCN'], description: 'Show Cause Notice from GST department regarding excess ITC claimed in FY 2024-25. Response with supporting documents required.',
    notice_no: 'SCN/GST/2026/1423', authority: 'GST Department — Delhi', severity: 'critical', workflow_stage: 'Preparation',
  },
  {
    id: 'w2', type: 'gst_filing', title: 'GSTR-1 — April 2026',
    client: 'BlueSky Software', priority: 'critical', score: 91, due_date: '2026-06-26',
    days_remaining: 1, assigned_to: 'Sneha Iyer', assigned_by: 'Priya Sharma', progress: 70, open_queries: 1,
    pending_docs: 0, status: 'Review Pending', queue: 'in_review',
    tags: ['GSTR-1', 'Monthly'], description: 'GSTR-1 for April 2026 due tomorrow. Data imported, awaiting final review and filing.',
    gstin: '29AADCB2230M1ZV', return_period: 'April 2026', form_type: 'GSTR-1',
  },
  {
    id: 'w3', type: 'tds_filing', title: 'TDS 140-TDS — Q4 FY 2025-26',
    client: 'Redwood Constructions', priority: 'critical', score: 88, due_date: '2026-06-27',
    days_remaining: 2, assigned_to: 'Rohan Verma', assigned_by: 'Priya Sharma', progress: 20, open_queries: 0,
    pending_docs: 5, status: 'Document Collection', queue: 'todo',
    tags: ['140-TDS', 'Q4'], description: 'Q4 TDS return — challan details and deductee information pending from client.',
    quarter: 'Q4 FY 2025-26', form_type: '140-TDS (26Q)',
  },
  {
    id: 'w4', type: 'notice', title: 'IT Scrutiny Notice — AY 2024-25',
    client: 'Sunrise Textiles', priority: 'critical', score: 85, due_date: '2026-06-25',
    days_remaining: -1, assigned_to: 'Sneha Iyer', assigned_by: 'Priya Sharma', progress: 60, open_queries: 1,
    pending_docs: 2, status: 'Overdue', queue: 'in_progress',
    tags: ['IT', 'Scrutiny', 'Overdue'], description: 'Income Tax scrutiny notice response overdue. Immediate attention required.',
    notice_no: 'ITO/SCR/2026/0089', authority: 'ITO Ward 4 — Mumbai', severity: 'critical',
  },
  {
    id: 'w5', type: 'gst_filing', title: 'GSTR-3B — April 2026',
    client: 'Apex Auto Parts', priority: 'high', score: 74, due_date: '2026-06-29',
    days_remaining: 4, assigned_to: 'Sneha Iyer', assigned_by: 'Priya Sharma', progress: 55, open_queries: 0,
    pending_docs: 1, status: 'In Progress', queue: 'in_progress',
    tags: ['GSTR-3B', 'Monthly'], description: 'GSTR-3B for April 2026. ITC reconciliation pending.',
    gstin: '08AAAPA1234A1ZT', return_period: 'April 2026', form_type: 'GSTR-3B',
  },
  {
    id: 'w6', type: 'audit', title: 'Statutory Audit FY 2025-26',
    client: 'Green Pharma', priority: 'high', score: 71, due_date: '2026-06-30',
    days_remaining: 5, assigned_to: 'Rohan Verma', assigned_by: 'Priya Sharma', progress: 45, open_queries: 3,
    pending_docs: 8, status: 'Fieldwork', queue: 'in_progress',
    tags: ['Statutory Audit', 'FY 25-26'], description: 'Statutory audit fieldwork in progress. Risk assessment and working papers pending.',
    audit_type: 'Statutory Audit',
  },
  {
    id: 'w7', type: 'gst_filing', title: 'GSTR-1 — April 2026',
    client: 'Redwood Constructions', priority: 'high', score: 68, due_date: '2026-07-01',
    days_remaining: 6, assigned_to: 'Rohan Verma', assigned_by: 'Priya Sharma', progress: 80, open_queries: 0,
    pending_docs: 0, status: 'Review Required', queue: 'in_review',
    tags: ['GSTR-1', 'Monthly'], description: 'Data preparation complete. Requires partner review before filing.',
    gstin: '07AAECR1234F1ZQ', return_period: 'April 2026', form_type: 'GSTR-1',
  },
  {
    id: 'w8', type: 'audit', title: 'Tax Audit — FY 2025-26 (Form 3CD)',
    client: 'BlueSky Software', priority: 'high', score: 65, due_date: '2026-07-02',
    days_remaining: 7, assigned_to: 'Sneha Iyer', assigned_by: 'Priya Sharma', progress: 30, open_queries: 1,
    pending_docs: 4, status: 'Planning', queue: 'todo',
    tags: ['Tax Audit', 'Form 3CD'], description: 'Tax audit planning stage. ICAI clause-wise checklist to be completed.',
    audit_type: 'Tax Audit',
  },
  {
    id: 'w9', type: 'tds_filing', title: 'TDS 138-TDS — Q4 FY 2025-26',
    client: 'Green Pharma', priority: 'medium', score: 55, due_date: '2026-07-03',
    days_remaining: 8, assigned_to: 'Sneha Iyer', assigned_by: 'Priya Sharma', progress: 65, open_queries: 0,
    pending_docs: 0, status: 'In Progress', queue: 'in_progress',
    tags: ['138-TDS', 'Salary', 'Q4'], description: 'Salary TDS return for Q4. Employee data available. Challan verification pending.',
    quarter: 'Q4 FY 2025-26', form_type: '138-TDS (24Q)',
  },
  {
    id: 'w10', type: 'gst_filing', title: 'GSTR-3B — March 2026',
    client: 'Sunrise Textiles', priority: 'medium', score: 52, due_date: '2026-07-05',
    days_remaining: 10, assigned_to: 'Rohan Verma', assigned_by: 'Priya Sharma', progress: 90, open_queries: 0,
    pending_docs: 0, status: 'Ready to File', queue: 'in_review',
    tags: ['GSTR-3B', 'Monthly'], description: 'GSTR-3B for March 2026 is ready. Awaiting digital signature.',
    gstin: '27AABCS1429B1ZB', return_period: 'March 2026', form_type: 'GSTR-3B',
  },
  {
    id: 'w11', type: 'doc_request', title: 'Bank Statements — FY 2025-26',
    client: 'Apex Auto Parts', priority: 'high', score: 60, due_date: '2026-06-28',
    days_remaining: 3, assigned_to: 'Rohan Verma', assigned_by: 'Priya Sharma', progress: 10, open_queries: 0,
    pending_docs: 6, status: 'Waiting', queue: 'todo',
    tags: ['Documents', 'Bank'], description: '6 months of bank statements pending. Reminder sent twice — no response.',
  },
  {
    id: 'w12', type: 'client_followup', title: 'Q4 TDS Challan Details',
    client: 'Redwood Constructions', priority: 'high', score: 58, due_date: '2026-06-27',
    days_remaining: 2, assigned_to: 'Sneha Iyer', assigned_by: 'Priya Sharma', progress: 0, open_queries: 1,
    pending_docs: 3, status: 'Waiting', queue: 'in_progress',
    tags: ['Follow-up', 'TDS'], description: 'Challan BSR codes and deposit dates not provided by client despite multiple reminders.',
  },
  {
    id: 'w13', type: 'doc_request', title: 'Purchase Invoices — April 2026',
    client: 'Green Pharma', priority: 'medium', score: 44, due_date: '2026-07-08',
    days_remaining: 13, assigned_to: 'Sneha Iyer', assigned_by: 'Priya Sharma', progress: 40, open_queries: 0,
    pending_docs: 4, status: 'Waiting', queue: 'todo',
    tags: ['Documents', 'Purchases'], description: 'Purchase invoices required for ITC reconciliation.',
  },
  {
    id: 'w14', type: 'internal', title: 'Update ICAI Membership Records',
    client: 'Internal', priority: 'low', score: 20, due_date: '2026-07-15',
    days_remaining: 20, assigned_to: 'Rohan Verma', assigned_by: 'Priya Sharma', progress: 0, open_queries: 0,
    pending_docs: 0, status: 'Todo', queue: 'todo',
    tags: ['Internal', 'Admin'], description: 'Annual renewal of ICAI membership for all team members.',
  },
  {
    id: 'w15', type: 'gst_filing', title: 'GSTR-1 — March 2026',
    client: 'Apex Auto Parts', priority: 'low', score: 10, due_date: '2026-05-15',
    days_remaining: -41, assigned_to: 'Sneha Iyer', assigned_by: 'Priya Sharma', progress: 100, open_queries: 0,
    pending_docs: 0, status: 'Filed', queue: 'done',
    tags: ['GSTR-1', 'Filed'], description: 'GSTR-1 for March 2026 filed successfully.',
    gstin: '08AAAPA1234A1ZT', return_period: 'March 2026', form_type: 'GSTR-1', ack_no: 'AA2026031234567',
  },
  {
    id: 'w16', type: 'audit', title: 'Statutory Audit FY 2024-25',
    client: 'Sunrise Textiles', priority: 'low', score: 10, due_date: '2026-03-31',
    days_remaining: -86, assigned_to: 'Rohan Verma', assigned_by: 'Priya Sharma', progress: 100, open_queries: 0,
    pending_docs: 0, status: 'Signed Off', queue: 'done',
    tags: ['Statutory Audit', 'Signed'], description: 'Statutory audit for FY 2024-25 complete and signed off.',
    audit_type: 'Statutory Audit',
  },
]


// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Used in drawer + OpsPanel — colored urgency badge */
function DaysBadge({ days }: { days: number }) {
  if (days < 0) return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: '#FEF2F2', color: '#DC2626' }}>
      {Math.abs(days)}d overdue
    </span>
  )
  if (days === 0) return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: '#FEF2F2', color: '#DC2626' }}>Due today</span>
  )
  if (days <= 3) return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: '#FFFBEB', color: '#D97706' }}>{days}d left</span>
  )
  return (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: G.canvas, color: G.secondary }}>{days}d left</span>
  )
}

/** Used on cards — minimal "Due Jun 26" text, red Overdue badge only when past due */
function DueLabel({ dueDate, daysRemaining }: { dueDate: string; daysRemaining: number }) {
  if (daysRemaining < 0) return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
      style={{ background: '#FEF2F2', color: '#DC2626' }}>Overdue</span>
  )
  const formatted = new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return (
    <span className="text-[10px] font-medium" style={{ color: '#475569' }}>Due {formatted}</span>
  )
}

function TypeChip({ type }: { type: WorkType }) {
  const cfg = TYPE_CFG[type]
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
      <Icon className="h-2.5 w-2.5" style={{ color: cfg.color }} />{cfg.label}
    </span>
  )
}

function PriorityDot({ priority }: { priority: Priority }) {
  return <span className="h-2 w-2 rounded-full shrink-0 inline-block"
    style={{ background: PRIORITY_CFG[priority].dot }} />
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'xs' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold shrink-0', size === 'xs' ? 'h-5 w-5 text-[8px]' : 'h-6 w-6 text-[9px]')}
      style={{ background: '#0584C7', color: '#fff' }}>
      {initials}
    </div>
  )
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct === 100 ? '#16A34A' : pct >= 70 ? '#0584C7' : pct >= 40 ? '#D97706' : '#94A3B8'
  return (
    <div className="h-1 w-full rounded-full" style={{ background: G.border }}>
      <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ─── Work Item Card ────────────────────────────────────────────────────────────
function getCardBorderLeft(item: WorkItem): string {
  if (item.priority === 'critical') return '3px solid #DC2626'
  return '1px solid #E2E8F0'
}

function WorkCard({ item, onClick, assignedBy }: { item: WorkItem; onClick: () => void; assignedBy?: string }) {
  const borderLeft = getCardBorderLeft(item)
  return (
    <div
      onClick={onClick}
      className="cursor-pointer select-none"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderLeft,
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        padding: '10px 12px',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 4px 14px rgba(15,23,42,0.10)'
        el.style.border = '1px solid #CBD5E1'
        el.style.borderLeft = borderLeft
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)'
        el.style.border = '1px solid #E2E8F0'
        el.style.borderLeft = borderLeft
      }}
    >
      {/* Top row: type chip + due label */}
      <div className="flex items-center justify-between mb-2">
        <TypeChip type={item.type} />
        <DueLabel dueDate={item.due_date} daysRemaining={item.days_remaining} />
      </div>

      {/* Title */}
      <p className="text-xs font-semibold leading-tight mb-1" style={{ color: '#0F172A' }}>{item.title}</p>

      {/* Client */}
      <p className="text-[10px] mb-1" style={{ color: '#475569' }}>{item.client}</p>

      {assignedBy && (
        <p className="text-[9px] mb-2" style={{ color: G.icon }}>Assigned by {assignedBy}</p>
      )}

      {/* Progress */}
      <div className="mb-2.5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px]" style={{ color: G.icon }}>Progress</span>
          <span className="text-[9px] font-semibold" style={{ color: G.secondary }}>{item.progress}%</span>
        </div>
        <ProgressBar pct={item.progress} />
      </div>

      {/* Footer: assignee + query/doc pills */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar name={item.assigned_to} size="xs" />
          <span className="text-[9px]" style={{ color: G.secondary }}>{item.assigned_to}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {item.open_queries > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
              <MessageSquare className="h-2.5 w-2.5" />{item.open_queries}
            </span>
          )}
          {item.pending_docs > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
              <FolderOpen className="h-2.5 w-2.5" />{item.pending_docs}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Board Column ─────────────────────────────────────────────────────────────
function BoardColumn({ queueId, items, onCardClick, showAssignedBy }: {
  queueId: QueueId; items: WorkItem[]; onCardClick: (item: WorkItem) => void; showAssignedBy?: boolean
}) {
  const cfg = QUEUE_CFG[queueId]
  const Icon = cfg.icon
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        minWidth: 268,
        maxWidth: 268,
        background: G.white,
        border: `1px solid ${G.border}`,
        borderRadius: 14,
      }}
    >
      {/* Column header */}
      <div
        className="px-3 py-2.5 flex items-center justify-between"
        style={{
          background: G.canvas,
          borderBottom: `1px solid ${G.border}`,
          borderRadius: '14px 14px 0 0',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" style={{ color: G.secondary }} />
          <span className="text-xs font-bold" style={{ color: G.primary }}>{cfg.label}</span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: G.border, color: G.secondary }}
          >
            {items.length}
          </span>
        </div>
        <button
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{ color: G.icon, padding: '2px 4px' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = G.primary}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = G.icon}
          onClick={() => {}}
          title={`Add to ${cfg.label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cards */}
      <div
        className="flex flex-col gap-2 p-2 overflow-y-auto flex-1"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-1">
            <CheckCircle2 className="h-6 w-6" style={{ color: G.icon, opacity: 0.4 }} />
            <p className="text-[10px]" style={{ color: G.icon }}>Nothing here</p>
          </div>
        )}
        {items.map(item => (
          <WorkCard key={item.id} item={item} onClick={() => onCardClick(item)} assignedBy={showAssignedBy ? item.assigned_by : undefined} />
        ))}
      </div>
    </div>
  )
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────
type DrawerTab = 'overview' | 'documents' | 'queries' | 'comments'

const QUEUE_ORDER: QueueId[] = ['todo', 'in_progress', 'in_review', 'done']
const QUEUE_LABELS: Record<QueueId, string> = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done',
}

function DetailDrawer({
  item, onClose, isArticle, isAdmin, onAction,
}: {
  item: WorkItem; onClose: () => void; isArticle: boolean; isAdmin: boolean
  onAction: (type: PendingAction['type'], meta: { note?: string; newDate?: string }) => void
}) {
  const navigate = useNavigate()
  const [tab, setTab]             = useState<DrawerTab>('overview')
  const [newComment, setNewComment] = useState('')
  const [newQuery, setNewQuery]   = useState('')
  const [extendDate, setExtendDate] = useState('')
  const [showExtend, setShowExtend] = useState(false)
  const [reminderDate, setReminderDate] = useState('')
  const [reminderNote, setReminderNote] = useState('')
  const [showReminder, setShowReminder] = useState(false)
  const [currentQueue, setCurrentQueue] = useState<QueueId>(item.queue)

  const p    = PRIORITY_CFG[item.priority]
  const tc   = TYPE_CFG[item.type]
  const TIcon = tc.icon

  // Role-based: article can move to in_progress / in_review; only admin can mark done
  const canMoveTo = (target: QueueId): boolean => {
    if (target === currentQueue) return false
    if (target === 'done') return isAdmin
    if (isArticle) return target === 'in_progress' || target === 'in_review'
    return true
  }

  const nextQueue = QUEUE_ORDER[QUEUE_ORDER.indexOf(currentQueue) + 1] as QueueId | undefined

  function moveStatus(target: QueueId) {
    setCurrentQueue(target)
    toast.success(`Moved to "${QUEUE_LABELS[target]}"`)
    if (target === 'in_review') {
      onAction('in_review', {})
    }
  }

  const mockDocs = [
    { name: 'Bank Statement Apr 2026', status: item.pending_docs > 0 ? 'Pending' : 'Uploaded', required: true },
    { name: 'Purchase Invoices',       status: item.pending_docs > 1 ? 'Pending' : 'Uploaded', required: true },
    { name: 'Sales Invoices',          status: 'Uploaded', required: true },
    { name: 'Challans / Payment Proof',status: item.type === 'tds_filing' && item.pending_docs > 0 ? 'Pending' : 'Uploaded', required: false },
  ]
  const mockComments = [
    { author: 'Rohan V.',       time: '2 hours ago', text: 'Documents received from client. Starting data entry now.' },
    { author: item.assigned_to, time: '1 day ago',   text: 'Sent reminder email to client for pending documents.' },
  ]
  const mockQueries = [
    { id: 1, by: item.assigned_to, text: 'Challan details not provided. Should we proceed with available data?', status: 'open', time: '5 hours ago' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{ width: 540, background: G.white, borderLeft: `1px solid ${G.border}`, boxShadow: '-8px 0 32px rgba(15,23,42,0.12)' }}>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${G.border}` }}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: tc.bg }}>
            <TIcon className="h-4 w-4" style={{ color: tc.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <TypeChip type={item.type} />
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: p.bg, color: p.color }}>{p.label}</span>
            </div>
            <h2 className="text-sm font-bold leading-tight" style={{ color: G.primary }}>{item.title}</h2>
            <p className="text-xs mt-0.5" style={{ color: G.secondary }}>{item.client}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ background: G.canvas }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G.border}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = G.canvas}>
            <X className="h-4 w-4" style={{ color: G.secondary }} />
          </button>
        </div>

        {/* Status pipeline strip */}
        <div className="px-5 py-3 flex items-center gap-2 flex-wrap" style={{ background: G.canvas, borderBottom: `1px solid ${G.border}` }}>
          {QUEUE_ORDER.map((q, i) => {
            const isCurrent = q === currentQueue
            const isDone    = q === 'done'
            const locked    = isDone && !isAdmin
            return (
              <div key={q} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" style={{ color: G.icon }} />}
                <button
                  disabled={!canMoveTo(q)}
                  onClick={() => canMoveTo(q) && moveStatus(q)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                  style={{
                    background: isCurrent ? G.primary : G.white,
                    color: isCurrent ? '#fff' : locked ? G.icon : G.secondary,
                    border: `1px solid ${isCurrent ? G.primary : G.border}`,
                    cursor: canMoveTo(q) ? 'pointer' : 'default',
                    opacity: !isCurrent && !canMoveTo(q) ? 0.55 : 1,
                  }}>
                  {locked && !isCurrent && <Lock className="h-2.5 w-2.5 mr-0.5" />}
                  {QUEUE_LABELS[q]}
                </button>
              </div>
            )
          })}
          <div className="flex-1" />
          <DaysBadge days={item.days_remaining} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-2" style={{ borderBottom: `1px solid ${G.border}` }}>
          {(['overview', 'documents', 'queries', 'comments'] as DrawerTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{ background: tab === t ? G.primary : 'transparent', color: tab === t ? '#fff' : G.secondary }}>
              {t}
              {t === 'queries' && item.open_queries > 0 && (
                <span className="ml-1 text-[9px] font-bold px-1 py-0.5 rounded-full"
                  style={{ background: '#E2E8F0', color: G.secondary }}>{item.open_queries}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── Overview ─────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: G.secondary }}>{item.description}</p>

              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Progress',      value: `${item.progress}%` },
                  { label: 'Assigned To',   value: item.assigned_to },
                  { label: 'Due Date',      value: item.due_date },
                  { label: 'Priority Score',value: item.score },
                  { label: 'Open Queries',  value: item.open_queries },
                  { label: 'Pending Docs',  value: item.pending_docs },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                    <p className="text-[9px] font-semibold mb-1" style={{ color: G.icon }}>{m.label}</p>
                    <p className="text-sm font-bold" style={{ color: G.primary }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Assigned By */}
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: '#0F172A' }}>
                  {item.assigned_by.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-[9px] font-semibold" style={{ color: G.icon }}>Assigned by</p>
                  <p className="text-xs font-bold" style={{ color: G.primary }}>{item.assigned_by}</p>
                  <p className="text-[9px]" style={{ color: G.secondary }}>CA Admin · admin@auditlens.demo</p>
                </div>
              </div>

              {/* ── Quick Actions ──────────────────────────── */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: G.icon }}>Quick Actions</p>
                <div className="space-y-2">

                  {/* Extend Deadline */}
                  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
                    <button onClick={() => setShowExtend(v => !v)}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                      style={{ background: G.white }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G.canvas}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = G.white}>
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                        <CalendarClock className="h-3.5 w-3.5" style={{ color: G.secondary }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold" style={{ color: G.primary }}>Request Deadline Extension</p>
                        <p className="text-[9px]" style={{ color: G.icon }}>Propose a new due date for this work item</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform"
                        style={{ color: G.icon, transform: showExtend ? 'rotate(90deg)' : 'none' }} />
                    </button>
                    {showExtend && (
                      <div className="px-4 pb-3 pt-1 space-y-2" style={{ background: G.canvas, borderTop: `1px solid ${G.border}` }}>
                        <label className="text-[10px] font-semibold" style={{ color: G.secondary }}>Proposed new date</label>
                        <input type="date" value={extendDate} onChange={e => setExtendDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                          style={{ background: G.white, border: `1px solid ${G.border}`, color: G.primary }} />
                        <button onClick={() => { if (extendDate) { onAction('extension_request', { note: '', newDate: extendDate }); toast.success('Extension request sent to admin'); setShowExtend(false); setExtendDate('') } }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ background: G.primary }}>Send Request</button>
                      </div>
                    )}
                  </div>

                  {/* Set Reminder */}
                  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
                    <button onClick={() => setShowReminder(v => !v)}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                      style={{ background: G.white }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G.canvas}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = G.white}>
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                        <Bell className="h-3.5 w-3.5" style={{ color: G.secondary }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold" style={{ color: G.primary }}>Set Alert / Reminder</p>
                        <p className="text-[9px]" style={{ color: G.icon }}>Get notified before the deadline or a custom date</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform"
                        style={{ color: G.icon, transform: showReminder ? 'rotate(90deg)' : 'none' }} />
                    </button>
                    {showReminder && (
                      <div className="px-4 pb-3 pt-1 space-y-2" style={{ background: G.canvas, borderTop: `1px solid ${G.border}` }}>
                        <label className="text-[10px] font-semibold" style={{ color: G.secondary }}>Remind me on</label>
                        <input type="datetime-local" value={reminderDate} onChange={e => setReminderDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                          style={{ background: G.white, border: `1px solid ${G.border}`, color: G.primary }} />
                        <input value={reminderNote} onChange={e => setReminderNote(e.target.value)}
                          placeholder="Note (optional)…"
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                          style={{ background: G.white, border: `1px solid ${G.border}`, color: G.primary }} />
                        <button onClick={() => { if (reminderDate) { toast.success('Reminder set'); setShowReminder(false); setReminderDate(''); setReminderNote('') } }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ background: G.primary }}>Set Reminder</button>
                      </div>
                    )}
                  </div>

                  {/* Request Documents via Communication */}
                  <button
                    onClick={() => { onAction('doc_request', {}); toast.info('Opening Communication tab…'); setTimeout(() => navigate('/communication'), 600); onClose() }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left"
                    style={{ background: G.white, border: `1px solid ${G.border}` }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G.canvas}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = G.white}>
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                      <FileUp className="h-3.5 w-3.5" style={{ color: G.secondary }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold" style={{ color: G.primary }}>Request Documents from Client</p>
                      <p className="text-[9px]" style={{ color: G.icon }}>Send a document request via Communication tab</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: G.icon }} />
                  </button>

                  {/* Move to next status (quick shortcut) */}
                  {nextQueue && canMoveTo(nextQueue) && (
                    <button onClick={() => moveStatus(nextQueue)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left"
                      style={{ background: G.white, border: `1px solid ${G.border}` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G.canvas}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = G.white}>
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                        <CheckCircle2 className="h-3.5 w-3.5" style={{ color: G.secondary }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold" style={{ color: G.primary }}>
                          Move to "{QUEUE_LABELS[nextQueue]}"
                        </p>
                        <p className="text-[9px]" style={{ color: G.icon }}>Advance this work item to the next stage</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: G.icon }} />
                    </button>
                  )}
                  {nextQueue && !canMoveTo(nextQueue) && nextQueue === 'done' && isArticle && (
                    <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                      <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: G.icon }} />
                      <p className="text-[10px]" style={{ color: G.icon }}>Only a CA Admin can mark this as Done</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Type-specific detail panels */}
              {item.gstin && (
                <div className="rounded-xl p-3 space-y-2" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: G.secondary }}>GST Details</p>
                  {[['GSTIN', item.gstin], ['Period', item.return_period], ['Form', item.form_type], ['Ack No.', item.ack_no ?? 'Not filed']].map(([k, v]) => v && (
                    <div key={k} className="flex justify-between">
                      <span className="text-[10px]" style={{ color: G.icon }}>{k}</span>
                      <span className="text-[10px] font-semibold font-mono" style={{ color: G.primary }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              {item.notice_no && (
                <div className="rounded-xl p-3 space-y-2" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: G.secondary }}>Notice Details</p>
                  {[['Notice No.', item.notice_no], ['Authority', item.authority], ['Severity', item.severity], ['Stage', item.workflow_stage]].map(([k, v]) => v && (
                    <div key={k} className="flex justify-between">
                      <span className="text-[10px]" style={{ color: G.icon }}>{k}</span>
                      <span className="text-[10px] font-semibold" style={{ color: G.primary }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              {item.audit_type && (
                <div className="rounded-xl p-3 space-y-2" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: G.secondary }}>Audit Details</p>
                  {[['Type', item.audit_type], ['Stage', item.status]].map(([k, v]) => v && (
                    <div key={k} className="flex justify-between">
                      <span className="text-[10px]" style={{ color: G.icon }}>{k}</span>
                      <span className="text-[10px] font-semibold" style={{ color: G.primary }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map(t => (
                    <span key={t} className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          {tab === 'documents' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold" style={{ color: G.primary }}>Required Documents</p>
                <button className="text-xs font-semibold" style={{ color: '#0584C7' }}
                  onClick={() => toast.info('Upload document')}>+ Upload</button>
              </div>
              {mockDocs.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: doc.status === 'Uploaded' ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${doc.status === 'Uploaded' ? '#86EFAC' : '#FCD34D'}` }}>
                  <Paperclip className="h-3.5 w-3.5 shrink-0" style={{ color: doc.status === 'Uploaded' ? '#16A34A' : '#D97706' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: G.primary }}>{doc.name}</p>
                    <p className="text-[9px]" style={{ color: G.secondary }}>{doc.required ? 'Required' : 'Optional'}</p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: doc.status === 'Uploaded' ? '#DCFCE7' : '#FEF9C3', color: doc.status === 'Uploaded' ? '#15803D' : '#A16207' }}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Queries */}
          {tab === 'queries' && (
            <div className="space-y-3">
              {mockQueries.map(q => (
                <div key={q.id} className="rounded-xl p-3"
                  style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={q.by} size="xs" />
                    <span className="text-[10px] font-semibold" style={{ color: G.primary }}>{q.by}</span>
                    <span className="text-[9px]" style={{ color: G.icon }}>{q.time}</span>
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#FEF3C7', color: '#92400E' }}>Open</span>
                  </div>
                  <p className="text-xs" style={{ color: G.secondary }}>{q.text}</p>
                  <button onClick={() => toast.success('Query resolved')}
                    className="mt-2 text-[10px] font-semibold px-2 py-1 rounded-lg"
                    style={{ background: '#F0FDF4', color: '#16A34A' }}>Mark Resolved</button>
                </div>
              ))}
              <div className="flex gap-2">
                <input value={newQuery} onChange={e => setNewQuery(e.target.value)}
                  placeholder="Raise a new query…"
                  className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                  style={{ background: G.canvas, border: `1.5px solid ${G.border}`, color: G.primary }} />
                <button onClick={() => { if (newQuery.trim()) { toast.info('Query raised'); setNewQuery('') } }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: '#0584C7' }}>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Comments */}
          {tab === 'comments' && (
            <div className="space-y-3">
              {mockComments.map((c, i) => (
                <div key={i} className="flex gap-2.5">
                  <Avatar name={c.author} size="xs" />
                  <div className="flex-1 rounded-xl p-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold" style={{ color: G.primary }}>{c.author}</span>
                      <span className="text-[9px]" style={{ color: G.icon }}>{c.time}</span>
                    </div>
                    <p className="text-xs" style={{ color: G.secondary }}>{c.text}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment…"
                  className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                  style={{ background: G.canvas, border: `1.5px solid ${G.border}`, color: G.primary }} />
                <button onClick={() => { if (newComment.trim()) { toast.success('Comment added'); setNewComment('') } }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: '#0584C7' }}>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Mock reference data ──────────────────────────────────────────────────────
const MOCK_CLIENTS = [
  { id: 'c1', name: 'Sunrise Textiles',     gstins: ['27AABCS1429B1ZB', '27AABCS1429B1ZC'], tan: 'MUMS12345A' },
  { id: 'c2', name: 'BlueSky Software',     gstins: ['29AADCB2230M1ZV'],                    tan: 'BLRS67890B' },
  { id: 'c3', name: 'Redwood Constructions', gstins: ['07AAECR1234F1ZQ'],                   tan: 'DELS11223C' },
  { id: 'c4', name: 'Apex Auto Parts',      gstins: ['08AAAPA1234A1ZT'],                    tan: 'JAIS44556D' },
  { id: 'c5', name: 'Green Pharma',         gstins: ['24AABCG9988P1Z3'],                    tan: 'AHMS77889E' },
]
const MOCK_TEAM = [
  { id: 'u1', name: 'Rohan Verma', role: 'Article' },
  { id: 'u2', name: 'Sneha Iyer',  role: 'Article' },
]
const GST_RETURN_TYPES  = ['GSTR-1', 'GSTR-1A', 'GSTR-3B', 'GSTR-9', 'GSTR-9C']
const TDS_RETURN_TYPES  = ['138-TDS (24Q)', '140-TDS (26Q)', '144-TDS (27Q)', '143-TDS (27EQ)']
const AUDIT_TYPES       = ['Statutory Audit', 'Tax Audit', 'Internal Audit', 'GST Audit']
const NOTICE_TYPES      = ['GST SCN', 'IT Scrutiny', 'Assessment Notice', 'Demand Notice']
const FY_OPTIONS        = ['2025-26', '2024-25', '2023-24']
const MONTHS            = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March']
const QUARTERS          = ['Q1 (Apr–Jun)', 'Q2 (Jul–Sep)', 'Q3 (Oct–Dec)', 'Q4 (Jan–Mar)']

// ─── Create Work Item Modal ────────────────────────────────────────────────────
const WORK_CATEGORIES = [
  { id: 'gst_filing',      label: 'GST Filing',         icon: FileText,     color: '#0584C7', desc: 'GSTR-1, GSTR-3B, GSTR-9, GSTR-9C' },
  { id: 'tds_filing',      label: 'TDS Filing',         icon: ReceiptText,  color: '#7C3AED', desc: '138-TDS, 140-TDS, 144-TDS, 143-TDS' },
  { id: 'audit',           label: 'Audit Engagement',   icon: Scale,        color: '#0D9488', desc: 'Statutory Audit, Tax Audit, Internal Audit' },
  { id: 'notice',          label: 'Government Notice',  icon: ShieldAlert,  color: '#DC2626', desc: 'GST SCN, IT Notice, Assessment' },
  { id: 'doc_request',     label: 'Document Request',   icon: FolderOpen,   color: '#D97706', desc: 'Collect documents from client' },
  { id: 'client_followup', label: 'Client Follow-up',   icon: Users,        color: '#2563EB', desc: 'Pending responses, clarifications' },
  { id: 'internal',        label: 'Internal Task',      icon: Layers,       color: '#64748B', desc: 'Admin, team, or internal work' },
]

function CreateModal({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (item: Partial<WorkItem> & { assigned_to: string; client: string; type: WorkType; priority: Priority; due_date: string; queue: 'todo' }) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedCat, setSelectedCat] = useState<WorkType | ''>('')

  // Common fields
  const [client, setClient]     = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate]   = useState('')
  const [fy, setFy]             = useState(FY_OPTIONS[0])
  const [description, setDescription] = useState('')

  // GST-specific
  const [gstin, setGstin]               = useState('')
  const [gstReturnType, setGstReturnType] = useState('')
  const [month, setMonth]               = useState('')

  // TDS-specific
  const [tdsReturnType, setTdsReturnType] = useState('')
  const [quarter, setQuarter]           = useState('')

  // Audit-specific
  const [auditType, setAuditType] = useState('')

  // Notice-specific
  const [noticeNo, setNoticeNo]       = useState('')
  const [authority, setAuthority]     = useState('')
  const [noticeType, setNoticeType]   = useState('')
  const [responseDue, setResponseDue] = useState('')

  const selectedClient = MOCK_CLIENTS.find(c => c.name === client)
  const tan = selectedClient?.tan ?? ''
  const canSubmit = !!client && !!assignTo && !!dueDate

  function handleSubmit() {
    if (!canSubmit || !selectedCat) return
    const partial: Partial<WorkItem> & { assigned_to: string; client: string; type: WorkType; priority: Priority; due_date: string; queue: 'todo' } = {
      type: selectedCat as WorkType,
      client,
      assigned_to: assignTo,
      priority,
      due_date: dueDate,
      queue: 'todo',
      description,
      tags: [],
      ...(selectedCat === 'gst_filing'  && { gstin, form_type: gstReturnType, return_period: month }),
      ...(selectedCat === 'tds_filing'  && { form_type: tdsReturnType, quarter }),
      ...(selectedCat === 'audit'       && { audit_type: auditType }),
      ...(selectedCat === 'notice'      && { notice_no: noticeNo, authority, severity: noticeType }),
    }
    onSubmit(partial)
  }

  const inputBase: React.CSSProperties = {
    background: G.canvas,
    border: `1px solid ${G.border}`,
    color: G.primary,
    borderRadius: 10,
    padding: '8px 12px',
    width: '100%',
    fontSize: 12,
    outline: 'none',
  }
  const labelCls = 'block text-[10px] font-semibold uppercase tracking-wider mb-1'

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full flex flex-col"
        style={{ maxWidth: 560, maxHeight: '85vh', background: G.white, border: `1px solid ${G.border}`, borderRadius: 16 }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: `1px solid ${G.border}` }}>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-semibold" style={{ color: G.icon }}>
                Step {step} of 2 — {step === 1 ? 'Select Category' : 'Fill Details'}
              </span>
            </div>
            {step === 2 && (
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px]" style={{ color: G.icon }}>Category</span>
                <ChevronRight className="h-3 w-3" style={{ color: G.icon }} />
                <span className="text-[10px] font-semibold" style={{ color: G.primary }}>Details</span>
              </div>
            )}
            <h2 className="text-sm font-bold" style={{ color: G.primary }}>Create Work Item</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: G.canvas }}>
            <X className="h-4 w-4" style={{ color: G.secondary }} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4">

          {/* ── Step 1: Category grid ── */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2">
              {WORK_CATEGORIES.map(cat => {
                const Icon = cat.icon
                const active = selectedCat === cat.id
                return (
                  <button key={cat.id} onClick={() => setSelectedCat(cat.id as WorkType)}
                    className="flex items-start gap-3 rounded-xl p-3 text-left transition-all"
                    style={{
                      background: active ? cat.color + '12' : G.canvas,
                      border: `1.5px solid ${active ? cat.color : G.border}`,
                    }}>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: cat.color + '18' }}>
                      <Icon className="h-4 w-4" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: active ? cat.color : G.primary }}>{cat.label}</p>
                      <p className="text-[9px] mt-0.5" style={{ color: G.icon }}>{cat.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Step 2: Detail form ── */}
          {step === 2 && (
            <div className="space-y-3">

              {/* Client */}
              <div>
                <label className={labelCls} style={{ color: G.icon }}>Client *</label>
                <div className="relative">
                  <select value={client}
                    onChange={e => { setClient(e.target.value); setGstin('') }}
                    className="appearance-none"
                    style={inputBase}>
                    <option value="">Select client…</option>
                    {MOCK_CLIENTS.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                </div>
              </div>

              {/* Assign To */}
              <div>
                <label className={labelCls} style={{ color: G.icon }}>Assign To *</label>
                <div className="relative">
                  <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
                    className="appearance-none"
                    style={inputBase}>
                    <option value="">Select team member…</option>
                    {MOCK_TEAM.map(u => <option key={u.id} value={u.name}>{u.name} ({u.role})</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                </div>
              </div>

              {/* Priority + Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={{ color: G.icon }}>Priority</label>
                  <div className="relative">
                    <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                      className="appearance-none"
                      style={inputBase}>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                  </div>
                </div>
                <div>
                  <label className={labelCls} style={{ color: G.icon }}>Due Date *</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    style={inputBase} />
                </div>
              </div>

              {/* Financial Year + second column (GSTIN or Quarter) */}
              {selectedCat === 'gst_filing' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Financial Year</label>
                    <div className="relative">
                      <select value={fy} onChange={e => setFy(e.target.value)}
                        className="appearance-none" style={inputBase}>
                        {FY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>GSTIN</label>
                    <div className="relative">
                      <select value={gstin} onChange={e => setGstin(e.target.value)}
                        className="appearance-none" style={inputBase}>
                        <option value="">Select GSTIN…</option>
                        {(selectedClient?.gstins ?? []).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                    </div>
                  </div>
                </div>
              )}

              {selectedCat === 'tds_filing' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Financial Year</label>
                    <div className="relative">
                      <select value={fy} onChange={e => setFy(e.target.value)}
                        className="appearance-none" style={inputBase}>
                        {FY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Quarter</label>
                    <div className="relative">
                      <select value={quarter} onChange={e => setQuarter(e.target.value)}
                        className="appearance-none" style={inputBase}>
                        <option value="">Select quarter…</option>
                        {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                    </div>
                  </div>
                </div>
              )}

              {selectedCat !== 'gst_filing' && selectedCat !== 'tds_filing' && (
                <div>
                  <label className={labelCls} style={{ color: G.icon }}>Financial Year</label>
                  <div className="relative">
                    <select value={fy} onChange={e => setFy(e.target.value)}
                      className="appearance-none" style={inputBase}>
                      {FY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                  </div>
                </div>
              )}

              {/* GST Filing extra */}
              {selectedCat === 'gst_filing' && (
                <>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Return Type</label>
                    <div className="relative">
                      <select value={gstReturnType} onChange={e => setGstReturnType(e.target.value)}
                        className="appearance-none" style={inputBase}>
                        <option value="">Select return type…</option>
                        {GST_RETURN_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Month</label>
                    <div className="relative">
                      <select value={month} onChange={e => setMonth(e.target.value)}
                        className="appearance-none" style={inputBase}>
                        <option value="">Select month…</option>
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                    </div>
                  </div>
                </>
              )}

              {/* TDS Filing extra */}
              {selectedCat === 'tds_filing' && (
                <>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>TAN (Auto-filled)</label>
                    <input value={tan} disabled
                      style={{ ...inputBase, opacity: 0.6, cursor: 'not-allowed' }} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Return Type</label>
                    <div className="relative">
                      <select value={tdsReturnType} onChange={e => setTdsReturnType(e.target.value)}
                        className="appearance-none" style={inputBase}>
                        <option value="">Select return type…</option>
                        {TDS_RETURN_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                    </div>
                  </div>
                </>
              )}

              {/* Audit extra */}
              {selectedCat === 'audit' && (
                <div>
                  <label className={labelCls} style={{ color: G.icon }}>Audit Type</label>
                  <div className="relative">
                    <select value={auditType} onChange={e => setAuditType(e.target.value)}
                      className="appearance-none" style={inputBase}>
                      <option value="">Select audit type…</option>
                      {AUDIT_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                  </div>
                </div>
              )}

              {/* Notice extra */}
              {selectedCat === 'notice' && (
                <>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Notice Number</label>
                    <input value={noticeNo} onChange={e => setNoticeNo(e.target.value)}
                      placeholder="e.g. SCN/GST/2026/1234"
                      style={inputBase} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Issuing Authority</label>
                    <input value={authority} onChange={e => setAuthority(e.target.value)}
                      placeholder="e.g. GST Department — Delhi"
                      style={inputBase} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Notice Type</label>
                    <div className="relative">
                      <select value={noticeType} onChange={e => setNoticeType(e.target.value)}
                        className="appearance-none" style={inputBase}>
                        <option value="">Select notice type…</option>
                        {NOTICE_TYPES.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Response Due Date</label>
                    <input type="date" value={responseDue} onChange={e => setResponseDue(e.target.value)}
                      style={inputBase} />
                  </div>
                </>
              )}

              {/* Description */}
              <div>
                <label className={labelCls} style={{ color: G.icon }}>Description / Notes</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Add any relevant notes…"
                  style={{ ...inputBase, resize: 'vertical' }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-3 flex items-center gap-3 flex-shrink-0"
          style={{ borderTop: `1px solid ${G.border}` }}>
          {step === 1 ? (
            <>
              <div className="flex-1" />
              <button
                disabled={!selectedCat}
                onClick={() => { if (selectedCat) setStep(2) }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: G.primary }}>
                Continue →
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
                ← Back
              </button>
              <div className="flex-1" />
              <button
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: G.primary }}>
                Create Work Item
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Operations Intelligence Panel ────────────────────────────────────────────
function OpsPanel({
  items, currentUserName, isArticle: isArticleView, pendingActions, adminView, onResolve,
}: {
  items: WorkItem[]
  currentUserName?: string
  isArticle: boolean
  pendingActions: PendingAction[]
  adminView: boolean
  onResolve?: (id: string) => void
}) {
  // ── Admin Management Panel ───────────────────────────────────────────────────
  if (adminView) {
    const pendingSummary: { type: PendingAction['type']; label: string; icon: React.ElementType }[] = [
      { type: 'in_review',          label: 'Awaiting Review',     icon: ScanEye       },
      { type: 'extension_request',  label: 'Extension Requests',  icon: CalendarClock },
      { type: 'doc_request',        label: 'Doc Requests',        icon: FileUp        },
    ]

    return (
      <div className="flex flex-col gap-4 h-full overflow-y-auto">

        {/* 1. Team Overview */}
        <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-3.5 w-3.5" style={{ color: G.secondary }} />
            <p className="text-xs font-bold" style={{ color: G.primary }}>Team Overview</p>
          </div>
          {MOCK_TEAM.map(member => {
            const memberItems = items.filter(i => i.assigned_to === member.name)
            const active = memberItems.filter(i => i.queue !== 'done').length
            const done   = memberItems.filter(i => i.queue === 'done').length
            const total  = active + done
            const pct    = total > 0 ? (done / total) * 100 : 0
            return (
              <div key={member.id} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: G.primary }}>{member.name}</p>
                    <p className="text-[9px]" style={{ color: G.icon }}>{member.role}</p>
                  </div>
                  <p className="text-[10px]" style={{ color: G.secondary }}>{active} active · {done} done</p>
                </div>
                <div className="h-1.5 w-full rounded-full" style={{ background: G.canvas }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: G.primary }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* 2. Pending Actions — full interactive cards */}
        <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-3.5 w-3.5" style={{ color: G.secondary }} />
            <p className="text-xs font-bold" style={{ color: G.primary }}>Pending Actions</p>
            {pendingActions.filter(a => !a.resolved).length > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
                style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
                {pendingActions.filter(a => !a.resolved).length}
              </span>
            )}
          </div>
          {pendingActions.filter(a => !a.resolved).length === 0 ? (
            <p className="text-[10px]" style={{ color: G.icon }}>No pending actions.</p>
          ) : (
            <div className="space-y-2">
              {pendingActions.filter(a => !a.resolved).map(action => {
                const cfg = ADMIN_PENDING_TYPE_CFG[action.type]
                const Icon = cfg.icon
                return (
                  <div key={action.id} className="rounded-xl p-3"
                    style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className="h-3 w-3 shrink-0" style={{ color: G.secondary }} />
                      <span className="text-[9px] font-semibold" style={{ color: G.secondary }}>{cfg.label}</span>
                      <span className="text-[9px] ml-auto" style={{ color: G.icon }}>{action.createdAt}</span>
                    </div>
                    <p className="text-[10px] font-semibold truncate mb-0.5" style={{ color: G.primary }}>{action.workItemTitle}</p>
                    <p className="text-[9px] mb-0.5" style={{ color: G.secondary }}>{action.client}</p>
                    <p className="text-[9px] mb-2" style={{ color: G.icon }}>by {action.requestedBy}{action.newDate ? ` · Proposed: ${action.newDate}` : ''}</p>
                    <button onClick={() => onResolve?.(action.id)}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-lg text-white"
                      style={{ background: G.primary }}>
                      Mark Done
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 3. Upcoming Deadlines (all team) */}
        <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-3.5 w-3.5" style={{ color: '#2563EB' }} />
            <p className="text-xs font-bold" style={{ color: G.primary }}>Upcoming Deadlines</p>
          </div>
          <div className="space-y-2">
            {[...items]
              .filter(i => i.queue !== 'done')
              .sort((a, b) => a.days_remaining - b.days_remaining)
              .slice(0, 4)
              .map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <TypeChip type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold truncate" style={{ color: G.primary }}>{item.title}</p>
                  </div>
                  <Avatar name={item.assigned_to} size="xs" />
                  <DaysBadge days={item.days_remaining} />
                </div>
              ))}
            {items.filter(i => i.queue !== 'done').length === 0 && (
              <p className="text-[10px]" style={{ color: G.icon }}>No upcoming deadlines</p>
            )}
          </div>
        </div>

        {/* 4. Due Today / Overdue */}
        <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-3.5 w-3.5" style={{ color: '#DC2626' }} />
            <p className="text-xs font-bold" style={{ color: G.primary }}>Due Today / Overdue</p>
          </div>
          <div className="space-y-2">
            {[...items]
              .filter(i => i.days_remaining <= 0 && i.queue !== 'done')
              .sort((a, b) => b.score - a.score)
              .slice(0, 4)
              .map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <PriorityDot priority={item.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold truncate" style={{ color: G.primary }}>{item.title}</p>
                    <p className="text-[9px]" style={{ color: G.secondary }}>{item.client}</p>
                  </div>
                  <DaysBadge days={item.days_remaining} />
                </div>
              ))}
            {items.filter(i => i.days_remaining <= 0 && i.queue !== 'done').length === 0 && (
              <p className="text-[10px]" style={{ color: G.icon }}>No overdue items</p>
            )}
          </div>
        </div>

        {/* 5. Recent Activity */}
        <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-3.5 w-3.5" style={{ color: G.secondary }} />
            <p className="text-xs font-bold" style={{ color: G.primary }}>Recent Activity</p>
          </div>
          <div className="space-y-2.5">
            {[
              { text: 'GSTR-1 Apr 2026 review completed', time: '10m ago', color: '#16A34A' },
              { text: 'Query raised on Redwood TDS return', time: '1h ago', color: '#D97706' },
              { text: 'Bank statements uploaded by client', time: '2h ago', color: '#0584C7' },
              { text: 'IT Notice response submitted', time: '5h ago', color: '#7C3AED' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full shrink-0 mt-1.5" style={{ background: a.color }} />
                <div>
                  <p className="text-[10px]" style={{ color: G.secondary }}>{a.text}</p>
                  <p className="text-[9px]" style={{ color: G.icon }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Article / default panel ──────────────────────────────────────────────────
  const filtered   = isArticleView && currentUserName ? items.filter(i => i.assigned_to === currentUserName) : items
  const overdue    = filtered.filter(i => i.days_remaining < 0 && i.queue !== 'done')
  const today      = filtered.filter(i => i.days_remaining >= 0 && i.days_remaining <= 1 && i.queue !== 'done')
  const upcoming   = filtered.filter(i => i.days_remaining > 1 && i.days_remaining <= 5 && i.queue !== 'done')
  const highRisk   = filtered.filter(i => i.score >= 70 && i.queue !== 'done').slice(0, 3)

  const myPending = isArticleView && currentUserName
    ? pendingActions.filter(a => a.requestedBy === currentUserName && !a.resolved)
    : []

  const PENDING_TYPE_CFG: Record<PendingAction['type'], { icon: React.ElementType; label: string }> = {
    in_review:          { icon: ScanEye,       label: 'Ready for Review' },
    extension_request:  { icon: CalendarClock, label: 'Extension Request' },
    doc_request:        { icon: FileUp,        label: 'Doc Request' },
    query:              { icon: MessageSquare, label: 'Query' },
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">

      {/* Sent to Admin — article view only */}
      {isArticleView && (
        <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Send className="h-3.5 w-3.5" style={{ color: G.secondary }} />
            <p className="text-xs font-bold" style={{ color: G.primary }}>Sent to Admin</p>
          </div>
          {myPending.length === 0 ? (
            <p className="text-[10px]" style={{ color: G.icon }}>No pending requests.</p>
          ) : (
            <div className="space-y-2">
              {myPending.slice(0, 3).map(a => {
                const cfg = PENDING_TYPE_CFG[a.type]
                const Icon = cfg.icon
                return (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg p-2"
                    style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                    <Icon className="h-3 w-3 shrink-0" style={{ color: G.icon }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold truncate" style={{ color: G.primary }}>{a.workItemTitle}</p>
                      <p className="text-[9px]" style={{ color: G.icon }}>{cfg.label} · {a.createdAt}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Today's Focus */}
      <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-3.5 w-3.5" style={{ color: '#F59E0B' }} />
          <p className="text-xs font-bold" style={{ color: G.primary }}>Today's Focus</p>
        </div>
        <div className="space-y-2">
          {today.slice(0, 3).map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <PriorityDot priority={item.priority} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold truncate" style={{ color: G.primary }}>{item.title}</p>
                <p className="text-[9px]" style={{ color: G.icon }}>{item.client}</p>
              </div>
              <DaysBadge days={item.days_remaining} />
            </div>
          ))}
          {today.length === 0 && <p className="text-[10px]" style={{ color: G.icon }}>No items due today</p>}
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-3.5 w-3.5" style={{ color: G.secondary }} />
            <p className="text-xs font-bold" style={{ color: G.primary }}>Overdue
              <span className="ml-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: G.canvas, color: G.secondary }}>{overdue.length}</span>
            </p>
          </div>
          <div className="space-y-2">
            {overdue.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold truncate" style={{ color: G.primary }}>{item.title}</p>
                  <p className="text-[9px]" style={{ color: G.secondary }}>{item.client} · {Math.abs(item.days_remaining)}d overdue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deadlines */}
      <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-3.5 w-3.5" style={{ color: '#2563EB' }} />
          <p className="text-xs font-bold" style={{ color: G.primary }}>Upcoming (3–5 days)</p>
        </div>
        <div className="space-y-2">
          {upcoming.slice(0, 4).map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <TypeChip type={item.type} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold truncate" style={{ color: G.primary }}>{item.title}</p>
              </div>
              <span className="text-[9px] font-semibold shrink-0" style={{ color: '#2563EB' }}>{item.days_remaining}d</span>
            </div>
          ))}
          {upcoming.length === 0 && <p className="text-[10px]" style={{ color: G.icon }}>No upcoming deadlines</p>}
        </div>
      </div>


      {/* High Risk Items */}
      <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-3.5 w-3.5" style={{ color: '#DC2626' }} />
          <p className="text-xs font-bold" style={{ color: G.primary }}>High Risk</p>
        </div>
        <div className="space-y-2">
          {highRisk.map(item => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg p-2"
              style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
              <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-white"
                style={{ background: item.score >= 90 ? '#DC2626' : item.score >= 75 ? '#D97706' : '#2563EB' }}>
                {item.score}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold truncate" style={{ color: G.primary }}>{item.title}</p>
                <p className="text-[9px]" style={{ color: G.icon }}>{item.client}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-3.5 w-3.5" style={{ color: G.secondary }} />
          <p className="text-xs font-bold" style={{ color: G.primary }}>Recent Activity</p>
        </div>
        <div className="space-y-2.5">
          {[
            { text: 'GSTR-1 Apr 2026 review completed', time: '10m ago', color: '#16A34A' },
            { text: 'Query raised on Redwood TDS return', time: '1h ago', color: '#D97706' },
            { text: 'Bank statements uploaded by client', time: '2h ago', color: '#0584C7' },
            { text: 'IT Notice response submitted', time: '5h ago', color: '#7C3AED' },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full shrink-0 mt-1.5" style={{ background: a.color }} />
              <div>
                <p className="text-[10px]" style={{ color: G.secondary }}>{a.text}</p>
                <p className="text-[9px]" style={{ color: G.icon }}>{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Admin Pending Panel ──────────────────────────────────────────────────────
const ADMIN_PENDING_TYPE_CFG: Record<PendingAction['type'], { icon: React.ElementType; label: string }> = {
  in_review:         { icon: ScanEye,       label: 'Ready for Review' },
  extension_request: { icon: CalendarClock, label: 'Extension Request' },
  doc_request:       { icon: FileUp,        label: 'Doc Request' },
  query:             { icon: MessageSquare, label: 'Query' },
}

function AdminPendingPanel({
  actions, onResolve,
}: {
  actions: PendingAction[]
  onResolve: (id: string) => void
}) {
  const unresolved = actions.filter(a => !a.resolved)
  if (unresolved.length === 0) return null

  return (
    <div className="px-5 py-3 flex-shrink-0" style={{ background: G.white, borderBottom: `1px solid ${G.border}` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: G.secondary }}>
          Pending Your Action
        </span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
          {unresolved.length}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {unresolved.map(action => {
          const cfg = ADMIN_PENDING_TYPE_CFG[action.type]
          const Icon = cfg.icon
          return (
            <div
              key={action.id}
              className="inline-flex flex-col shrink-0 rounded-xl p-3"
              style={{ width: 220, background: G.white, border: `1px solid ${G.border}` }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
                  <Icon className="h-2.5 w-2.5" />{cfg.label}
                </span>
              </div>
              <p className="text-xs font-semibold leading-tight truncate mb-0.5" style={{ color: G.primary }}>
                {action.workItemTitle}
              </p>
              <p className="text-[10px] mb-0.5" style={{ color: G.secondary }}>{action.client}</p>
              <p className="text-[9px] mb-0.5" style={{ color: G.icon }}>by {action.requestedBy}</p>
              {action.newDate && (
                <p className="text-[9px] mb-1" style={{ color: G.icon }}>Proposed: {action.newDate}</p>
              )}
              <button
                onClick={() => onResolve(action.id)}
                className="mt-auto self-start text-[10px] font-semibold px-2 py-1 rounded-lg text-white"
                style={{ background: G.primary }}
              >
                Mark Done
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Team Swimlane View (admin only) ─────────────────────────────────────────
function TeamSwimlaneView({ items, onItemClick }: { items: WorkItem[]; onItemClick: (i: WorkItem) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {MOCK_TEAM.map(member => {
        const memberItems = items.filter(i => i.assigned_to === member.name)
        const activeCount = memberItems.filter(i => i.queue !== 'done').length
        const doneCount   = memberItems.filter(i => i.queue === 'done').length
        const total       = memberItems.length
        const pct         = total > 0 ? Math.round((doneCount / total) * 100) : 0

        return (
          <div key={member.id} className="flex rounded-2xl overflow-hidden"
            style={{ background: G.white, border: `1px solid ${G.border}`, minHeight: 130 }}>

            {/* Left header */}
            <div className="w-44 shrink-0 flex flex-col justify-center gap-2 px-4 py-3"
              style={{ borderRight: `1px solid ${G.border}`, background: G.canvas }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: G.primary }}>
                  {member.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight" style={{ color: G.primary }}>{member.name}</p>
                  <p className="text-[9px]" style={{ color: G.icon }}>{member.role}</p>
                </div>
              </div>
              <p className="text-[9px]" style={{ color: G.secondary }}>
                {activeCount} active · {doneCount} done
              </p>
              {/* Completion bar */}
              <div className="h-1 rounded-full overflow-hidden" style={{ background: G.border }}>
                <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: G.primary }} />
              </div>
            </div>

            {/* Scrollable cards */}
            <div className="flex gap-2 p-3 overflow-x-auto flex-1" style={{ scrollbarWidth: 'thin', alignItems: 'flex-start' }}>
              {memberItems.length === 0 ? (
                <div className="flex items-center justify-center w-full py-4">
                  <p className="text-[10px]" style={{ color: G.icon }}>No work assigned</p>
                </div>
              ) : (
                memberItems
                  .sort((a, b) => b.score - a.score)
                  .map(item => (
                    <div key={item.id} style={{ minWidth: 220, maxWidth: 220 }}>
                      <WorkCard item={item} onClick={() => onItemClick(item)} />
                    </div>
                  ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Client Group View (admin only) ──────────────────────────────────────────
function ClientGroupView({ items, onItemClick }: { items: WorkItem[]; onItemClick: (i: WorkItem) => void }) {
  const clients = Array.from(new Set(items.map(i => i.client))).sort()
  return (
    <div className="flex flex-col gap-4">
      {clients.map(clientName => {
        const clientItems = items.filter(i => i.client === clientName).sort((a, b) => b.score - a.score)
        return (
          <div key={clientName} className="rounded-2xl overflow-hidden"
            style={{ background: G.white, border: `1px solid ${G.border}` }}>
            {/* Client header */}
            <div className="px-4 py-3 flex items-center gap-3"
              style={{ background: G.canvas, borderBottom: `1px solid ${G.border}` }}>
              <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                style={{ background: G.border, color: G.secondary }}>
                {clientName.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-sm font-bold" style={{ color: G.primary }}>{clientName}</p>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: G.border, color: G.secondary }}>{clientItems.length} items</span>
            </div>

            {/* Items table */}
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${G.border}` }}>
                  {['Work Item', 'Type', 'Assigned To', 'Priority', 'Due', 'Status', 'Progress'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold"
                      style={{ color: G.icon }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientItems.map(item => {
                  const p = PRIORITY_CFG[item.priority]
                  return (
                    <tr key={item.id} onClick={() => onItemClick(item)}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: `1px solid ${G.border}` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G.canvas}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <PriorityDot priority={item.priority} />
                          <span className="font-semibold truncate max-w-[160px]" style={{ color: G.primary }}>{item.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><TypeChip type={item.type} /></td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Avatar name={item.assigned_to} size="xs" />
                          <span style={{ color: G.secondary }}>{item.assigned_to}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: p.bg, color: p.color }}>{p.label}</span>
                      </td>
                      <td className="px-4 py-2.5"><DueLabel dueDate={item.due_date} daysRemaining={item.days_remaining} /></td>
                      <td className="px-4 py-2.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>{item.status}</span>
                      </td>
                      <td className="px-4 py-2.5 w-24">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1 rounded-full" style={{ background: G.border }}>
                            <div className="h-1 rounded-full" style={{ width: `${item.progress}%`, background: G.primary }} />
                          </div>
                          <span className="text-[9px] shrink-0" style={{ color: G.icon }}>{item.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════════
export function WorkCenterPage() {
  const { isArticle, isAdmin } = usePermission()
  const currentUser = useAuthStore(s => s.user)
  const articleView = isArticle()
  const adminView = isAdmin()
  const [search,         setSearch]         = useState('')
  const [filterType,     setFilterType]     = useState<WorkType | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')
  const [selectedItem,   setSelectedItem]   = useState<WorkItem | null>(null)
  const [showCreate,     setShowCreate]     = useState(false)
  const [pendingActions, setPendingActions] = useState<PendingAction[]>(PENDING_ACTIONS)
  const [workItems,      setWorkItems]      = useState<WorkItem[]>(RAW_ITEMS)
  const [adminTab,       setAdminTab]       = useState<'team' | 'client' | 'board'>('team')

  function addPendingAction(action: Omit<PendingAction, 'id' | 'resolved' | 'createdAt'>) {
    const newAction: PendingAction = { ...action, id: `pa_${Date.now()}`, resolved: false, createdAt: 'Just now' }
    setPendingActions(prev => [newAction, ...prev])
  }

  function resolveAction(id: string) {
    setPendingActions(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a))
    toast.success('Action resolved')
  }

  function handleCreateItem(partial: Partial<WorkItem> & { assigned_to: string; client: string; type: WorkType; priority: Priority; due_date: string; queue: 'todo' }) {
    const today = new Date()
    const due = new Date(partial.due_date)
    const daysRemaining = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const newItem: WorkItem = {
      id: `w_${Date.now()}`,
      title: partial.title ?? `${partial.type?.replace('_', ' ')} — ${partial.return_period ?? partial.due_date}`,
      description: partial.description ?? '',
      score: partial.priority === 'critical' ? 90 : partial.priority === 'high' ? 70 : partial.priority === 'medium' ? 50 : 20,
      days_remaining: daysRemaining,
      assigned_by: currentUser?.full_name ?? 'Admin',
      progress: 0,
      open_queries: 0,
      pending_docs: 0,
      status: 'Todo',
      tags: [],
      ...partial,
      queue: 'todo',
    }
    setWorkItems(prev => [newItem, ...prev])
    toast.success(`Work item created and assigned to ${partial.assigned_to}`)
    setShowCreate(false)
  }

  // Derived filtered list
  const allItems = useMemo(() => {
    let items = workItems
    if (articleView && currentUser?.full_name) {
      items = items.filter(i => i.assigned_to === currentUser.full_name)
    }
    if (search) items = items.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.client.toLowerCase().includes(search.toLowerCase())
    )
    if (filterType !== 'all')     items = items.filter(i => i.type === filterType)
    if (filterPriority !== 'all') items = items.filter(i => i.priority === filterPriority)
    return items
  }, [workItems, search, filterType, filterPriority, currentUser?.full_name, articleView])

  // Board queues
  const queues: QueueId[] = ['todo', 'in_progress', 'in_review', 'done']
  const queuedItems = (qid: QueueId) => allItems.filter(i => i.queue === qid).sort((a, b) => b.score - a.score)

  return (
    <div className="flex h-full" style={{ background: G.canvas }}>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Top header */}
        <div className="px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${G.border}`, background: G.white }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold" style={{ color: G.primary }}>
                {articleView ? 'My Work' : 'Work Center'}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: G.secondary }}>
                {articleView
                  ? `${currentUser?.full_name ?? 'My'} · Assigned tasks, filings & notices`
                  : 'All compliance operations — GST · TDS · Audit · Notices · Tasks'}
              </p>
            </div>
            {!articleView && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                style={{ background: G.primary, boxShadow: '0 4px 12px rgba(15,23,42,0.2)' }}>
                <Plus className="h-4 w-4" />Create Work Item
              </button>
            )}
          </div>

        </div>

        {/* Filter + view bar */}
        <div className="px-6 py-3 flex items-center gap-3 flex-shrink-0"
          style={{ background: G.white, borderBottom: `1px solid ${G.border}` }}>
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: G.icon }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search items, clients…"
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.primary }} />
          </div>

          {/* Type filter */}
          <div className="relative">
            <select value={filterType} onChange={e => setFilterType(e.target.value as WorkType | 'all')}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl text-xs font-semibold outline-none"
              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
              <option value="all">All Types</option>
              {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
          </div>

          {/* Priority filter */}
          <div className="relative">
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl text-xs font-semibold outline-none"
              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
              <option value="all">All Priorities</option>
              {(Object.keys(PRIORITY_CFG) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CFG[p].label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
          </div>

          <div className="flex-1" />

          {/* View toggle — admin only */}
          {!articleView && (
            <div className="flex gap-1">
              {([
                { id: 'team',   label: 'By Team'   },
                { id: 'client', label: 'By Client' },
                { id: 'board',  label: 'All Work'  },
              ] as const).map(v => (
                <button key={v.id} onClick={() => setAdminTab(v.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{
                    background: adminTab === v.id ? G.primary : G.white,
                    color: adminTab === v.id ? '#fff' : G.secondary,
                    border: `1px solid ${adminTab === v.id ? G.primary : G.border}`,
                  }}>
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main content — differs by role and tab */}
        <div className="flex-1 overflow-auto p-5">
          {articleView ? (
            /* Article: always 4-column kanban */
            <div className="flex gap-3" style={{ minWidth: 'max-content', alignItems: 'flex-start' }}>
              {queues.map(qid => (
                <BoardColumn key={qid} queueId={qid} items={queuedItems(qid)}
                  onCardClick={setSelectedItem} showAssignedBy={false} />
              ))}
            </div>
          ) : adminTab === 'team' ? (
            <TeamSwimlaneView items={allItems} onItemClick={setSelectedItem} />
          ) : adminTab === 'client' ? (
            <ClientGroupView items={allItems} onItemClick={setSelectedItem} />
          ) : (
            /* All Work: same 4-column kanban */
            <div className="flex gap-3" style={{ minWidth: 'max-content', alignItems: 'flex-start' }}>
              {queues.map(qid => (
                <BoardColumn key={qid} queueId={qid} items={queuedItems(qid)}
                  onCardClick={setSelectedItem} showAssignedBy={true} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Ops Intelligence Panel ──────────────────────── */}
      <div className="hidden xl:flex flex-col w-72 shrink-0 overflow-y-auto p-4 gap-4"
        style={{ background: G.canvas, borderLeft: `1px solid ${G.border}` }}>
        <div className="flex items-center gap-2 py-1">
          <BarChart2 className="h-3.5 w-3.5" style={{ color: G.secondary }} />
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: G.secondary }}>
            {articleView ? 'My Dashboard' : 'Operations Intelligence'}
          </p>
        </div>
        <OpsPanel
          items={workItems}
          currentUserName={currentUser?.full_name}
          isArticle={articleView}
          pendingActions={pendingActions}
          adminView={!articleView}
          onResolve={resolveAction}
        />
      </div>

      {/* ── Detail Drawer ───────────────────────────────────────── */}
      {selectedItem && (
        <DetailDrawer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          isArticle={articleView}
          isAdmin={adminView}
          onAction={(type, meta) => {
            if (!selectedItem) return
            addPendingAction({
              type,
              workItemId: selectedItem.id,
              workItemTitle: selectedItem.title,
              client: selectedItem.client,
              requestedBy: currentUser?.full_name ?? 'Unknown',
              assignedTo: selectedItem.assigned_to,
              ...meta,
            })
            toast.success('Admin has been notified')
          }}
        />
      )}

      {/* ── Create Modal ─────────────────────────────────────────── */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateItem}
        />
      )}
    </div>
  )
}
