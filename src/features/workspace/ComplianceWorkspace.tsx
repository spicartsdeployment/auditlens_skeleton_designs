import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText, ReceiptText, Scale, AlertTriangle, CheckCircle2,
  Clock, ChevronRight, MessageSquare, Send, X, Eye,
  AlertCircle, FolderOpen, ChevronDown, ChevronUp, Circle,
  RefreshCw, Filter,
} from 'lucide-react'
import { format, parseISO, isAfter, differenceInDays } from 'date-fns'
import { mockComplianceApi } from '@/mock/api'
import { MOCK_FILINGS, MOCK_CLIENTS } from '@/mock/data'
import { useAuthStore } from '@/shared/hooks/useAuthStore'
import { usePermission } from '@/shared/hooks/usePermission'
import { cn } from '@/shared/components/cn'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────
interface Query { id: number; filing_id: number; raised_by: string; issue: string; created_at: string; status: 'open' | 'resolved'; reply?: string }

// ── Shared Badge ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    filed: 'badge-filed', done: 'badge-done',
    in_review: 'badge-inreview', submitted: 'badge-submitted',
    draft: 'badge-draft', overdue: 'badge-overdue', open: 'badge-inprogress',
  }
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', map[status] ?? 'badge-draft')}>{status.replace(/_/g, ' ')}</span>
}

