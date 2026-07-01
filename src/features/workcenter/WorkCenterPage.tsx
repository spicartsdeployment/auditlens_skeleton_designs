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
  TrendingUp, ChevronDown, Star, Calendar,
  Layers, CalendarClock, Bell, FileUp, ArrowRight,
  ChevronRight, Lock, LayoutGrid, List,
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
type Priority = 'critical' | 'high' | 'medium' | 'low'
type QueueId = 'todo' | 'in_progress' | 'in_review' | 'done'
type ViewMode = 'list' | 'folder'

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
  high: { label: 'High', color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' },
  medium: { label: 'Medium', color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' },
  low: { label: 'Low', color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8' },
}

const QUEUE_CFG: Record<QueueId, { label: string; icon: React.ElementType }> = {
  todo: { label: 'To Do', icon: Circle },
  in_progress: { label: 'In Progress', icon: Clock3 },
  in_review: { label: 'In Review', icon: ScanEye },
  done: { label: 'Done', icon: CheckCircle2 },
}

const TYPE_CFG: Record<WorkType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  gst_filing: { label: 'GST Filing', icon: FileText, color: '#0584C7', bg: '#EFF8FF' },
  tds_filing: { label: 'TDS Filing', icon: ReceiptText, color: '#7C3AED', bg: '#F5F3FF' },
  audit: { label: 'Audit', icon: Scale, color: '#0D9488', bg: '#F0FDFA' },
  notice: { label: 'Notice', icon: ShieldAlert, color: '#DC2626', bg: '#FEF2F2' },
  doc_request: { label: 'Document Req.', icon: FolderOpen, color: '#D97706', bg: '#FFFBEB' },
  client_followup: { label: 'Client Follow-up', icon: Users, color: '#2563EB', bg: '#EFF6FF' },
  internal: { label: 'Internal Task', icon: Layers, color: '#64748B', bg: '#F1F5F9' },
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
      <div className="flex items-center justify-between mb-2">
        <TypeChip type={item.type} />
        <DueLabel dueDate={item.due_date} daysRemaining={item.days_remaining} />
      </div>
      <p className="text-xs font-semibold leading-tight mb-1" style={{ color: '#0F172A' }}>{item.title}</p>
      <p className="text-[10px] mb-1" style={{ color: '#475569' }}>{item.client}</p>
      {assignedBy && (
        <p className="text-[9px] mb-2" style={{ color: G.icon }}>Assigned by {assignedBy}</p>
      )}
      <div className="mb-2.5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px]" style={{ color: G.icon }}>Progress</span>
          <span className="text-[9px] font-semibold" style={{ color: G.secondary }}>{item.progress}%</span>
        </div>
        <ProgressBar pct={item.progress} />
      </div>
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

// ─── List View Row ─────────────────────────────────────────────────────────────
function WorkRow({ item, onClick }: { item: WorkItem; onClick: () => void }) {
  const cfg = QUEUE_CFG[item.queue]
  const QIcon = cfg.icon
  const p = PRIORITY_CFG[item.priority]

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer transition-colors"
      style={{ borderBottom: `1px solid ${G.border}` }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = G.canvas)}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      {/* Title + Client */}
      <td className="px-3 py-2.5" style={{ maxWidth: 280 }}>
        <div className="flex items-center gap-2">
          <PriorityDot priority={item.priority} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" title={item.title}
              style={{ color: G.primary, maxWidth: 230 }}>{item.title}</p>
            <p className="text-[10px] truncate" title={item.client}
              style={{ color: G.secondary, maxWidth: 230 }}>{item.client}</p>
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="px-3 py-2.5"><TypeChip type={item.type} /></td>

      {/* Priority */}
      <td className="px-3 py-2.5">
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: p.bg, color: p.color }}>{p.label}</span>
      </td>

      {/* Status */}
      <td className="px-3 py-2.5">
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
          <QIcon className="h-2.5 w-2.5" />{cfg.label}
        </span>
      </td>

      {/* Assigned To */}
      <td className="px-3 py-2.5 hidden md:table-cell" style={{ maxWidth: 130 }}>
        <div className="flex items-center gap-1.5">
          <Avatar name={item.assigned_to} size="xs" />
          <span className="text-xs truncate" title={item.assigned_to}
            style={{ color: G.secondary, maxWidth: 100 }}>{item.assigned_to}</span>
        </div>
      </td>

      {/* Due */}
      <td className="px-3 py-2.5">
        <DueLabel dueDate={item.due_date} daysRemaining={item.days_remaining} />
      </td>

      {/* Progress */}
      <td className="px-3 py-2.5 hidden lg:table-cell" style={{ width: 110 }}>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1 rounded-full" style={{ background: G.border }}>
            <div className="h-1 rounded-full transition-all"
              style={{
                width: `${item.progress}%`,
                background: item.progress === 100 ? '#16A34A' : item.progress >= 70 ? '#0584C7' : item.progress >= 40 ? '#D97706' : '#94A3B8',
              }} />
          </div>
          <span className="text-[9px] shrink-0 tabular-nums" style={{ color: G.icon }}>{item.progress}%</span>
        </div>
      </td>

      {/* Queries/Docs */}
      <td className="px-3 py-2.5 hidden xl:table-cell">
        <div className="flex items-center gap-1.5">
          {item.open_queries > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
              <MessageSquare className="h-2.5 w-2.5" />{item.open_queries}
            </span>
          )}
          {item.pending_docs > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
              <FolderOpen className="h-2.5 w-2.5" />{item.pending_docs}
            </span>
          )}
          {item.open_queries === 0 && item.pending_docs === 0 && (
            <span className="text-[10px]" style={{ color: G.icon }}>—</span>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── List View Table ───────────────────────────────────────────────────────────
function WorkListView({ items, onItemClick }: {
  items: WorkItem[]; onItemClick: (i: WorkItem) => void
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 rounded-2xl"
        style={{ background: G.white, border: `1px solid ${G.border}` }}>
        <CheckCircle2 className="h-8 w-8" style={{ color: G.icon, opacity: 0.5 }} />
        <p className="text-sm" style={{ color: G.icon }}>No work items match the current filters</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: G.white, border: `1px solid ${G.border}`, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '26%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '11%' }} />
            <col className="hidden md:table-column" style={{ width: '12%' }} />
            <col style={{ width: '8%' }} />
            <col className="hidden lg:table-column" style={{ width: '10%' }} />
            <col className="hidden xl:table-column" style={{ width: '7%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: G.canvas }}>
              {[
                { label: 'Work Item', className: '' },
                { label: 'Type', className: '' },
                { label: 'Priority', className: '' },
                { label: 'Status', className: '' },
                { label: 'Assigned To', className: 'hidden md:table-cell' },
                { label: 'Due', className: '' },
                { label: 'Progress', className: 'hidden lg:table-cell' },
                { label: 'Q / D', className: 'hidden xl:table-cell' },
              ].map((h, i) => (
                <th key={i}
                  className={`text-left px-3 py-2.5 text-[9px] font-semibold uppercase tracking-wider border-b whitespace-nowrap ${h.className}`}
                  style={{ color: G.secondary, borderColor: G.border }}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <WorkRow key={item.id} item={item} onClick={() => onItemClick(item)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Board Column ─────────────────────────────────────────────────────────────
function BoardColumn({ queueId, items, onCardClick }: {
  queueId: QueueId; items: WorkItem[]; onCardClick: (item: WorkItem) => void
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
          onClick={() => { }}
          title={`Add to ${cfg.label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
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
          <WorkCard key={item.id} item={item} onClick={() => onCardClick(item)} />
        ))}
      </div>
    </div>
  )
}

// ─── Detail Drawer (unchanged) ────────────────────────────────────────────────
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
  const [tab, setTab] = useState<DrawerTab>('overview')
  const [newComment, setNewComment] = useState('')
  const [newQuery, setNewQuery] = useState('')
  const [extendDate, setExtendDate] = useState('')
  const [showExtend, setShowExtend] = useState(false)
  const [reminderDate, setReminderDate] = useState('')
  const [reminderNote, setReminderNote] = useState('')
  const [showReminder, setShowReminder] = useState(false)
  const [currentQueue, setCurrentQueue] = useState<QueueId>(item.queue)

  const p = PRIORITY_CFG[item.priority]
  const tc = TYPE_CFG[item.type]
  const TIcon = tc.icon

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
    if (target === 'in_review') onAction('in_review', {})
  }

  const mockDocs = [
    { name: 'Bank Statement Apr 2026', status: item.pending_docs > 0 ? 'Pending' : 'Uploaded', required: true },
    { name: 'Purchase Invoices', status: item.pending_docs > 1 ? 'Pending' : 'Uploaded', required: true },
    { name: 'Sales Invoices', status: 'Uploaded', required: true },
    { name: 'Challans / Payment Proof', status: item.type === 'tds_filing' && item.pending_docs > 0 ? 'Pending' : 'Uploaded', required: false },
  ]
  const mockComments = [
    { author: 'Rohan V.', time: '2 hours ago', text: 'Documents received from client. Starting data entry now.' },
    { author: item.assigned_to, time: '1 day ago', text: 'Sent reminder email to client for pending documents.' },
  ]
  const mockQueries = [
    { id: 1, by: item.assigned_to, text: 'Challan details not provided. Should we proceed with available data?', status: 'open', time: '5 hours ago' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{ width: 540, background: G.white, borderLeft: `1px solid ${G.border}`, boxShadow: '-8px 0 32px rgba(15,23,42,0.12)' }}>

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
            style={{ background: G.canvas }}>
            <X className="h-4 w-4" style={{ color: G.secondary }} />
          </button>
        </div>

        <div className="px-5 py-3 flex items-center gap-2 flex-wrap" style={{ background: G.canvas, borderBottom: `1px solid ${G.border}` }}>
          {QUEUE_ORDER.map((q, i) => {
            const isCurrent = q === currentQueue
            const isDone = q === 'done'
            const locked = isDone && !isAdmin
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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'overview' && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: G.secondary }}>{item.description}</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Progress', value: `${item.progress}%` },
                  { label: 'Assigned To', value: item.assigned_to },
                  { label: 'Due Date', value: item.due_date },
                  { label: 'Priority Score', value: item.score },
                  { label: 'Open Queries', value: item.open_queries },
                  { label: 'Pending Docs', value: item.pending_docs },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                    <p className="text-[9px] font-semibold mb-1" style={{ color: G.icon }}>{m.label}</p>
                    <p className="text-sm font-bold" style={{ color: G.primary }}>{m.value}</p>
                  </div>
                ))}
              </div>
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
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: G.icon }}>Quick Actions</p>
                <div className="space-y-2">
                  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
                    <button onClick={() => setShowExtend(v => !v)}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                      style={{ background: G.white }}>
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
                  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
                    <button onClick={() => setShowReminder(v => !v)}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                      style={{ background: G.white }}>
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
                  <button
                    onClick={() => { onAction('doc_request', {}); toast.info('Opening Communication tab…'); setTimeout(() => navigate('/communication'), 600); onClose() }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left"
                    style={{ background: G.white, border: `1px solid ${G.border}` }}>
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
                  {nextQueue && canMoveTo(nextQueue) && (
                    <button onClick={() => moveStatus(nextQueue)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left"
                      style={{ background: G.white, border: `1px solid ${G.border}` }}>
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
  { id: 'c1', name: 'Sunrise Textiles', gstins: ['27AABCS1429B1ZB', '27AABCS1429B1ZC'], tan: 'MUMS12345A', gst_enabled: true, tds_enabled: true, audit_enabled: true },
  { id: 'c2', name: 'BlueSky Software', gstins: ['29AADCB2230M1ZV'], tan: 'BLRS67890B', gst_enabled: true, tds_enabled: false, audit_enabled: false },
  { id: 'c3', name: 'Redwood Constructions', gstins: ['07AAECR1234F1ZQ'], tan: 'DELS11223C', gst_enabled: true, tds_enabled: true, audit_enabled: false },
  { id: 'c4', name: 'Apex Auto Parts', gstins: ['08AAAPA1234A1ZT'], tan: 'JAIS44556D', gst_enabled: false, tds_enabled: true, audit_enabled: true },
  { id: 'c5', name: 'Green Pharma', gstins: ['24AABCG9988P1Z3'], tan: 'AHMS77889E', gst_enabled: true, tds_enabled: false, audit_enabled: true },
]
const MOCK_TEAM = [
  { id: 'u1', name: 'Rohan Verma', role: 'Article' },
  { id: 'u2', name: 'Sneha Iyer', role: 'Article' },
]
const GST_RETURN_TYPES = ['GSTR-1', 'GSTR-1A', 'GSTR-3B', 'GSTR-9', 'GSTR-9C']
const TDS_RETURN_TYPES = ['138-TDS (24Q)', '140-TDS (26Q)', '144-TDS (27Q)', '143-TDS (27EQ)']
const AUDIT_TYPES = ['Statutory Audit', 'Tax Audit', 'Internal Audit', 'GST Audit']
const NOTICE_TYPES = ['GST SCN', 'IT Scrutiny', 'Assessment Notice', 'Demand Notice']
const FY_OPTIONS = ['2025-26', '2024-25', '2023-24']
const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March']
const QUARTERS = ['Q1 (Apr–Jun)', 'Q2 (Jul–Sep)', 'Q3 (Oct–Dec)', 'Q4 (Jan–Mar)']

// ─── Create Work Item Modal (3-step: Company → Module → Task) ─────────────────
const WORK_CATEGORIES = [
  { id: 'gst_filing', label: 'GST', icon: FileText, color: '#0584C7', desc: 'GSTR-1, GSTR-3B, GSTR-9, GSTR-9C', moduleKey: 'gst_enabled' as const },
  { id: 'tds_filing', label: 'TDS', icon: ReceiptText, color: '#7C3AED', desc: '138-TDS, 140-TDS, 144-TDS, 143-TDS', moduleKey: 'tds_enabled' as const },
  { id: 'audit', label: 'Audit', icon: Scale, color: '#0D9488', desc: 'Statutory Audit, Tax Audit, Internal Audit', moduleKey: 'audit_enabled' as const },
  { id: 'notice', label: 'Government Notice', icon: ShieldAlert, color: '#DC2626', desc: 'GST SCN, IT Notice, Assessment' },
  { id: 'doc_request', label: 'Document Request', icon: FolderOpen, color: '#D97706', desc: 'Collect documents from client' },
  { id: 'client_followup', label: 'Client Follow-up', icon: Users, color: '#2563EB', desc: 'Pending responses, clarifications' },
  { id: 'internal', label: 'Internal Task', icon: Layers, color: '#64748B', desc: 'Admin, team, or internal work' },
]

const OTHERS_MODULE = {
  id: 'others',
  label: 'Others',
  icon: Layers,
  color: '#64748B',
  desc: 'Custom task — describe the work required',
}

type SelectableModule = WorkType | 'others'

function getEligibleModules(clientId: string) {
  if (clientId === 'others') return WORK_CATEGORIES.filter(c => c.moduleKey)
  const c = MOCK_CLIENTS.find(x => x.id === clientId)
  if (!c) return []
  return WORK_CATEGORIES.filter(cat => {
    if (cat.moduleKey === 'gst_enabled') return c.gst_enabled
    if (cat.moduleKey === 'tds_enabled') return c.tds_enabled
    if (cat.moduleKey === 'audit_enabled') return c.audit_enabled
    return false
  })
}

function gstAutoDueDate(returnType: string, periodMonth: string): string {
  if (!periodMonth) return ''
  const parsed = new Date(`1 ${periodMonth}`)
  if (isNaN(parsed.getTime())) return ''
  const y = parsed.getFullYear()
  const m = parsed.getMonth()
  const nextM = (m + 1) % 12
  const nextY = m === 11 ? y + 1 : y
  const dayMap: Record<string, number> = {
    'GSTR-1': 11, 'GSTR-1A': 13, 'GSTR-3B': 20, 'GSTR-2B': 14, 'GSTR-9': 31, 'GSTR-9C': 31,
  }
  if (returnType === 'GSTR-9' || returnType === 'GSTR-9C') return `${y + 1}-12-31`
  const day = dayMap[returnType] ?? 20
  return `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function CreateModal({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (item: Partial<WorkItem> & { assigned_to: string; client: string; type: WorkType; priority: Priority; due_date: string; queue: 'todo' }) => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [clientId, setClientId] = useState('')
  const [otherCompanyName, setOtherCompanyName] = useState('')
  const [selectedCat, setSelectedCat] = useState<SelectableModule | ''>('')
  const [assignTo, setAssignTo] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [gstFilingDueDate, setGstFilingDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [gstin, setGstin] = useState('')
  const [gstReturnType, setGstReturnType] = useState('')
  const [month, setMonth] = useState('')
  const [tdsReturnType, setTdsReturnType] = useState('')
  const [quarter, setQuarter] = useState('')
  const [auditType, setAuditType] = useState('')
  const [noticeNo, setNoticeNo] = useState('')
  const [authority, setAuthority] = useState('')
  const [noticeType, setNoticeType] = useState('')

  const isOthersCompany = clientId === 'others'
  const selectedClient = MOCK_CLIENTS.find(c => c.id === clientId)
  const client = isOthersCompany ? otherCompanyName.trim() : (selectedClient?.name ?? '')
  const tan = selectedClient?.tan ?? ''
  const eligibleModules = getEligibleModules(clientId)

  const gstComputedDue = gstAutoDueDate(gstReturnType, month)
  const displayedGstFilingDue = gstFilingDueDate || gstComputedDue
  const isOthersModule = selectedCat === 'others'
  const isGstModule = selectedCat === 'gst_filing'

  const stepLabels: Record<number, string> = { 1: 'Select Company', 2: 'Select Module', 3: 'Task Details' }
  const canContinueStep1 = !!clientId && (!isOthersCompany || !!otherCompanyName.trim())
  const canContinueStep2 = !!selectedCat

  const canSubmit = (() => {
    if (!client || !assignTo || !selectedCat) return false
    if (isOthersModule) return !!description.trim() && !!dueDate
    if (isGstModule) return !!taskDeadline && !!gstReturnType && !!month
    return !!dueDate
  })()

  function resetModuleFields() {
    setSelectedCat('')
    setGstin(''); setGstReturnType(''); setMonth('')
    setTdsReturnType(''); setQuarter('')
    setAuditType(''); setNoticeNo(''); setAuthority(''); setNoticeType('')
    setDescription(''); setDueDate(''); setTaskDeadline(''); setGstFilingDueDate('')
  }

  function handleClientChange(id: string) {
    setClientId(id)
    resetModuleFields()
    if (id !== 'others') setOtherCompanyName('')
  }

  function handleSubmit() {
    if (!canSubmit || !selectedCat) return
    const workType: WorkType = isOthersModule ? 'internal' : (selectedCat as WorkType)
    const finalDueDate = isGstModule ? taskDeadline : dueDate
    const finalDescription = isOthersModule
      ? description.trim()
      : isGstModule && displayedGstFilingDue
        ? `${description ? description + '\n\n' : ''}GST filing due: ${displayedGstFilingDue}`
        : description

    onSubmit({
      type: workType,
      client,
      assigned_to: assignTo,
      priority,
      due_date: finalDueDate,
      queue: 'todo',
      description: finalDescription,
      tags: isOthersModule ? ['Others'] : [],
      ...(isGstModule && { gstin, form_type: gstReturnType, return_period: month }),
      ...(selectedCat === 'tds_filing' && { form_type: tdsReturnType, quarter }),
      ...(selectedCat === 'audit' && { audit_type: auditType }),
      ...(selectedCat === 'notice' && { notice_no: noticeNo, authority, severity: noticeType }),
    })
  }

  const inputBase: React.CSSProperties = {
    background: G.canvas, border: `1px solid ${G.border}`, color: G.primary,
    borderRadius: 10, padding: '8px 12px', width: '100%', fontSize: 12, outline: 'none',
  }
  const labelCls = 'block text-[10px] font-semibold uppercase tracking-wider mb-1'

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full flex flex-col"
        style={{ maxWidth: 560, maxHeight: '88vh', background: G.white, border: `1px solid ${G.border}`, borderRadius: 16 }}>
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: `1px solid ${G.border}` }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-1">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
                    style={{
                      background: s < step ? '#10B981' : s === step ? '#0584C7' : G.border,
                      color: s <= step ? '#fff' : G.icon,
                    }}>
                    {s < step ? '✓' : s}
                  </div>
                  {s < 3 && <div className="w-6 h-px" style={{ background: s < step ? '#10B981' : G.border }} />}
                </div>
              ))}
            </div>
            <h2 className="text-sm font-bold mt-1" style={{ color: G.primary }}>{stepLabels[step]}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: G.canvas }}>
            <X className="h-4 w-4" style={{ color: G.secondary }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: G.secondary }}>
                Select the company this task belongs to. Enabled modules will be shown in the next step.
              </p>
              <div>
                <label className={labelCls} style={{ color: G.icon }}>Company *</label>
                <select value={clientId} onChange={e => handleClientChange(e.target.value)}
                  className="appearance-none" style={inputBase}>
                  <option value="">Select company…</option>
                  {MOCK_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="others">Others</option>
                </select>
              </div>
              {isOthersCompany && (
                <div>
                  <label className={labelCls} style={{ color: G.icon }}>Company Name *</label>
                  <input value={otherCompanyName} onChange={e => setOtherCompanyName(e.target.value)}
                    placeholder="Enter company or client name…" style={inputBase} />
                </div>
              )}
              {selectedClient && (
                <div className="rounded-xl px-3 py-2.5" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                  <p className="text-[10px] font-semibold mb-1.5" style={{ color: G.icon }}>Enabled modules</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClient.gst_enabled && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#EFF6FF', color: '#2563EB' }}>GST</span>
                    )}
                    {selectedClient.tds_enabled && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#FFFBEB', color: '#D97706' }}>TDS</span>
                    )}
                    {selectedClient.audit_enabled && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#F0FDF4', color: '#16A34A' }}>Audit</span>
                    )}
                    {!selectedClient.gst_enabled && !selectedClient.tds_enabled && !selectedClient.audit_enabled && (
                      <span className="text-[10px]" style={{ color: G.icon }}>No modules enabled</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                <span className="text-[10px] font-semibold" style={{ color: G.icon }}>Company</span>
                <span className="text-xs font-bold" style={{ color: G.primary }}>{client}</span>
              </div>
              <p className="text-xs" style={{ color: G.secondary }}>
                {isOthersCompany
                  ? 'Choose a module for this task, or select Others for a custom task.'
                  : 'Modules enabled for this company. Select Others for a custom task outside standard modules.'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {eligibleModules.map(cat => {
                  const Icon = cat.icon
                  const active = selectedCat === cat.id
                  return (
                    <button key={cat.id} onClick={() => setSelectedCat(cat.id as SelectableModule)}
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
                {(() => {
                  const cat = OTHERS_MODULE
                  const Icon = cat.icon
                  const active = selectedCat === 'others'
                  return (
                    <button onClick={() => setSelectedCat('others')}
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
                })()}
              </div>
              {!isOthersCompany && eligibleModules.length === 0 && (
                <p className="text-xs px-3 py-2 rounded-xl" style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
                  No modules are enabled for this company. Use Others to create a custom task.
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                <span className="text-[10px] font-semibold" style={{ color: G.icon }}>Company</span>
                <span className="text-xs font-bold" style={{ color: G.primary }}>{client}</span>
                <div className="w-px h-3" style={{ background: G.border }} />
                <span className="text-[10px] font-semibold" style={{ color: G.icon }}>Module</span>
                <span className="text-xs font-bold" style={{ color: '#0584C7' }}>
                  {isOthersModule ? OTHERS_MODULE.label : WORK_CATEGORIES.find(c => c.id === selectedCat)?.label}
                </span>
              </div>

              {isOthersModule && (
                <>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Assign To *</label>
                    <select value={assignTo} onChange={e => setAssignTo(e.target.value)} className="appearance-none" style={inputBase}>
                      <option value="">Select team member…</option>
                      {MOCK_TEAM.map(u => <option key={u.id} value={u.name}>{u.name} ({u.role})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="appearance-none" style={inputBase}>
                      <option value="critical">Critical</option><option value="high">High</option>
                      <option value="medium">Medium</option><option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Due Date *</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputBase} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Task Description *</label>
                    <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}
                      placeholder="Describe the task — what needs to be done, context, and any relevant details…"
                      style={{ ...inputBase, resize: 'vertical' }} />
                    {!description.trim() && (
                      <p className="text-[10px] mt-1" style={{ color: '#DC2626' }}>Description is required for Others tasks.</p>
                    )}
                  </div>
                </>
              )}

              {!isOthersModule && (
                <>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Assign To *</label>
                    <select value={assignTo} onChange={e => setAssignTo(e.target.value)} className="appearance-none" style={inputBase}>
                      <option value="">Select team member…</option>
                      {MOCK_TEAM.map(u => <option key={u.id} value={u.name}>{u.name} ({u.role})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="appearance-none" style={inputBase}>
                      <option value="critical">Critical</option><option value="high">High</option>
                      <option value="medium">Medium</option><option value="low">Low</option>
                    </select>
                  </div>

                  {isGstModule && (
                    <>
                      <div>
                        <label className={labelCls} style={{ color: G.icon }}>GSTIN</label>
                        <select value={gstin} onChange={e => setGstin(e.target.value)} className="appearance-none" style={inputBase}>
                          <option value="">Select GSTIN…</option>
                          {(selectedClient?.gstins ?? []).map((g: string) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls} style={{ color: G.icon }}>Return Type *</label>
                          <select value={gstReturnType} onChange={e => setGstReturnType(e.target.value)} className="appearance-none" style={inputBase}>
                            <option value="">Select…</option>
                            {GST_RETURN_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls} style={{ color: G.icon }}>Month *</label>
                          <select value={month} onChange={e => setMonth(e.target.value)} className="appearance-none" style={inputBase}>
                            <option value="">Select…</option>
                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: displayedGstFilingDue ? '#EFF8FF' : G.canvas, border: `1px solid ${displayedGstFilingDue ? '#0584C744' : G.border}` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={labelCls} style={{ color: displayedGstFilingDue ? '#0584C7' : G.icon }}>GST Filing Due Date</label>
                          {gstComputedDue && !gstFilingDueDate && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#0584C718', color: '#0584C7' }}>Auto-computed</span>
                          )}
                        </div>
                        <input type="date" value={displayedGstFilingDue} onChange={e => setGstFilingDueDate(e.target.value)}
                          style={{ ...inputBase, background: '#fff' }} />
                        {displayedGstFilingDue ? (
                          <p className="text-[10px] mt-1.5" style={{ color: '#0584C7' }}>
                            Statutory due date for {gstReturnType || 'return'} ({month || 'period'}) — override if needed.
                          </p>
                        ) : (
                          <p className="text-[10px] mt-1" style={{ color: G.icon }}>Select Return Type + Month to auto-fill the GST filing due date.</p>
                        )}
                      </div>
                      <div className="rounded-xl p-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                        <label className={labelCls} style={{ color: G.icon }}>Task Deadline *</label>
                        <input type="date" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)}
                          style={{ ...inputBase, background: G.white }} />
                        <p className="text-[10px] mt-1.5" style={{ color: G.secondary }}>
                          Internal deadline for your team (can be before the GST filing due date).
                        </p>
                      </div>
                    </>
                  )}

                  {!isGstModule && (
                    <div>
                      <label className={labelCls} style={{ color: G.icon }}>Due Date *</label>
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputBase} />
                    </div>
                  )}

                  {selectedCat === 'tds_filing' && (
                    <>
                      <div>
                        <label className={labelCls} style={{ color: G.icon }}>TAN (Auto-filled)</label>
                        <input value={tan} disabled style={{ ...inputBase, opacity: 0.6 }} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls} style={{ color: G.icon }}>Return Type</label>
                          <select value={tdsReturnType} onChange={e => setTdsReturnType(e.target.value)} className="appearance-none" style={inputBase}>
                            <option value="">Select…</option>
                            {TDS_RETURN_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls} style={{ color: G.icon }}>Quarter</label>
                          <select value={quarter} onChange={e => setQuarter(e.target.value)} className="appearance-none" style={inputBase}>
                            <option value="">Select…</option>
                            {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  {selectedCat === 'audit' && (
                    <div>
                      <label className={labelCls} style={{ color: G.icon }}>Audit Type</label>
                      <select value={auditType} onChange={e => setAuditType(e.target.value)} className="appearance-none" style={inputBase}>
                        <option value="">Select…</option>
                        {AUDIT_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  )}
                  {selectedCat === 'notice' && (
                    <>
                      <div>
                        <label className={labelCls} style={{ color: G.icon }}>Notice Number</label>
                        <input value={noticeNo} onChange={e => setNoticeNo(e.target.value)} style={inputBase} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls} style={{ color: G.icon }}>Authority</label>
                          <input value={authority} onChange={e => setAuthority(e.target.value)} style={inputBase} />
                        </div>
                        <div>
                          <label className={labelCls} style={{ color: G.icon }}>Notice Type</label>
                          <select value={noticeType} onChange={e => setNoticeType(e.target.value)} className="appearance-none" style={inputBase}>
                            <option value="">Select…</option>
                            {NOTICE_TYPES.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label className={labelCls} style={{ color: G.icon }}>Notes (optional)</label>
                    <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
                      placeholder="Additional notes…" style={{ ...inputBase, resize: 'vertical' }} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-4 pb-4 pt-3 flex items-center gap-3 flex-shrink-0" style={{ borderTop: `1px solid ${G.border}` }}>
          {step > 1 && (
            <button onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
              ← Back
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button
              disabled={step === 1 ? !canContinueStep1 : !canContinueStep2}
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
              style={{ background: G.primary }}>
              Continue →
            </button>
          ) : (
            <button disabled={!canSubmit} onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
              style={{ background: '#0584C7' }}>
              Create Work Item
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Ops Panel (admin/article — unchanged) ────────────────────────────────────
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
  if (adminView) {
    return (
      <div className="flex flex-col gap-4 h-full overflow-y-auto">
        <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-3.5 w-3.5" style={{ color: G.secondary }} />
            <p className="text-xs font-bold" style={{ color: G.primary }}>Team Overview</p>
          </div>
          {MOCK_TEAM.map(member => {
            const memberItems = items.filter(i => i.assigned_to === member.name)
            const active = memberItems.filter(i => i.queue !== 'done').length
            const done = memberItems.filter(i => i.queue === 'done').length
            const total = active + done
            const pct = total > 0 ? (done / total) * 100 : 0
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
                  <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: G.primary }} />
                </div>
              </div>
            )
          })}
        </div>
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
        <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-3.5 w-3.5" style={{ color: '#2563EB' }} />
            <p className="text-xs font-bold" style={{ color: G.primary }}>Upcoming Deadlines</p>
          </div>
          <div className="space-y-2">
            {[...items].filter(i => i.queue !== 'done').sort((a, b) => a.days_remaining - b.days_remaining).slice(0, 4).map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <TypeChip type={item.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold truncate" style={{ color: G.primary }}>{item.title}</p>
                </div>
                <Avatar name={item.assigned_to} size="xs" />
                <DaysBadge days={item.days_remaining} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const filtered = isArticleView && currentUserName ? items.filter(i => i.assigned_to === currentUserName) : items
  const overdue = filtered.filter(i => i.days_remaining < 0 && i.queue !== 'done')
  const today = filtered.filter(i => i.days_remaining >= 0 && i.days_remaining <= 1 && i.queue !== 'done')
  const upcoming = filtered.filter(i => i.days_remaining > 1 && i.days_remaining <= 5 && i.queue !== 'done')
  const highRisk = filtered.filter(i => i.score >= 70 && i.queue !== 'done').slice(0, 3)
  const myPending = isArticleView && currentUserName
    ? pendingActions.filter(a => a.requestedBy === currentUserName && !a.resolved) : []

  const PENDING_TYPE_CFG: Record<PendingAction['type'], { icon: React.ElementType; label: string }> = {
    in_review: { icon: ScanEye, label: 'Ready for Review' },
    extension_request: { icon: CalendarClock, label: 'Extension Request' },
    doc_request: { icon: FileUp, label: 'Doc Request' },
    query: { icon: MessageSquare, label: 'Query' },
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
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
              <div key={item.id} className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold truncate" style={{ color: G.primary }}>{item.title}</p>
                <p className="text-[9px]" style={{ color: G.secondary }}>{item.client} · {Math.abs(item.days_remaining)}d overdue</p>
              </div>
            ))}
          </div>
        </div>
      )}
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
        </div>
      </div>
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
    </div>
  )
}

const ADMIN_PENDING_TYPE_CFG: Record<PendingAction['type'], { icon: React.ElementType; label: string }> = {
  in_review: { icon: ScanEye, label: 'Ready for Review' },
  extension_request: { icon: CalendarClock, label: 'Extension Request' },
  doc_request: { icon: FileUp, label: 'Doc Request' },
  query: { icon: MessageSquare, label: 'Query' },
}

// ─── Team Swimlane (admin) ────────────────────────────────────────────────────
function TeamSwimlaneView({ items, onItemClick }: { items: WorkItem[]; onItemClick: (i: WorkItem) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {MOCK_TEAM.map(member => {
        const memberItems = items.filter(i => i.assigned_to === member.name)
        const activeCount = memberItems.filter(i => i.queue !== 'done').length
        const doneCount = memberItems.filter(i => i.queue === 'done').length
        const total = memberItems.length
        const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
        return (
          <div key={member.id} className="flex rounded-2xl overflow-hidden"
            style={{ background: G.white, border: `1px solid ${G.border}`, minHeight: 130 }}>
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
              <p className="text-[9px]" style={{ color: G.secondary }}>{activeCount} active · {doneCount} done</p>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: G.border }}>
                <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: G.primary }} />
              </div>
            </div>
            <div className="flex gap-2 p-3 overflow-x-auto flex-1" style={{ scrollbarWidth: 'thin', alignItems: 'flex-start' }}>
              {memberItems.length === 0 ? (
                <div className="flex items-center justify-center w-full py-4">
                  <p className="text-[10px]" style={{ color: G.icon }}>No work assigned</p>
                </div>
              ) : memberItems.sort((a, b) => b.score - a.score).map(item => (
                <div key={item.id} style={{ minWidth: 220, maxWidth: 220 }}>
                  <WorkCard item={item} onClick={() => onItemClick(item)} />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Client Group View (admin) ────────────────────────────────────────────────
function ClientGroupView({ items, onItemClick }: { items: WorkItem[]; onItemClick: (i: WorkItem) => void }) {
  const clients = Array.from(new Set(items.map(i => i.client))).sort()
  return (
    <div className="flex flex-col gap-4">
      {clients.map(clientName => {
        const clientItems = items.filter(i => i.client === clientName).sort((a, b) => b.score - a.score)
        return (
          <div key={clientName} className="rounded-2xl overflow-hidden"
            style={{ background: G.white, border: `1px solid ${G.border}` }}>
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
                      style={{ borderBottom: `1px solid ${G.border}` }}>
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

// ─── View Toggle component ────────────────────────────────────────────────────
function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex rounded-xl overflow-hidden shrink-0"
      style={{ border: `1px solid ${G.border}`, background: G.white }}>
      <button onClick={() => onChange('list')}
        className="flex items-center justify-center h-[34px] w-[34px] transition-all"
        style={{
          background: view === 'list' ? G.primary : 'transparent',
          color: view === 'list' ? '#FFFFFF' : G.icon,
        }}
        title="List view">
        <List className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => onChange('folder')}
        className="flex items-center justify-center h-[34px] w-[34px] transition-all"
        style={{
          background: view === 'folder' ? G.primary : 'transparent',
          color: view === 'folder' ? '#FFFFFF' : G.icon,
          borderLeft: `1px solid ${G.border}`,
        }}
        title="Folder / Board view">
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
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

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<WorkType | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<QueueId | 'all'>('all')
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>('all')
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [pendingActions, setPendingActions] = useState<PendingAction[]>(PENDING_ACTIONS)
  const [workItems, setWorkItems] = useState<WorkItem[]>(RAW_ITEMS)
  const [adminTab, setAdminTab] = useState<'team' | 'client' | 'board'>('board')

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

  const allItems = useMemo(() => {
    let items = workItems
    if (articleView && currentUser?.full_name) {
      items = items.filter(i => i.assigned_to === currentUser.full_name)
    }
    if (search) items = items.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.client.toLowerCase().includes(search.toLowerCase())
    )
    if (filterType !== 'all') items = items.filter(i => i.type === filterType)
    if (filterPriority !== 'all') items = items.filter(i => i.priority === filterPriority)
    if (filterStatus !== 'all') items = items.filter(i => i.queue === filterStatus)
    if (filterAssignedTo !== 'all') items = items.filter(i => i.assigned_to === filterAssignedTo)
    if (filterCompany !== 'all') items = items.filter(i => i.client === filterCompany)
    return items
  }, [workItems, search, filterType, filterPriority, filterStatus, filterAssignedTo, filterCompany, currentUser?.full_name, articleView])

  const queues: QueueId[] = ['todo', 'in_progress', 'in_review', 'done']
  const queuedItems = (qid: QueueId) => allItems.filter(i => i.queue === qid).sort((a, b) => b.score - a.score)

  // Whether to use admin's special views (team/client) — only meaningful in board mode
  const useAdminGroupedView = !articleView && viewMode === 'folder' && adminTab !== 'board'

  return (
    <div className="flex h-full" style={{ background: G.canvas }}>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Top header — title + ALL controls in one row */}
        <div className="px-6 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${G.border}`, background: G.white }}>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Title block */}
            <div className="shrink-0">
              <h1 className="text-xl font-bold leading-tight" style={{ color: G.primary }}>
                {articleView ? 'My Work' : 'Work Center'}
              </h1>
              <p className="text-[10px] mt-0.5" style={{ color: G.secondary }}>
                {articleView
                  ? 'Assigned tasks, filings & notices'
                  : 'All compliance operations'}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-56 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: G.icon }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search items, clients…"
                className="w-full pl-8 pr-3 py-[7px] rounded-xl text-xs outline-none"
                style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.primary }} />
            </div>

            {/* Type filter */}
            <div className="relative shrink-0">
              <select value={filterType} onChange={e => setFilterType(e.target.value as WorkType | 'all')}
                className="appearance-none pl-3 pr-7 py-[7px] rounded-xl text-xs font-semibold outline-none cursor-pointer"
                style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
                <option value="all">All Types</option>
                {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
            </div>

            {/* Priority filter */}
            <div className="relative shrink-0">
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
                className="appearance-none pl-3 pr-7 py-[7px] rounded-xl text-xs font-semibold outline-none cursor-pointer"
                style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
                <option value="all">All Priorities</option>
                {(Object.keys(PRIORITY_CFG) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CFG[p].label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
            </div>

            {/* NEW: Status filter (todo/in_progress/in_review/done) */}
            <div className="relative shrink-0">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as QueueId | 'all')}
                className="appearance-none pl-3 pr-7 py-[7px] rounded-xl text-xs font-semibold outline-none cursor-pointer"
                style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
                <option value="all">All Status</option>
                {(Object.keys(QUEUE_CFG) as QueueId[]).map(q => <option key={q} value={q}>{QUEUE_CFG[q].label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
            </div>

            {/* Company filter */}
            <div className="relative shrink-0">
              <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
                className="appearance-none pl-3 pr-7 py-[7px] rounded-xl text-xs font-semibold outline-none cursor-pointer"
                style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
                <option value="all">All Companies</option>
                {Array.from(new Set(workItems.map(i => i.client).filter(Boolean))).sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
            </div>

            {/* Assigned To filter */}
            <div className="relative shrink-0">
              <select value={filterAssignedTo} onChange={e => setFilterAssignedTo(e.target.value)}
                className="appearance-none pl-3 pr-7 py-[7px] rounded-xl text-xs font-semibold outline-none cursor-pointer"
                style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
                <option value="all">Assigned To</option>
                {Array.from(new Set(workItems.map(i => i.assigned_to).filter(Boolean))).sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: G.icon }} />
            </div>

            <div className="flex-1" />

            {/* View toggle (list/folder) */}
            <ViewToggle view={viewMode} onChange={setViewMode} />

            {/* Admin grouping selector — only when in folder mode */}
            {!articleView && viewMode === 'folder' && (
              <div className="flex gap-1 shrink-0">
                {([
                  { id: 'board', label: 'Board' },
                  { id: 'team', label: 'By Team' },
                  { id: 'client', label: 'By Client' },
                ] as const).map(v => (
                  <button key={v.id} onClick={() => setAdminTab(v.id)}
                    className="px-3 py-[7px] rounded-xl text-xs font-semibold transition-colors"
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

            {/* Create button — admin only */}
            {!articleView && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-[7px] text-xs font-bold text-white shrink-0"
                style={{ background: G.primary, boxShadow: '0 4px 12px rgba(15,23,42,0.18)' }}>
                <Plus className="h-3.5 w-3.5" />Create
              </button>
            )}
          </div>
        </div>

        {/* Main content area — list or folder views */}
        <div className="flex-1 overflow-auto p-5">

          {viewMode === 'list' ? (
            /* LIST VIEW — same table for both article and admin */
            <WorkListView
              items={allItems}
              onItemClick={setSelectedItem}
            />
          ) : (
            /* FOLDER VIEW */
            articleView ? (
              /* Article: 4-column kanban */
              <div className="flex gap-3" style={{ minWidth: 'max-content', alignItems: 'flex-start' }}>
                {queues.map(qid => (
                  <BoardColumn key={qid} queueId={qid} items={queuedItems(qid)}
                    onCardClick={setSelectedItem} />
                ))}
              </div>
            ) : adminTab === 'team' ? (
              <TeamSwimlaneView items={allItems} onItemClick={setSelectedItem} />
            ) : adminTab === 'client' ? (
              <ClientGroupView items={allItems} onItemClick={setSelectedItem} />
            ) : (
              /* Admin board */
              <div className="flex gap-3" style={{ minWidth: 'max-content', alignItems: 'flex-start' }}>
                {queues.map(qid => (
                  <BoardColumn key={qid} queueId={qid} items={queuedItems(qid)}
                    onCardClick={setSelectedItem} />
                ))}
              </div>
            )
          )}
        </div>
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