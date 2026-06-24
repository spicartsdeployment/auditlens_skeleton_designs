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

import { G, StatusBadge as GrayStatusBadge, DarkBtn, OutlineBtn, ContentCard } from '@/shared/components/GrayKpi'

// ── Shared Badge ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  return <GrayStatusBadge status={status} />
}

// ── Module icon — gray only ───────────────────────────────
function ModuleIcon({ type }: { type: string }) {
  const map: Record<string, React.ElementType> = {
    gstr1: FileText, gstr3b: FileText, gstr9: FileText,
    tds_26q: ReceiptText, tds_24q: ReceiptText, audit_statutory: Scale,
  }
  const Icon = map[type] ?? FileText
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
      <Icon className="h-4 w-4" style={{ color: G.icon }} />
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
        <div key={q.id} className="rounded-xl p-3 space-y-2.5"
          style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
          {/* Query body */}
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: '#D97706' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-semibold leading-none" style={{ color: G.primary }}>
                  Query from {q.raised_by}
                </p>
                <span className="text-[10px]" style={{ color: G.icon }}>
                  {format(new Date(q.created_at), 'd MMM, h:mm a')}
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: G.secondary }}>{q.issue}</p>
            </div>
          </div>
          {/* Reply row — stacked to stay inside narrow panel */}
          <div className="space-y-1.5">
            <input
              type="text"
              placeholder="Type your reply..."
              value={replyText[q.id] ?? ''}
              onChange={e => setReplyText(p => ({ ...p, [q.id]: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter' && replyText[q.id]?.trim()) { onResolve(q.id, replyText[q.id]); setReplyText(p => ({ ...p, [q.id]: '' })) } }}
              className="w-full rounded-lg px-3 py-1.5 text-xs"
              style={{ background: G.white, border: `1px solid ${G.border}`, color: G.primary, outline: 'none' }}
            />
            <button
              className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
              style={{ background: G.primary, color: '#FFFFFF' }}
              onClick={() => { if (replyText[q.id]?.trim()) { onResolve(q.id, replyText[q.id]); setReplyText(p => ({ ...p, [q.id]: '' })) } }}
            >
              <Send className="h-3 w-3" /> Reply &amp; Resolve
            </button>
          </div>
        </div>
      ))}
      {resolved.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: G.icon }}>Resolved ({resolved.length})</p>
          {resolved.map(q => (
            <div key={q.id} className="rounded-xl p-4 mb-2"
              style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
              <p className="text-xs" style={{ color: G.secondary }}>{q.issue}</p>
              {q.reply && <p className="text-xs mt-2 font-medium" style={{ color: '#166534' }}>↳ {q.reply}</p>}
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
        {filing.due_date && (() => {
          const isOvd = isAfter(new Date(), parseISO(filing.due_date))
          return (
            <div className="flex items-center gap-2 rounded-xl p-2.5 text-xs"
              style={{ background: G.canvas, border: `1px solid ${isOvd ? '#FECACA' : G.border}`, color: isOvd ? '#DC2626' : G.secondary }}>
              <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: isOvd ? '#DC2626' : G.icon }} />
              Due: {format(parseISO(filing.due_date), 'd MMMM yyyy')}
              {isOvd && ' — OVERDUE'}
            </div>
          )
        })()}
      </div>

      {/* Document checklist */}
      {docs.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-content mb-2">Documents</p>
          <div className="space-y-1.5">
            {docs.map(doc => (
              <div key={doc.name} className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                style={{ background: G.canvas, border: `1px solid ${doc.uploaded ? G.border : '#FECACA'}` }}>
                {doc.uploaded
                  ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: '#166534' }} />
                  : <Circle className="h-3.5 w-3.5 shrink-0" style={{ color: G.icon }} />
                }
                <span className="text-xs" style={{ color: doc.uploaded ? '#166534' : G.secondary }}>{doc.name}</span>
                {!doc.uploaded && <span className="ml-auto text-[10px] font-semibold" style={{ color: '#DC2626' }}>Missing</span>}
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
              <div key={q.id} className="rounded-xl p-3"
                style={{ background: G.canvas, border: `1px solid ${q.status === 'open' ? '#FDE68A' : G.border}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color: q.status === 'open' ? '#D97706' : '#166534' }} />
                  <span className="text-[10px] font-semibold" style={{ color: G.secondary }}>{q.raised_by} · {format(new Date(q.created_at), 'd MMM')}</span>
                  <GrayStatusBadge status={q.status} />
                </div>
                <p className="text-xs" style={{ color: G.primary }}>{q.issue}</p>
                {q.reply && <p className="text-xs mt-1.5 pl-3 font-medium" style={{ borderLeft: '2px solid #166534', color: '#166534' }}>↳ {q.reply}</p>}
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
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-semibold transition-colors"
              style={{ borderColor: missingDocs.length > 0 ? '#FDE68A' : G.border, color: missingDocs.length > 0 ? '#D97706' : G.secondary }}
              onClick={() => setShowQueryForm(true)}
            >
              <MessageSquare className="h-4 w-4" />
              {missingDocs.length > 0 ? `Raise Query (${missingDocs.length} issues found)` : 'Raise a Query with Admin'}
            </button>
          ) : (
            <div className="rounded-xl p-4 space-y-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: G.primary }}>Raise a Query</p>
                <button onClick={() => setShowQueryForm(false)} style={{ color: G.icon }}><X className="h-4 w-4" /></button>
              </div>
              {missingDocs.length > 0 && (
                <div className="rounded-xl px-3 py-2" style={{ background: G.canvas, border: `1px solid #FDE68A` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#D97706' }}>Detected issues:</p>
                  {missingDocs.map((d: any) => <p key={d.name} className="text-xs" style={{ color: '#92400E' }}>• {d.name} is missing</p>)}
                </div>
              )}
              <textarea
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
                rows={3}
                placeholder="Describe the issue clearly so admin can guide you..."
                className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                style={{ background: G.white, border: `1px solid ${G.border}`, color: G.primary }}
              />
              <div className="flex gap-2">
                <DarkBtn
                  className="flex-1 justify-center disabled:opacity-50"
                  onClick={() => { if (queryText.trim()) { onRaiseQuery(filing.id, queryText); setQueryText(''); setShowQueryForm(false) } }}
                >
                  <Send className="h-3.5 w-3.5" /> Submit Query
                </DarkBtn>
                <OutlineBtn onClick={() => setShowQueryForm(false)}>Cancel</OutlineBtn>
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
          <h1 className="text-xl font-bold" style={{ color: G.primary }}>Compliance Workspace</h1>
          <p className="text-sm mt-0.5" style={{ color: G.secondary }}>
            {isAdmin() || isSuperAdmin()
              ? 'Review filings, respond to team queries, and track compliance'
              : 'Check your filing status and raise queries with your CA'}
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all"
          style={{ background: G.white, border: `1px solid ${G.border}`, color: G.secondary }}
          onClick={() => { qc.invalidateQueries(); toast.success('Refreshed') }}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Admin: open queries notice — gray border, amber text only */}
      {(isAdmin() || isSuperAdmin()) && openQueryCount > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: G.canvas, border: `1px solid #FDE68A` }}>
          <AlertCircle className="h-5 w-5 shrink-0" style={{ color: '#D97706' }} />
          <p className="text-sm font-medium" style={{ color: '#92400E' }}>
            {openQueryCount} open {openQueryCount === 1 ? 'query' : 'queries'} raised by team — review in the Query panel
          </p>
          <ChevronRight className="h-4 w-4 ml-auto" style={{ color: G.icon }} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── LEFT: Filing List ─────────────────────────── */}
        <div className="lg:col-span-4 space-y-3">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 shrink-0" style={{ color: G.icon }} />
            <div className="flex gap-0.5 rounded-xl p-0.5 flex-1"
              style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
              {['all', 'draft', 'in_review', 'filed'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className="flex-1 rounded-lg py-1.5 text-[10px] font-semibold capitalize transition-all"
                  style={statusFilter === s ? { background: G.primary, color: '#FFFFFF' } : { color: G.secondary }}>
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
                        className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all"
                        style={{
                          background: isSelected ? G.canvas : G.white,
                          border: `1px solid ${isSelected ? G.primary : G.border}`,
                          boxShadow: isSelected ? `0 0 0 1px ${G.primary}22` : 'none',
                        }}
                        onClick={() => setSelectedFiling(filing)}
                      >
                        <ModuleIcon type={filing.filing_type} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold truncate" style={{ color: G.primary }}>{FILING_TYPE_LABELS[filing.filing_type] ?? filing.filing_type}</p>
                            {hasQuery && <AlertCircle className="h-3 w-3 shrink-0" style={{ color: '#D97706' }} />}
                          </div>
                          <p className="text-[10px] truncate" style={{ color: G.secondary }}>{client?.legal_name} · {filing.period}</p>
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
            <ContentCard>
              <div className="p-16 flex flex-col items-center gap-3">
                <Eye className="h-12 w-12" style={{ color: G.icon }} />
                <p className="text-sm" style={{ color: G.secondary }}>Select a filing to review details</p>
              </div>
            </ContentCard>
          ) : (
            <ContentCard>
              <div className="p-5">
                <FilingDetail
                  filing={selectedFiling}
                  queries={queries}
                  currentUser={user}
                  onRaiseQuery={handleRaiseQuery}
                  isAdmin={isAdmin() || isSuperAdmin()}
                />
              </div>
            </ContentCard>
          )}
        </div>

        {/* ── RIGHT: Queries + Deadlines ────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Queries panel */}
          <ContentCard>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                  <MessageSquare className="h-3.5 w-3.5" style={{ color: G.icon }} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: G.primary }}>
                  {isAdmin() || isSuperAdmin() ? 'Team Queries' : 'My Queries'}
                </h2>
                {openQueryCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold px-1"
                    style={{ background: G.primary, color: '#FFFFFF' }}>{openQueryCount}</span>
                )}
              </div>
              {isAdmin() || isSuperAdmin() ? (
                <AdminQueryPanel queries={queries} onResolve={handleResolveQuery} />
              ) : (
                <div className="space-y-2">
                  {queries.filter(q => q.raised_by === user?.full_name).length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: G.secondary }}>No queries raised yet.</p>
                  ) : queries.filter(q => q.raised_by === user?.full_name).map(q => (
                    <div key={q.id} className="rounded-xl p-3"
                      style={{ background: G.canvas, border: `1px solid ${q.status === 'open' ? '#FDE68A' : G.border}` }}>
                      <p className="text-xs" style={{ color: G.secondary }}>{q.issue}</p>
                      {q.reply && <p className="text-xs mt-1.5 font-semibold" style={{ color: '#166534' }}>Admin: {q.reply}</p>}
                      <GrayStatusBadge status={q.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ContentCard>

          {/* Missing Documents summary */}
          <ContentCard>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                  <FolderOpen className="h-3.5 w-3.5" style={{ color: G.icon }} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: G.primary }}>Missing Documents</h2>
                <span className="ml-auto text-xs font-bold" style={{ color: (missingDocs as any[]).length > 0 ? '#DC2626' : G.icon }}>{(missingDocs as any[]).length}</span>
              </div>
              <ul className="space-y-2">
                {(missingDocs as any[]).slice(0, 5).map((d: any) => (
                  <li key={d.id} className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: d.status === 'overdue' ? '#DC2626' : '#D97706' }} />
                    <span className="truncate" style={{ color: G.primary }}>{d.document}</span>
                    <span className="shrink-0" style={{ color: G.icon }}>{d.client_name.split(' ')[0]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ContentCard>

        </div>
      </div>
    </div>
  )
}