// ── Module icon ───────────────────────────────────────────
function ModuleIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ElementType; cls: string }> = {
    gstr1: { icon: FileText, cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30' },
    gstr3b: { icon: FileText, cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30' },
    gstr9: { icon: FileText, cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30' },
    tds_26q: { icon: ReceiptText, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30' },
    tds_24q: { icon: ReceiptText, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30' },
    audit_statutory: { icon: Scale, cls: 'bg-green-50 text-green-700 dark:bg-green-900/30' },
  }
  const { icon: Icon, cls } = map[type] ?? { icon: FileText, cls: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800' }
  return (
    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cls)}>
      <Icon className="h-4 w-4" />
    </div>
  )
}

// ── Mock queries in memory ────────────────────────────────
const MOCK_QUERIES: Query[] = [
  { id: 1, filing_id: 2, raised_by: 'Rohan Verma', issue: 'B2C invoice summary for May 2026 is missing. Client has not uploaded yet. Should I follow up or hold the filing?', created_at: '2026-06-09T11:00:00Z', status: 'open' },
  { id: 2, filing_id: 3, raised_by: 'Sneha Iyer', issue: 'TDS challan details for Q4 not received from BlueSky. Deadline is June 30. Requesting guidance on escalation.', created_at: '2026-06-22T09:00:00Z', status: 'open' },
]

const FILING_TYPE_LABELS: Record<string, string> = {
  gstr1: 'GSTR-1', gstr3b: 'GSTR-3B', gstr9: 'GSTR-9', gstr9c: 'GSTR-9C',
  tds_26q: 'TDS 26Q', tds_24q: 'TDS 24Q', audit_statutory: 'Statutory Audit', audit_tax: 'Tax Audit',
}

// ── Admin view: Queries raised by team ───────────────────
function AdminQueryPanel({ queries, onResolve }: { queries: Query[]; onResolve: (id: number, reply: string) => void }) {
  const [replyText, setReplyText] = useState<Record<number, string>>({})
  const open = queries.filter(q => q.status === 'open')
  const resolved = queries.filter(q => q.status === 'resolved')

  return (
    <div className="space-y-3">
      {open.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <CheckCircle2 className="h-10 w-10 text-green-400" />
          <p className="text-sm text-secondary-content">No open queries from the team</p>
        </div>
      ) : open.map(q => (
        <div key={q.id} className="rounded-xl border border-warning-200 dark:border-amber-900 bg-warning-50/50 dark:bg-amber-900/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-warning-600" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-warning-700 dark:text-amber-300">
                Query from {q.raised_by}
                <span className="ml-2 text-[10px] font-normal text-muted-content">{format(new Date(q.created_at), 'd MMM, h:mm a')}</span>
              </p>
              <p className="text-sm text-primary-content mt-1">{q.issue}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your reply..."
              value={replyText[q.id] ?? ''}
              onChange={e => setReplyText(p => ({ ...p, [q.id]: e.target.value }))}
              className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-surface dark:bg-neutral-800 px-3 py-1.5 text-sm text-primary-content placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
              disabled={!replyText[q.id]?.trim()}
              onClick={() => { onResolve(q.id, replyText[q.id]); setReplyText(p => ({ ...p, [q.id]: '' })) }}
            >
              <Send className="h-3 w-3" /> Reply & Resolve
            </button>
          </div>
        </div>
      ))}
      {resolved.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-content mb-2">Resolved ({resolved.length})</p>
          {resolved.map(q => (
            <div key={q.id} className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10 p-4 mb-2">
              <p className="text-xs text-secondary-content">{q.issue}</p>
              {q.reply && <p className="text-xs mt-2 font-medium text-green-700 dark:text-green-400">↳ {q.reply}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Filing detail panel ───────────────────────────────────
function FilingDetail({ filing, queries, currentUser, onRaiseQuery, isAdmin }: {
  filing: any; queries: Query[]; currentUser: any
  onRaiseQuery: (filingId: number, issue: string) => void; isAdmin: boolean
}) {
  const [queryText, setQueryText] = useState('')
  const [showQueryForm, setShowQueryForm] = useState(false)

  const client = MOCK_CLIENTS.find(c => c.id === filing.client_id)
  const filingQueries = queries.filter(q => q.filing_id === filing.id)

  // Mock doc checklist per filing type
  const docChecklist: Record<string, { name: string; uploaded: boolean }[]> = {
    gstr1: [
      { name: 'Sales Register (Excel)', uploaded: true },
      { name: 'B2B Invoice Summary', uploaded: true },
      { name: 'B2C Invoice Summary', uploaded: false },
    ],
    gstr3b: [
      { name: 'GSTR-3B Computation Sheet', uploaded: true },
      { name: 'ITC Reconciliation', uploaded: true },
    ],
    tds_26q: [
      { name: 'Vendor Payment Details', uploaded: false },
      { name: 'TDS Challan Copy', uploaded: false },
      { name: 'Form 26Q Draft', uploaded: false },
    ],
    audit_statutory: [
      { name: 'Balance Sheet', uploaded: false },
      { name: 'P&L Statement', uploaded: false },
      { name: 'Bank Statements', uploaded: true },
    ],
  }
  const docs = docChecklist[filing.filing_type] ?? []
  const missingDocs = docs.filter(d => !d.uploaded)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <ModuleIcon type={filing.filing_type} />
          <div>
            <p className="text-base font-bold text-primary-content">{FILING_TYPE_LABELS[filing.filing_type] ?? filing.filing_type}</p>
            <p className="text-xs text-secondary-content">{client?.legal_name} · Period: {filing.period}</p>
          </div>
          <StatusBadge status={filing.status} />
        </div>
        {filing.due_date && (
          <div className={cn('flex items-center gap-2 rounded-lg p-2.5 text-xs', isAfter(new Date(), parseISO(filing.due_date)) ? 'bg-danger-50 dark:bg-red-900/20 text-danger-700 dark:text-red-300' : 'bg-neutral-50 dark:bg-neutral-800 text-secondary-content')}>
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Due: {format(parseISO(filing.due_date), 'd MMMM yyyy')}
            {isAfter(new Date(), parseISO(filing.due_date)) && ' — OVERDUE'}
          </div>
        )}
      </div>

      {/* Document checklist */}
      {docs.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-content mb-2">Documents</p>
          <div className="space-y-1.5">
            {docs.map(doc => (
              <div key={doc.name} className={cn('flex items-center gap-2.5 rounded-lg px-3 py-2', doc.uploaded ? 'bg-green-50 dark:bg-green-900/20' : 'bg-neutral-50 dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-700')}>
                {doc.uploaded
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  : <Circle className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                }
                <span className={cn('text-xs', doc.uploaded ? 'text-green-700 dark:text-green-300' : 'text-secondary-content')}>{doc.name}</span>
                {!doc.uploaded && <span className="ml-auto text-[10px] text-danger-500 font-semibold">Missing</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing queries */}
      {filingQueries.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-content mb-2">Queries</p>
          <div className="space-y-2">
            {filingQueries.map(q => (
              <div key={q.id} className={cn('rounded-xl border p-3', q.status === 'open' ? 'border-warning-200 dark:border-amber-900 bg-warning-50/50 dark:bg-amber-900/10' : 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10')}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className={cn('h-3.5 w-3.5 shrink-0', q.status === 'open' ? 'text-warning-600' : 'text-green-500')} />
                  <span className="text-[10px] font-semibold text-secondary-content">{q.raised_by} · {format(new Date(q.created_at), 'd MMM')}</span>
                  <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', q.status === 'open' ? 'bg-warning-100 text-warning-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300')}>{q.status}</span>
                </div>
                <p className="text-xs text-primary-content">{q.issue}</p>
                {q.reply && <p className="text-xs mt-1.5 pl-3 border-l-2 border-green-400 text-green-700 dark:text-green-300">↳ {q.reply}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raise query (non-admin only) */}
      {!isAdmin && (
        <div>
          {!showQueryForm ? (
            <button
              className={cn('w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-semibold transition-colors', missingDocs.length > 0 ? 'border-warning-300 text-warning-600 hover:bg-warning-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20' : 'border-neutral-200 dark:border-neutral-700 text-secondary-content hover:text-primary-content hover:border-neutral-300 dark:hover:border-neutral-600')}
              onClick={() => setShowQueryForm(true)}
            >
              <MessageSquare className="h-4 w-4" />
              {missingDocs.length > 0 ? `Raise Query (${missingDocs.length} issues found)` : 'Raise a Query with Admin'}
            </button>
          ) : (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface-2 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-primary-content">Raise a Query</p>
                <button onClick={() => setShowQueryForm(false)} className="text-neutral-400 hover:text-neutral-600"><X className="h-4 w-4" /></button>
              </div>
              {missingDocs.length > 0 && (
                <div className="rounded-lg bg-warning-50 dark:bg-amber-900/20 px-3 py-2">
                  <p className="text-xs font-semibold text-warning-700 dark:text-amber-300 mb-1">Detected issues:</p>
                  {missingDocs.map(d => <p key={d.name} className="text-xs text-warning-600 dark:text-amber-400">• {d.name} is missing</p>)}
                </div>
              )}
              <textarea
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
                rows={3}
                placeholder="Describe the issue clearly so admin can guide you..."
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-surface dark:bg-neutral-800 px-3 py-2 text-sm text-primary-content placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-lg bg-primary-600 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={!queryText.trim()}
                  onClick={() => { onRaiseQuery(filing.id, queryText); setQueryText(''); setShowQueryForm(false) }}
                >
                  <Send className="h-3.5 w-3.5" /> Submit Query
                </button>
                <button className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm font-semibold text-secondary-content hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={() => setShowQueryForm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Workspace ────────────────────────────────────────
export function ComplianceWorkspace() {
  const qc = useQueryClient()
  const user = useAuthStore(s => s.user)
  const { isAdmin, isSuperAdmin } = usePermission()
  const [selectedFiling, setSelectedFiling] = useState<any>(MOCK_FILINGS[1])
  const [queries, setQueries] = useState<Query[]>(MOCK_QUERIES)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: missingDocs = [] } = useQuery({ queryKey: ['missing-docs'], queryFn: () => mockComplianceApi.missingDocs().then(r => r.data) })
  const { data: approvals = [] } = useQuery({ queryKey: ['approvals'], queryFn: () => mockComplianceApi.approvals().then(r => r.data) })

  const today = new Date()

  // Role-aware filing list
  const filings = isAdmin() || isSuperAdmin()
    ? MOCK_FILINGS
    : MOCK_FILINGS.filter(f => f.filled_by_id === user?.id || f.reviewed_by_id === user?.id || [1, 2, 3].includes(f.client_id))

  const filtered = statusFilter === 'all' ? filings : filings.filter(f => f.status === statusFilter)

  const groups = {
    'Needs Attention': filtered.filter(f => f.status === 'in_review' || (f.due_date && isAfter(today, parseISO(f.due_date)) && f.status !== 'filed')),
    'In Progress':     filtered.filter(f => ['draft', 'submitted'].includes(f.status)),
    'Filed':           filtered.filter(f => f.status === 'filed'),
  }

  const openQueryCount = queries.filter(q => q.status === 'open').length

  const handleRaiseQuery = (filingId: number, issue: string) => {
    const newQuery: Query = {
      id: Date.now(), filing_id: filingId,
      raised_by: user?.full_name ?? 'Unknown',
      issue, created_at: new Date().toISOString(), status: 'open',
    }
    setQueries(p => [newQuery, ...p])
    toast.success('Query raised — admin has been notified')
  }

  const handleResolveQuery = (id: number, reply: string) => {
    setQueries(p => p.map(q => q.id === id ? { ...q, status: 'resolved', reply } : q))
    toast.success('Query resolved')
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary-content">Compliance Workspace</h1>
          <p className="text-sm text-secondary-content">
            {isAdmin() || isSuperAdmin()
              ? 'Review filings, respond to team queries, and track compliance'
              : 'Check your filing status and raise queries with your CA'}
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-surface dark:bg-neutral-800 px-3 py-2 text-xs font-medium text-secondary-content hover:text-primary-content"
          onClick={() => { qc.invalidateQueries(); toast.success('Refreshed') }}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Admin: open queries alert banner */}
      {(isAdmin() || isSuperAdmin()) && openQueryCount > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-warning-50 dark:bg-amber-900/20 border border-warning-200 dark:border-amber-900 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-warning-600 shrink-0" />
          <p className="text-sm text-warning-700 dark:text-amber-300 font-medium">
            {openQueryCount} open {openQueryCount === 1 ? 'query' : 'queries'} raised by team — review in the Query panel
          </p>
          <ChevronRight className="h-4 w-4 text-warning-500 ml-auto" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── LEFT: Filing List ─────────────────────────── */}
        <div className="lg:col-span-4 space-y-3">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-content shrink-0" />
            <div className="flex gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-0.5 flex-1">
              {['all', 'draft', 'in_review', 'filed'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn('flex-1 rounded-md py-1.5 text-[10px] font-semibold capitalize transition-colors', statusFilter === s ? 'bg-white dark:bg-neutral-700 text-primary-content shadow-sm' : 'text-secondary-content hover:text-primary-content')}>
                  {s === 'all' ? 'All' : s === 'in_review' ? 'Review' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped filing list */}
          {Object.entries(groups).map(([groupName, groupFilings]) => {
            if (groupFilings.length === 0) return null
            return (
              <div key={groupName}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-content mb-1.5 px-1">{groupName}</p>
                <div className="space-y-1.5">
                  {groupFilings.map(filing => {
                    const client = MOCK_CLIENTS.find(c => c.id === filing.client_id)
                    const isSelected = selectedFiling?.id === filing.id
                    const hasQuery = queries.some(q => q.filing_id === filing.id && q.status === 'open')
                    return (
                      <button key={filing.id}
                        className={cn('w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all', isSelected ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 shadow-sm' : 'border-neutral-200 dark:border-neutral-700 bg-surface dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600')}
                        onClick={() => setSelectedFiling(filing)}
                      >
                        <ModuleIcon type={filing.filing_type} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-primary-content truncate">{FILING_TYPE_LABELS[filing.filing_type] ?? filing.filing_type}</p>
                            {hasQuery && <AlertCircle className="h-3 w-3 text-warning-500 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-secondary-content truncate">{client?.legal_name} · {filing.period}</p>
                        </div>
                        <StatusBadge status={filing.status} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── CENTER: Filing Detail ─────────────────────── */}
        <div className="lg:col-span-5">
          {!selectedFiling ? (
            <div className="card rounded-xl border p-16 flex flex-col items-center gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <Eye className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm text-secondary-content">Select a filing to review details</p>
            </div>
          ) : (
            <div className="card rounded-xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
              <FilingDetail
                filing={selectedFiling}
                queries={queries}
                currentUser={user}
                onRaiseQuery={handleRaiseQuery}
                isAdmin={isAdmin() || isSuperAdmin()}
              />
            </div>
          )}
        </div>

        {/* ── RIGHT: Queries + Deadlines ────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Queries panel */}
          <div className="card rounded-xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning-50 dark:bg-amber-900/30">
                <MessageSquare className="h-3.5 w-3.5 text-warning-600" />
              </div>
              <h2 className="text-sm font-semibold text-primary-content">
                {isAdmin() || isSuperAdmin() ? 'Team Queries' : 'My Queries'}
              </h2>
              {openQueryCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-warning-500 text-[10px] font-bold text-white px-1">{openQueryCount}</span>
              )}
            </div>
            {isAdmin() || isSuperAdmin() ? (
              <AdminQueryPanel queries={queries} onResolve={handleResolveQuery} />
            ) : (
              <div className="space-y-2">
                {queries.filter(q => q.raised_by === user?.full_name).length === 0 ? (
                  <p className="text-sm text-secondary-content text-center py-6">No queries raised yet. Select a filing and raise a query if you need guidance.</p>
                ) : queries.filter(q => q.raised_by === user?.full_name).map(q => (
                  <div key={q.id} className={cn('rounded-xl border p-3', q.status === 'open' ? 'border-warning-200 dark:border-amber-900 bg-warning-50/50 dark:bg-amber-900/10' : 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10')}>
                    <p className="text-xs text-secondary-content">{q.issue}</p>
                    {q.reply && <p className="text-xs mt-1.5 font-semibold text-green-700 dark:text-green-400">Admin: {q.reply}</p>}
                    <span className={cn('mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', q.status === 'open' ? 'bg-warning-100 text-warning-700' : 'bg-green-100 text-green-700')}>{q.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing Documents summary */}
          <div className="card rounded-xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-50 dark:bg-red-900/30">
                <FolderOpen className="h-3.5 w-3.5 text-danger-600" />
              </div>
              <h2 className="text-sm font-semibold text-primary-content">Missing Documents</h2>
              <span className="ml-auto text-xs text-danger-600 font-bold">{(missingDocs as any[]).length}</span>
            </div>
            <ul className="space-y-2">
              {(missingDocs as any[]).slice(0, 5).map((d: any) => (
                <li key={d.id} className="flex items-center gap-2 text-xs">
                  <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', d.status === 'overdue' ? 'bg-danger-500' : 'bg-warning-500')} />
                  <span className="text-primary-content truncate">{d.document}</span>
                  <span className="shrink-0 text-muted-content">{d.client_name.split(' ')[0]}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  )
}
