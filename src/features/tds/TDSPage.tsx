/**
 * TDS Module
 * Tabs: Overview | Clients | Returns | Reconciliation
 *
 * Form types:
 *   24Q  — Salary (quarterly)
 *   26Q  — Non-salary / Payments to residents
 *   27Q  — Payments to non-residents / foreign remittances
 *   27EQ — Tax Collected at Source (TCS)
 */
import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ReceiptText, CheckCircle2, AlertTriangle, Clock,
  Eye, EyeOff, RefreshCw, Check, AlertCircle,
  Minus, Upload, RotateCcw, ChevronDown, Download,
  FileCheck, Pencil, Trash2, Save, Send, Hash,
} from 'lucide-react'
import { mockComplianceApi } from '@/mock/api'
import { clientsApi } from '@/shared/api/clients'
import { toast } from 'sonner'
import {
  G, PageHeader, OutlineBtn, ContentCard,
} from '@/shared/components/GrayKpi'
import { cn } from '@/shared/components/cn'

// ── Tab config ─────────────────────────────────────────────────────────────
type MainTab = 'overview' | 'clients' | 'returns' | 'reconciliation'
const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: 'overview',       label: 'Overview' },
  { key: 'clients',        label: 'Clients' },
  { key: 'returns',        label: 'Returns' },
  { key: 'reconciliation', label: 'Reconciliation' },
]

// New form numbers (FY 2026-27 onwards) → old equivalents
const FORM_TYPES = ['138-TDS', '140-TDS', '144-TDS', '143-TDS'] as const
type FormType = typeof FORM_TYPES[number]

const QUARTERS = ['Q1 FY 2025-26', 'Q2 FY 2025-26', 'Q3 FY 2025-26', 'Q4 FY 2025-26', 'Q1 FY 2026-27']
const YEARS    = ['2024-25', '2025-26', '2026-27']

// Form type labels — new (138/140/144/143) with old equivalent shown
const FORM_META: Record<FormType, { full: string; oldForm: string; desc: string }> = {
  '138-TDS': { full: 'Form No. 138-TDS', oldForm: 'Form 24Q',  desc: 'TDS on Salaries' },
  '140-TDS': { full: 'Form No. 140-TDS', oldForm: 'Form 26Q',  desc: 'TDS on Payments to Residents (Non-Salary)' },
  '144-TDS': { full: 'Form No. 144-TDS', oldForm: 'Form 27Q',  desc: 'Payments to Non-Residents (Other than Salary)' },
  '143-TDS': { full: 'Form No. 143-TDS', oldForm: 'Form 27EQ', desc: 'TCS — Tax Collected at Source' },
}

// Reverse map: old form number → new form type key (for mock data display)
const OLD_TO_NEW: Record<string, FormType> = {
  '24Q': '138-TDS', '26Q': '140-TDS', '27Q': '144-TDS', '27EQ': '143-TDS',
}

// ── TAN credentials ────────────────────────────────────────────────────────
const TAN_CREDS: Record<number, { tan: string; username: string; password: string }> = {
  1: { tan: 'SRTX12345A', username: 'SRTX12345A', password: 'Srx@Tds2024!' },
  2: { tan: 'BLSK98765B', username: 'BLSK98765B', password: 'Blsk#Tds99@' },
  3: { tan: 'RDWD55432C', username: 'RDWD55432C', password: 'Rw@Tds2026#' },
  4: { tan: 'GRPH33211D', username: 'GRPH33211D', password: 'GrPh%5Tds!' },
  5: { tan: 'APEX77654E', username: 'APEX77654E', password: 'Ap3x@Tds9' },
}

// ── Auto-fill form data ────────────────────────────────────────────────────
type SectionRow = { section: string; nature: string; amount: string; tds: string; rate: string }

type TDSFormData = {
  // Deductor
  tan: string; deductor: string; category: string; pan: string; address: string
  // Period
  quarter: string; fy: string; period: string
  // Challan
  bsr: string; challanDate: string; challanSerial: string; taxDeposited: string; minorHead: string
  // Summary (type-specific)
  employees?: number; totalSalary?: string
  deductees?: number; totalAmount?: string
  tdsDeducted: string
  // Sections (26Q / 27Q)
  sections?: SectionRow[]
  // TCS (27EQ)
  collectees?: number; totalCollection?: string
}

