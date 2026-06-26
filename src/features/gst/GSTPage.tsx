/**
 * GST Module v2
 * Tabs: Overview | Clients | Returns | Reconciliation
 */
import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, CheckCircle2, AlertTriangle, Clock, Upload,
  Eye, EyeOff, RefreshCw, Check, AlertCircle,
  Minus, RotateCcw, ChevronDown, Plus, Pencil, Trash2,
  BarChart2, Send, Save, ArrowLeftRight, X, Search,
} from 'lucide-react'
import { mockComplianceApi } from '@/mock/api'
import { clientsApi } from '@/shared/api/clients'
import { toast } from 'sonner'
import {
  G, PageHeader, OutlineBtn, ContentCard,
} from '@/shared/components/GrayKpi'
import { cn } from '@/shared/components/cn'

// ─── Constants ───────────────────────────────────────────────────────────────
type MainTab = 'overview' | 'clients' | 'returns' | 'reconciliation'
const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'clients', label: 'Clients' },
  { key: 'returns', label: 'Returns' },
  { key: 'reconciliation', label: 'Reconciliation' },
]

const RETURN_TYPES = ['GSTR-1', 'GSTR-1A', 'GSTR-3B', 'GSTR-9', 'GSTR-9C'] as const
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
const YEARS = ['2024-25', '2025-26', '2026-27']

// Valid statuses (only 3 states)
type ReturnStatus = 'save_draft' | 'submitted' | 'filed'
function mapStatus(raw: string): ReturnStatus {
  if (raw === 'filed') return 'filed'
  if (raw === 'pending' || raw === 'in_review') return 'submitted'
  return 'save_draft'
}
function StatusPill({ status }: { status: ReturnStatus }) {
  const cfg = {
    save_draft: { label: 'Save Draft', bg: '#F1F5F9', color: '#64748B' },
    submitted: { label: 'Submitted', bg: '#EFF6FF', color: '#2563EB' },
    filed: { label: 'Filed', bg: '#F0FDF4', color: '#16A34A' },
  }[status]
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {status === 'filed' && <Check className="h-2.5 w-2.5" />}
      {status === 'submitted' && <Send className="h-2.5 w-2.5" />}
      {status === 'save_draft' && <Save className="h-2.5 w-2.5" />}
      {cfg.label}
    </span>
  )
}

// Mock GSTIN data per client
const CLIENT_GSTINS: Record<string, string[]> = {
  '1': ['27AABCS1429B1ZB', '29AABCS1429B1ZK'],
  '2': ['29AADCB2230M1ZV'],
  '3': ['07AAECR1234F1ZQ', '27AAECR1234F1ZM'],
  '4': ['33AADPH5621K1ZM'],
  '5': ['08AAAPA1234A1ZT'],
}

// Mock portal credentials
const PORTAL_CREDS: Record<number, { username: string; password: string }> = {
  1: { username: 'sunrisetex27', password: 'Sun@Tx2024!' },
  2: { username: 'bluesky29kn', password: 'Blue#9sky@' },
  3: { username: 'redwood07dl', password: 'Rw@2026#1' },
  4: { username: 'grphm33mh', password: 'Green%Ph5!' },
  5: { username: 'apexauto24', password: 'Ap3x@Auto9' },
}

// ─── Sheet types ─────────────────────────────────────────────────────────────
type SheetDef = { key: string; section: string; label: string; cols: string[]; rows: string[][] }

// GSTR-1 / GSTR-1A sheets
const GSTR1_SHEETS: SheetDef[] = [
  {
    key: 'b2b', section: '4A, 4B, 6B, 6C', label: 'B2B, SEZ, DE Invoices',
    cols: ['GSTIN', 'Receiver', 'Inv No', 'Inv Date', 'Inv Value (₹)', 'PoS', 'Rate', 'Taxable (₹)', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)'],
    rows: [
      ['29AADCB2230M1ZV', 'BlueSky Software', 'INV-2026-042', '05-Apr-26', '1,18,000', '29-KA', '18%', '1,00,000', '18,000', '—', '—'],
      ['27AABCS1429B1ZB', 'Sunrise Textiles', 'INV-2026-043', '12-Apr-26', '59,000', '27-GJ', '5%', '56,190', '2,810', '—', '—'],
      ['07AAECR1234F1ZQ', 'Redwood Constructions', 'INV-2026-044', '18-Apr-26', '2,36,000', '07-DL', '18%', '2,00,000', '36,000', '—', '—'],
    ],
  },
  {
    key: 'b2cl', section: '5', label: 'B2C (Large) Invoices',
    cols: ['Inv No', 'Inv Date', 'Inv Value (₹)', 'Place of Supply', 'Rate', 'Taxable (₹)', 'IGST (₹)', 'Applicable Tax'],
    rows: [
      ['INV-2026-051', '03-Apr-26', '1,06,200', '27-MH', '18%', '90,000', '16,200', 'Y'],
      ['INV-2026-052', '15-Apr-26', '2,12,000', '24-GJ', '12%', '1,89,285', '22,714', 'N'],
    ],
  },
  {
    key: 'b2cs', section: '7', label: 'B2C (Others)',
    cols: ['Type', 'Place of Supply', 'Rate', 'Taxable (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Cess (₹)'],
    rows: [
      ['OE', '24-GJ', '5%', '4,52,000', '11,300', '11,300', '—', '—'],
      ['OE', '24-GJ', '12%', '2,10,000', '12,600', '12,600', '—', '—'],
      ['OE', '27-MH', '18%', '1,85,000', '—', '—', '33,300', '—'],
    ],
  },
  {
    key: 'cdnr', section: '9B (R)', label: 'CDN — Registered',
    cols: ['GSTIN', 'Receiver', 'Note No', 'Note Date', 'Type', 'PoS', 'Taxable (₹)', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)'],
    rows: [
      ['29AADCB2230M1ZV', 'BlueSky Software', 'CN-2026-007', '10-Apr-26', 'Credit', '29-KA', '5,000', '900', '—', '—'],
      ['27AABCS1429B1ZB', 'Sunrise Textiles', 'DN-2026-002', '20-Apr-26', 'Debit', '27-GJ', '2,500', '125', '—', '—'],
    ],
  },
  {
    key: 'cdnur', section: '9B (U)', label: 'CDN — Unregistered',
    cols: ['UR Type', 'Note No', 'Note Date', 'Note Value (₹)', 'Place of Supply', 'Rate', 'Taxable (₹)', 'IGST (₹)'],
    rows: [],
  },
  {
    key: 'exemp', section: '8A–8D', label: 'Nil / Exempt / Non-GST',
    cols: ['Description', 'Nature', 'Inter-State (₹)', 'Intra-State (₹)'],
    rows: [
      ['Nil Rated Supplies', 'Outward', '—', '45,000'],
      ['Exempted (other than nil rated)', 'Outward', '—', '1,20,000'],
      ['Non-GST Outward Supplies', 'Outward', '15,000', '—'],
    ],
  },
  {
    key: 'hsn', section: '12', label: 'HSN-wise Summary',
    cols: ['HSN', 'Description', 'UQC', 'Qty', 'Total Value (₹)', 'Rate', 'Taxable (₹)', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)', 'Cess (₹)'],
    rows: [
      ['6006', 'Knitted fabric', 'MTR', '1,200', '5,40,000', '5%', '5,14,285', '25,714', '—', '—', '—'],
      ['8471', 'Computers & parts', 'NOS', '15', '3,75,000', '18%', '3,17,796', '57,203', '—', '—', '—'],
      ['3004', 'Pharmaceutical goods', 'NOS', '500', '2,25,000', '12%', '2,00,892', '24,107', '—', '—', '—'],
    ],
  },
  {
    key: 'docs', section: '13', label: 'Documents Issued',
    cols: ['Nature of Document', 'Sr No From', 'Sr No To', 'Total Issued', 'Cancelled'],
    rows: [
      ['Invoices — Outward Supply', 'INV-2026-001', 'INV-2026-058', '58', '3'],
      ['Debit Note', 'DN-2026-001', 'DN-2026-002', '2', '0'],
      ['Credit Note', 'CN-2026-001', 'CN-2026-007', '7', '1'],
      ['Bill of Supply', 'BOS-2026-001', 'BOS-2026-018', '18', '0'],
    ],
  },
]

