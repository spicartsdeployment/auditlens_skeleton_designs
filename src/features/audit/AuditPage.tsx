import { useState } from 'react'
import {
  ChevronDown, ChevronUp, ChevronRight, Plus, Save, FileText, Download, CheckCircle2,
  AlertTriangle, Clock, Users, Activity, FileCheck, Folder, MessageSquare, Eye,
  PenLine, BarChart2, Shield, Search, Upload, Paperclip, AlertCircle, TrendingUp,
  RefreshCw, XCircle, CheckSquare, Circle, MoreHorizontal, ArrowRight,
  ClipboardList, Star, Zap, Settings, ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Design tokens ─────────────────────────────────────────────────────────
const G = {
  canvas:   '#F8FAFC',
  white:    '#FFFFFF',
  border:   '#E2E8F0',
  muted:    '#94A3B8',
  secondary:'#475569',
  primary:  '#0F172A',
  accent:   '#0584C7',
} as const

// ─── Mock Data ──────────────────────────────────────────────────────────────
const ENGAGEMENTS = [
  {
    id: 1, client: 'Sunrise Textiles Pvt Ltd', pan: 'AABCS1234D', gstin: '29AABCS1234D1Z5',
    cin: 'U17000KA2015PTC081234', type: 'Statutory Audit', fy: 'FY 2025-26',
    period: 'Apr 2025 – Mar 2026', status: 'In Progress', dueDate: '30 Sep 2026',
    healthScore: 74, progress: 52,
    team: [
      { name: 'Priya Sharma', role: 'Partner', initials: 'PS', color: '#0584C7' },
      { name: 'Rohan Verma', role: 'Manager', initials: 'RV', color: '#10B981' },
      { name: 'Sneha Iyer', role: 'Senior', initials: 'SI', color: '#F59E0B' },
      { name: 'Arjun Mehta', role: 'Article', initials: 'AM', color: '#8B5CF6' },
    ],
  },
  {
    id: 2, client: 'BlueSky Software Solutions', pan: 'AABCB5678E', gstin: '27AABCB5678E1Z3',
    cin: 'U72200MH2018PTC298765', type: 'Tax Audit', fy: 'FY 2025-26',
    period: 'Apr 2025 – Mar 2026', status: 'Planning', dueDate: '31 Oct 2026',
    healthScore: 88, progress: 18,
    team: [
      { name: 'Priya Sharma', role: 'Partner', initials: 'PS', color: '#0584C7' },
      { name: 'Arjun Mehta', role: 'Article', initials: 'AM', color: '#8B5CF6' },
    ],
  },
  {
    id: 3, client: 'Apex Auto Parts Ltd', pan: 'AABCA9012F', gstin: '24AABCA9012F1Z8',
    cin: 'L34100GJ2010PLC057890', type: 'Statutory Audit', fy: 'FY 2024-25',
    period: 'Apr 2024 – Mar 2025', status: 'Review', dueDate: '15 Jul 2026',
    healthScore: 91, progress: 87,
    team: [
      { name: 'Priya Sharma', role: 'Partner', initials: 'PS', color: '#0584C7' },
      { name: 'Rohan Verma', role: 'Manager', initials: 'RV', color: '#10B981' },
    ],
  },
]

const STAGE_STATUS: Record<number, Record<string, { pct: number; pending: number; exceptions: number; done: boolean }>> = {
  1: {
    preliminary:    { pct: 85,  pending: 2,  exceptions: 1, done: false },
    caro:           { pct: 45,  pending: 8,  exceptions: 4, done: false },
    reconciliation: { pct: 62,  pending: 4,  exceptions: 5, done: false },
    documentation:  { pct: 52,  pending: 9,  exceptions: 3, done: false },
    checklist:      { pct: 40,  pending: 6,  exceptions: 0, done: false },
    observations:   { pct: 30,  pending: 5,  exceptions: 0, done: false },
    review:         { pct: 0,   pending: 0,  exceptions: 0, done: false },
    signoff:        { pct: 0,   pending: 0,  exceptions: 0, done: false },
    tax_forms:      { pct: 0,   pending: 0,  exceptions: 0, done: false },
  },
  2: {
    preliminary:    { pct: 30,  pending: 3,  exceptions: 0, done: false },
    caro:           { pct: 0,   pending: 0,  exceptions: 0, done: false },
    reconciliation: { pct: 0,   pending: 0,  exceptions: 0, done: false },
    documentation:  { pct: 10,  pending: 15, exceptions: 0, done: false },
    checklist:      { pct: 0,   pending: 0,  exceptions: 0, done: false },
    observations:   { pct: 0,   pending: 0,  exceptions: 0, done: false },
    review:         { pct: 0,   pending: 0,  exceptions: 0, done: false },
    signoff:        { pct: 0,   pending: 0,  exceptions: 0, done: false },
    tax_forms:      { pct: 10,  pending: 5,  exceptions: 0, done: false },
  },
  3: {
    preliminary:    { pct: 100, pending: 0,  exceptions: 1, done: true  },
    caro:           { pct: 90,  pending: 2,  exceptions: 1, done: false },
    reconciliation: { pct: 97,  pending: 1,  exceptions: 2, done: false },
    documentation:  { pct: 92,  pending: 3,  exceptions: 2, done: false },
    checklist:      { pct: 85,  pending: 2,  exceptions: 0, done: false },
    observations:   { pct: 100, pending: 0,  exceptions: 0, done: true  },
    review:         { pct: 60,  pending: 2,  exceptions: 0, done: false },
    signoff:        { pct: 0,   pending: 0,  exceptions: 0, done: false },
    tax_forms:      { pct: 0,   pending: 0,  exceptions: 0, done: false },
  },
}

const DOCUMENTS = [
  { id: 1, name: 'Trial Balance FY 2025-26', category: 'Financial', contact: 'Rajesh Kumar', due: '15 Jun 2026', status: 'received', verified: true,  reminders: 1 },
  { id: 2, name: 'Bank Statements (All 6 accounts)', category: 'Bank', contact: 'Rajesh Kumar', due: '15 Jun 2026', status: 'received', verified: false, reminders: 2 },
  { id: 3, name: 'GST Returns (GSTR-1, 3B) Apr–Mar', category: 'GST', contact: 'Meera Patel', due: '20 Jun 2026', status: 'received', verified: true,  reminders: 1 },
  { id: 4, name: 'TDS Certificates (Form 16A)', category: 'TDS', contact: 'Meera Patel', due: '20 Jun 2026', status: 'partial',  verified: false, reminders: 3 },
  { id: 5, name: 'Fixed Assets Register', category: 'Assets', contact: 'Rajesh Kumar', due: '25 Jun 2026', status: 'pending',  verified: false, reminders: 2 },
  { id: 6, name: 'Inventory Valuation Report', category: 'Inventory', contact: 'Suresh Nair', due: '25 Jun 2026', status: 'pending',  verified: false, reminders: 3 },
  { id: 7, name: 'Board Minutes (All meetings)', category: 'Corporate', contact: 'Amit Shah', due: '30 Jun 2026', status: 'escalated', verified: false, reminders: 5 },
  { id: 8, name: 'Loan Agreements & Repayment Schedule', category: 'Finance', contact: 'Rajesh Kumar', due: '30 Jun 2026', status: 'missing',  verified: false, reminders: 4 },
]

const RISKS = [
  { id: 1, area: 'Revenue Recognition', category: 'Financial', likelihood: 'High', impact: 'High', score: 9, comment: 'Complex revenue arrangements with multiple performance obligations', mitigation: 'Detailed transaction testing of top 20 customers' },
  { id: 2, area: 'GST ITC Mismatch', category: 'GST', likelihood: 'High', impact: 'Medium', score: 7, comment: 'Differences observed between GSTR-2A and books', mitigation: 'Reconcile ITC on monthly basis, test top 50 suppliers' },
  { id: 3, area: 'TDS Deduction Gaps', category: 'TDS', likelihood: 'Medium', impact: 'Medium', score: 5, comment: 'Certain vendor payments may not have attracted TDS', mitigation: 'Review all payments above ₹30,000 to contractors' },
  { id: 4, area: 'Inventory Valuation', category: 'Compliance', likelihood: 'Medium', impact: 'High', score: 6, comment: 'Raw material prices fluctuated significantly in Q3–Q4', mitigation: 'Physical verification and FIFO/weighted avg reconciliation' },
  { id: 5, area: 'Related Party Transactions', category: 'Fraud', likelihood: 'Low', impact: 'High', score: 4, comment: 'Transactions with associate entities at non-arm\'s-length prices', mitigation: 'Review all RPT disclosures and arm\'s-length documentation' },
]

// CARO 2020 — Statutory Audit only
const CARO_CLAUSES = [
  { id: 1, no: '3(i)(a)', title: 'Fixed Assets — Proper Records', status: 'complete', risk: 'Low', evidence: 3, observations: 0, comment: 'Fixed assets register maintained and physically verified.' },
  { id: 2, no: '3(ii)(a)', title: 'Inventory — Physical Verification', status: 'in_progress', risk: 'Medium', evidence: 1, observations: 1, comment: 'Physical verification pending for warehouse-2 location.' },
  { id: 3, no: '3(iii)', title: 'Loans — Granted to Parties', status: 'complete', risk: 'Low', evidence: 2, observations: 0, comment: 'No loans granted to companies covered under sec 189.' },
  { id: 4, no: '3(iv)', title: 'Loans, Investments, Guarantees — Sec 185/186', status: 'pending', risk: 'High', evidence: 0, observations: 2, comment: 'Awaiting board resolution copies and valuation reports.' },
  { id: 5, no: '3(vi)', title: 'Cost Records — Sec 148(1)', status: 'not_applicable', risk: 'Low', evidence: 0, observations: 0, comment: 'Company not required to maintain cost records.' },
  { id: 6, no: '3(vii)(a)', title: 'Statutory Dues — Regular Deposit', status: 'in_progress', risk: 'Medium', evidence: 2, observations: 1, comment: 'Minor delays in GST payment identified in Aug and Nov 2025.' },
]

// Form 3CD — Tax Audit only (Sec 44AB, Income Tax Act)
const FORM_3CD_CLAUSES = [
  { id: 1,  no: 'Cl. 9',  title: 'Books of Account — Mode of Maintenance', status: 'complete', risk: 'Low', evidence: 2, observations: 0, comment: 'Books maintained in Tally Prime; address and period verified.' },
  { id: 2,  no: 'Cl. 11', title: 'Method of Accounting — Sec 145', status: 'complete', risk: 'Low', evidence: 1, observations: 0, comment: 'Mercantile basis followed consistently.' },
  { id: 3,  no: 'Cl. 12', title: 'Method of Valuation of Stock', status: 'complete', risk: 'Medium', evidence: 2, observations: 0, comment: 'Weighted average cost method applied for raw materials.' },
  { id: 4,  no: 'Cl. 13', title: 'Capital Asset Converted to Stock-in-Trade', status: 'not_applicable', risk: 'Low', evidence: 0, observations: 0, comment: 'No capital asset converted during the year.' },
  { id: 5,  no: 'Cl. 16', title: 'Amounts Credited to P&L but Chargeable u/s 28 to 44D', status: 'in_progress', risk: 'Medium', evidence: 1, observations: 1, comment: 'Export incentives under verification — MEIS/RoDTEP reconciliation pending.' },
  { id: 6,  no: 'Cl. 17', title: 'Amount Admissible under Sec 32AC/33AB/33ABA/35', status: 'not_applicable', risk: 'Low', evidence: 0, observations: 0, comment: 'No deductions claimed under these sections.' },
  { id: 7,  no: 'Cl. 18', title: 'Expenditure Debited to P&L — Personal / Capital Nature', status: 'in_progress', risk: 'Medium', evidence: 1, observations: 1, comment: 'Director vehicle expenses require disallowance computation.' },
  { id: 8,  no: 'Cl. 19', title: 'Deductions Allowable u/s 32 — Depreciation', status: 'complete', risk: 'Low', evidence: 3, observations: 0, comment: 'IT depreciation schedule reconciled with books depreciation.' },
  { id: 9,  no: 'Cl. 21(a)', title: 'Amounts Inadmissible u/s 40A(2) — Related Party Payments', status: 'pending', risk: 'High', evidence: 0, observations: 2, comment: 'Payments to associate concern at non-arm\'s-length price under review.' },
  { id: 10, no: 'Cl. 21(b)', title: 'Cash Payments Exceeding ₹10,000 — Sec 40A(3)', status: 'complete', risk: 'Low', evidence: 2, observations: 0, comment: 'No single cash payment exceeds threshold. Verified from cash book.' },
  { id: 11, no: 'Cl. 26', title: 'Payments to Specified Persons — Sec 40A(2)(b)', status: 'in_progress', risk: 'Medium', evidence: 1, observations: 0, comment: 'Related party master list obtained; reasonableness check ongoing.' },
  { id: 12, no: 'Cl. 34(a)', title: 'TDS — Deduction, Deposit and Return Filing', status: 'in_progress', risk: 'High', evidence: 2, observations: 1, comment: 'TDS default identified on professional fees — 3 vendors. Late deposit interest pending.' },
  { id: 13, no: 'Cl. 34(b)', title: 'Tax Collected at Source — Compliance', status: 'not_applicable', risk: 'Low', evidence: 0, observations: 0, comment: 'Assessee not liable to collect TCS.' },
  { id: 14, no: 'Cl. 36B', title: 'GST — Turnover Reconciliation', status: 'in_progress', risk: 'High', evidence: 1, observations: 2, comment: 'GSTR-1 vs books turnover mismatch of ₹4.2L under reconciliation.' },
  { id: 15, no: 'Cl. 44', title: 'GST Expenses — Breakup of Total Expenditure', status: 'pending', risk: 'Medium', evidence: 0, observations: 0, comment: 'Breakup of expenditure between registered and unregistered GST entities pending.' },
]

const WORKING_PAPERS_DATA = [
  { id: 1, area: 'Revenue', title: 'Revenue Analytical Review', preparer: 'Sneha Iyer', reviewer: 'Rohan Verma', due: '10 Jul 2026', status: 'complete', version: 2, flag: false },
  { id: 2, area: 'Revenue', title: 'Contract Asset & Liability Testing', preparer: 'Arjun Mehta', reviewer: 'Rohan Verma', due: '12 Jul 2026', status: 'in_review', version: 1, flag: true },
  { id: 3, area: 'Bank', title: 'Bank Reconciliation — SBI OD Account', preparer: 'Arjun Mehta', reviewer: 'Sneha Iyer', due: '8 Jul 2026', status: 'complete', version: 1, flag: false },
  { id: 4, area: 'GST', title: 'GSTR-1 vs Books Reconciliation', preparer: 'Sneha Iyer', reviewer: 'Rohan Verma', due: '14 Jul 2026', status: 'draft', version: 1, flag: false },
  { id: 5, area: 'TDS', title: 'TDS Deduction & Deposit Verification', preparer: 'Arjun Mehta', reviewer: 'Rohan Verma', due: '14 Jul 2026', status: 'in_review', version: 1, flag: true },
  { id: 6, area: 'Fixed Assets', title: 'FA Schedule & Depreciation', preparer: 'Sneha Iyer', reviewer: 'Rohan Verma', due: '15 Jul 2026', status: 'pending', version: 0, flag: false },
  { id: 7, area: 'Payroll', title: 'Payroll Testing — 6 months sample', preparer: 'Arjun Mehta', reviewer: 'Sneha Iyer', due: '16 Jul 2026', status: 'pending', version: 0, flag: false },
]

const OBS_LIST = [
  { id: 'OBS-001', title: 'Revenue not recognised as per Ind AS 115', severity: 'High', impact: '₹28.4L', area: 'Revenue', owner: 'Rajesh Kumar', due: '10 Jul 2026', status: 'open', category: 'Accounting', response: '' },
  { id: 'OBS-002', title: 'ITC availed on exempt supplies — GSTR-2A mismatch ₹6.2L', severity: 'High', impact: '₹6.2L', area: 'GST', owner: 'Meera Patel', due: '12 Jul 2026', status: 'mgmt_pending', category: 'GST', response: 'Under review by accounts team' },
  { id: 'OBS-003', title: 'TDS not deducted on professional fees — 3 vendors', severity: 'Medium', impact: '₹1.8L', area: 'TDS', owner: 'Meera Patel', due: '15 Jul 2026', status: 'resolved', category: 'TDS', response: 'TDS deposited with interest. Confirmation attached.' },
  { id: 'OBS-004', title: 'Board minutes not maintained for Q1 meetings', severity: 'Low', impact: 'Nil', area: 'Compliance', owner: 'Amit Shah', due: '20 Jul 2026', status: 'open', category: 'Compliance', response: '' },
  { id: 'OBS-005', title: 'Inventory valuation — FIFO not consistently applied', severity: 'Medium', impact: '₹12.1L', area: 'Inventory', owner: 'Suresh Nair', due: '18 Jul 2026', status: 'under_review', category: 'Accounting', response: 'Valuation method documentation being compiled' },
]

const ACTIVITIES = [
  { time: '2h ago', text: 'Working paper WP-Revenue-001 approved by Rohan Verma', user: 'RV' },
  { time: '4h ago', text: 'Observation OBS-003 marked resolved with evidence upload', user: 'AM' },
  { time: '5h ago', text: 'CARO clause 3(i)(a) marked complete', user: 'SI' },
  { time: '1d ago', text: 'Document request sent — Board Minutes (3rd reminder)', user: 'PS' },
  { time: '1d ago', text: 'Risk score updated for Revenue Recognition', user: 'RV' },
  { time: '2d ago', text: 'GST ITC reconciliation working paper uploaded', user: 'SI' },
]

// ─── Checklist mock data ─────────────────────────────────────────────────────
type ChecklistItem = {
  id: string; sectionNo: string; itemNo: string; question: string
  answerType: 'yes_no_na' | 'text' | 'tabular'
  answer: string; documentation: string; location: string; remarks: string; isCustom: boolean
}

const CHECKLIST_SECTIONS = [
  { no: '1', name: 'General' },
  { no: '2', name: 'Revenue' },
  { no: '3', name: 'Expenses' },
  { no: '4', name: 'GST Compliance' },
  { no: '5', name: 'TDS Compliance' },
]

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: 'c1.1', sectionNo: '1', itemNo: '1.1', question: 'Are the books of account maintained as per prescribed format?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-BOA-01', remarks: '', isCustom: false },
  { id: 'c1.2', sectionNo: '1', itemNo: '1.2', question: 'Is the accounting software used compliant and auditable?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-SW-01', remarks: '', isCustom: false },
  { id: 'c1.3', sectionNo: '1', itemNo: '1.3', question: 'Are all bank accounts reconciled monthly?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-BNK-01', remarks: '', isCustom: false },
  { id: 'c2.1', sectionNo: '2', itemNo: '2.1', question: 'Is the nature of business and revenue streams identified?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-REV-01', remarks: '', isCustom: false },
  { id: 'c2.2', sectionNo: '2', itemNo: '2.2', question: 'Is revenue recognised in accordance with the applicable standard (Ind AS 115/AS 9)?', answerType: 'yes_no_na', answer: '', documentation: 'Pending', location: '', remarks: 'Verify with CA', isCustom: false },
  { id: 'c2.3', sectionNo: '2', itemNo: '2.3', question: 'Are contracts, POs, work orders, and performance obligations documented?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-REV-02', remarks: '', isCustom: false },
  { id: 'c2.4', sectionNo: '2', itemNo: '2.4', question: 'Is cut-off at period end properly checked, including unbilled revenue?', answerType: 'yes_no_na', answer: '', documentation: 'Pending', location: '', remarks: '', isCustom: false },
  { id: 'c2.5', sectionNo: '2', itemNo: '2.5', question: 'Is revenue reconciled with GST returns / sales registers?', answerType: 'yes_no_na', answer: 'No', documentation: 'Obtained', location: 'WP-GST-REC', remarks: 'Mismatch ₹4.2L — under review', isCustom: false },
  { id: 'c2.6', sectionNo: '2', itemNo: '2.6', question: 'Are disclosures on accounting policy, disaggregation, and significant judgements adequate?', answerType: 'yes_no_na', answer: '', documentation: 'Pending', location: '', remarks: '', isCustom: false },
  { id: 'c3.1', sectionNo: '3', itemNo: '3.1', question: 'Are major expense heads analytically reviewed?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-EXP-01', remarks: '', isCustom: false },
  { id: 'c3.2', sectionNo: '3', itemNo: '3.2', question: 'Are capital vs revenue expenditure classifications appropriate?', answerType: 'yes_no_na', answer: '', documentation: 'Pending', location: '', remarks: '', isCustom: false },
  { id: 'c3.3', sectionNo: '3', itemNo: '3.3', question: 'Are provisions made for all known liabilities?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-PROV-01', remarks: '', isCustom: false },
  { id: 'c3.4', sectionNo: '3', itemNo: '3.4', question: 'Is depreciation computed as per applicable rates?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-DEP-01', remarks: '', isCustom: false },
  { id: 'c4.1', sectionNo: '4', itemNo: '4.1', question: 'Is ITC availed matching GSTR-2B/2A?', answerType: 'yes_no_na', answer: 'No', documentation: 'Obtained', location: 'WP-GST-01', remarks: 'Mismatch ₹6.2L', isCustom: false },
  { id: 'c4.2', sectionNo: '4', itemNo: '4.2', question: 'Are outward supplies reconciled with books?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-GST-02', remarks: '', isCustom: false },
  { id: 'c4.3', sectionNo: '4', itemNo: '4.3', question: 'Are RCM liabilities identified and paid?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-GST-03', remarks: '', isCustom: false },
  { id: 'c4.4', sectionNo: '4', itemNo: '4.4', question: 'Are GST returns filed on time?', answerType: 'yes_no_na', answer: 'No', documentation: 'Obtained', location: 'WP-GST-04', remarks: 'Delays in Aug and Nov 2025', isCustom: false },
  { id: 'c5.1', sectionNo: '5', itemNo: '5.1', question: 'Are all applicable TDS sections covered?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-TDS-01', remarks: '', isCustom: false },
  { id: 'c5.2', sectionNo: '5', itemNo: '5.2', question: 'Is TDS deducted and deposited timely?', answerType: 'yes_no_na', answer: 'No', documentation: 'Obtained', location: 'WP-TDS-02', remarks: 'Late deposit on professional fees', isCustom: false },
  { id: 'c5.3', sectionNo: '5', itemNo: '5.3', question: 'Are TDS certificates issued?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-TDS-03', remarks: '', isCustom: false },
  { id: 'c5.4', sectionNo: '5', itemNo: '5.4', question: 'Are TDS returns filed?', answerType: 'yes_no_na', answer: 'Yes', documentation: 'Obtained', location: 'WP-TDS-04', remarks: '', isCustom: false },
]