function buildFormData(clientId: string, quarter: string, formType: FormType, clients: any[]): TDSFormData | null {
  const client = (clients as any[]).find((c: any) => String(c.id) === clientId)
  if (!client) return null

  const creds = TAN_CREDS[Number(clientId) as keyof typeof TAN_CREDS]
    ?? { tan: 'UNKN00000A', username: 'UNKN00000A', password: '—' }

  const fyMatch = quarter.match(/FY (\d{4}-\d{2})/)
  const fy = fyMatch?.[1] ?? '2025-26'

  const periodMap: Record<string, string> = {
    'Q1': 'Apr – Jun',
    'Q2': 'Jul – Sep',
    'Q3': 'Oct – Dec',
    'Q4': 'Jan – Mar',
  }
  const qCode = quarter.split(' ')[0] as string
  const period = `${periodMap[qCode] ?? '?'} ${fy.split('-')[0]}`

  const challanDateMap: Record<string, string> = {
    'Q1': '15-Jun', 'Q2': '15-Sep', 'Q3': '15-Dec', 'Q4': '15-Mar',
  }
  const challanDate = `${challanDateMap[qCode]}-${fy.split('-')[0].slice(2)}`

  const base: TDSFormData = {
    tan: creds.tan,
    deductor: client.legal_name,
    category: 'Company',
    pan: (client.pan as string) ?? 'AABCS1429B',
    address: (client.address as string) ?? '—',
    quarter,
    fy,
    period,
    bsr: '0012345',
    challanDate,
    challanSerial: '00001',
    taxDeposited: '—',
    minorHead: '200',
    tdsDeducted: '—',
  }

  if (formType === '138-TDS') {          // Salaries (was 24Q)
    return {
      ...base,
      employees: 45,
      totalSalary: '89,00,000',
      tdsDeducted: '5,20,000',
      taxDeposited: '5,20,000',
    }
  }

  if (formType === '140-TDS') {          // Non-salary residents (was 26Q)
    return {
      ...base,
      deductees: 14,
      totalAmount: '36,40,000',
      tdsDeducted: '1,82,000',
      taxDeposited: '1,82,000',
      sections: [
        { section: '194C', nature: 'Payments to Contractors',         amount: '15,00,000', tds: '30,000', rate: '2%' },
        { section: '194J', nature: 'Professional / Technical Services', amount: '8,00,000', tds: '80,000', rate: '10%' },
        { section: '194I', nature: 'Rent',                            amount: '6,00,000', tds: '60,000', rate: '10%' },
        { section: '194H', nature: 'Commission / Brokerage',          amount: '7,40,000', tds: '12,000', rate: '~2%' },
      ],
    }
  }

  if (formType === '144-TDS') {          // Non-residents foreign payments (was 27Q)
    return {
      ...base,
      deductees: 3,
      totalAmount: '12,50,000',
      tdsDeducted: '1,25,000',
      taxDeposited: '1,25,000',
      sections: [
        { section: '195',  nature: 'Other Payments to Non-Residents',  amount: '8,00,000', tds: '80,000', rate: '10%' },
        { section: '196C', nature: 'Income from Units / LT Cap Gains', amount: '4,50,000', tds: '45,000', rate: '10%' },
      ],
    }
  }

  // 143-TDS — TCS (was 27EQ)
  return {
    ...base,
    minorHead: '206',
    collectees: 8,
    totalCollection: '24,00,000',
    tdsDeducted: '24,000',
    taxDeposited: '24,000',
    sections: [
      { section: '206C(1)',  nature: 'Sale of Scrap',           amount: '5,00,000',  tds: '5,000',  rate: '1%' },
      { section: '206C(1H)', nature: 'Sale of Goods > ₹50L',   amount: '19,00,000', tds: '19,000', rate: '0.1%' },
    ],
  }
}

// ── Reconciliation data ────────────────────────────────────────────────────
type ReconRow = { voucher: string; date: string; pan: string; party: string; paid: string; tdsBooks: string; tdsChallan: string; ais: string; status: string }

const RECON_MISMATCHED: ReconRow[] = [
  { voucher: 'VCH-2026-039', date: '28-Mar-26', pan: 'ABCDE1234Z', party: 'Rama Cotton Ltd',  paid: '5,00,000', tdsBooks: '10,000', tdsChallan: '8,000',  ais: '8,000',  status: 'mismatched' },
  { voucher: 'VCH-2026-040', date: '31-Mar-26', pan: 'XYZAB9876A', party: 'Delta Services',   paid: '8,00,000', tdsBooks: '80,000', tdsChallan: '80,000', ais: '—',      status: 'mismatched' },
]
const RECON_PARTIAL: ReconRow[] = [
  { voucher: 'VCH-2026-051', date: '05-Mar-26', pan: 'PQRST9876Y', party: 'Omega Traders',    paid: '3,00,000', tdsBooks: '6,000',  tdsChallan: '5,800', ais: '5,800',  status: 'partial' },
  { voucher: 'VCH-2026-055', date: '10-Mar-26', pan: 'LMNOP5432K', party: 'Bravo Consulting', paid: '4,00,000', tdsBooks: '40,000', tdsChallan: '40,000',ais: '39,500', status: 'partial' },
]
const RECON_MATCHED: ReconRow[] = [
  { voucher: 'VCH-2026-042', date: '02-Mar-26', pan: '29AADCB2230', party: 'BlueSky Software',     paid: '2,00,000', tdsBooks: '20,000', tdsChallan: '20,000', ais: '20,000', status: 'matched' },
  { voucher: 'VCH-2026-043', date: '12-Mar-26', pan: '27AABCS1429', party: 'Sunrise Textiles',     paid: '1,50,000', tdsBooks: '15,000', tdsChallan: '15,000', ais: '15,000', status: 'matched' },
  { voucher: 'VCH-2026-044', date: '18-Mar-26', pan: '07AAECR1234', party: 'Redwood Constructions', paid: '6,00,000', tdsBooks: '60,000', tdsChallan: '60,000', ais: '60,000', status: 'matched' },
]
const RECON_ALL = [...RECON_MISMATCHED, ...RECON_PARTIAL, ...RECON_MATCHED]