// GSTR-3B sheets
const GSTR3B_SHEETS: SheetDef[] = [
  {
    key: '3_1', section: '3.1', label: 'Outward Supplies',
    cols: ['Nature of Supplies', 'Total Taxable (₹)', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)', 'Cess (₹)'],
    rows: [
      ['Taxable supplies (excl. zero rated/nil/exempt)', '9,47,475', '82,027', '32,025', '32,025', '—'],
      ['Zero rated (taxable) supplies', '—', '—', '—', '—', '—'],
      ['Nil / Exempt supplies', '1,65,000', '—', '—', '—', '—'],
      ['Inward supplies (RCM)', '—', '—', '—', '—', '—'],
      ['Non-GST outward supplies', '15,000', '—', '—', '—', '—'],
    ],
  },
  {
    key: '4', section: '4', label: 'Eligible ITC',
    cols: ['Details', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)', 'Cess (₹)'],
    rows: [
      ['ITC on Import of Goods', '—', '—', '—', '—'],
      ['ITC on Import of Services', '—', '—', '—', '—'],
      ['ITC from ISD', '—', '—', '—', '—'],
      ['All Other ITC', '1,80,000', '28,000', '28,000', '—'],
    ],
  },
  {
    key: '5', section: '5', label: 'Exempt / Nil / Non-GST',
    cols: ['Details', 'Inter-State (₹)', 'Intra-State (₹)'],
    rows: [
      ['Nil Rated Supplies', '—', '45,000'],
      ['Exempted Supplies', '—', '1,20,000'],
      ['Non-GST Supplies', '15,000', '—'],
    ],
  },
  {
    key: '6_1', section: '6.1', label: 'Tax Payment',
    cols: ['Tax Head', 'Tax Payable (₹)', 'ITC Paid (₹)', 'Cash Paid (₹)', 'Additional Cash Required (₹)'],
    rows: [
      ['IGST', '82,027', '82,027', '—', '—'],
      ['CGST', '32,025', '32,025', '—', '—'],
      ['SGST/UTGST', '32,025', '32,025', '—', '—'],
      ['Cess', '—', '—', '—', '—'],
      ['Interest', '—', '—', '—', '—'],
      ['Late Fee', '—', '—', '—', '—'],
    ],
  },
]

const ANNUAL_SHEETS: SheetDef[] = [
  {
    key: 'summary', section: 'Pt.II', label: 'Details of Outward & Inward Supplies',
    cols: ['Particulars', 'As per Books (₹)', 'As per Returns (₹)', 'Difference (₹)'],
    rows: [
      ['Total Outward Taxable Supplies', '1,20,00,000', '1,18,50,000', '1,50,000'],
      ['Total ITC Availed', '8,40,000', '8,10,000', '30,000'],
      ['Tax Paid', '12,60,000', '12,60,000', '—'],
    ],
  },
]

function getSheetsForType(rt: string): SheetDef[] {
  if (rt === 'GSTR-1' || rt === 'GSTR-1A') return GSTR1_SHEETS
  if (rt === 'GSTR-3B') return GSTR3B_SHEETS
  return ANNUAL_SHEETS
}

// ─── Reconciliation types ────────────────────────────────────────────────────
type ReconCategory = 'gstr_vs_gstr' | 'books_vs_gstr'

interface ReconType {
  key: string
  label: string
  category: ReconCategory
}

const RECON_TYPES: ReconType[] = [
  { key: 'gstr3b_vs_gstr1', label: 'GSTR-3B vs GSTR-1', category: 'gstr_vs_gstr' },
  { key: 'gstr3b_vs_gstr2b', label: 'GSTR-3B vs GSTR-2B', category: 'gstr_vs_gstr' },
  { key: 'gstr2a_vs_gstr3b', label: 'GSTR-2A vs GSTR-3B', category: 'gstr_vs_gstr' },
  { key: 'gstr2a_vs_gstr2b', label: 'GSTR-2A vs GSTR-2B', category: 'gstr_vs_gstr' },
  { key: 'books_vs_gstr1', label: 'Books vs GSTR-1', category: 'books_vs_gstr' },
  { key: 'books_vs_gstr2b', label: 'Books vs GSTR-2B', category: 'books_vs_gstr' },
  { key: 'gstr2a_vs_books', label: 'Books vs GSTR-2A', category: 'books_vs_gstr' },
  { key: 'gstr3b_vs_books', label: 'Books vs GSTR-3B', category: 'books_vs_gstr' },
]

// ─── Recon mock rows ─────────────────────────────────────────────────────────
type ReconRow = {
  id: string; inv: string; date: string; gstin: string; party: string
  books: string; portal: string; diff: string
  status: 'mismatched' | 'partial' | 'matched'
}

const MOCK_RECON: ReconRow[] = [
  { id: 'r1', inv: 'INV-2026-039', date: '28-Mar-26', gstin: '27AABCS1429B1ZB', party: 'Sunrise Textiles', books: '75,000', portal: '70,000', diff: '5,000', status: 'mismatched' },
  { id: 'r2', inv: 'INV-2026-040', date: '31-Mar-26', gstin: '29AADCB2230M1ZV', party: 'BlueSky Software', books: '2,00,000', portal: '1,80,000', diff: '20,000', status: 'mismatched' },
  { id: 'r3', inv: 'INV-2026-047', date: '09-Apr-26', gstin: '07AAECR1234F1ZQ', party: 'Redwood Constructions', books: '3,50,000', portal: '—', diff: '3,50,000', status: 'mismatched' },
  { id: 'r4', inv: 'INV-2026-051', date: '03-Apr-26', gstin: '33AADPH5621K1ZM', party: 'Green Pharma', books: '90,000', portal: '89,500', diff: '500', status: 'partial' },
  { id: 'r5', inv: 'INV-2026-055', date: '22-Apr-26', gstin: '08AAAPA1234A1ZT', party: 'Apex Auto Parts', books: '1,50,000', portal: '1,48,000', diff: '2,000', status: 'partial' },
  { id: 'r6', inv: 'INV-2026-042', date: '05-Apr-26', gstin: '29AADCB2230M1ZV', party: 'BlueSky Software', books: '1,00,000', portal: '1,00,000', diff: '—', status: 'matched' },
  { id: 'r7', inv: 'INV-2026-043', date: '12-Apr-26', gstin: '27AABCS1429B1ZB', party: 'Sunrise Textiles', books: '56,190', portal: '56,190', diff: '—', status: 'matched' },
  { id: 'r8', inv: 'INV-2026-044', date: '18-Apr-26', gstin: '07AAECR1234F1ZQ', party: 'Redwood Constructions', books: '2,00,000', portal: '2,00,000', diff: '—', status: 'matched' },
]

// Mock: which GSTR data is "available" in the system for a given client
const AVAILABLE_GSTR_DATA: Record<string, string[]> = {
  '1': ['GSTR-1', 'GSTR-3B'],
  '2': ['GSTR-1', 'GSTR-3B', 'GSTR-2B'],
  '3': ['GSTR-1'],
  '4': ['GSTR-3B'],
  '5': ['GSTR-1', 'GSTR-3B', 'GSTR-2B'],
}