// ─── Shared atoms ───────────────────────────────────────────────────────────
function Badge({ label, color = G.border, text = G.secondary }: { label: string; color?: string; text?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: color + '22', color: text, border: `1px solid ${color}44` }}>{label}</span>
  )
}

function SevBadge({ sev }: { sev: string }) {
  const map: Record<string, [string, string]> = {
    High: ['#EF4444', '#FEF2F2'], Medium: ['#F59E0B', '#FFFBEB'], Low: ['#10B981', '#F0FDF4'],
  }
  const [c, bg] = map[sev] ?? [G.muted, G.canvas]
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
    style={{ background: bg, color: c, border: `1px solid ${c}33` }}>{sev}</span>
}

function Pct({ value }: { value: number }) {
  const color = value === 100 ? '#10B981' : value >= 60 ? G.accent : value >= 30 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-16 h-1.5 rounded-full" style={{ background: G.border }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{value}%</span>
    </div>
  )
}

function MiniAvatar({ initials, color, size = 6 }: { initials: string; color: string; size?: number }) {
  return (
    <div className={`flex h-${size} w-${size} shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white`}
      style={{ background: color }}>{initials}</div>
  )
}

function SectionCard({ id, label, icon: Icon, stage, expanded, onToggle, children }: {
  id: string; label: string; icon: React.ElementType
  stage: { pct: number; pending: number; exceptions: number; done: boolean }
  expanded: boolean; onToggle: () => void; children: React.ReactNode
}) {
  const statusColor = stage.done ? '#10B981' : stage.pct > 0 ? G.accent : G.muted
  return (
    <div id={`stage-${id}`} className="rounded-2xl overflow-hidden transition-all"
      style={{ background: G.white, border: `1px solid ${expanded ? G.accent + '55' : G.border}`, boxShadow: expanded ? '0 4px 16px rgba(5,132,199,0.08)' : '0 1px 3px rgba(15,23,42,0.06)' }}>
      <button className="w-full flex items-center gap-3 px-5 py-3.5 text-left" onClick={onToggle}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: stage.done ? '#F0FDF4' : stage.pct > 0 ? '#EFF8FF' : G.canvas, border: `1px solid ${statusColor}33` }}>
          <Icon className="h-4 w-4" style={{ color: statusColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: G.primary }}>{label}</span>
            {stage.done && <Badge label="Complete" color="#10B981" text="#10B981" />}
            {stage.pending > 0 && <Badge label={`${stage.pending} pending`} color="#F59E0B" text="#92400E" />}
            {stage.exceptions > 0 && <Badge label={`${stage.exceptions} exceptions`} color="#EF4444" text="#991B1B" />}
          </div>
        </div>
        <Pct value={stage.pct} />
        <div className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors"
          style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
          {expanded ? <ChevronUp className="h-3 w-3" style={{ color: G.secondary }} />
                    : <ChevronDown className="h-3 w-3" style={{ color: G.secondary }} />}
        </div>
      </button>
      {expanded && (
        <div className="border-t px-5 py-4" style={{ borderColor: G.border }}>
          {children}
        </div>
      )}
    </div>
  )
}

function InnerTabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: active === t ? G.white : 'transparent', color: active === t ? G.primary : G.secondary,
            boxShadow: active === t ? '0 1px 3px rgba(15,23,42,0.08)' : 'none' }}>
          {t}
        </button>
      ))}
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: G.muted }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: G.primary }}>{value}</span>
    </div>
  )
}

// ─── Workflow stages config ─────────────────────────────────────────────────
const STATUTORY_STAGES = [
  { id: 'preliminary',    label: 'Preliminary Audit',     icon: ClipboardList },
  { id: 'caro',           label: 'CARO 2020',             icon: BarChart2     },
  { id: 'reconciliation', label: 'Reconciliation',        icon: RefreshCw     },
  { id: 'documentation',  label: 'Docs & Working Papers', icon: FileText      },
  { id: 'checklist',      label: 'Audit Checklist',       icon: CheckSquare   },
  { id: 'observations',   label: 'Observations',          icon: AlertCircle   },
  { id: 'review',         label: 'Review',                icon: Eye           },
  { id: 'signoff',        label: 'Sign-Off',              icon: PenLine       },
]

const TAX_AUDIT_STAGES = [
  { id: 'tax_forms',     label: 'Tax Audit Forms',       icon: FileCheck },
  { id: 'documentation', label: 'Docs & Working Papers', icon: FileText  },
]

type StageId = string

// ─── Stage content renderers ────────────────────────────────────────────────