// ══════════════════════════════════════════════════════════════════════════
// Shared helpers
// ══════════════════════════════════════════════════════════════════════════
function Sel({ label, value, onChange, options }: {
  label: string; value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: G.secondary }}>{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="appearance-none w-full rounded-xl border px-3 py-2 pr-8 text-sm outline-none"
          style={{ background: G.white, borderColor: G.border, color: value ? G.primary : G.icon }}
        >
          <option value="">— Select —</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
          style={{ color: G.icon }} />
      </div>
    </div>
  )
}


function reconStatusStyle(s: string): React.CSSProperties {
  if (s === 'matched')  return { background: '#F0FDF4', color: '#16A34A' }
  if (s === 'partial')  return { background: '#FFFBEB', color: '#D97706' }
  return                       { background: '#FEF2F2', color: '#DC2626' }
}
function ReconIcon({ status }: { status: string }) {
  if (status === 'matched') return <Check className="h-3 w-3" />
  if (status === 'partial') return <Minus className="h-3 w-3" />
  return <AlertCircle className="h-3 w-3" />
}

// ══════════════════════════════════════════════════════════════════════════
// Tab panels
// ══════════════════════════════════════════════════════════════════════════

// ── Overview ───────────────────────────────────────────────────────────────
function OverviewTab({ returns }: { returns: any[] }) {
  const stats = {
    total:   returns.length,
    filed:   returns.filter((r: any) => r.status === 'filed').length,
    pending: returns.filter((r: any) => ['pending','in_review'].includes(r.status)).length,
    overdue: returns.filter((r: any) => r.status === 'overdue').length,
  }

  const byForm = FORM_TYPES.map(ft => {
    // mock data stores old form names (24Q/26Q…); map via OLD_TO_NEW
    const oldKey = FORM_META[ft].oldForm.replace('Form ', '')
    const rts = returns.filter((r: any) => r.return_type === oldKey || r.return_type === ft)
    return {
      form: ft,
      meta: FORM_META[ft],
      total:   rts.length,
      filed:   rts.filter((r: any) => r.status === 'filed').length,
      pending: rts.filter((r: any) => ['pending','in_review'].includes(r.status)).length,
      overdue: rts.filter((r: any) => r.status === 'overdue').length,
    }
  }).filter(r => r.total > 0)

  return (
    <div className="space-y-5">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { label: 'Total Returns', value: stats.total,   icon: ReceiptText,   color: G.icon,    bg: G.canvas },
          { label: 'Filed',         value: stats.filed,   icon: CheckCircle2,  color: '#16A34A', bg: '#F0FDF4' },
          { label: 'Pending',       value: stats.pending, icon: Clock,         color: '#D97706', bg: '#FFFBEB' },
          { label: 'Overdue',       value: stats.overdue, icon: AlertTriangle, color: stats.overdue > 0 ? '#DC2626' : G.icon, bg: stats.overdue > 0 ? '#FEF2F2' : G.canvas },
        ] as const).map(s => (
          <div key={s.label} className="rounded-2xl border p-4" style={{ background: G.white, borderColor: G.border }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: G.secondary }}>{s.label}</span>
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold tabular-nums"
              style={{ color: s.color === G.icon ? G.primary : s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Form-wise breakdown */}
      <ContentCard>
        <div className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: G.primary }}>Form-wise Breakdown</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: G.canvas }}>
                  {['Form', 'Description', 'Total', 'Filed', 'Pending', 'Overdue', 'Completion'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold border-b"
                      style={{ color: G.secondary, borderColor: G.border }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byForm.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: G.icon }}>No returns data</td></tr>
                ) : byForm.map(r => {
                  const pct = r.total ? Math.round((r.filed / r.total) * 100) : 0
                  return (
                    <tr key={r.form} style={{ borderBottom: `1px solid ${G.border}` }}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold block" style={{ color: G.primary }}>{r.meta.full}</span>
                        <span className="text-[10px]" style={{ color: G.icon }}>Previously: {r.meta.oldForm}</span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: G.secondary }}>{r.meta.desc}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: G.primary }}>{r.total}</td>
                      <td className="px-4 py-3" style={{ color: '#16A34A', fontWeight: 500 }}>{r.filed}</td>
                      <td className="px-4 py-3" style={{ color: '#D97706' }}>{r.pending}</td>
                      <td className="px-4 py-3" style={{ color: r.overdue > 0 ? '#DC2626' : G.icon, fontWeight: r.overdue > 0 ? 600 : 400 }}>{r.overdue}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: G.canvas }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? '#16A34A' : pct >= 50 ? '#D97706' : '#DC2626' }} />
                          </div>
                          <span className="text-xs font-semibold w-8 text-right tabular-nums" style={{ color: G.secondary }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* All returns */}
          <div className="pt-5" style={{ borderTop: `1px solid ${G.border}` }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: G.primary }}>All Returns</h3>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr style={{ background: G.canvas }}>
                    {['Client','Form','Quarter','Due Date','Deductees','Challan Count','Status','Filed On'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold border-b whitespace-nowrap"
                        style={{ color: G.secondary, borderColor: G.border }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(returns as any[]).map((r: any, idx: number) => {
                    const newKey = OLD_TO_NEW[r.return_type] ?? (r.return_type as FormType)
                    const meta   = FORM_META[newKey]
                    const challanCount = (idx % 3) + 1  // mock: 1-3 challans per return
                    return (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${G.border}` }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G.canvas}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <td className="px-4 py-2.5 font-semibold text-xs" style={{ color: G.primary }}>{r.client_name}</td>
                        <td className="px-4 py-2.5">
                          {meta ? (
                            <div>
                              <span className="font-mono text-xs font-semibold block" style={{ color: G.primary }}>{meta.full}</span>
                              <span className="text-[10px]" style={{ color: G.icon }}>{meta.oldForm}</span>
                            </div>
                          ) : (
                            <span className="font-mono text-xs font-semibold" style={{ color: G.primary }}>{r.return_type}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: G.secondary }}>{r.quarter}</td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: G.primary }}>{r.due_date ?? '—'}</td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: G.secondary }}>{r.deductees}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums"
                            style={{ color: G.primary }}>
                            <Hash className="h-3 w-3" style={{ color: G.icon }} />{challanCount}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={r.status === 'filed' ? { background: '#F0FDF4', color: '#16A34A' }
                              : r.status === 'pending' || r.status === 'in_review' ? { background: '#EFF6FF', color: '#2563EB' }
                              : { background: '#FEF2F2', color: '#DC2626' }}>
                            {r.status === 'filed' ? <Check className="h-2.5 w-2.5" /> : null}
                            {r.status === 'filed' ? 'Filed' : r.status === 'pending' ? 'Pending' : r.status === 'in_review' ? 'In Review' : 'Overdue'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: G.secondary }}>{r.filed_date ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ContentCard>
    </div>
  )
}

// ── Clients ────────────────────────────────────────────────────────────────
function ClientsTab({ clients }: { clients: any[] }) {
  const [shown, setShown] = useState<Set<number>>(new Set())
  const toggle = (id: number) =>
    setShown(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const tdsClients = (clients as any[]).filter((c: any) => c.tds_enabled)

  return (
    <ContentCard>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: G.primary }}>TRACES / TDS Portal Credentials</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: G.canvas, color: G.secondary }}>
            {tdsClients.length} active clients
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: G.canvas }}>
                {['S.No', 'Client Name', 'PAN', 'TAN', 'TRACES Password', 'TDS Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold border-b whitespace-nowrap"
                    style={{ color: G.secondary, borderColor: G.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tdsClients.map((c: any, idx: number) => {
                const creds = TAN_CREDS[c.id as number] ?? { tan: 'UNKN00000A', username: 'UNKN00000A', password: '—' }
                const visible = shown.has(c.id as number)
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${G.border}` }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G.canvas}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: G.icon }}>{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: G.primary }}>{c.legal_name}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: G.secondary }}>{c.pan ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: G.primary }}>{creds.tan}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs" style={{ color: G.primary }}>
                          {visible ? creds.password : '•'.repeat(10)}
                        </span>
                        <button
                          onClick={() => toggle(c.id as number)}
                          className="flex-shrink-0 rounded-md p-1"
                          style={{ background: G.canvas }}
                          title={visible ? 'Hide' : 'Show'}
                        >
                          {visible
                            ? <EyeOff className="h-3.5 w-3.5" style={{ color: G.secondary }} />
                            : <Eye    className="h-3.5 w-3.5" style={{ color: G.secondary }} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: '#F0FDF4', color: '#16A34A' }}>
                        <Check className="h-2.5 w-2.5" />Active
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ContentCard>
  )
}