// ══════════════════════════════════════════════════════════════════════════
// Shared Atoms
// ══════════════════════════════════════════════════════════════════════════
function Sel({ label, value, onChange, options, disabled, className: extraClass }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; disabled?: boolean; className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1 min-w-0', extraClass)}>
      <label className="text-[10px] font-semibold uppercase tracking-wider truncate"
        style={{ color: G.secondary }}>{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
          className="appearance-none w-full rounded-xl border px-3 py-2 pr-8 text-sm outline-none transition-colors disabled:opacity-50"
          style={{ background: G.white, borderColor: G.border, color: value ? G.primary : G.icon }}>
          <option value="">— Select —</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
          style={{ color: G.icon }} />
      </div>
    </div>
  )
}

function SectionTile({ sheet, active, onClick }: { sheet: SheetDef; active: boolean; onClick: () => void }) {
  const count = sheet.rows.length
  return (
    <button onClick={onClick} className="rounded-xl border text-left transition-all w-full"
      style={{
        background: G.white,
        borderColor: active ? '#0584C7' : G.border,
        boxShadow: active ? '0 0 0 2px rgba(5,132,199,0.2)' : '0 1px 3px rgba(15,23,42,0.06)',
      }}>
      <div className="px-2.5 py-2 rounded-t-xl flex flex-col justify-center"
        style={{ background: '#1E3A5F', minHeight: 50 }}>
        <p className="text-[9px] font-bold text-white leading-tight">{sheet.section}</p>
        <p className="text-[8.5px] leading-tight mt-0.5" style={{ color: '#93C5FD' }}>{sheet.label}</p>
      </div>
      <div className="px-2.5 py-2 flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0"
          style={{ color: count > 0 ? '#16A34A' : G.icon }} />
        <span className="text-sm font-bold tabular-nums"
          style={{ color: count > 0 ? G.primary : G.icon }}>{count}</span>
      </div>
    </button>
  )
}