function PlanningContent({ eng }: { eng: typeof ENGAGEMENTS[0] }) {
  const [sub, setSub] = useState('Details')
  const CHECKLIST = [
    { item: 'Engagement letter signed', done: true },
    { item: 'Independence check completed', done: true },
    { item: 'Prior year audit files reviewed', done: true },
    { item: 'Audit scope document finalised', done: true },
    { item: 'Materiality computed', done: true },
    { item: 'Team briefing meeting held', done: false },
    { item: 'Client PBC list shared', done: false },
  ]
  return (
    <>
      <InnerTabs tabs={['Details', 'Scope & Materiality', 'Team', 'Checklist', 'Objectives']} active={sub} onChange={setSub} />
      {sub === 'Details' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FieldRow label="Client" value={eng.client} />
          <FieldRow label="Audit Type" value={eng.type} />
          <FieldRow label="Financial Year" value={eng.fy} />
          <FieldRow label="Audit Period" value={eng.period} />
          <FieldRow label="Due Date" value={eng.dueDate} />
          <FieldRow label="Status" value={eng.status} />
          <FieldRow label="PAN" value={eng.pan} />
          <FieldRow label="GSTIN" value={eng.gstin} />
          <FieldRow label="CIN" value={eng.cin} />
        </div>
      )}
      {sub === 'Scope & Materiality' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Overall Materiality', value: '₹42.5L', note: '0.5% of Gross Revenue' },
              { label: 'Performance Materiality', value: '₹31.9L', note: '75% of Overall' },
              { label: 'Trivial Threshold', value: '₹2.1L', note: '5% of Overall' },
            ].map(m => (
              <div key={m.label} className="rounded-xl p-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: G.muted }}>{m.label}</p>
                <p className="text-xl font-bold" style={{ color: G.primary }}>{m.value}</p>
                <p className="text-[10px]" style={{ color: G.secondary }}>{m.note}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <p className="text-xs font-semibold mb-2" style={{ color: G.primary }}>Audit Scope Inclusions</p>
            <div className="flex flex-wrap gap-2">
              {['Financial Statements', 'GST Compliance', 'TDS Compliance', 'CARO Reporting', 'Related Parties', 'Loans & Advances', 'Fixed Assets', 'Revenue Recognition', 'Payroll & HR'].map(s => (
                <Badge key={s} label={s} color={G.accent} text={G.accent} />
              ))}
            </div>
          </div>
        </div>
      )}
      {sub === 'Team' && (
        <div className="grid grid-cols-2 gap-3">
          {eng.team.map(m => (
            <div key={m.name} className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
              <MiniAvatar initials={m.initials} color={m.color} size={9} />
              <div>
                <p className="text-sm font-semibold" style={{ color: G.primary }}>{m.name}</p>
                <p className="text-xs" style={{ color: G.secondary }}>{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {sub === 'Checklist' && (
        <ul className="space-y-2">
          {CHECKLIST.map((c, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ background: c.done ? '#F0FDF4' : G.canvas, border: `1px solid ${c.done ? '#10B981' : G.border}` }}>
                {c.done ? <CheckCircle2 className="h-3 w-3" style={{ color: '#10B981' }} />
                        : <Circle className="h-3 w-3" style={{ color: G.muted }} />}
              </div>
              <span className="text-sm" style={{ color: c.done ? G.secondary : G.primary }}>{c.item}</span>
            </li>
          ))}
        </ul>
      )}
      {sub === 'Objectives' && (
        <div className="space-y-2">
          {['Obtain reasonable assurance about whether the financial statements are free from material misstatement',
            'Express an opinion on whether the financial statements present a true and fair view',
            'Report on compliance with CARO 2020 requirements',
            'Identify material weaknesses in internal controls',
            'Verify GST compliance and ITC availment',
            'Confirm TDS deductions and deposits are complete and timely',
          ].map((obj, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: G.accent }}>{i + 1}</span>
              <p className="text-sm" style={{ color: G.secondary }}>{obj}</p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function QuestionnaireContent() {
  const [sub, setSub] = useState('Management')
  const QS: Record<string, Array<{ q: string; ans: string; status: 'answered' | 'pending' | 'na' }>> = {
    Management: [
      { q: 'Have there been any significant changes in the business during FY 2025-26?', ans: 'New product line launched in Q2; no major structural changes', status: 'answered' },
      { q: 'Are there any pending litigation or contingent liabilities?', ans: 'Two GST demand notices under appeal (₹12L combined)', status: 'answered' },
      { q: 'Has management identified any fraud or suspected fraud?', ans: '', status: 'pending' },
      { q: 'Were there any significant accounting estimates revised during the year?', ans: '', status: 'pending' },
    ],
    'Internal Control': [
      { q: 'Is there a documented delegation of authority matrix?', ans: 'Yes, last updated Jan 2026', status: 'answered' },
      { q: 'Are bank reconciliations performed and reviewed monthly?', ans: 'Yes, by the accounts manager', status: 'answered' },
      { q: 'Is inventory physically verified at year-end?', ans: '', status: 'pending' },
    ],
    Compliance: [
      { q: 'Have all statutory dues been deposited on time?', ans: 'Minor delays in GST — August and November 2025', status: 'answered' },
      { q: 'Is the register of contracts with related parties maintained?', ans: '', status: 'pending' },
    ],
    'Representation Letter': [
      { q: 'Management acknowledges responsibility for fair presentation of financial statements', ans: 'Signed — Rajesh Kumar, CFO, 5 Jun 2026', status: 'answered' },
      { q: 'All material transactions have been recorded', ans: '', status: 'pending' },
    ],
  }
  const tabs = Object.keys(QS)
  const items = QS[sub] ?? []
  return (
    <>
      <InnerTabs tabs={tabs} active={sub} onChange={setSub} />
      <div className="space-y-3">
        {items.map((q, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-sm font-medium" style={{ color: G.primary }}>{q.q}</p>
              <Badge label={q.status} color={q.status === 'answered' ? '#10B981' : '#F59E0B'} text={q.status === 'answered' ? '#10B981' : '#92400E'} />
            </div>
            {q.ans ? (
              <p className="text-xs rounded-lg p-2" style={{ color: G.secondary, background: G.white, border: `1px solid ${G.border}` }}>{q.ans}</p>
            ) : (
              <div className="flex gap-2">
                <input placeholder="Enter response…" className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
                  style={{ border: `1px solid ${G.border}`, background: G.white, color: G.primary }} />
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: G.accent }}>Save</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function DocRequestsContent() {
  const [sub, setSub] = useState('All')
  const filtered = sub === 'All' ? DOCUMENTS :
    sub === 'Received' ? DOCUMENTS.filter(d => d.status === 'received') :
    sub === 'Pending' ? DOCUMENTS.filter(d => d.status === 'pending') :
    sub === 'Missing' ? DOCUMENTS.filter(d => d.status === 'missing') :
    DOCUMENTS.filter(d => d.status === 'escalated')
  const statusColor: Record<string, string> = { received: '#10B981', partial: '#F59E0B', pending: '#64748B', missing: '#EF4444', escalated: '#DC2626' }
  return (
    <>
      <InnerTabs tabs={['All', 'Received', 'Pending', 'Missing', 'Escalated']} active={sub} onChange={setSub} />
      <div className="space-y-2">
        {filtered.map(doc => (
          <div key={doc.id} className="flex items-center gap-3 rounded-xl p-3"
            style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: G.white, border: `1px solid ${G.border}` }}>
              <FileText className="h-4 w-4" style={{ color: G.muted }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: G.primary }}>{doc.name}</p>
              <p className="text-[10px]" style={{ color: G.secondary }}>{doc.category} · Contact: {doc.contact} · Due: {doc.due}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {doc.verified && <Badge label="Verified" color="#10B981" text="#10B981" />}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                style={{ background: (statusColor[doc.status] ?? G.muted) + '22', color: statusColor[doc.status] ?? G.muted }}>
                {doc.status}
              </span>
              {doc.reminders > 0 && (
                <span className="text-[10px]" style={{ color: G.muted }}>{doc.reminders} reminder{doc.reminders > 1 ? 's' : ''}</span>
              )}
              <button className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                style={{ background: G.white, border: `1px solid ${G.border}` }}
                onClick={() => toast.info(`Upload document: ${doc.name}`)}>
                <Upload className="h-3 w-3" style={{ color: G.secondary }} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function RiskContent() {
  const [sub, setSub] = useState('All Risks')
  const riskMap: Record<string, string[]> = {
    'All Risks': ['Financial', 'GST', 'TDS', 'Compliance', 'Fraud'],
    'Financial': ['Financial'], 'GST': ['GST'], 'TDS': ['TDS'], 'Compliance': ['Compliance'], 'Fraud': ['Fraud'],
  }
  const filtered = RISKS.filter(r => riskMap[sub]?.includes(r.category))
  return (
    <>
      <InnerTabs tabs={['All Risks', 'Financial', 'GST', 'TDS', 'Compliance', 'Fraud']} active={sub} onChange={setSub} />
      <div className="space-y-2">
        {filtered.map(r => {
          const scoreColor = r.score >= 8 ? '#EF4444' : r.score >= 5 ? '#F59E0B' : '#10B981'
          return (
            <div key={r.id} className="rounded-xl p-4" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ background: scoreColor }}>{r.score}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold" style={{ color: G.primary }}>{r.area}</p>
                    <Badge label={r.category} color={G.accent} text={G.accent} />
                    <SevBadge sev={r.likelihood === 'High' ? 'High' : r.likelihood === 'Medium' ? 'Medium' : 'Low'} />
                  </div>
                  <p className="text-xs mb-2" style={{ color: G.secondary }}>{r.comment}</p>
                  <div className="flex gap-3 text-[10px]" style={{ color: G.muted }}>
                    <span>Likelihood: <strong style={{ color: G.primary }}>{r.likelihood}</strong></span>
                    <span>Impact: <strong style={{ color: G.primary }}>{r.impact}</strong></span>
                  </div>
                  <p className="text-[10px] mt-1.5 p-2 rounded-lg" style={{ color: G.secondary, background: G.white, border: `1px solid ${G.border}` }}>
                    Mitigation: {r.mitigation}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function GSTVerifContent() {
  const [sub, setSub] = useState('GSTR-1')
  const rules: Record<string, Array<{ rule: string; result: 'pass' | 'fail' | 'exception' | 'pending' }>> = {
    'GSTR-1': [
      { rule: 'GSTR-1 turnover matches books', result: 'pass' },
      { rule: 'B2B invoices in GSTR-1 match sales register', result: 'exception' },
      { rule: 'HSN summary reported for all supply types', result: 'pass' },
      { rule: 'Nil-rated, exempt, and non-GST supplies disclosed', result: 'pass' },
      { rule: 'Late filing fee paid where applicable', result: 'fail' },
    ],
    'GSTR-3B': [
      { rule: 'GSTR-3B liability matches GSTR-1', result: 'exception' },
      { rule: 'ITC in GSTR-3B ≤ GSTR-2A/2B auto-populated', result: 'fail' },
      { rule: 'RCM liability reported and paid', result: 'pass' },
    ],
    'ITC': [
      { rule: 'ITC availed only on valid invoices', result: 'pass' },
      { rule: 'ITC reversed on exempt supplies (Rule 42/43)', result: 'exception' },
      { rule: 'ITC on capital goods correctly capitalised', result: 'pass' },
    ],
    'GST Liability': [
      { rule: 'GST liability computed correctly on all taxable supplies', result: 'pass' },
      { rule: 'Advance receipts reported in the month received', result: 'pending' },
    ],
    'Reconciliation': [
      { rule: 'GSTR-1 vs e-Invoice reconciliation', result: 'pass' },
      { rule: 'GSTR-3B vs GSTR-1 liability reconciliation', result: 'exception' },
      { rule: 'Books turnover vs GSTR turnover reconciliation', result: 'pass' },
    ],
  }
  const resultColor: Record<string, string> = { pass: '#10B981', fail: '#EF4444', exception: '#F59E0B', pending: G.muted }
  const resultIcon: Record<string, React.ElementType> = { pass: CheckCircle2, fail: XCircle, exception: AlertTriangle, pending: Clock }
  const items = rules[sub] ?? []
  return (
    <>
      <InnerTabs tabs={['GSTR-1', 'GSTR-3B', 'ITC', 'GST Liability', 'Reconciliation']} active={sub} onChange={setSub} />
      <div className="space-y-2">
        {items.map((r, i) => {
          const RIcon = resultIcon[r.result]
          return (
            <div key={i} className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
              <RIcon className="h-4 w-4 shrink-0" style={{ color: resultColor[r.result] }} />
              <p className="flex-1 text-sm" style={{ color: G.primary }}>{r.rule}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full"
                  style={{ background: resultColor[r.result] + '22', color: resultColor[r.result] }}>{r.result}</span>
                {(r.result === 'fail' || r.result === 'exception') && (
                  <button className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #EF444433' }}
                    onClick={() => toast.info('Creating observation…')}>
                    + Observation
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function TDSVerifContent() {
  const [sub, setSub] = useState('Deduction')
  const rules: Record<string, Array<{ rule: string; result: 'pass' | 'fail' | 'exception' | 'pending' }>> = {
    'Deduction': [
      { rule: 'TDS deducted on all payments above threshold limits', result: 'exception' },
      { rule: 'Correct TDS rate applied for each section', result: 'pass' },
      { rule: 'TDS on salary correctly computed under Sec 192', result: 'pass' },
      { rule: 'Higher TDS deducted where PAN not available (Sec 206AA)', result: 'fail' },
    ],
    'Deposit': [
      { rule: 'TDS deposited within 7th of following month', result: 'pass' },
      { rule: 'March TDS deposited by 30th April', result: 'pass' },
      { rule: 'Interest for delayed deposit charged and paid', result: 'exception' },
    ],
    'Challan': [
      { rule: 'Challan BSR codes and serial numbers verified', result: 'pass' },
      { rule: 'Challan amount matches TDS payable', result: 'pass' },
    ],
    'Returns': [
      { rule: 'Form 26Q/24Q filed within due dates', result: 'pass' },
      { rule: 'Form 27Q for foreign payments filed', result: 'pending' },
    ],
    'PAN Validation': [
      { rule: 'All deductee PANs validated on TRACES', result: 'exception' },
      { rule: 'Form 16/16A issued within due date', result: 'pass' },
    ],
  }
  const resultColor: Record<string, string> = { pass: '#10B981', fail: '#EF4444', exception: '#F59E0B', pending: G.muted }
  const resultIcon: Record<string, React.ElementType> = { pass: CheckCircle2, fail: XCircle, exception: AlertTriangle, pending: Clock }
  const items = rules[sub] ?? []
  return (
    <>
      <InnerTabs tabs={['Deduction', 'Deposit', 'Challan', 'Returns', 'PAN Validation']} active={sub} onChange={setSub} />
      <div className="space-y-2">
        {items.map((r, i) => {
          const RIcon = resultIcon[r.result]
          return (
            <div key={i} className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
              <RIcon className="h-4 w-4 shrink-0" style={{ color: resultColor[r.result] }} />
              <p className="flex-1 text-sm" style={{ color: G.primary }}>{r.rule}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full"
                  style={{ background: resultColor[r.result] + '22', color: resultColor[r.result] }}>{r.result}</span>
                {(r.result === 'fail' || r.result === 'exception') && (
                  <button className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #EF444433' }}
                    onClick={() => toast.info('Creating observation…')}>
                    + Observation
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function CAROContent({ auditType }: { auditType: string }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const statusColor: Record<string, string> = { complete: '#10B981', in_progress: G.accent, pending: '#F59E0B', not_applicable: G.muted }
  const statusLabel: Record<string, string> = { complete: 'Complete', in_progress: 'In Progress', pending: 'Pending', not_applicable: 'N/A' }
  const isTaxAudit = auditType === 'Tax Audit' || auditType === 'Tax Audit (u/s 44AB)'
  const clauses = isTaxAudit ? FORM_3CD_CLAUSES : CARO_CLAUSES
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: isTaxAudit ? '#EFF8FF' : '#F0FDF4', border: `1px solid ${isTaxAudit ? G.accent + '44' : '#10B98144'}` }}>
          <FileCheck className="h-3.5 w-3.5" style={{ color: isTaxAudit ? G.accent : '#10B981' }} />
          <span className="text-xs font-bold" style={{ color: isTaxAudit ? G.accent : '#10B981' }}>
            {isTaxAudit ? 'Form 3CD — Tax Audit Report (Sec 44AB)' : 'CARO 2020 — Companies Auditor\'s Report Order'}
          </span>
          <Badge label={`${clauses.length} clauses`} color={isTaxAudit ? G.accent : '#10B981'} text={isTaxAudit ? G.accent : '#10B981'} />
        </div>
        <div className="ml-auto flex gap-3 text-[11px]" style={{ color: G.muted }}>
          <span style={{ color: '#10B981' }}>✓ {clauses.filter(c => c.status === 'complete').length} complete</span>
          <span style={{ color: '#F59E0B' }}>⏳ {clauses.filter(c => c.status === 'in_progress').length} in progress</span>
          <span style={{ color: '#EF4444' }}>⚠ {clauses.filter(c => c.status === 'pending').length} pending</span>
        </div>
      </div>
      {clauses.map(c => (
        <div key={c.id} className="rounded-xl overflow-hidden" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
            <span className="text-[10px] font-mono font-bold" style={{ color: G.muted }}>{c.no}</span>
            <p className="flex-1 text-sm font-medium" style={{ color: G.primary }}>{c.title}</p>
            <div className="flex items-center gap-2 shrink-0">
              <SevBadge sev={c.risk as string} />
              <Badge label={statusLabel[c.status]} color={statusColor[c.status]} text={statusColor[c.status]} />
              {c.evidence > 0 && <span className="text-[10px]" style={{ color: G.muted }}>{c.evidence} evidence</span>}
              {c.observations > 0 && <span className="text-[10px]" style={{ color: '#EF4444' }}>{c.observations} obs</span>}
              {expanded === c.id ? <ChevronUp className="h-3 w-3" style={{ color: G.muted }} /> : <ChevronDown className="h-3 w-3" style={{ color: G.muted }} />}
            </div>
          </button>
          {expanded === c.id && (
            <div className="px-4 pb-4 border-t" style={{ borderColor: G.border }}>
              <p className="text-sm mt-3 mb-3" style={{ color: G.secondary }}>{c.comment}</p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: G.white, border: `1px solid ${G.border}`, color: G.secondary }}
                  onClick={() => toast.info('Attaching evidence…')}>
                  <Paperclip className="h-3 w-3 inline mr-1" />Attach Evidence
                </button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: '#FEF2F2', border: '1px solid #EF444433', color: '#EF4444' }}
                  onClick={() => toast.info('Creating observation…')}>
                  <AlertCircle className="h-3 w-3 inline mr-1" />Raise Observation
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function WorkingPapersContent() {
  const [sub, setSub] = useState('Revenue')
  const areas = ['Revenue', 'Expenses', 'Bank', 'Fixed Assets', 'GST', 'TDS', 'Payroll', 'Loans', 'Controls']
  const papers = WORKING_PAPERS_DATA.filter(p => p.area === sub)
  const statusColor: Record<string, string> = { complete: '#10B981', in_review: G.accent, draft: '#F59E0B', pending: G.muted }
  return (
    <>
      <InnerTabs tabs={areas} active={sub} onChange={setSub} />
      {papers.length === 0 ? (
        <div className="py-10 text-center">
          <FileText className="h-8 w-8 mx-auto mb-2" style={{ color: G.muted }} />
          <p className="text-sm" style={{ color: G.muted }}>No working papers for {sub} yet</p>
          <button className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: G.accent }}
            onClick={() => toast.info(`Create working paper for ${sub}`)}>
            <Plus className="h-3 w-3 inline mr-1" />Create Working Paper
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {papers.map(p => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: G.white, border: `1px solid ${G.border}` }}>
                <FileText className="h-4 w-4" style={{ color: G.muted }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: G.primary }}>{p.title}</p>
                <p className="text-[10px]" style={{ color: G.secondary }}>Preparer: {p.preparer} · Reviewer: {p.reviewer} · Due: {p.due} · v{p.version}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.flag && <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#F59E0B' }} />}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                  style={{ background: (statusColor[p.status] ?? G.muted) + '22', color: statusColor[p.status] ?? G.muted }}>
                  {p.status.replace('_', ' ')}
                </span>
                <button className="p-1.5 rounded-lg" style={{ background: G.white, border: `1px solid ${G.border}` }}
                  onClick={() => toast.info(`Open: ${p.title}`)}>
                  <ArrowRight className="h-3 w-3" style={{ color: G.secondary }} />
                </button>
              </div>
            </div>
          ))}
          <button className="mt-1 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: G.white, border: `1px dashed ${G.border}`, color: G.secondary, width: '100%' }}
            onClick={() => toast.info(`Create working paper for ${sub}`)}>
            <Plus className="h-3 w-3 inline mr-1" />Add Working Paper
          </button>
        </div>
      )}
    </>
  )
}

function ObservationsContent() {
  const columns = [
    { id: 'open', label: 'Open', color: '#EF4444' },
    { id: 'mgmt_pending', label: 'Mgmt Response Pending', color: '#F59E0B' },
    { id: 'under_review', label: 'Under Review', color: G.accent },
    { id: 'resolved', label: 'Resolved', color: '#10B981' },
  ]
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map(col => {
        const items = OBS_LIST.filter(o => o.status === col.id)
        return (
          <div key={col.id} className="flex-none w-56 rounded-xl p-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full" style={{ background: col.color }} />
              <span className="text-xs font-bold" style={{ color: G.primary }}>{col.label}</span>
              <span className="ml-auto text-[10px] font-bold rounded-full px-1.5"
                style={{ background: col.color + '22', color: col.color }}>{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(obs => (
                <div key={obs.id} className="rounded-xl p-3"
                  style={{ background: G.white, border: `1px solid ${G.border}`, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] font-mono" style={{ color: G.muted }}>{obs.id}</span>
                    <SevBadge sev={obs.severity} />
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color: G.primary }}>{obs.title}</p>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: G.muted }}>
                    <span>{obs.area}</span>
                    <span>·</span>
                    <span style={{ color: obs.impact !== 'Nil' ? '#EF4444' : G.muted }}>{obs.impact}</span>
                  </div>
                  {obs.response && (
                    <p className="text-[10px] mt-1.5 p-1.5 rounded-lg" style={{ background: G.canvas, color: G.secondary }}>{obs.response}</p>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-center py-4 text-[10px]" style={{ color: G.muted }}>No items</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MgmtResponsesContent() {
  return (
    <div className="space-y-3">
      {OBS_LIST.filter(o => o.status !== 'open').map(obs => (
        <div key={obs.id} className="rounded-xl p-4" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-mono" style={{ color: G.muted }}>{obs.id}</span>
                <SevBadge sev={obs.severity} />
                <Badge label={obs.area} color={G.accent} text={G.accent} />
              </div>
              <p className="text-sm font-semibold mb-2" style={{ color: G.primary }}>{obs.title}</p>
              {obs.response ? (
                <div className="rounded-lg p-3" style={{ background: G.white, border: `1px solid ${G.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: G.muted }}>Management Response</p>
                  <p className="text-xs" style={{ color: G.secondary }}>{obs.response}</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input placeholder="Enter management response…" className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
                    style={{ border: `1px solid ${G.border}`, background: G.white, color: G.primary }} />
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shrink-0" style={{ background: G.accent }}>Save</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReviewContent() {
  const CHECKLIST = [
    { item: 'All working papers reviewed and signed off', done: false },
    { item: 'All observations raised and responses received', done: false },
    { item: 'CARO checklist complete', done: false },
    { item: 'Materiality assessment finalised', done: true },
    { item: 'Subsequent events review completed', done: false },
    { item: 'Going concern assessment done', done: false },
    { item: 'Draft financial statements reviewed', done: false },
    { item: 'Management letter drafted', done: false },
  ]
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: '#FFFBEB', border: '1px solid #FCD34D66' }}>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4" style={{ color: '#F59E0B' }} />
          <p className="text-sm font-semibold" style={{ color: '#92400E' }}>Pending Blockers</p>
        </div>
        <ul className="text-xs space-y-1 pl-6 list-disc" style={{ color: '#78350F' }}>
          <li>3 working papers pending partner review</li>
          <li>Management response awaited for OBS-001 (₹28.4L — Revenue)</li>
          <li>Board minutes not received (escalated)</li>
        </ul>
      </div>
      <ul className="space-y-2">
        {CHECKLIST.map((c, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ background: c.done ? '#F0FDF4' : G.canvas, border: `1px solid ${c.done ? '#10B981' : G.border}` }}>
              {c.done ? <CheckCircle2 className="h-3 w-3" style={{ color: '#10B981' }} /> : <Circle className="h-3 w-3" style={{ color: G.muted }} />}
            </div>
            <span className="text-sm" style={{ color: c.done ? G.secondary : G.primary }}>{c.item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SignOffContent() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: '#FEF2F2', border: '1px solid #EF444433' }}>
        <div className="flex items-center gap-2 mb-1">
          <XCircle className="h-4 w-4" style={{ color: '#EF4444' }} />
          <p className="text-sm font-semibold" style={{ color: '#991B1B' }}>Sign-off blocked — review not complete</p>
        </div>
        <p className="text-xs" style={{ color: '#B91C1C' }}>Complete the Review stage before proceeding to Sign-Off.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { role: 'Preparer Sign-off', name: 'Arjun Mehta', status: 'Signed', date: '20 Jun 2026' },
          { role: 'Manager Sign-off', name: 'Rohan Verma', status: 'Signed', date: '22 Jun 2026' },
          { role: 'Partner Sign-off', name: 'Priya Sharma', status: 'Pending', date: '' },
        ].map(s => (
          <div key={s.role} className="rounded-xl p-4" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: G.muted }}>{s.role}</p>
            <p className="text-sm font-semibold" style={{ color: G.primary }}>{s.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge label={s.status} color={s.status === 'Signed' ? '#10B981' : '#F59E0B'} text={s.status === 'Signed' ? '#10B981' : '#92400E'} />
              {s.date && <span className="text-[10px]" style={{ color: G.secondary }}>{s.date}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── New composite stage components ─────────────────────────────────────────

function PreliminaryContent({ eng, showMgmtResponse }: { eng: typeof ENGAGEMENTS[0]; showMgmtResponse: boolean }) {
  const tabs = showMgmtResponse
    ? ['Planning', 'Risk Assessment', 'Questionnaires', 'Management Response']
    : ['Planning', 'Risk Assessment', 'Questionnaires']
  const [sub, setSub] = useState('Planning')

  return (
    <>
      <InnerTabs tabs={tabs} active={sub} onChange={setSub} />
      {sub === 'Planning'           && <PlanningContent eng={eng} />}
      {sub === 'Risk Assessment'    && <RiskContent />}
      {sub === 'Questionnaires'     && <QuestionnaireContent />}
      {sub === 'Management Response' && <MgmtResponsesContent />}
    </>
  )
}

function CAROWithApplicabilityContent({ auditType }: { auditType: string }) {
  const [caroApplicable, setCaroApplicable] = useState(true)
  const [caroReason, setCaroReason] = useState('Company type (Private Ltd / Public Ltd / LLP)')

  const reasons = [
    'Company type (Private Ltd / Public Ltd / LLP)',
    'Turnover > ₹10 Crore',
    'Not applicable — exempted',
  ]

  return (
    <div className="space-y-4">
      {/* Applicability banner */}
      <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-semibold" style={{ color: G.primary }}>CARO 2020 Applicable?</span>
          <button
            onClick={() => setCaroApplicable(v => !v)}
            className="relative flex-none"
            style={{ width: 36, height: 20 }}
            title={caroApplicable ? 'Click to mark as Not Applicable' : 'Click to mark as Applicable'}
          >
            <div className="absolute inset-0 rounded-full transition-colors" style={{ background: caroApplicable ? G.accent : G.border }} />
            <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
              style={{ left: caroApplicable ? '18px' : '2px' }} />
          </button>
          <span className="text-xs font-semibold" style={{ color: caroApplicable ? G.accent : G.muted }}>
            {caroApplicable ? 'Yes' : 'No'}
          </span>
        </div>
        {!caroApplicable && (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: G.secondary }}>Reason:</span>
            <select
              value={caroReason}
              onChange={e => setCaroReason(e.target.value)}
              className="rounded-lg px-2 py-1 text-xs focus:outline-none"
              style={{ border: `1px solid ${G.border}`, background: G.white, color: G.primary }}
            >
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}
      </div>

      {!caroApplicable ? (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#F1F5F9', border: `1px solid ${G.border}` }}>
          <AlertCircle className="h-5 w-5 shrink-0" style={{ color: G.muted }} />
          <p className="text-sm" style={{ color: G.secondary }}>CARO 2020 not applicable for this engagement — {caroReason}</p>
        </div>
      ) : (
        <CAROContent auditType={auditType} />
      )}
    </div>
  )
}

function ReconciliationContent() {
  const [sub, setSub] = useState('GST')
  return (
    <>
      <InnerTabs tabs={['GST', 'TDS']} active={sub} onChange={setSub} />
      {sub === 'GST' && <GSTVerifContent />}
      {sub === 'TDS' && <TDSVerifContent />}
    </>
  )
}

function DocumentationContent() {
  const [sub, setSub] = useState('Documents')
  return (
    <>
      <InnerTabs tabs={['Documents', 'Working Papers']} active={sub} onChange={setSub} />
      {sub === 'Documents'      && <DocRequestsContent />}
      {sub === 'Working Papers' && <WorkingPapersContent />}
    </>
  )
}

// ─── Audit Checklist ─────────────────────────────────────────────────────────

function AuditChecklistContent() {
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_CHECKLIST)
  const [showAddForm, setShowAddForm] = useState(false)
  const [customQ, setCustomQ] = useState('')
  const [customType, setCustomType] = useState<'yes_no_na' | 'text' | 'tabular'>('yes_no_na')
  const [customSection, setCustomSection] = useState('1')

  function updateItem(id: string, field: keyof ChecklistItem, value: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it))
  }

  function addCustomItem() {
    if (!customQ.trim()) return
    const sec = CHECKLIST_SECTIONS.find(s => s.no === customSection)!
    const sectionItems = items.filter(i => i.sectionNo === customSection)
    const lastNo = sectionItems.length > 0 ? sectionItems[sectionItems.length - 1].itemNo : `${customSection}.0`
    const nextNum = parseFloat(lastNo.split('.')[1] ?? '0') + 1
    const newItem: ChecklistItem = {
      id: `c${customSection}.${nextNum}`,
      sectionNo: customSection,
      itemNo: `${customSection}.${nextNum}`,
      question: customQ.trim(),
      answerType: customType,
      answer: '', documentation: '', location: '', remarks: '',
      isCustom: true,
    }
    setItems(prev => [...prev, newItem])
    setCustomQ('')
    setShowAddForm(false)
    toast.success(`Custom item added to Section ${customSection} — ${sec.name}`)
  }

  const thStyle: React.CSSProperties = {
    padding: '8px 10px', border: `1px solid ${G.border}`,
    textAlign: 'left', fontWeight: 600, fontSize: 11, color: G.secondary,
    background: G.canvas, whiteSpace: 'nowrap',
  }
  const tdStyle: React.CSSProperties = {
    padding: '8px 10px', border: `1px solid ${G.border}`,
    color: G.primary, verticalAlign: 'middle', fontSize: 12,
  }
  const selectStyle: React.CSSProperties = {
    appearance: 'none', padding: '4px 6px', borderRadius: 6,
    border: `1px solid ${G.border}`, background: G.white, fontSize: 11,
    color: G.primary, width: '100%', cursor: 'pointer',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '4px 6px', borderRadius: 6,
    border: `1px solid ${G.border}`, background: G.white,
    fontSize: 11, color: G.primary, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 46 }}>#</th>
              <th style={thStyle}>Checklist Item</th>
              <th style={{ ...thStyle, width: 90 }}>Answer</th>
              <th style={{ ...thStyle, width: 130 }}>Documentation</th>
              <th style={{ ...thStyle, width: 110 }}>Location</th>
              <th style={{ ...thStyle, width: 160 }}>Remarks / If any</th>
            </tr>
          </thead>
          <tbody>
            {CHECKLIST_SECTIONS.map(section => (
              <>
                <tr key={`sec-${section.no}`}>
                  <td colSpan={6} style={{ ...tdStyle, background: '#F1F5F9', fontWeight: 700, color: G.primary, fontSize: 11 }}>
                    {section.no} — {section.name}
                  </td>
                </tr>
                {items.filter(it => it.sectionNo === section.no).map(it => (
                  <tr key={it.id} style={{ background: it.isCustom ? '#FAFEFF' : G.white }}>
                    <td style={{ ...tdStyle, color: G.muted, fontSize: 11 }}>{it.itemNo}</td>
                    <td style={{ ...tdStyle, maxWidth: 340 }}>
                      <span style={{ color: G.primary }}>{it.question}</span>
                      {it.isCustom && <Badge label="Custom" color={G.accent} text={G.accent} />}
                    </td>
                    <td style={tdStyle}>
                      {it.answerType === 'yes_no_na' ? (
                        <select value={it.answer} onChange={e => updateItem(it.id, 'answer', e.target.value)} style={selectStyle}>
                          <option value="">—</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="N/A">N/A</option>
                        </select>
                      ) : (
                        <input value={it.answer} onChange={e => updateItem(it.id, 'answer', e.target.value)} style={inputStyle} placeholder="Enter…" />
                      )}
                    </td>
                    <td style={tdStyle}>
                      <select value={it.documentation} onChange={e => updateItem(it.id, 'documentation', e.target.value)} style={selectStyle}>
                        <option value="">—</option>
                        <option value="Obtained">Obtained</option>
                        <option value="Not Required">Not Required</option>
                        <option value="Pending">Pending</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <input value={it.location} onChange={e => updateItem(it.id, 'location', e.target.value)} style={inputStyle} placeholder="WP ref…" />
                    </td>
                    <td style={tdStyle}>
                      <input value={it.remarks} onChange={e => updateItem(it.id, 'remarks', e.target.value)} style={inputStyle} placeholder="Notes…" />
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add custom item */}
      <div className="mt-4">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: G.white, border: `1px dashed ${G.border}`, color: G.secondary }}
          >
            <Plus className="h-3.5 w-3.5" />+ Add Custom Item
          </button>
        ) : (
          <div className="p-4 rounded-xl space-y-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <p className="text-xs font-bold" style={{ color: G.primary }}>Add Custom Checklist Item</p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: G.muted }}>Question</label>
                <input
                  value={customQ}
                  onChange={e => setCustomQ(e.target.value)}
                  placeholder="Enter checklist question…"
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                  style={{ border: `1px solid ${G.border}`, background: G.white, color: G.primary }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: G.muted }}>Answer Type</label>
                  <select
                    value={customType}
                    onChange={e => setCustomType(e.target.value as 'yes_no_na' | 'text' | 'tabular')}
                    className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                    style={{ border: `1px solid ${G.border}`, background: G.white, color: G.primary }}
                  >
                    <option value="yes_no_na">Yes / No / N/A</option>
                    <option value="text">Fill the Blank</option>
                    <option value="tabular">Tabular Data</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: G.muted }}>Section</label>
                  <select
                    value={customSection}
                    onChange={e => setCustomSection(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                    style={{ border: `1px solid ${G.border}`, background: G.white, color: G.primary }}
                  >
                    {CHECKLIST_SECTIONS.map(s => (
                      <option key={s.no} value={s.no}>{s.no} — {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addCustomItem}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: G.accent }}
              >
                Add Item
              </button>
              <button
                onClick={() => { setShowAddForm(false); setCustomQ('') }}
                className="px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ background: G.white, border: `1px solid ${G.border}`, color: G.secondary }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tax Audit Forms ──────────────────────────────────────────────────────────

type TaxFormItem = { id: string; no: string; question: string; answer: string; documentation: string; location: string; remarks: string }

const FORM_3CA_BASE: TaxFormItem[] = [
  { id: '3ca_1', no: '1', question: 'Is the entity required to get accounts audited under any law other than Income Tax Act?', answer: 'Yes', documentation: 'Obtained', location: 'WP-3CA-01', remarks: '' },
  { id: '3ca_2', no: '2', question: 'Has the audit been conducted and signed by a qualified CA?', answer: 'Yes', documentation: 'Obtained', location: 'WP-3CA-02', remarks: '' },
  { id: '3ca_3', no: '3', question: 'Does the report comply with the format prescribed under Rule 6G?', answer: 'Yes', documentation: 'Obtained', location: 'WP-3CA-03', remarks: '' },
  { id: '3ca_4', no: '4', question: 'Is Form 3CD attached along with Form 3CA?', answer: '', documentation: 'Pending', location: '', remarks: 'Awaiting 3CD completion' },
  { id: '3ca_5', no: '5', question: 'Are all disclosures complete and accurate?', answer: '', documentation: 'Pending', location: '', remarks: '' },
]

const FORM_3CB_BASE: TaxFormItem[] = [
  { id: '3cb_1', no: '1', question: 'Is the entity NOT required to get accounts audited under any other law?', answer: 'Yes', documentation: 'Obtained', location: 'WP-3CB-01', remarks: '' },
  { id: '3cb_2', no: '2', question: 'Has the CA conducted independent audit procedures?', answer: 'Yes', documentation: 'Obtained', location: 'WP-3CB-02', remarks: '' },
  { id: '3cb_3', no: '3', question: 'Are financial statements prepared as per applicable accounting standards?', answer: 'Yes', documentation: 'Obtained', location: 'WP-3CB-03', remarks: '' },
  { id: '3cb_4', no: '4', question: 'Is the audit conducted for the full period of the previous year?', answer: 'Yes', documentation: 'Obtained', location: 'WP-3CB-04', remarks: '' },
  { id: '3cb_5', no: '5', question: 'Are all significant accounting policies disclosed?', answer: '', documentation: 'Pending', location: '', remarks: '' },
]

const FORM_3CE_BASE: TaxFormItem[] = [
  { id: '3ce_1', no: '1', question: 'Is the assessee a non-resident receiving royalties/fees for technical services?', answer: 'Yes', documentation: 'Obtained', location: 'WP-3CE-01', remarks: '' },
  { id: '3ce_2', no: '2', question: 'Is the income taxable under section 44DA?', answer: 'Yes', documentation: 'Obtained', location: 'WP-3CE-02', remarks: '' },
  { id: '3ce_3', no: '3', question: 'Are the agreements/contracts documented?', answer: 'Yes', documentation: 'Obtained', location: 'WP-3CE-03', remarks: '' },
  { id: '3ce_4', no: '4', question: 'Has the income been correctly computed as per applicable provisions?', answer: '', documentation: 'Pending', location: '', remarks: '' },
]

function statusToAnswer(status: string): string {
  if (status === 'complete') return 'Yes'
  if (status === 'not_applicable') return 'N/A'
  return ''
}

function TaxAuditFormsContent() {
  const [activeForm, setActiveForm] = useState<'3CA' | '3CB' | '3CD' | '3CE'>('3CA')

  const form3cdBase: TaxFormItem[] = FORM_3CD_CLAUSES.map(c => ({
    id: `3cd_${c.id}`,
    no: c.no,
    question: c.title,
    answer: statusToAnswer(c.status),
    documentation: c.evidence > 0 ? 'Obtained' : (c.status === 'not_applicable' ? 'N/A' : 'Pending'),
    location: c.evidence > 0 ? `WP-3CD-${c.id.toString().padStart(2, '0')}` : '',
    remarks: c.observations > 0 ? `${c.observations} observation(s)` : '',
  }))

  const [items3ca, setItems3ca] = useState<TaxFormItem[]>(FORM_3CA_BASE)
  const [items3cb, setItems3cb] = useState<TaxFormItem[]>(FORM_3CB_BASE)
  const [items3cd, setItems3cd] = useState<TaxFormItem[]>(form3cdBase)
  const [items3ce, setItems3ce] = useState<TaxFormItem[]>(FORM_3CE_BASE)

  const currentItems = activeForm === '3CA' ? items3ca : activeForm === '3CB' ? items3cb : activeForm === '3CD' ? items3cd : items3ce
  const setCurrentItems = activeForm === '3CA' ? setItems3ca : activeForm === '3CB' ? setItems3cb : activeForm === '3CD' ? setItems3cd : setItems3ce

  function updateItem(id: string, field: keyof TaxFormItem, value: string) {
    setCurrentItems((prev: TaxFormItem[]) => prev.map(it => it.id === id ? { ...it, [field]: value } : it))
  }

  const FORMS: Array<{ id: '3CA' | '3CB' | '3CD' | '3CE'; label: string; desc: string }> = [
    { id: '3CA', label: 'Form 3CA', desc: 'Audit report u/s 44AB — accounts audited under other law' },
    { id: '3CB', label: 'Form 3CB', desc: 'Audit report u/s 44AB — accounts not audited under other law' },
    { id: '3CD', label: 'Form 3CD', desc: 'Statement of particulars required to be furnished' },
    { id: '3CE', label: 'Form 3CE', desc: 'Audit report u/s 44DA (royalties/fees from foreign companies)' },
  ]

  const thStyle: React.CSSProperties = {
    padding: '8px 10px', border: `1px solid ${G.border}`,
    textAlign: 'left', fontWeight: 600, fontSize: 11, color: G.secondary,
    background: G.canvas, whiteSpace: 'nowrap',
  }
  const tdStyle: React.CSSProperties = {
    padding: '8px 10px', border: `1px solid ${G.border}`,
    color: G.primary, verticalAlign: 'middle', fontSize: 12,
  }
  const selectStyle: React.CSSProperties = {
    appearance: 'none', padding: '4px 6px', borderRadius: 6,
    border: `1px solid ${G.border}`, background: G.white, fontSize: 11,
    color: G.primary, width: '100%', cursor: 'pointer',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '4px 6px', borderRadius: 6,
    border: `1px solid ${G.border}`, background: G.white,
    fontSize: 11, color: G.primary, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div className="space-y-4">
      {/* Form selector segmented control */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
        {FORMS.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveForm(f.id)}
            className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all text-left"
            style={{
              background: activeForm === f.id ? G.white : 'transparent',
              color: activeForm === f.id ? G.primary : G.secondary,
              boxShadow: activeForm === f.id ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
              border: activeForm === f.id ? `1px solid ${G.border}` : '1px solid transparent',
            }}
          >
            <p className="font-bold" style={{ color: activeForm === f.id ? G.accent : G.secondary }}>{f.label}</p>
            <p className="text-[10px] leading-tight mt-0.5 hidden md:block" style={{ color: G.muted }}>{f.desc}</p>
          </button>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] flex-1" style={{ color: G.muted }}>
          Form {activeForm} · Last saved: Jun 28, 2026
        </span>
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: G.white, border: `1px solid ${G.border}`, color: G.secondary }}
          onClick={() => toast.success('Draft saved')}
        >
          Save Draft
        </button>
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: G.white, border: `1px solid ${G.accent}`, color: G.accent }}
          onClick={() => toast.info('Submitted for review')}
        >
          Submit for Review
        </button>
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
          style={{ background: G.accent }}
          onClick={() => toast.success('Filed successfully')}
        >
          File
        </button>
      </div>

      {/* Checklist table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 80 }}>#</th>
              <th style={thStyle}>Item</th>
              <th style={{ ...thStyle, width: 90 }}>Answer</th>
              <th style={{ ...thStyle, width: 130 }}>Documentation</th>
              <th style={{ ...thStyle, width: 110 }}>Location</th>
              <th style={{ ...thStyle, width: 160 }}>Remarks / If any</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(it => (
              <tr key={it.id} style={{ background: G.white }}>
                <td style={{ ...tdStyle, color: G.muted, fontSize: 11 }}>{it.no}</td>
                <td style={{ ...tdStyle, maxWidth: 340 }}>{it.question}</td>
                <td style={tdStyle}>
                  <select value={it.answer} onChange={e => updateItem(it.id, 'answer', e.target.value)} style={selectStyle}>
                    <option value="">—</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="N/A">N/A</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <select value={it.documentation} onChange={e => updateItem(it.id, 'documentation', e.target.value)} style={selectStyle}>
                    <option value="">—</option>
                    <option value="Obtained">Obtained</option>
                    <option value="Not Required">Not Required</option>
                    <option value="Pending">Pending</option>
                    <option value="N/A">N/A</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <input value={it.location} onChange={e => updateItem(it.id, 'location', e.target.value)} style={inputStyle} placeholder="WP ref…" />
                </td>
                <td style={tdStyle}>
                  <input value={it.remarks} onChange={e => updateItem(it.id, 'remarks', e.target.value)} style={inputStyle} placeholder="Notes…" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Right Panel ─────────────────────────────────────────────────────────────
function RightPanel({ eng, stageStatus }: { eng: typeof ENGAGEMENTS[0]; stageStatus: typeof STAGE_STATUS[1] }) {
  const openObs = OBS_LIST.filter(o => o.status === 'open').length
  const missingDocs = DOCUMENTS.filter(d => d.status === 'missing' || d.status === 'escalated').length
  const pendingTasks = Object.values(stageStatus).reduce((acc, s) => acc + s.pending, 0)
  const totalExceptions = Object.values(stageStatus).reduce((acc, s) => acc + s.exceptions, 0)

  return (
    <div className="space-y-3">
      {/* Health Score */}
      <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold" style={{ color: G.primary }}>Audit Health</span>
          <span className="text-xs" style={{ color: G.muted }}>/ 100</span>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold" style={{ color: eng.healthScore >= 75 ? '#10B981' : eng.healthScore >= 50 ? '#F59E0B' : '#EF4444' }}>
            {eng.healthScore}
          </span>
          <Star className="h-4 w-4 mb-1" style={{ color: '#F59E0B' }} />
        </div>
        <div className="relative h-2 rounded-full mb-1" style={{ background: G.border }}>
          <div className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${eng.healthScore}%`, background: eng.healthScore >= 75 ? '#10B981' : '#F59E0B' }} />
        </div>
        <p className="text-[10px]" style={{ color: G.muted }}>Overall Progress: {eng.progress}%</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Pending Tasks', value: pendingTasks, color: '#F59E0B', icon: Clock },
          { label: 'Open Obs', value: openObs, color: '#EF4444', icon: AlertCircle },
          { label: 'Exceptions', value: totalExceptions, color: '#F59E0B', icon: AlertTriangle },
          { label: 'Missing Docs', value: missingDocs, color: '#EF4444', icon: Folder },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3" style={{ background: G.white, border: `1px solid ${G.border}` }}>
            <s.icon className="h-4 w-4 mb-1" style={{ color: s.color }} />
            <p className="text-lg font-bold" style={{ color: s.value > 0 ? s.color : G.primary }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: G.muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming deadlines */}
      <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
        <p className="text-xs font-bold mb-3" style={{ color: G.primary }}>Upcoming Deadlines</p>
        <div className="space-y-2">
          {[
            { item: 'WP-Revenue-001 Review', date: '10 Jul', urgent: false },
            { item: 'OBS-001 Management Response', date: '10 Jul', urgent: true },
            { item: 'CARO Clause 3(iv) Complete', date: '12 Jul', urgent: true },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: d.urgent ? '#EF4444' : G.muted }} />
              <p className="flex-1 text-[11px] leading-tight" style={{ color: G.secondary }}>{d.item}</p>
              <span className="text-[10px] font-semibold shrink-0" style={{ color: d.urgent ? '#EF4444' : G.muted }}>{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* High-risk issues */}
      <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
        <p className="text-xs font-bold mb-3" style={{ color: G.primary }}>High Risk Issues</p>
        <div className="space-y-2">
          {RISKS.filter(r => r.score >= 6).map(r => (
            <div key={r.id} className="flex items-start gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: r.score >= 8 ? '#EF4444' : '#F59E0B' }}>{r.score}</div>
              <p className="text-[11px] leading-tight" style={{ color: G.secondary }}>{r.area}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
        <p className="text-xs font-bold mb-3" style={{ color: G.primary }}>Assigned Team</p>
        <div className="space-y-2">
          {eng.team.map(m => (
            <div key={m.name} className="flex items-center gap-2">
              <MiniAvatar initials={m.initials} color={m.color} size={7} />
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-none" style={{ color: G.primary }}>{m.name}</p>
                <p className="text-[10px]" style={{ color: G.muted }}>{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl p-4" style={{ background: G.white, border: `1px solid ${G.border}` }}>
        <p className="text-xs font-bold mb-3" style={{ color: G.primary }}>Recent Activity</p>
        <div className="space-y-2.5">
          {ACTIVITIES.map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: G.muted }}>{a.user}</div>
              <div>
                <p className="text-[11px] leading-tight" style={{ color: G.secondary }}>{a.text}</p>
                <p className="text-[10px]" style={{ color: G.muted }}>{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const AUDIT_TYPES = [
  'Statutory Audit',
  'Tax Audit (u/s 44AB)',
  'Internal Audit',
  'Stock Audit',
  'GST Audit',
  'Transfer Pricing Audit',
  'Concurrent Audit',
  'Special Purpose Audit',
]

const AUDIT_TYPE_META: Record<string, { icon: typeof FileCheck; desc: string; color: string }> = {
  'Statutory Audit': {
    icon: FileCheck,
    desc: 'Annual statutory audit under Companies Act with CARO compliance',
    color: '#0584C7',
  },
  'Tax Audit (u/s 44AB)': {
    icon: FileText,
    desc: 'Tax audit report u/s 44AB — Forms 3CA, 3CB, 3CD & 3CE',
    color: '#8B5CF6',
  },
  'Internal Audit': {
    icon: Shield,
    desc: 'Internal controls review and operational risk assessment',
    color: '#10B981',
  },
  'Stock Audit': {
    icon: BarChart2,
    desc: 'Physical stock verification and inventory valuation audit',
    color: '#F59E0B',
  },
  'GST Audit': {
    icon: RefreshCw,
    desc: 'GST compliance audit — returns, ITC reconciliation & filings',
    color: '#0EA5E9',
  },
  'Transfer Pricing Audit': {
    icon: TrendingUp,
    desc: 'Related-party transactions and arm\'s-length pricing review',
    color: '#EC4899',
  },
  'Concurrent Audit': {
    icon: Activity,
    desc: 'Continuous audit during the financial year for banks & PSUs',
    color: '#6366F1',
  },
  'Special Purpose Audit': {
    icon: Star,
    desc: 'Custom-scope audit for specific regulatory or lender requirements',
    color: '#64748B',
  },
}

function countEngagementsForType(type: string) {
  return ENGAGEMENTS.filter(e =>
    e.type === type ||
    (type === 'Tax Audit (u/s 44AB)' && e.type === 'Tax Audit')
  ).length
}

function AuditTypeSelection({
  visibleTypes,
  onSelect,
  onToggleVisibility,
  onShowAll,
  showSettings,
  setShowSettings,
}: {
  visibleTypes: Set<string>
  onSelect: (type: string) => void
  onToggleVisibility: (type: string) => void
  onShowAll: () => void
  showSettings: boolean
  setShowSettings: (v: boolean | ((prev: boolean) => boolean)) => void
}) {
  const visibleList = AUDIT_TYPES.filter(t => visibleTypes.has(t))

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: G.primary }}>Audit</h1>
          <p className="text-sm mt-0.5" style={{ color: G.secondary }}>
            Select an audit type to open engagements and workflow stages
          </p>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowSettings(v => !v)}
            title="Customize visible audit types"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
            style={{
              background: showSettings ? G.accent + '15' : G.white,
              border: `1px solid ${showSettings ? G.accent : G.border}`,
              color: showSettings ? G.accent : G.secondary,
            }}
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Customize</span>
          </button>

          {showSettings && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
              <div
                className="absolute right-0 top-full mt-2 z-50 rounded-2xl shadow-xl"
                style={{ background: G.white, border: `1px solid ${G.border}`, width: 300 }}
              >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${G.border}` }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: G.primary }}>Customize Audit Types</p>
                    <p className="text-[10px]" style={{ color: G.muted }}>Choose which types appear on this page</p>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg"
                    style={{ background: G.canvas, color: G.muted }}>
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="p-2 max-h-72 overflow-y-auto">
                  {AUDIT_TYPES.map(t => {
                    const isOn = visibleTypes.has(t)
                    return (
                      <button
                        key={t}
                        onClick={() => onToggleVisibility(t)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
                        style={{ background: isOn ? G.accent + '08' : 'transparent' }}
                      >
                        <FileCheck className="h-3.5 w-3.5 shrink-0" style={{ color: isOn ? G.accent : G.muted }} />
                        <span className="flex-1 text-xs font-medium text-left" style={{ color: isOn ? G.primary : G.muted }}>{t}</span>
                        <div className="relative h-4 w-7 rounded-full shrink-0"
                          style={{ background: isOn ? G.accent : G.border }}>
                          <div className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all"
                            style={{ left: isOn ? '14px' : '2px' }} />
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: `1px solid ${G.border}` }}>
                  <button
                    onClick={onShowAll}
                    className="text-[11px] font-semibold"
                    style={{ color: G.accent }}>
                    Show All
                  </button>
                  <span className="text-[10px]" style={{ color: G.muted }}>
                    {visibleTypes.size} of {AUDIT_TYPES.length} shown
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleList.map(t => {
          const meta = AUDIT_TYPE_META[t]
          const Icon = meta.icon
          const count = countEngagementsForType(t)
          return (
            <button
              key={t}
              onClick={() => onSelect(t)}
              className="rounded-2xl p-5 text-left transition-all group"
              style={{
                background: G.white,
                border: `1px solid ${G.border}`,
                boxShadow: '0 1px 3px 0 rgba(15,23,42,0.06)',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.borderColor = meta.color + '66'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px 0 rgba(15,23,42,0.10)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.borderColor = G.border
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px 0 rgba(15,23,42,0.06)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: meta.color + '14', border: `1px solid ${meta.color}33` }}
                >
                  <Icon className="h-5 w-5" style={{ color: meta.color }} />
                </div>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: G.muted }} />
              </div>
              <p className="text-2xl font-bold leading-none mb-1.5 tabular-nums" style={{ color: G.primary }}>
                {count}
              </p>
              <p className="text-sm font-bold mb-1" style={{ color: G.primary }}>{t}</p>
              <p className="text-[11px] leading-snug" style={{ color: G.secondary }}>{meta.desc}</p>
              <p className="text-[10px] mt-2 font-semibold" style={{ color: G.muted }}>
                {count === 1 ? '1 active engagement' : `${count} active engagements`}
              </p>
            </button>
          )
        })}
      </div>
    </>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function AuditPage() {
  const [hasSelectedType, setHasSelectedType] = useState(false)
  const [visibleAuditTypes, setVisibleAuditTypes] = useState<Set<string>>(() => new Set(AUDIT_TYPES))
  const [showTypeSettings, setShowTypeSettings] = useState(false)
  const [selectedId, setSelectedId] = useState(1)
  const [activeStage, setActiveStage] = useState<StageId>('preliminary')
  const [showEngSearch, setShowEngSearch] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [auditType, setAuditType] = useState(ENGAGEMENTS[0].type)
  const [selectedFY, setSelectedFY] = useState('FY 2025-26')
  const [periodFrom, setPeriodFrom] = useState('2025-04')
  const [periodTo, setPeriodTo] = useState('2026-03')
  const [showTabSettings, setShowTabSettings] = useState(false)
  const [visibleStages, setVisibleStages] = useState<Set<string>>(
    new Set(STATUTORY_STAGES.map(s => s.id))
  )

  const isTaxAudit = auditType === 'Tax Audit' || auditType === 'Tax Audit (u/s 44AB)'
  const STAGES = isTaxAudit ? TAX_AUDIT_STAGES : STATUTORY_STAGES

  function toggleAuditTypeVisibility(t: string) {
    setVisibleAuditTypes(prev => {
      const next = new Set(prev)
      if (next.has(t)) { if (next.size > 1) next.delete(t) } else next.add(t)
      return next
    })
  }

  function selectAuditType(t: string) {
    setAuditType(t)
    const matching = ENGAGEMENTS.find(e => e.type === t || (t === 'Tax Audit (u/s 44AB)' && e.type === 'Tax Audit'))
    if (matching) setSelectedId(matching.id)
    const tIsTax = t === 'Tax Audit' || t === 'Tax Audit (u/s 44AB)'
    const newStages = tIsTax ? TAX_AUDIT_STAGES : STATUTORY_STAGES
    setActiveStage(newStages[0].id)
    setVisibleStages(new Set(newStages.map(s => s.id)))
    setHasSelectedType(true)
    setShowTypeSettings(false)
    setShowEngSearch(false)
  }

  function backToAuditTypes() {
    setHasSelectedType(false)
    setShowTypeSettings(false)
    setShowEngSearch(false)
    setShowTypeDropdown(false)
  }

  function toggleStageVisibility(id: string) {
    setVisibleStages(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size === 1) return prev
        next.delete(id)
        if (activeStage === id) {
          const first = STAGES.find(s => next.has(s.id))
          if (first) setActiveStage(first.id)
        }
      } else {
        next.add(id)
      }
      return next
    })
  }

  const eng = ENGAGEMENTS.find(e => e.id === selectedId) ?? ENGAGEMENTS[0]
  const stageStatus = STAGE_STATUS[selectedId] ?? STAGE_STATUS[1]

  const statusColors: Record<string, string> = {
    'In Progress': G.accent, 'Planning': '#F59E0B', 'Review': '#8B5CF6', 'Completed': '#10B981',
  }

return (
    <div className="p-3 md:p-4 max-w-[1600px] mx-auto" style={{ background: G.canvas }}>

      {!hasSelectedType ? (
        <AuditTypeSelection
          visibleTypes={visibleAuditTypes}
          onSelect={selectAuditType}
          onToggleVisibility={toggleAuditTypeVisibility}
          onShowAll={() => setVisibleAuditTypes(new Set(AUDIT_TYPES))}
          showSettings={showTypeSettings}
          setShowSettings={setShowTypeSettings}
        />
      ) : (
        <>
      {/* ── Back + selected audit type ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={backToAuditTypes}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: G.white, border: `1px solid ${G.border}`, color: G.secondary }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.borderColor = G.accent
            ;(e.currentTarget as HTMLElement).style.color = G.accent
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.borderColor = G.border
            ;(e.currentTarget as HTMLElement).style.color = G.secondary
          }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Audit Types
        </button>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: G.white, border: `1px solid ${G.border}` }}
        >
          {(() => {
            const meta = AUDIT_TYPE_META[auditType] ?? AUDIT_TYPE_META['Statutory Audit']
            const Icon = meta.icon
            return (
              <>
                <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                <span className="text-sm font-bold" style={{ color: G.primary }}>{auditType}</span>
              </>
            )
          })()}
        </div>
      </div>

      {/* ── Engagement Header ──────────────────────────────────────────────── */}
      <div className="rounded-2xl mb-3 p-5" style={{ background: G.white, border: `1px solid ${G.border}`, boxShadow: '0 1px 4px rgba(15,23,42,0.07)' }}>
        <div className="flex items-start gap-4 flex-wrap">
          {/* Client selector */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: G.muted }}>Audit Engagement</p>
            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-left w-full transition-all"
                style={{ background: G.canvas, border: `1px solid ${G.border}` }}
                onClick={() => { setShowEngSearch(v => !v); setShowTypeDropdown(false) }}
              >
                <Search className="h-3.5 w-3.5 shrink-0" style={{ color: G.muted }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: G.primary }}>{eng.client}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: G.muted }} />
              </button>
              {showEngSearch && (
                <div className="absolute top-full mt-1 left-0 right-0 z-20 rounded-xl overflow-hidden shadow-xl"
                  style={{ background: G.white, border: `1px solid ${G.border}` }}>
                  {ENGAGEMENTS.map(e => {
                    const engIsTax = e.type === 'Tax Audit' || e.type === 'Tax Audit (u/s 44AB)'
                    const newStages = engIsTax ? TAX_AUDIT_STAGES : STATUTORY_STAGES
                    return (
                      <button key={e.id} className="w-full flex items-start gap-3 px-4 py-3 text-left hover:opacity-80 transition-opacity"
                        style={{ borderBottom: `1px solid ${G.border}` }}
                        onClick={() => {
                          setSelectedId(e.id)
                          setAuditType(e.type)
                          setShowEngSearch(false)
                          setActiveStage(newStages[0].id)
                          setVisibleStages(new Set(newStages.map(s => s.id)))
                        }}>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: G.primary }}>{e.client}</p>
                          <p className="text-[10px]" style={{ color: G.secondary }}>{e.type} · {e.fy}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Audit Type dropdown */}
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: G.muted }}>Audit Type</p>
            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-left min-w-[200px] transition-all"
                style={{ background: G.canvas, border: `1px solid ${showTypeDropdown ? G.accent : G.border}` }}
                onClick={() => { setShowTypeDropdown(v => !v); setShowEngSearch(false) }}
              >
                <FileCheck className="h-3.5 w-3.5 shrink-0" style={{ color: isTaxAudit ? G.accent : '#10B981' }} />
                <span className="flex-1 text-sm font-semibold" style={{ color: G.primary }}>{auditType}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: G.muted }} />
              </button>
              {showTypeDropdown && (
                <div className="absolute top-full mt-1 left-0 z-20 rounded-xl overflow-hidden shadow-xl min-w-[220px]"
                  style={{ background: G.white, border: `1px solid ${G.border}` }}>
                  {AUDIT_TYPES.map(t => {
                    const tIsTax = t === 'Tax Audit' || t === 'Tax Audit (u/s 44AB)'
                    const newStages = tIsTax ? TAX_AUDIT_STAGES : STATUTORY_STAGES
                    return (
                      <button key={t}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors"
                        style={{
                          borderBottom: `1px solid ${G.border}`,
                          background: auditType === t ? G.accent + '10' : G.white,
                          color: auditType === t ? G.accent : G.primary,
                        }}
                        onMouseEnter={e => { if (auditType !== t) (e.currentTarget as HTMLElement).style.background = G.canvas }}
                        onMouseLeave={e => { if (auditType !== t) (e.currentTarget as HTMLElement).style.background = G.white }}
                        onClick={() => {
                          setAuditType(t)
                          setActiveStage(newStages[0].id)
                          setVisibleStages(new Set(newStages.map(s => s.id)))
                          setShowTypeDropdown(false)
                        }}
                      >
                        {auditType === t && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: G.accent }} />}
                        {auditType !== t && <Circle className="h-3.5 w-3.5 shrink-0" style={{ color: G.muted }} />}
                        <span className="text-sm font-medium">{t}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* FY selector */}
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: G.muted }}>Financial Year</p>
            <select
              value={selectedFY}
              onChange={e => setSelectedFY(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm font-semibold appearance-none cursor-pointer focus:outline-none"
              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.primary, minWidth: 130 }}
            >
              {['FY 2025-26','FY 2024-25','FY 2023-24','FY 2022-23'].map(fy => (
                <option key={fy} value={fy}>{fy}</option>
              ))}
            </select>
          </div>

          {/* Period From */}
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: G.muted }}>From</p>
            <input
              type="month"
              value={periodFrom}
              onChange={e => setPeriodFrom(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none cursor-pointer"
              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.primary }}
            />
          </div>

          {/* Period To */}
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: G.muted }}>To</p>
            <input
              type="month"
              value={periodTo}
              onChange={e => setPeriodTo(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none cursor-pointer"
              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.primary }}
            />
          </div>

          {/* Status + Team */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl px-3 py-2" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: G.muted }}>Status</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: (statusColors[eng.status] ?? G.muted) + '22', color: statusColors[eng.status] ?? G.muted,
                  border: `1px solid ${(statusColors[eng.status] ?? G.muted)}44` }}>
                {eng.status}
              </span>
            </div>
            <div className="rounded-xl px-3 py-2" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: G.muted }}>Team</p>
              <div className="flex -space-x-1.5">
                {eng.team.map(m => (
                  <div key={m.name} title={`${m.name} (${m.role})`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white"
                    style={{ background: m.color }}>{m.initials}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            {[
              { label: 'Save Draft', icon: Save,        action: () => toast.success('Draft saved') },
              { label: 'Request Docs', icon: Folder,     action: () => toast.info('Document request sent') },
              { label: 'New Observation', icon: Plus,    action: () => toast.info('Create observation') },
              { label: 'Generate Report', icon: Download, action: () => toast.info('Generating audit report…') },
            ].map(btn => (
              <button key={btn.label}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = G.accent; (e.currentTarget as HTMLElement).style.color = G.accent }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = G.border; (e.currentTarget as HTMLElement).style.color = G.secondary }}
                onClick={btn.action}>
                <btn.icon className="h-3.5 w-3.5" />{btn.label}
              </button>
            ))}
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: G.accent }}
              onClick={() => toast.success('Audit marked complete!')}>
              <CheckCircle2 className="h-3.5 w-3.5" />Complete Audit
            </button>
          </div>
        </div>
      </div>

      {/* ── Stage Tab Bar + Content ─────────────────────────────────────── */}
      <div className="rounded-2xl" style={{ background: G.white, border: `1px solid ${G.border}`, boxShadow: '0 1px 4px rgba(15,23,42,0.07)' }}>

        {/* Tab strip row */}
        <div className="flex items-stretch rounded-t-2xl" style={{ background: G.canvas, borderBottom: `1px solid ${G.border}` }}>

          {/* Scrollable tabs */}
          <div className="flex items-end overflow-x-auto flex-1 px-3" style={{ gap: 2, minHeight: 48 }}>
            {STAGES.filter(stage => visibleStages.has(stage.id)).map((stage) => {
              const s = stageStatus[stage.id]
              const isActive = activeStage === stage.id
              const isDone = s?.done
              const hasIssue = (s?.exceptions ?? 0) > 0
              const hasPending = (s?.pending ?? 0) > 0
              const SIcon = stage.icon
              const dotColor = isDone ? '#10B981' : hasIssue ? '#EF4444' : hasPending ? '#F59E0B' : s && s.pct > 0 ? G.accent : 'transparent'

              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStage(stage.id)}
                  className="relative flex items-center gap-1.5 px-4 shrink-0 transition-all focus:outline-none"
                  style={{
                    height: isActive ? 44 : 38,
                    marginTop: isActive ? 0 : 6,
                    background: isActive ? G.white : 'transparent',
                    borderRadius: '10px 10px 0 0',
                    border: isActive ? `1px solid ${G.border}` : '1px solid transparent',
                    borderBottom: isActive ? `2px solid ${G.accent}` : '1px solid transparent',
                    color: isActive ? G.accent : G.secondary,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 11,
                    zIndex: isActive ? 2 : 1,
                  }}
                >
                  <SIcon className="h-3.5 w-3.5 shrink-0" style={{ color: isActive ? G.accent : G.muted }} />
                  <span className="whitespace-nowrap">{stage.label}</span>
                  {dotColor !== 'transparent' && (
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Gear button */}
          <div className="relative shrink-0 flex items-center px-3" style={{ borderLeft: `1px solid ${G.border}` }}>
            <button
              onClick={() => setShowTabSettings(v => !v)}
              title="Customize visible tabs"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: showTabSettings ? G.accent + '15' : G.white,
                border: `1px solid ${showTabSettings ? G.accent : G.border}`,
                color: showTabSettings ? G.accent : G.secondary,
              }}
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">Tabs</span>
            </button>

            {/* Settings popover */}
            {showTabSettings && (
              <div
                className="absolute right-0 top-full mt-2 z-50 rounded-2xl shadow-xl"
                style={{ background: G.white, border: `1px solid ${G.border}`, width: 260 }}
              >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${G.border}` }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: G.primary }}>Customize Tabs</p>
                    <p className="text-[10px]" style={{ color: G.muted }}>Toggle which stages appear in the tab bar</p>
                  </div>
                  <button
                    onClick={() => setShowTabSettings(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors"
                    style={{ background: G.canvas, color: G.muted }}>
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="p-2">
                  {STAGES.map(stage => {
                    const isOn = visibleStages.has(stage.id)
                    const SIcon = stage.icon
                    return (
                      <button
                        key={stage.id}
                        onClick={() => toggleStageVisibility(stage.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
                        style={{ background: isOn ? G.accent + '08' : 'transparent' }}
                      >
                        <SIcon className="h-3.5 w-3.5 shrink-0" style={{ color: isOn ? G.accent : G.muted }} />
                        <span className="flex-1 text-xs font-medium text-left" style={{ color: isOn ? G.primary : G.muted }}>{stage.label}</span>
                        <div className="relative h-4 w-7 rounded-full transition-all shrink-0"
                          style={{ background: isOn ? G.accent : G.border }}>
                          <div className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all"
                            style={{ left: isOn ? '14px' : '2px' }} />
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: `1px solid ${G.border}` }}>
                  <button
                    onClick={() => setVisibleStages(new Set(STAGES.map(s => s.id)))}
                    className="text-[11px] font-semibold"
                    style={{ color: G.accent }}>
                    Show All
                  </button>
                  <span className="text-[10px]" style={{ color: G.muted }}>{visibleStages.size} of {STAGES.length} shown</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab content panel */}
        <div className="p-5" style={{ background: G.white }}>
          {(() => {
            const s = stageStatus[activeStage] ?? { pct: 0, pending: 0, exceptions: 0, done: false }
            const stage = STAGES.find(st => st.id === activeStage) ?? STAGES[0]

            return (
              <>
                {/* Stage header */}
                <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: `1px solid ${G.border}` }}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: s.done ? '#F0FDF4' : s.pct > 0 ? '#EFF8FF' : G.canvas, border: `1px solid ${s.done ? '#10B98133' : s.pct > 0 ? G.accent + '33' : G.border}` }}>
                    <stage.icon className="h-4 w-4" style={{ color: s.done ? '#10B981' : s.pct > 0 ? G.accent : G.muted }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold" style={{ color: G.primary }}>{stage.label}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <Pct value={s.pct} />
                      {s.done && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F0FDF4', color: '#10B981' }}>Complete</span>}
                      {s.pending > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FFFBEB', color: '#92400E' }}>{s.pending} pending</span>}
                      {s.exceptions > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEF2F2', color: '#991B1B' }}>{s.exceptions} exceptions</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const visibleList = STAGES.filter(st => visibleStages.has(st.id))
                      const idx = visibleList.findIndex(st => st.id === activeStage)
                      return (
                        <>
                          {idx > 0 && (
                            <button
                              onClick={() => setActiveStage(visibleList[idx - 1].id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
                              ← Prev
                            </button>
                          )}
                          {idx < visibleList.length - 1 && (
                            <button
                              onClick={() => setActiveStage(visibleList[idx + 1].id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                              style={{ background: G.accent }}>
                              Next →
                            </button>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Stage body */}
                {activeStage === 'preliminary'    && <PreliminaryContent eng={eng} showMgmtResponse={!isTaxAudit} />}
                {activeStage === 'caro'           && <CAROWithApplicabilityContent auditType={auditType} />}
                {activeStage === 'reconciliation' && <ReconciliationContent />}
                {activeStage === 'tax_forms'      && <TaxAuditFormsContent />}
                {activeStage === 'documentation'  && <DocumentationContent />}
                {activeStage === 'checklist'      && <AuditChecklistContent />}
                {activeStage === 'observations'   && <ObservationsContent />}
                {activeStage === 'review'         && <ReviewContent />}
                {activeStage === 'signoff'        && <SignOffContent />}
              </>
            )
          })()}
        </div>
      </div>
        </>
      )}
    </div>
  )
}