// ── Mock editable table data ──────────────────────────────────────────────
type ChallanRow = { id: string; challan_no: string; bsr: string; deposit_date: string; tan: string; amount: string; bank: string; status: string }
type DeducteeRow = { id: string; pan: string; name: string; section: string; amount: string; tds: string; rate: string; cert: string }

const MOCK_CHALLANS: ChallanRow[] = [
  { id: 'ch1', challan_no: 'CHN-001', bsr: '0012345', deposit_date: '15-Jun-25', tan: 'SRTX12345A', amount: '5,20,000', bank: 'HDFC Bank', status: 'Paid' },
  { id: 'ch2', challan_no: 'CHN-002', bsr: '0012345', deposit_date: '07-Jul-25', tan: 'SRTX12345A', amount: '1,82,000', bank: 'ICICI Bank', status: 'Paid' },
  { id: 'ch3', challan_no: 'CHN-003', bsr: '0098765', deposit_date: '15-Sep-25', tan: 'BLSK98765B', amount: '62,500',   bank: 'SBI',        status: 'Paid' },
]
const MOCK_DEDUCTEES: DeducteeRow[] = [
  { id: 'dd1', pan: 'ABCDE1234Z', name: 'Ramesh Kumar',      section: '192',  amount: '8,50,000', tds: '62,000', rate: '—',   cert: '—' },
  { id: 'dd2', pan: 'XYZAB9876A', name: 'Delta Services',    section: '194J', amount: '8,00,000', tds: '80,000', rate: '10%', cert: 'CERT-001' },
  { id: 'dd3', pan: 'PQRST9876Y', name: 'Omega Traders',     section: '194C', amount: '15,00,000',tds: '30,000', rate: '2%',  cert: '—' },
  { id: 'dd4', pan: 'LMNOP5432K', name: 'Bravo Consulting',  section: '194I', amount: '6,00,000', tds: '60,000', rate: '10%', cert: 'CERT-002' },
]