// SheetTable with Actions column + Add Record
function SheetTable({ sheet, showActions = false, onAddRecord }: {
  sheet: SheetDef; showActions?: boolean; onAddRecord?: () => void
}) {
  const [rows, setRows] = useState<string[][]>(sheet.rows)
  const [editing, setEditing] = useState<number | null>(null)
  const [editBuf, setEditBuf] = useState<string[]>([])

  const startEdit = (ri: number) => { setEditing(ri); setEditBuf([...rows[ri]]) }
  const saveEdit = (ri: number) => { setRows(r => r.map((row, i) => i === ri ? editBuf : row)); setEditing(null) }
  const deleteRow = (ri: number) => { setRows(r => r.filter((_, i) => i !== ri)); toast.info('Record deleted') }

  if (rows.length === 0 && !showActions) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <CheckCircle2 className="h-8 w-8" style={{ color: G.icon }} />
        <p className="text-sm font-medium" style={{ color: G.secondary }}>No records in this section</p>
      </div>
    )
  }

  return (
    <div>
      {showActions && (
        <div className="flex justify-end mb-2">
          <button onClick={onAddRecord ?? (() => toast.info('Add record dialog'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
            style={{ background: '#0584C7' }}>
            <Plus className="h-3.5 w-3.5" />Add Record
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ background: G.canvas }}>
              <th className="text-left px-3 py-2 text-[10px] font-semibold border-b"
                style={{ color: G.secondary, borderColor: G.border }}>#</th>
              {sheet.cols.map(c => (
                <th key={c} className="text-left px-3 py-2 text-[10px] font-semibold border-b whitespace-nowrap"
                  style={{ color: G.secondary, borderColor: G.border }}>{c}</th>
              ))}
              {showActions && (
                <th className="text-left px-3 py-2 text-[10px] font-semibold border-b whitespace-nowrap"
                  style={{ color: G.secondary, borderColor: G.border }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={sheet.cols.length + (showActions ? 2 : 1)}
                  className="px-3 py-8 text-center text-xs" style={{ color: G.icon }}>
                  No records — click Add Record to create entries
                </td>
              </tr>
            )}
            {rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: `1px solid ${G.border}` }}
                onMouseEnter={e => { if (editing !== ri) (e.currentTarget as HTMLElement).style.background = G.canvas }}
                onMouseLeave={e => { if (editing !== ri) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <td className="px-3 py-2 font-mono text-[10px]" style={{ color: G.icon }}>{ri + 1}</td>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 whitespace-nowrap">
                    {editing === ri
                      ? <input value={editBuf[ci] ?? ''} onChange={e => setEditBuf(b => b.map((v, i) => i === ci ? e.target.value : v))}
                        className="w-full min-w-[60px] rounded px-1.5 py-0.5 text-xs outline-none"
                        style={{ border: '1px solid #0584C7', background: '#EFF8FF', color: G.primary }} />
                      : <span style={{
                        color: ci === 0 ? G.primary : G.secondary,
                        fontWeight: ci === 0 ? 500 : 400,
                        fontFamily: ci > 3 ? 'monospace' : 'inherit',
                      }}>{cell}</span>
                    }
                  </td>
                ))}
                {showActions && (
                  <td className="px-3 py-2">
                    {editing === ri
                      ? <div className="flex items-center gap-1">
                        <button onClick={() => saveEdit(ri)}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                          style={{ background: '#16A34A' }}>Save</button>
                        <button onClick={() => setEditing(null)}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: G.canvas, color: G.secondary }}>Cancel</button>
                      </div>
                      : <div className="flex items-center gap-1.5">
                        <button onClick={() => startEdit(ri)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: '#EFF6FF', color: '#2563EB' }}>
                          <Pencil className="h-2.5 w-2.5" />Edit
                        </button>
                        <button onClick={() => deleteRow(ri)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: '#FEF2F2', color: '#DC2626' }}>
                          <Trash2 className="h-2.5 w-2.5" />Delete
                        </button>
                      </div>
                    }
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Summary View Component
function SummaryView({ returnType, period, onClose }: { returnType: string; period: string; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold" style={{ color: G.primary }}>Return Summary — {returnType}</h3>
          <p className="text-xs mt-0.5" style={{ color: G.icon }}>{period} · Consolidated view before filing</p>
        </div>
        <button onClick={onClose} className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold"
          style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
          <X className="h-3.5 w-3.5" />Close Summary
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoices', value: '58', sub: 'B2B + B2C + Exports' },
          { label: 'Total Taxable Value', value: '₹14,47,475', sub: 'across all sections' },
          { label: 'Total Tax Amount', value: '₹1,46,077', sub: 'IGST + CGST + SGST' },
          { label: 'Total Invoice Value', value: '₹15,93,552', sub: 'incl. taxes' },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-3"
            style={{ background: G.white, borderColor: G.border }}>
            <p className="text-[10px] font-semibold mb-1" style={{ color: G.secondary }}>{c.label}</p>
            <p className="text-lg font-bold tabular-nums" style={{ color: G.primary }}>{c.value}</p>
            <p className="text-[9px] mt-0.5" style={{ color: G.icon }}>{c.sub}</p>
          </div>
        ))}
      </div>
      <ContentCard>
        <div className="p-4">
          <h4 className="text-xs font-bold mb-3" style={{ color: G.primary }}>Tax Head Breakup</h4>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ background: G.canvas }}>
                {['Tax Head', 'Taxable Value (₹)', 'Tax Rate', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)', 'Cess (₹)', 'Total Tax (₹)'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold border-b whitespace-nowrap"
                    style={{ color: G.secondary, borderColor: G.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['5%', '5,14,285', '5%', '25,714', '—', '—', '—', '25,714'],
                ['12%', '2,00,892', '12%', '24,107', '—', '—', '—', '24,107'],
                ['18%', '6,17,796', '18%', '82,027', '32,025', '32,025', '—', '1,46,077'],
                ['28%', '—', '28%', '—', '—', '—', '—', '—'],
                ['Total', '13,32,973', '—', '1,31,848', '32,025', '32,025', '—', '1,95,898'],
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${G.border}`, fontWeight: i === 4 ? 700 : 400 }}>
                  {r.map((c, j) => (
                    <td key={j} className="px-3 py-2 whitespace-nowrap"
                      style={{ color: G.primary, fontFamily: j > 0 ? 'monospace' : 'inherit' }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
      <ContentCard>
        <div className="p-4">
          <h4 className="text-xs font-bold mb-3" style={{ color: G.primary }}>HSN/SAC-wise Summary</h4>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ background: G.canvas }}>
                {['HSN/SAC', 'Description', 'UQC', 'Qty', 'Taxable (₹)', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)', 'Cess (₹)'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold border-b whitespace-nowrap"
                    style={{ color: G.secondary, borderColor: G.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['6006', 'Knitted fabric', 'MTR', '1,200', '5,14,285', '25,714', '—', '—', '—'],
                ['8471', 'Computers & parts', 'NOS', '15', '3,17,796', '57,203', '—', '—', '—'],
                ['3004', 'Pharmaceutical goods', 'NOS', '500', '2,00,892', '24,107', '—', '—', '—'],
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${G.border}` }}>
                  {r.map((c, j) => (
                    <td key={j} className="px-3 py-2 whitespace-nowrap"
                      style={{ color: j === 0 ? G.primary : G.secondary, fontWeight: j < 2 ? 500 : 400, fontFamily: j > 2 ? 'monospace' : 'inherit' }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Tab: Overview
// ══════════════════════════════════════════════════════════════════════════
function OverviewTab({ returns }: { returns: any[] }) {
  const mapped = (returns as any[]).map(r => ({ ...r, _status: mapStatus(r.status) }))
  const stats = {
    total: mapped.length,
    filed: mapped.filter(r => r._status === 'filed').length,
    submitted: mapped.filter(r => r._status === 'submitted').length,
    save_draft: mapped.filter(r => r._status === 'save_draft').length,
  }

  const byType = RETURN_TYPES.map(rt => {
    const rts = mapped.filter(r => r.return_type === rt)
    return {
      type: rt,
      total: rts.length,
      filed: rts.filter(r => r._status === 'filed').length,
      submitted: rts.filter(r => r._status === 'submitted').length,
      draft: rts.filter(r => r._status === 'save_draft').length,
    }
  }).filter(r => r.total > 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { label: 'Total Returns', value: stats.total, icon: FileText, color: G.icon, bg: G.canvas },
          { label: 'Filed', value: stats.filed, icon: CheckCircle2, color: '#16A34A', bg: '#F0FDF4' },
          { label: 'Submitted', value: stats.submitted, icon: Send, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Save Draft', value: stats.save_draft, icon: Save, color: '#D97706', bg: '#FFFBEB' },
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

      <ContentCard>
        <div className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: G.primary }}>Return-type Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: G.canvas }}>
                  {['Return Type', 'Total', 'Filed', 'Submitted', 'Save Draft', 'Completion'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold border-b"
                      style={{ color: G.secondary, borderColor: G.border }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byType.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: G.icon }}>No returns data</td></tr>
                  : byType.map(r => {
                    const pct = r.total ? Math.round((r.filed / r.total) * 100) : 0
                    return (
                      <tr key={r.type} style={{ borderBottom: `1px solid ${G.border}` }}>
                        <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: G.primary }}>{r.type}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: G.primary }}>{r.total}</td>
                        <td className="px-4 py-3" style={{ color: '#16A34A', fontWeight: 500 }}>{r.filed}</td>
                        <td className="px-4 py-3" style={{ color: '#2563EB' }}>{r.submitted}</td>
                        <td className="px-4 py-3" style={{ color: '#D97706' }}>{r.draft}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full" style={{ background: G.canvas }}>
                              <div className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: pct >= 80 ? '#16A34A' : pct >= 50 ? '#2563EB' : '#D97706' }} />
                            </div>
                            <span className="text-xs font-semibold w-8 text-right tabular-nums"
                              style={{ color: G.secondary }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${G.border}` }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: G.primary }}>All Returns</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ background: G.canvas }}>
                    {['Client', 'Return', 'Period', 'Due Date', 'Status', 'Assigned To', 'Filed On'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold border-b whitespace-nowrap"
                        style={{ color: G.secondary, borderColor: G.border }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mapped.map(r => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${G.border}` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G.canvas}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td className="px-4 py-2.5 font-semibold text-xs" style={{ color: G.primary }}>{r.client_name}</td>
                      <td className="px-4 py-2.5"><span className="font-mono text-xs font-semibold">{r.return_type}</span></td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: G.secondary }}>{r.period}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: G.primary }}>{r.due_date ?? '—'}</td>
                      <td className="px-4 py-2.5"><StatusPill status={r._status} /></td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: G.secondary }}>{r.assigned_to ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: G.secondary }}>{r.filed_date ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ContentCard>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Tab: Clients
// ══════════════════════════════════════════════════════════════════════════
function ClientsTab({ clients }: { clients: any[] }) {
  const [shown, setShown] = useState<Set<number>>(new Set())
  const toggle = (id: number) =>
    setShown(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const gstClients = (clients as any[]).filter(c => c.gst_enabled)

  return (
    <ContentCard>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: G.primary }}>GST Portal Credentials</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: G.canvas, color: G.secondary }}>
            {gstClients.length} active clients
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: G.canvas }}>
                {['S.No', 'Client Name', 'GSTIN', 'State', 'Portal Username', 'Portal Password', 'GST Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold border-b whitespace-nowrap"
                    style={{ color: G.secondary, borderColor: G.border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gstClients.map((c: any, idx: number) => {
                const creds = PORTAL_CREDS[c.id as number] ?? { username: '—', password: '—' }
                const visible = shown.has(c.id as number)
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${G.border}` }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G.canvas}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: G.icon }}>{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: G.primary }}>{c.legal_name}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: G.primary }}>{c.gstin ?? '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: G.secondary }}>{c.state ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: G.secondary }}>{creds.username}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs" style={{ color: G.primary }}>
                          {visible ? creds.password : '•'.repeat(10)}
                        </span>
                        <button onClick={() => toggle(c.id as number)}
                          className="flex-shrink-0 rounded-md p-1" style={{ background: G.canvas }}>
                          {visible
                            ? <EyeOff className="h-3.5 w-3.5" style={{ color: G.secondary }} />
                            : <Eye className="h-3.5 w-3.5" style={{ color: G.secondary }} />}
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

// ══════════════════════════════════════════════════════════════════════════
// Tab: Returns
// ══════════════════════════════════════════════════════════════════════════
type PrepMode = 'none' | 'nil' | 'online' | 'import'

function ReturnsTab({ clients }: { clients: any[] }) {
  const [client, setClient] = useState('')
  const [gstin, setGstin] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [returnType, setReturnType] = useState('')
  const [prepMode, setPrepMode] = useState<PrepMode>('none')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [activeSheet, setActiveSheet] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const gstinOptions = client ? (CLIENT_GSTINS[client] ?? []) : []
  const canFilter = !!client && !!gstin
  const canPrepare = canFilter && !!year && !!month && !!returnType
  const sheets = returnType ? getSheetsForType(returnType) : []
  const selSheet = sheets.find(s => s.key === activeSheet) ?? sheets[0]
  const period = `${month} ${year}`

  const handleClientChange = (v: string) => { setClient(v); setGstin(''); resetPrep() }
  const handleTypeChange = (v: string) => { setReturnType(v); resetPrep() }
  const resetPrep = () => {
    setPrepMode('none'); setLoaded(false); setActiveSheet(''); setShowSummary(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setLoading(true)
    toast.info(`Importing ${f.name}…`)
    setTimeout(() => {
      setLoading(false); setLoaded(true); setActiveSheet(sheets[0]?.key ?? '')
      toast.success(`${returnType} data loaded — ${sheets.length} sections`)
    }, 1800)
  }

  const handlePrepOnline = () => {
    setLoaded(true); setActiveSheet(sheets[0]?.key ?? '')
    toast.info('Online preparation mode — enter data manually')
  }

  return (
    <div className="space-y-4">
      <ContentCard>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Sel label="Client" value={client} onChange={handleClientChange}
              options={(clients as any[]).filter(c => c.gst_enabled).map(c => ({ value: String(c.id), label: c.legal_name }))} />
            <Sel label="GSTIN" value={gstin} onChange={setGstin} disabled={!client}
              options={gstinOptions.map(g => ({ value: g, label: g }))} />
            <Sel label="Financial Year" value={year} onChange={setYear} disabled={!canFilter}
              options={YEARS.map(y => ({ value: y, label: y }))} />
            <Sel label="Month" value={month} onChange={setMonth} disabled={!canFilter}
              options={MONTHS.map(m => ({ value: m, label: m }))} />
            <Sel label="Return Type" value={returnType} onChange={handleTypeChange} disabled={!canFilter}
              options={RETURN_TYPES.map(r => ({ value: r, label: r }))} />
          </div>

          {canPrepare && !loaded && (
            <div className="flex flex-wrap items-center gap-3 pt-3" style={{ borderTop: `1px solid ${G.border}` }}>
              <label className="flex items-center gap-2 cursor-pointer select-none rounded-xl px-3 py-2 transition-all"
                style={{
                  background: prepMode === 'nil' ? '#FFFBEB' : G.canvas,
                  border: `1.5px solid ${prepMode === 'nil' ? '#D97706' : G.border}`,
                }}>
                <input type="checkbox" checked={prepMode === 'nil'}
                  onChange={e => setPrepMode(e.target.checked ? 'nil' : 'none')}
                  className="w-3.5 h-3.5 accent-amber-500" />
                <span className="text-xs font-semibold"
                  style={{ color: prepMode === 'nil' ? '#D97706' : G.secondary }}>Fill Nil Return</span>
              </label>

              <button onClick={() => { setPrepMode('online'); handlePrepOnline() }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  background: prepMode === 'online' ? '#EFF6FF' : G.canvas,
                  border: `1.5px solid ${prepMode === 'online' ? '#2563EB' : G.border}`,
                  color: prepMode === 'online' ? '#2563EB' : G.secondary,
                }}>
                <Pencil className="h-3.5 w-3.5" />Prepare Online
              </button>

              <div className="flex-1" />

              <input ref={fileRef} type="file" className="hidden" accept=".xlsx,.xls,.csv"
                onChange={handleImportFile} />
              <button onClick={() => { setPrepMode('import'); fileRef.current?.click() }}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
                style={{ background: loading ? G.secondary : '#0F172A' }}>
                <Upload className="h-3.5 w-3.5" />
                {loading ? 'Importing…' : 'Import File'}
              </button>
            </div>
          )}

          {canPrepare && prepMode === 'nil' && !loaded && (
            <div className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
                  Nil Return — {returnType} for {period}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#A16207' }}>
                  No transactions to report. Filing a Nil Return will declare zero outward supplies for this period.
                </p>
              </div>
              <button onClick={() => { setLoaded(true); toast.info('Nil Return prepared') }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white flex-shrink-0 ml-4"
                style={{ background: '#D97706' }}>
                Confirm Nil Return
              </button>
            </div>
          )}

          {loaded && (
            <div className="pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${G.border}` }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#16A34A' }} />
                <span className="text-sm font-medium" style={{ color: G.primary }}>
                  {returnType} — {period}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: '#F0FDF4', color: '#16A34A' }}>
                  {prepMode === 'nil' ? 'Nil Return' : prepMode === 'online' ? 'Online Entry' : `${sheets.length} sections`}
                </span>
              </div>
              <OutlineBtn onClick={resetPrep}>
                <RotateCcw className="h-3.5 w-3.5" />Change
              </OutlineBtn>
            </div>
          )}
        </div>
      </ContentCard>

      {loading && (
        <ContentCard>
          <div className="p-10 flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#0584C7', borderTopColor: 'transparent' }} />
            <p className="text-sm font-medium" style={{ color: G.primary }}>Processing Excel workbook…</p>
          </div>
        </ContentCard>
      )}

      {showSummary && (
        <ContentCard>
          <div className="p-5">
            <SummaryView returnType={returnType} period={period} onClose={() => setShowSummary(false)} />
          </div>
        </ContentCard>
      )}

      {loaded && !loading && !showSummary && prepMode !== 'nil' && sheets.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 xl:grid-cols-9 gap-2">
            {sheets.map(sheet => (
              <SectionTile key={sheet.key} sheet={sheet}
                active={(activeSheet || sheets[0]?.key) === sheet.key}
                onClick={() => setActiveSheet(sheet.key)} />
            ))}
          </div>

          {selSheet && (
            <ContentCard>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: G.primary }}>
                      {selSheet.section} — {selSheet.label}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: G.icon }}>
                      {selSheet.rows.length} record{selSheet.rows.length !== 1 ? 's' : ''} ·{' '}
                      {prepMode === 'online' ? 'Online entry mode' : 'Imported from Excel'}
                    </p>
                  </div>
                </div>
                <SheetTable sheet={selSheet} showActions={true} />
              </div>
            </ContentCard>
          )}

          <div className="flex items-center gap-3 justify-end pt-1">
            <button onClick={() => setShowSummary(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
              style={{ background: G.white, border: `1.5px solid ${G.border}`, color: G.secondary }}>
              <BarChart2 className="h-4 w-4" />View Summary
            </button>
            <button onClick={() => toast.success('Draft saved successfully')}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
              style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', color: '#2563EB' }}>
              <Save className="h-4 w-4" />Save as Draft
            </button>
            <button onClick={() => toast.success(`${returnType} filed & submitted successfully for ${period}`)}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all"
              style={{ background: '#16A34A', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
              <Send className="h-4 w-4" />File & Submit
            </button>
          </div>
        </div>
      )}

      {loaded && prepMode === 'nil' && (
        <ContentCard>
          <div className="p-8 flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{ background: '#FFFBEB', border: '2px solid #FCD34D' }}>
              <FileText className="h-6 w-6" style={{ color: '#D97706' }} />
            </div>
            <div className="text-center">
              <p className="text-base font-bold" style={{ color: G.primary }}>Nil Return Ready</p>
              <p className="text-sm mt-1" style={{ color: G.secondary }}>{returnType} · {period} · No transactions to report</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toast.success('Nil Return draft saved')}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', color: '#2563EB' }}>
                <Save className="h-4 w-4" />Save as Draft
              </button>
              <button onClick={() => toast.success(`Nil Return filed for ${returnType} ${period}`)}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: '#16A34A' }}>
                <Send className="h-4 w-4" />File & Submit
              </button>
            </div>
          </div>
        </ContentCard>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Tab: Reconciliation
// ══════════════════════════════════════════════════════════════════════════
type ReconFilter = 'all' | 'mismatched' | 'partial' | 'matched'
type ReconStep = 'select' | 'upload' | 'results'

function ReconciliationTab({ clients }: { clients: any[] }) {
  // ── Filter state ──
  const [client, setClient] = useState('')
  const [gstin, setGstin] = useState('')
  const [year, setYear] = useState('')
  const [fromMonth, setFromMonth] = useState('')
  const [toMonth, setToMonth] = useState('')

  // ── Recon type + flow state ──
  const [reconType, setReconType] = useState('')
  const [step, setStep] = useState<ReconStep>('select')
  const [checking, setChecking] = useState(false)

  // ── Upload state ──
  const [booksUploaded, setBooksUploaded] = useState(false)
  const [gstrUploaded, setGstrUploaded] = useState(false)
  const [loadingBooks, setLoadingBooks] = useState(false)
  const [loadingGstr, setLoadingGstr] = useState(false)
  const booksRef = useRef<HTMLInputElement>(null)
  const gstrRef = useRef<HTMLInputElement>(null)

  // ── Results state ──
  const [filter, setFilter] = useState<ReconFilter>('all')
  const [rows, setRows] = useState<ReconRow[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [editBuf, setEditBuf] = useState<Partial<ReconRow>>({})

  // ── Derived ──
  const gstinOptions = client ? (CLIENT_GSTINS[client] ?? []) : []
  const allFiltersSet = !!client && !!gstin && !!year && !!fromMonth && !!toMonth
  const selectedRecon = RECON_TYPES.find(r => r.key === reconType)
  // Correctly derive isBookType from the `category` field on the typed object
  const isBookType = selectedRecon?.category === 'books_vs_gstr'

  // For "books_vs_gstr" types, determine which GSTR file is needed
  const getRequiredGstrType = (): string | null => {
    if (reconType === 'books_vs_gstr1') return 'GSTR-1'
    if (reconType === 'books_vs_gstr2b') return 'GSTR-2B'
    if (reconType === 'gstr2a_vs_books') return 'GSTR-2A'
    if (reconType === 'gstr3b_vs_books') return 'GSTR-3B'
    return null
  }
  const requiredGstr = getRequiredGstrType()
  const gstrDataExists = requiredGstr
    ? (AVAILABLE_GSTR_DATA[client] ?? []).includes(requiredGstr)
    : true

  // For "gstr_vs_gstr" types, check if both sides exist
  const getGstrPairTypes = (): [string, string] | null => {
    if (reconType === 'gstr3b_vs_gstr1') return ['GSTR-3B', 'GSTR-1']
    if (reconType === 'gstr3b_vs_gstr2b') return ['GSTR-3B', 'GSTR-2B']
    if (reconType === 'gstr2a_vs_gstr3b') return ['GSTR-2A', 'GSTR-3B']
    if (reconType === 'gstr2a_vs_gstr2b') return ['GSTR-2A', 'GSTR-2B']
    return null
  }
  const gstrPair = getGstrPairTypes()

  const getMissingGstrFiles = (): string[] => {
    if (!gstrPair) return []
    return gstrPair.filter(t => !(AVAILABLE_GSTR_DATA[client] ?? []).includes(t))
  }
  const missingGstrFiles = getMissingGstrFiles()

  const canCheck = allFiltersSet && !!reconType

  // ── Handlers ──
  const handleClientChange = (v: string) => { setClient(v); setGstin(''); resetAll() }

  const resetAll = () => {
    setReconType(''); setStep('select'); setChecking(false)
    setBooksUploaded(false); setGstrUploaded(false)
    setRows([]); setEditId(null); setFilter('all')
  }

  const handleCheck = () => {
    if (!canCheck) return

    if (isBookType) {
      if (!booksUploaded) { setStep('upload'); return }
      if (!gstrDataExists && !gstrUploaded) { setStep('upload'); return }
    } else {
      if (missingGstrFiles.length > 0 && !gstrUploaded) { setStep('upload'); return }
    }

    runReconciliation()
  }

  const runReconciliation = () => {
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
      setRows([...MOCK_RECON])
      setStep('results')
      toast.success(`Reconciliation complete — ${MOCK_RECON.length} records processed`)
    }, 2000)
  }

  const handleBooksFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setLoadingBooks(true)
    toast.info(`Uploading ${e.target.files[0].name}…`)
    setTimeout(() => { setLoadingBooks(false); setBooksUploaded(true); toast.success('Books file uploaded successfully') }, 1500)
  }

  const handleGstrFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setLoadingGstr(true)
    toast.info(`Uploading ${e.target.files[0].name}…`)
    setTimeout(() => {
      setLoadingGstr(false); setGstrUploaded(true)
      toast.success(`${requiredGstr ?? 'GSTR'} file uploaded successfully`)
    }, 1500)
  }

  const handleUploadComplete = () => { runReconciliation() }

  const uploadReady = isBookType
    ? booksUploaded && (gstrDataExists || gstrUploaded)
    : (missingGstrFiles.length === 0 || gstrUploaded)

  // ── Edit handlers ──
  const startEdit = (id: string) => {
    const r = rows.find(x => x.id === id)
    if (r) { setEditId(id); setEditBuf({ ...r }) }
  }
  const saveEdit = () => {
    setRows(prev => prev.map(r => r.id === editId ? { ...r, ...editBuf } as ReconRow : r))
    setEditId(null)
    toast.success('Record updated')
  }
  const autoMatch = () => {
    setRows(prev => prev.map(r => {
      if ((r.status === 'partial' || r.status === 'mismatched') && r.diff !== '—') {
        const diffNum = parseInt(r.diff.replace(/,/g, '').replace('—', '0') || '0')
        if (diffNum <= 500) return { ...r, status: 'matched' as const, diff: '—' }
      }
      return r
    }))
    toast.success('Auto-matched records within ₹500 tolerance')
  }

  const filtered = rows.filter(r =>
    filter === 'all' ? true :
      filter === 'mismatched' ? r.status === 'mismatched' :
        filter === 'partial' ? r.status === 'partial' :
          r.status === 'matched'
  )

  const counts = {
    all: rows.length,
    mismatched: rows.filter(r => r.status === 'mismatched').length,
    partial: rows.filter(r => r.status === 'partial').length,
    matched: rows.filter(r => r.status === 'matched').length,
  }

  return (
    <div className="space-y-4">
      {/* ── FILTER BAR ── */}
      <ContentCard>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <Sel label="Client" value={client} onChange={handleClientChange}
              options={(clients as any[]).filter(c => c.gst_enabled).map(c => ({ value: String(c.id), label: c.legal_name }))} />
            <Sel label="GSTIN" value={gstin} onChange={v => { setGstin(v); if (step !== 'select') resetAll() }}
              disabled={!client}
              options={gstinOptions.map(g => ({ value: g, label: g }))} />
            <Sel label="Financial Year" value={year} onChange={v => { setYear(v); if (step !== 'select') resetAll() }}
              disabled={!client || !gstin}
              options={YEARS.map(y => ({ value: y, label: y }))} />
            <Sel label="From Month" value={fromMonth}
              onChange={v => { setFromMonth(v); if (step !== 'select') resetAll() }}
              disabled={!client || !gstin || !year}
              options={MONTHS.map(m => ({ value: m, label: m }))} />
            <Sel label="To Month" value={toMonth}
              onChange={v => { setToMonth(v); if (step !== 'select') resetAll() }}
              disabled={!client || !gstin || !year || !fromMonth}
              options={MONTHS
                .filter(m => !fromMonth || MONTHS.indexOf(m) >= MONTHS.indexOf(fromMonth))
                .map(m => ({ value: m, label: m }))} />
          </div>
        </div>
      </ContentCard>

      {/* ── RECONCILIATION TYPE CARDS ── */}
      {allFiltersSet && step === 'select' && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: G.secondary }}>
            Select Reconciliation Type
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {RECON_TYPES.map(rt => (
              <button key={rt.key} onClick={() => setReconType(rt.key)}
                className="rounded-xl border p-4 text-left transition-all"
                style={{
                  background: reconType === rt.key ? '#EFF6FF' : G.white,
                  borderColor: reconType === rt.key ? '#2563EB' : G.border,
                  boxShadow: reconType === rt.key ? '0 0 0 2px rgba(37,99,235,0.15)' : '0 1px 3px rgba(15,23,42,0.05)',
                }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold"
                    style={{ color: reconType === rt.key ? '#1D4ED8' : G.primary }}>
                    {rt.label}
                  </span>
                  {reconType === rt.key && (
                    <span className="ml-auto h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#2563EB' }}>
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                </div>
                <p className="text-[10px] mt-1 font-medium"
                  style={{ color: rt.category === 'books_vs_gstr' ? '#7C3AED' : '#0369A1' }}>
                  {rt.category === 'books_vs_gstr' ? 'Books ↔ GSTR' : 'GSTR ↔ GSTR'}
                </p>
              </button>
            ))}
          </div>

          {/* ── CHECK BUTTON ── */}
          {reconType && (
            <div className="flex items-center justify-between mt-4 pt-4"
              style={{ borderTop: `1px solid ${G.border}` }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: G.primary }}>
                  {selectedRecon?.label}
                </span>
                <span className="text-xs" style={{ color: G.icon }}>
                  · {fromMonth} to {toMonth} {year}
                </span>
              </div>
              <button onClick={handleCheck} disabled={checking}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: checking ? G.secondary : '#0F172A' }}>
                {checking
                  ? <>
                    <div className="h-4 w-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: '#FFFFFF', borderTopColor: 'transparent' }} />
                    Checking…
                  </>
                  : <><Search className="h-4 w-4" />Check Reconciliation</>
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── UPLOAD STEP ── */}
      {step === 'upload' && (
        <ContentCard>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4" style={{ color: '#D97706' }} />
              <h3 className="text-sm font-bold" style={{ color: G.primary }}>Additional Files Required</h3>
            </div>
            <p className="text-xs" style={{ color: G.secondary }}>
              {isBookType
                ? 'Books data is always required for this reconciliation type. Upload your accounting ledger below.'
                : 'Some GSTR data files are not available in the system. Please upload the missing file(s) to proceed.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Books file — always shown for books type */}
              {isBookType && (
                <div className="rounded-xl border p-4"
                  style={{ background: booksUploaded ? '#F0FDF4' : G.canvas, borderColor: booksUploaded ? '#86EFAC' : G.border }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: G.primary }}>📁 Books / Ledger File</span>
                    {booksUploaded && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#16A34A' }}>
                        <CheckCircle2 className="h-3 w-3" />Uploaded
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mb-3" style={{ color: G.icon }}>
                    Upload your accounting ledger, sales/purchase register (.xlsx, .csv)
                  </p>
                  <input ref={booksRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleBooksFile} />
                  <button onClick={() => booksRef.current?.click()} disabled={loadingBooks}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50"
                    style={{
                      background: booksUploaded ? '#DCFCE7' : G.white,
                      border: `1.5px solid ${booksUploaded ? '#86EFAC' : G.border}`,
                      color: booksUploaded ? '#16A34A' : G.secondary,
                    }}>
                    <Upload className="h-3.5 w-3.5" />
                    {loadingBooks ? 'Uploading…' : booksUploaded ? 'Replace File' : 'Upload Books File'}
                  </button>
                </div>
              )}

              {/* GSTR file — shown when data doesn't exist in system */}
              {((isBookType && !gstrDataExists) || (!isBookType && missingGstrFiles.length > 0)) && (
                <div className="rounded-xl border p-4"
                  style={{ background: gstrUploaded ? '#F0FDF4' : G.canvas, borderColor: gstrUploaded ? '#86EFAC' : G.border }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: G.primary }}>
                      📄 {isBookType ? requiredGstr : missingGstrFiles.join(' / ')} Data File
                    </span>
                    {gstrUploaded && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#16A34A' }}>
                        <CheckCircle2 className="h-3 w-3" />Uploaded
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mb-2" style={{ color: G.icon }}>
                    {isBookType ? requiredGstr : missingGstrFiles.join(' / ')} data was not found in the Returns module for this client.
                  </p>
                  <div className="rounded-lg px-2.5 py-1.5 mb-3 inline-flex items-center gap-1.5"
                    style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <AlertCircle className="h-3 w-3" style={{ color: '#DC2626' }} />
                    <span className="text-[10px] font-semibold" style={{ color: '#DC2626' }}>
                      Not available in system — manual upload required
                    </span>
                  </div>
                  <div>
                    <input ref={gstrRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleGstrFile} />
                    <button onClick={() => gstrRef.current?.click()} disabled={loadingGstr}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50"
                      style={{
                        background: gstrUploaded ? '#DCFCE7' : G.white,
                        border: `1.5px solid ${gstrUploaded ? '#86EFAC' : G.border}`,
                        color: gstrUploaded ? '#16A34A' : G.secondary,
                      }}>
                      <Upload className="h-3.5 w-3.5" />
                      {loadingGstr ? 'Uploading…' : gstrUploaded ? 'Replace File' : `Upload ${isBookType ? requiredGstr : 'GSTR'} File`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3"
              style={{ borderTop: `1px solid ${G.border}` }}>
              <button onClick={() => { setStep('select'); setBooksUploaded(false); setGstrUploaded(false) }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
                style={{ background: G.canvas, color: G.secondary, border: `1px solid ${G.border}` }}>
                <RotateCcw className="h-3 w-3" />Back
              </button>
              <button onClick={handleUploadComplete} disabled={!uploadReady || checking}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: uploadReady ? '#0F172A' : G.secondary }}>
                {checking
                  ? <>
                    <div className="h-4 w-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: '#FFFFFF', borderTopColor: 'transparent' }} />
                    Processing…
                  </>
                  : <><Search className="h-4 w-4" />Run Reconciliation</>
                }
              </button>
            </div>
          </div>
        </ContentCard>
      )}

      {/* ── CHECKING SPINNER ── */}
      {checking && step === 'select' && (
        <ContentCard>
          <div className="p-10 flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-[3px] animate-spin"
              style={{ borderColor: '#0584C7', borderTopColor: 'transparent' }} />
            <p className="text-sm font-semibold" style={{ color: G.primary }}>
              Running {selectedRecon?.label}…
            </p>
            <p className="text-xs" style={{ color: G.icon }}>
              Comparing {fromMonth} to {toMonth} {year} data
            </p>
          </div>
        </ContentCard>
      )}

      {/* ── RESULTS ── */}
      {step === 'results' && rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold" style={{ color: G.primary }}>
                {selectedRecon?.label}
              </h3>
              <p className="text-[11px]" style={{ color: G.icon }}>
                {fromMonth} to {toMonth} {year} · {(clients as any[]).find(c => String(c.id) === client)?.legal_name} · {gstin}
              </p>
            </div>
            <button
              onClick={() => { setStep('select'); setReconType(''); setRows([]); setBooksUploaded(false); setGstrUploaded(false) }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
              style={{ background: G.canvas, color: G.secondary, border: `1px solid ${G.border}` }}>
              <RotateCcw className="h-3 w-3" />New Reconciliation
            </button>
          </div>

          {/* Summary filter cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { key: 'all', label: 'All Records', cnt: counts.all, color: G.secondary, bg: G.canvas, Icon: ArrowLeftRight },
              { key: 'mismatched', label: 'Mismatched', cnt: counts.mismatched, color: '#DC2626', bg: '#FEF2F2', Icon: AlertCircle },
              { key: 'partial', label: 'Partially Matched', cnt: counts.partial, color: '#D97706', bg: '#FFFBEB', Icon: Minus },
              { key: 'matched', label: 'Matched', cnt: counts.matched, color: '#16A34A', bg: '#F0FDF4', Icon: Check },
            ] as const).map(s => (
              <button key={s.key} onClick={() => setFilter(s.key as ReconFilter)}
                className="rounded-2xl border p-4 text-left transition-all"
                style={{
                  background: filter === s.key ? s.bg : G.white,
                  borderColor: filter === s.key ? s.color : G.border,
                  boxShadow: filter === s.key ? `0 0 0 1.5px ${s.color}30` : '0 1px 3px rgba(15,23,42,0.06)',
                }}>
                <div className="flex items-center gap-2 mb-2">
                  <s.Icon className="h-4 w-4" style={{ color: s.color }} />
                  <span className="text-xs font-semibold" style={{ color: G.secondary }}>{s.label}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums"
                  style={{ color: s.color === G.secondary ? G.primary : s.color }}>{s.cnt}</p>
              </button>
            ))}
          </div>

          {/* Data table */}
          <ContentCard>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: G.primary }}>Reconciliation Details</h3>
                  <p className="text-[11px] mt-0.5" style={{ color: G.icon }}>
                    {filtered.length} of {rows.length} records shown · Edit mismatched rows directly
                  </p>
                </div>
                <button onClick={autoMatch}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
                  style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#16A34A' }}>
                  <Check className="h-3.5 w-3.5" />Auto-Match (≤₹500)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: G.canvas }}>
                      {['#', 'Invoice No', 'Date', 'GSTIN', 'Party', 'Books (₹)', 'Portal (₹)', 'Difference (₹)', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold border-b whitespace-nowrap"
                          style={{ color: G.secondary, borderColor: G.border }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => {
                      const statusStyle = r.status === 'matched'
                        ? { bg: '#F0FDF4', color: '#16A34A' }
                        : r.status === 'partial'
                          ? { bg: '#FFFBEB', color: '#D97706' }
                          : { bg: '#FEF2F2', color: '#DC2626' }
                      const isEditing = editId === r.id
                      const canEdit = r.status !== 'matched'
                      return (
                        <tr key={r.id}
                          style={{ borderBottom: `1px solid ${G.border}`, background: isEditing ? '#F8FAFC' : 'transparent' }}
                          onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = G.canvas }}
                          onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                          <td className="px-3 py-2.5 font-mono" style={{ color: G.icon }}>{i + 1}</td>
                          <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: G.primary }}>
                            {isEditing
                              ? <input value={editBuf.inv ?? ''} onChange={e => setEditBuf(b => ({ ...b, inv: e.target.value }))}
                                className="w-24 rounded px-1.5 py-0.5 text-xs outline-none"
                                style={{ border: '1px solid #0584C7', background: '#EFF8FF' }} />
                              : r.inv}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: G.secondary }}>{r.date}</td>
                          <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: G.secondary }}>{r.gstin}</td>
                          <td className="px-3 py-2.5 font-medium" style={{ color: G.primary }}>{r.party}</td>
                          <td className="px-3 py-2.5 font-mono">
                            {isEditing
                              ? <input value={editBuf.books ?? ''} onChange={e => setEditBuf(b => ({ ...b, books: e.target.value }))}
                                className="w-20 rounded px-1.5 py-0.5 text-xs outline-none"
                                style={{ border: '1px solid #0584C7', background: '#EFF8FF' }} />
                              : <span style={{ color: G.primary }}>₹{r.books}</span>}
                          </td>
                          <td className="px-3 py-2.5 font-mono">
                            {isEditing
                              ? <input value={editBuf.portal ?? ''} onChange={e => setEditBuf(b => ({ ...b, portal: e.target.value }))}
                                className="w-20 rounded px-1.5 py-0.5 text-xs outline-none"
                                style={{ border: '1px solid #0584C7', background: '#EFF8FF' }} />
                              : r.portal === '—'
                                ? <span style={{ color: '#DC2626', fontWeight: 600 }}>Not found</span>
                                : <span style={{ color: G.secondary }}>₹{r.portal}</span>}
                          </td>
                          <td className="px-3 py-2.5 font-mono font-semibold"
                            style={{ color: r.status === 'matched' ? G.icon : r.status === 'partial' ? '#D97706' : '#DC2626' }}>
                            {r.diff !== '—' ? `₹${r.diff}` : '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                              style={{ background: statusStyle.bg, color: statusStyle.color }}>
                              {r.status === 'matched'
                                ? <Check className="h-3 w-3" />
                                : r.status === 'partial'
                                  ? <Minus className="h-3 w-3" />
                                  : <AlertCircle className="h-3 w-3" />}
                              {r.status === 'partial' ? 'Partial' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            {isEditing
                              ? <div className="flex items-center gap-1">
                                <button onClick={saveEdit}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                                  style={{ background: '#16A34A' }}>Save</button>
                                <button onClick={() => setEditId(null)}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold"
                                  style={{ background: G.canvas, color: G.secondary }}>Cancel</button>
                              </div>
                              : canEdit && (
                                <button onClick={() => startEdit(r.id)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                                  style={{ background: '#EFF6FF', color: '#2563EB' }}>
                                  <Pencil className="h-2.5 w-2.5" />Edit
                                </button>
                              )}
                          </td>
                        </tr>
                      )
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-3 py-8 text-center text-sm" style={{ color: G.icon }}>
                          No records match this filter
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </ContentCard>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!allFiltersSet && (
        <ContentCard>
          <div className="p-10 flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{ background: G.canvas, border: `2px solid ${G.border}` }}>
              <ArrowLeftRight className="h-6 w-6" style={{ color: G.icon }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: G.primary }}>Select All Filters to Begin</p>
            <p className="text-xs text-center max-w-sm" style={{ color: G.secondary }}>
              Choose a client, GSTIN, financial year, and the period range (from–to months) to view reconciliation options.
            </p>
          </div>
        </ContentCard>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════
export function GSTPage() {
  const [activeTab, setActiveTab] = useState<MainTab>('overview')

  const { data: returns = [] } = useQuery({
    queryKey: ['gst-returns'],
    queryFn: () => mockComplianceApi.gstReturns().then(r => r.data),
  })
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientsApi.list().then(r => r.data),
  })

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto" style={{ background: G.canvas }}>
      <div className="flex flex-row items-center justify-between mb-4">
        <PageHeader title="GST Module" sub="GST Filings and Reconciliation">
          <OutlineBtn onClick={() => toast.success('Refreshed')}><RefreshCw className="h-3.5 w-3.5" /></OutlineBtn>
        </PageHeader>

        <div className="mb-5 flex gap-1 p-1 rounded-2xl w-fit"
          style={{ background: G.white, border: `1px solid ${G.border}` }}>
          {MAIN_TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={cn('px-5 py-2 rounded-xl text-sm font-semibold transition-all')}
              style={{
                background: activeTab === t.key ? '#0F172A' : 'transparent',
                color: activeTab === t.key ? '#FFFFFF' : G.secondary,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && <OverviewTab returns={returns as any[]} />}
      {activeTab === 'clients' && <ClientsTab clients={clients as any[]} />}
      {activeTab === 'returns' && <ReturnsTab clients={clients as any[]} />}
      {activeTab === 'reconciliation' && <ReconciliationTab clients={clients as any[]} />}
    </div>
  )
}