// Inline-editable generic table
function EditableTable<T extends Record<string, string>>({
  cols, rows, onRowsChange,
}: {
  cols: { key: keyof T; label: string; mono?: boolean }[]
  rows: T[]
  onRowsChange: (rows: T[]) => void
}) {
  const [editId, setEditId] = useState<string | null>(null)
  const [buf,    setBuf]    = useState<T | null>(null)

  const startEdit = (row: T) => { setEditId((row as any).id); setBuf({ ...row }) }
  const saveEdit  = () => {
    if (!buf) return
    onRowsChange(rows.map(r => (r as any).id === editId ? buf : r))
    setEditId(null); setBuf(null)
    toast.success('Row updated')
  }
  const deleteRow = (id: string) => { onRowsChange(rows.filter(r => (r as any).id !== id)); toast.info('Row deleted') }
  const addRow    = () => {
    const newRow = cols.reduce((acc, c) => ({ ...acc, [c.key]: '' }), { id: Math.random().toString(36).slice(2) } as any) as T
    onRowsChange([...rows, newRow]); toast.info('New row added')
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button onClick={addRow}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
          style={{ background: '#0584C7' }}>
          <Hash className="h-3.5 w-3.5" />Add Row
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ background: G.canvas }}>
              <th className="text-left px-3 py-2 text-[10px] font-semibold border-b"
                style={{ color: G.secondary, borderColor: G.border }}>#</th>
              {cols.map(c => (
                <th key={String(c.key)} className="text-left px-3 py-2 text-[10px] font-semibold border-b whitespace-nowrap"
                  style={{ color: G.secondary, borderColor: G.border }}>{c.label}</th>
              ))}
              <th className="text-left px-3 py-2 text-[10px] font-semibold border-b whitespace-nowrap"
                style={{ color: G.secondary, borderColor: G.border }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={cols.length + 2} className="px-3 py-8 text-center text-xs" style={{ color: G.icon }}>
                No records — click Add Row to create entries
              </td></tr>
            )}
            {rows.map((row, ri) => {
              const id = (row as any).id
              const isEditing = editId === id
              return (
                <tr key={id} style={{ borderBottom: `1px solid ${G.border}`, background: isEditing ? '#F8FAFC' : 'transparent' }}
                  onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = G.canvas }}
                  onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: G.icon }}>{ri + 1}</td>
                  {cols.map(c => (
                    <td key={String(c.key)} className="px-3 py-2.5 whitespace-nowrap">
                      {isEditing
                        ? <input value={(buf as any)?.[c.key] ?? ''}
                            onChange={e => setBuf(b => b ? ({ ...b, [c.key]: e.target.value }) : b)}
                            className="w-full min-w-[70px] rounded px-1.5 py-0.5 text-xs outline-none"
                            style={{ border: `1px solid #0584C7`, background: '#EFF8FF', color: G.primary }} />
                        : <span style={{ color: G.primary, fontFamily: c.mono ? 'monospace' : 'inherit', fontWeight: ri === 0 && c.key === cols[0].key ? 500 : 400 }}>
                            {String(row[c.key]) || '—'}
                          </span>
                      }
                    </td>
                  ))}
                  <td className="px-3 py-2.5">
                    {isEditing
                      ? <div className="flex items-center gap-1">
                          <button onClick={saveEdit}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                            style={{ background: '#16A34A' }}>Save</button>
                          <button onClick={() => { setEditId(null); setBuf(null) }}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: G.canvas, color: G.secondary }}>Cancel</button>
                        </div>
                      : <div className="flex items-center gap-1.5">
                          <button onClick={() => startEdit(row)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: '#EFF6FF', color: '#2563EB' }}>
                            <Pencil className="h-2.5 w-2.5" />Edit
                          </button>
                          <button onClick={() => deleteRow(id)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: '#FEF2F2', color: '#DC2626' }}>
                            <Trash2 className="h-2.5 w-2.5" />Delete
                          </button>
                        </div>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Returns ────────────────────────────────────────────────────────────────
type ReturnSubTab = 'challans' | 'deductees'

function ReturnsTab({ clients }: { clients: any[] }) {
  const [client,    setClient]    = useState('')
  const [quarter,   setQuarter]   = useState('')
  const [formType,  setFormType]  = useState<FormType | ''>('')
  const [importing, setImporting] = useState(false)
  const [loaded,    setLoaded]    = useState(false)
  const [subTab,    setSubTab]    = useState<ReturnSubTab>('challans')
  const [challans,  setChallans]  = useState<ChallanRow[]>(MOCK_CHALLANS)
  const [deductees, setDeductees] = useState<DeducteeRow[]>(MOCK_DEDUCTEES)
  const fileRef = useRef<HTMLInputElement>(null)

  const canShow = !!client && !!quarter && !!formType

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImporting(true)
    toast.info(`Importing ${f.name}…`)
    setTimeout(() => {
      setImporting(false)
      setLoaded(true)
      toast.success('TDS return data imported successfully')
    }, 1600)
  }

  const handleFormTypeChange = (v: string) => {
    setFormType(v as FormType | '')
    setLoaded(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const tdsClients = (clients as any[]).filter((c: any) => c.tds_enabled)

  const CHALLAN_COLS: { key: keyof ChallanRow; label: string; mono?: boolean }[] = [
    { key: 'challan_no',    label: 'Challan No.',    mono: true },
    { key: 'bsr',           label: 'BSR Code',       mono: true },
    { key: 'deposit_date',  label: 'Deposit Date' },
    { key: 'tan',           label: 'TAN',            mono: true },
    { key: 'amount',        label: 'Amount (₹)',     mono: true },
    { key: 'bank',          label: 'Bank Name' },
    { key: 'status',        label: 'Status' },
  ]
  const DEDUCTEE_COLS: { key: keyof DeducteeRow; label: string; mono?: boolean }[] = [
    { key: 'pan',     label: 'Deductee PAN', mono: true },
    { key: 'name',    label: 'Name' },
    { key: 'section', label: 'Section',      mono: true },
    { key: 'amount',  label: 'Amount Paid (₹)', mono: true },
    { key: 'tds',     label: 'TDS (₹)',      mono: true },
    { key: 'rate',    label: 'Rate' },
    { key: 'cert',    label: 'Certificate No.' },
  ]

  return (
    <div className="space-y-4">
      {/* Selection + Import bar */}
      <ContentCard>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Sel label="Client" value={client} onChange={v => { setClient(v); setLoaded(false) }}
              options={tdsClients.map((c: any) => ({ value: String(c.id), label: c.legal_name }))} />
            <Sel label="Quarter" value={quarter} onChange={v => { setQuarter(v); setLoaded(false) }}
              options={QUARTERS.map(q => ({ value: q, label: q }))} />
            <Sel label="Form Type" value={formType} onChange={handleFormTypeChange}
              options={FORM_TYPES.map(f => ({ value: f, label: `${FORM_META[f].full} — ${FORM_META[f].desc}` }))} />
          </div>

          {/* Import File (replaces Reset) */}
          {canShow && !loaded && (
            <div className="pt-3 flex items-center gap-3 flex-wrap" style={{ borderTop: `1px solid ${G.border}` }}>
              <input ref={fileRef} type="file" className="hidden" accept=".txt,.fvu,.xlsx,.csv"
                onChange={handleFileChange} />
              <button onClick={() => !importing && fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: importing ? G.secondary : '#0F172A', cursor: importing ? 'not-allowed' : 'pointer' }}>
                {importing
                  ? <><div className="h-3.5 w-3.5 rounded-full border-2 animate-spin"
                      style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />Importing…</>
                  : <><Upload className="h-3.5 w-3.5" />Import File</>
                }
              </button>
              <span className="text-xs" style={{ color: G.icon }}>
                Upload TDS return data (.fvu / .txt / .xlsx) for {formType} — {quarter}
              </span>
            </div>
          )}

          {/* Loaded status */}
          {loaded && (
            <div className="pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${G.border}` }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" style={{ color: '#16A34A' }} />
                <span className="text-sm font-medium" style={{ color: G.primary }}>
                  {FORM_META[formType as FormType]?.full}
                  <span className="text-xs ml-1 font-normal" style={{ color: G.icon }}>
                    ({FORM_META[formType as FormType]?.oldForm})
                  </span> — {quarter}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: '#F0FDF4', color: '#16A34A' }}>
                  {challans.length} challans · {deductees.length} deductees
                </span>
              </div>
              <OutlineBtn onClick={() => { setLoaded(false); if (fileRef.current) fileRef.current.value = '' }}>
                <RotateCcw className="h-3.5 w-3.5" />Re-import
              </OutlineBtn>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Sub-tabs: TDS Challans | Deductee Details */}
      {canShow && loaded && (
        <div className="space-y-3">
          {/* Sub-tab bar */}
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: G.white, border: `1px solid ${G.border}` }}>
            {([
              { key: 'challans',  label: 'TDS Challans' },
              { key: 'deductees', label: 'Deductee Details' },
            ] as { key: ReturnSubTab; label: string }[]).map(t => (
              <button key={t.key} onClick={() => setSubTab(t.key)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: subTab === t.key ? '#0F172A' : 'transparent',
                  color:      subTab === t.key ? '#FFFFFF' : G.secondary,
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Table card */}
          <ContentCard>
            <div className="p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold" style={{ color: G.primary }}>
                  {subTab === 'challans' ? 'TDS Challans' : 'Deductee Details'}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: G.icon }}>
                  {subTab === 'challans'
                    ? 'Review and edit challan details before filing. All fields are editable.'
                    : 'Review deductee-wise TDS deduction details. Modify and correct before submission.'}
                </p>
              </div>

              {subTab === 'challans'
                ? <EditableTable<ChallanRow>  cols={CHALLAN_COLS}  rows={challans}  onRowsChange={setChallans} />
                : <EditableTable<DeducteeRow> cols={DEDUCTEE_COLS} rows={deductees} onRowsChange={setDeductees} />
              }
            </div>
          </ContentCard>

          {/* Action buttons */}
          <div className="flex items-center gap-3 justify-end pt-1">
            <button onClick={() => toast.success('Draft saved successfully')}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
              style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', color: '#2563EB' }}>
              <Save className="h-4 w-4" />Save as Draft
            </button>
            <button onClick={() => toast.success('Return submitted for review')}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
              style={{ background: G.white, border: `1.5px solid ${G.border}`, color: G.secondary }}>
              <Send className="h-4 w-4" />Submit
            </button>
            <button onClick={() => toast.success(`${FORM_META[formType as FormType]?.full} filed successfully for ${quarter}`)}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: '#16A34A', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
              <FileCheck className="h-4 w-4" />File
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Reconciliation ─────────────────────────────────────────────────────────
type ReconFilter = 'all' | 'mismatched' | 'partial' | 'matched'

function ReconciliationTab({ clients }: { clients: any[] }) {
  const [client,   setClient]   = useState('')
  const [quarter,  setQuarter]  = useState('')
  const [formType, setFormType] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [imported, setImported] = useState(false)
  const [filter,   setFilter]   = useState<ReconFilter>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  const canImport = !!client && !!quarter && !!formType

  const filtered: ReconRow[] =
    filter === 'all'        ? RECON_ALL :
    filter === 'mismatched' ? RECON_MISMATCHED :
    filter === 'partial'    ? RECON_PARTIAL :
                              RECON_MATCHED

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setLoading(true)
    toast.info('Reconciling books TDS against portal data…')
    setTimeout(() => {
      setLoading(false)
      setImported(true)
      toast.success(`Reconciliation complete — ${RECON_MISMATCHED.length} mismatches found`)
    }, 2000)
  }

  return (
    <div className="space-y-4">
      {/* Selection */}
      <ContentCard>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Sel label="Client" value={client} onChange={setClient}
              options={(clients as any[]).filter((c: any) => c.tds_enabled)
                .map((c: any) => ({ value: String(c.id), label: c.legal_name }))} />
            <Sel label="Quarter" value={quarter} onChange={setQuarter}
              options={QUARTERS.map(q => ({ value: q, label: q }))} />
            <Sel label="Form Type" value={formType}
              onChange={v => { setFormType(v); setImported(false) }}
              options={FORM_TYPES.map(f => ({ value: f, label: `${FORM_META[f].full} — ${FORM_META[f].desc}` }))} />
          </div>

          {canImport && !imported && (
            <div className="pt-3 flex items-center gap-3" style={{ borderTop: `1px solid ${G.border}` }}>
              <input ref={fileRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFile} />
              <button
                onClick={() => !loading && fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: loading ? G.secondary : '#0F172A', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <Upload className="h-3.5 w-3.5" />
                {loading ? 'Processing…' : 'Upload Books / Ledger File'}
              </button>
              <span className="text-xs" style={{ color: G.icon }}>
                Upload TDS ledger (.xlsx) to compare against TRACES / AIS data
              </span>
            </div>
          )}

          {imported && !loading && (
            <div className="pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${G.border}` }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" style={{ color: '#16A34A' }} />
                <span className="text-sm font-medium" style={{ color: G.primary }}>
                  Reconciliation complete — {FORM_META[formType as FormType]?.full ?? formType}
                  <span className="text-xs ml-1" style={{ color: G.icon }}>
                    ({FORM_META[formType as FormType]?.oldForm ?? ''})
                  </span> {quarter}
                </span>
              </div>
              <OutlineBtn onClick={() => { setImported(false); if (fileRef.current) fileRef.current.value = '' }}>
                <RotateCcw className="h-3.5 w-3.5" />Change File
              </OutlineBtn>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Loading */}
      {loading && (
        <ContentCard>
          <div className="p-10 flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#0584C7', borderTopColor: 'transparent' }} />
            <p className="text-sm font-medium" style={{ color: G.primary }}>Reconciling TDS data…</p>
            <p className="text-xs" style={{ color: G.icon }}>Matching books deductions against TRACES / AIS records</p>
          </div>
        </ContentCard>
      )}

      {/* Results */}
      {imported && !loading && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {([
              { key: 'mismatched', label: 'Mismatched',        count: RECON_MISMATCHED.length, color: '#DC2626', bg: '#FEF2F2', Icon: AlertCircle },
              { key: 'partial',    label: 'Partially Matched', count: RECON_PARTIAL.length,    color: '#D97706', bg: '#FFFBEB', Icon: Minus },
              { key: 'matched',    label: 'Matched',           count: RECON_MATCHED.length,    color: '#16A34A', bg: '#F0FDF4', Icon: Check },
            ] as const).map(s => (
              <button
                key={s.key}
                onClick={() => setFilter(s.key as ReconFilter)}
                className="rounded-2xl border p-4 text-left transition-all"
                style={{
                  background: filter === s.key ? s.bg : G.white,
                  borderColor: filter === s.key ? s.color : G.border,
                  boxShadow: filter === s.key ? `0 0 0 1.5px ${s.color}40` : '0 1px 3px rgba(15,23,42,0.06)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <s.Icon className="h-4 w-4" style={{ color: s.color }} />
                  <span className="text-xs font-semibold" style={{ color: G.secondary }}>{s.label}</span>
                </div>
                <p className="text-3xl font-bold tabular-nums" style={{ color: s.color }}>{s.count}</p>
                <p className="text-[10px] mt-1" style={{ color: G.icon }}>transactions</p>
              </button>
            ))}
          </div>

          {/* Comparison table */}
          <ContentCard>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: G.border }}>
                  {(['all', 'mismatched', 'partial', 'matched'] as ReconFilter[]).map((f, i, arr) => {
                    const cnt = f === 'all' ? RECON_ALL.length : f === 'mismatched' ? RECON_MISMATCHED.length : f === 'partial' ? RECON_PARTIAL.length : RECON_MATCHED.length
                    return (
                      <button key={f} onClick={() => setFilter(f)}
                        className="px-3 py-1.5 text-xs font-semibold capitalize transition-colors"
                        style={{
                          background: filter === f ? '#0F172A' : G.white,
                          color:      filter === f ? '#FFFFFF' : G.secondary,
                          borderRight: i < arr.length - 1 ? `1px solid ${G.border}` : undefined,
                        }}
                      >
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({cnt})
                      </button>
                    )
                  })}
                </div>
                <OutlineBtn onClick={() => toast.success('Report exported')}>
                  <Download className="h-3.5 w-3.5" />Export
                </OutlineBtn>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: G.canvas }}>
                      {['#', 'Voucher', 'Date', 'PAN', 'Party', 'Amount Paid (₹)', 'TDS Books (₹)', 'TDS Challan (₹)', 'AIS / 26AS (₹)', 'Status'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold border-b whitespace-nowrap"
                          style={{ color: G.secondary, borderColor: G.border }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={r.voucher} style={{ borderBottom: `1px solid ${G.border}` }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G.canvas}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <td className="px-3 py-2.5 font-mono" style={{ color: G.icon }}>{i + 1}</td>
                        <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: G.primary }}>{r.voucher}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: G.secondary }}>{r.date}</td>
                        <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: G.secondary }}>{r.pan}</td>
                        <td className="px-3 py-2.5 font-medium" style={{ color: G.primary }}>{r.party}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: G.secondary }}>₹{r.paid}</td>
                        <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: G.primary }}>₹{r.tdsBooks}</td>
                        <td className="px-3 py-2.5 font-mono"
                          style={{ color: r.status === 'mismatched' && r.tdsChallan !== r.tdsBooks ? '#D97706' : G.secondary }}>
                          ₹{r.tdsChallan}
                        </td>
                        <td className="px-3 py-2.5 font-mono"
                          style={{ color: r.ais === '—' ? '#DC2626' : G.secondary }}>
                          {r.ais === '—' ? <span style={{ color: '#DC2626', fontWeight: 600 }}>Not in AIS</span> : `₹${r.ais}`}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                            style={reconStatusStyle(r.status)}>
                            <ReconIcon status={r.status} />
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={10} className="px-3 py-8 text-center text-sm" style={{ color: G.icon }}>No records</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </ContentCard>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════
export function TDSPage() {
  const [activeTab, setActiveTab] = useState<MainTab>('overview')

  const { data: returns = [] } = useQuery({
    queryKey: ['tds-returns'],
    queryFn: () => mockComplianceApi.tdsReturns().then(r => r.data),
  })
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientsApi.list().then(r => r.data),
  })

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto" style={{ background: G.canvas }}>
      <PageHeader title="TDS Module" sub="Tax Deducted at Source — returns, credentials and reconciliation">
        <OutlineBtn onClick={() => toast.success('Refreshed')}><RefreshCw className="h-3.5 w-3.5" /></OutlineBtn>
      </PageHeader>

      {/* Tab bar */}
      <div className="mb-5 flex gap-1 p-1 rounded-2xl w-fit"
        style={{ background: G.white, border: `1px solid ${G.border}` }}>
        {MAIN_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn('px-5 py-2 rounded-xl text-sm font-semibold transition-all')}
            style={{
              background: activeTab === t.key ? '#0F172A' : 'transparent',
              color:      activeTab === t.key ? '#FFFFFF' : G.secondary,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview'       && <OverviewTab        returns={returns as any[]} />}
      {activeTab === 'clients'        && <ClientsTab         clients={clients as any[]} />}
      {activeTab === 'returns'        && <ReturnsTab         clients={clients as any[]} />}
      {activeTab === 'reconciliation' && <ReconciliationTab  clients={clients as any[]} />}
    </div>
  )
}
