/**
 * Organization Onboarding Wizard — 16 Steps
 * Layout: Horizontal stepper on top + full-width form body
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, MapPin, Users, GitBranch, Receipt, Settings,
  Calculator, FileText, Shield, UserPlus, ClipboardList,
  BarChart2, BookOpen, Bell, FolderOpen, CheckCircle2,
  ChevronRight, ChevronLeft, Check, Plus, Trash2, Eye, EyeOff,
  AlertCircle, Save,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Design tokens ───────────────────────────────────────────────────────────
const G = {
  canvas: '#F0F4F8',
  white: '#FFFFFF',
  border: '#D8E3ED',
  borderHov: '#B0C4D8',
  muted: '#8FA3B8',
  secondary: '#4A6080',
  primary: '#0D1F35',
  accent: '#0A84D0',
  accentHov: '#0870B0',
  accentFg: '#FFFFFF',
  success: '#12A87A',
  divider: '#E4EDF5',
} as const

// ─── Step metadata ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Organization', fullLabel: 'Organization Details', icon: Building2, group: 'Organization' },
  { id: 2, label: 'Address', fullLabel: 'Registered Address', icon: MapPin, group: 'Organization' },
  { id: 3, label: 'KMPs', fullLabel: 'Key Management Persons', icon: Users, group: 'Organization' },
  { id: 4, label: 'Branches', fullLabel: 'Branch Details', icon: GitBranch, group: 'Organization' },
  { id: 5, label: 'GST Reg.', fullLabel: 'GST Registration', icon: Receipt, group: 'GST' },
  { id: 6, label: 'GST Filing', fullLabel: 'GST Filing Configuration', icon: Settings, group: 'GST' },
  { id: 7, label: 'TDS Config', fullLabel: 'TDS Configuration', icon: Calculator, group: 'TDS & IT' },
  { id: 8, label: 'TDS Filing', fullLabel: 'TDS Filing Configuration', icon: FileText, group: 'TDS & IT' },
  { id: 9, label: 'Income Tax', fullLabel: 'Income Tax Configuration', icon: Shield, group: 'TDS & IT' },
  { id: 10, label: 'Admin User', fullLabel: 'Client Admin Creation', icon: UserPlus, group: 'Admin' },
  { id: 11, label: 'Audit Clauses', fullLabel: 'Audit Clause Configuration', icon: ClipboardList, group: 'Audit' },
  { id: 12, label: 'Audit Apply', fullLabel: 'Audit Applicability', icon: BarChart2, group: 'Audit' },
  { id: 13, label: 'Compliance', fullLabel: 'Compliance Configuration', icon: BookOpen, group: 'Audit' },
  { id: 14, label: 'Communication', fullLabel: 'Communication Preferences', icon: Bell, group: 'Preferences' },
  { id: 15, label: 'Documents', fullLabel: 'Document Preferences', icon: FolderOpen, group: 'Preferences' },
  { id: 16, label: 'Review', fullLabel: 'Review & Submit', icon: CheckCircle2, group: 'Review' },
] as const

// ─── Types ───────────────────────────────────────────────────────────────────
interface KMP {
  id: string; full_name: string; designation: string; email: string; mobile: string
  din: string; dob: string; is_primary: boolean; is_signatory: boolean
}
interface Branch {
  id: string; name: string; code: string; state: string; address: string
  contact_person: string; contact_number: string; email: string
  gst_applicable: boolean; tds_applicable: boolean; audit_applicable: string; status: 'active' | 'inactive'
}
interface GSTReg {
  id: string; gstin: string; registration_type: string; state: string; branch: string
  registration_date: string; gst_status: string; authorized_signatory: string
  eway_bill: boolean; reconciliation: boolean
}

interface FormState {
  legal_name: string; trade_name: string; pan: string; org_type: string; cin: string
  email: string; mobile: string; website: string; fy_start: string; fy_end: string
  incorporation_date: string; nature_of_business: string; industry_type: string
  msme_registered: boolean; msme_number: string
  addr_line1: string; addr_line2: string; landmark: string; city: string
  district: string; state: string; country: string; pincode: string
  addr_type: string; google_location: string
  kmps: KMP[]
  branches: Branch[]
  gst_registrations: GSTReg[]
  state_code: string; sez_payer: boolean; einvoicing: boolean
  gst_frequency: string; gst_return_types: string[]
  gst_username: string; gst_password: string; gst_mobile: string; gst_email: string
  gst_reviewer: string; gst_approver: string
  tds_name: string; tds_branch: string; tds_state: string; pao_code: string
  pao_reg_no: string; tds_portal_username: string; tds_portal_password: string
  premises_name: string; area_location: string; tds_pincode: string
  telephone: string; ministry_dept: string; ddo_code: string; ddo_reg_no: string
  tds_reconciliation: boolean; flat_no: string; road_street: string
  tds_city: string; tds_district: string; tds_state2: string; tds_email: string
  tan: string; deductor_type: string; effective_date: string; tds_applicable: boolean
  tds_sections: string[]; tds_return_types: string[]
  traces_username: string; traces_password: string
  traces_mobile: string; traces_email: string
  tds_reviewer: string; tds_approver: string
  it_pan: string; it_username: string; it_password: string
  it_mobile: string; it_email: string
  it_reviewer: string; it_approver: string
  admin_name: string; admin_email: string; admin_mobile: string
  admin_designation: string; admin_password: string
  enabled_clauses: string[]; disabled_clauses: string[]; custom_clauses: string[]
  clause_version: string; clause_fy: string
  tax_audit_applicable: boolean; statutory_audit_applicable: boolean
  audit_frequency: string; audit_reviewer: string; audit_approver: string; audit_due_date: string
  compliance_masters: string[]
  email_notifications: boolean; whatsapp_notifications: boolean; portal_notifications: boolean
  auto_doc_requests: boolean; reminder_notifications: boolean
  reminder_frequency: string; escalation_days: string; doc_categories: string[]
}

const INITIAL_KMP = (): KMP => ({
  id: Math.random().toString(36).slice(2), full_name: '', designation: '', email: '',
  mobile: '', din: '', dob: '', is_primary: false, is_signatory: false,
})
const INITIAL_BRANCH = (): Branch => ({
  id: Math.random().toString(36).slice(2), name: '', code: '', state: '', address: '',
  contact_person: '', contact_number: '', email: '', gst_applicable: true,
  tds_applicable: true, audit_applicable: '', status: 'active',
})
const INITIAL_GST_REG = (): GSTReg => ({
  id: Math.random().toString(36).slice(2), gstin: '', registration_type: '', state: '',
  branch: '', registration_date: '', gst_status: 'Active', authorized_signatory: '',
  eway_bill: false, reconciliation: true,
})

const INIT: FormState = {
  legal_name: '', trade_name: '', pan: '', org_type: '', cin: '',
  email: '', mobile: '', website: '', fy_start: '04', fy_end: '03',
  incorporation_date: '', nature_of_business: '', industry_type: '',
  msme_registered: false, msme_number: '',
  addr_line1: '', addr_line2: '', landmark: '', city: '', district: '',
  state: '', country: 'India', pincode: '', addr_type: 'Registered Office', google_location: '',
  kmps: [INITIAL_KMP()],
  branches: [],
  gst_registrations: [INITIAL_GST_REG()],
  state_code: '', sez_payer: false, einvoicing: false,
  gst_frequency: 'Monthly', gst_return_types: ['GSTR1', 'GSTR3B'],
  gst_username: '', gst_password: '', gst_mobile: '', gst_email: '',
  gst_reviewer: '', gst_approver: '',
  tds_name: '', tds_branch: '', tds_state: '', pao_code: '', pao_reg_no: '',
  tds_portal_username: '', tds_portal_password: '', premises_name: '', area_location: '',
  tds_pincode: '', telephone: '', ministry_dept: '', ddo_code: '', ddo_reg_no: '',
  tds_reconciliation: true, flat_no: '', road_street: '', tds_city: '', tds_district: '',
  tds_state2: '', tds_email: '', tan: '', deductor_type: '', effective_date: '', tds_applicable: true,
  tds_sections: ['194C', '194J'], tds_return_types: ['26Q'],
  traces_username: '', traces_password: '', traces_mobile: '', traces_email: '',
  tds_reviewer: '', tds_approver: '',
  it_pan: '', it_username: '', it_password: '', it_mobile: '', it_email: '',
  it_reviewer: '', it_approver: '',
  admin_name: '', admin_email: '', admin_mobile: '', admin_designation: '', admin_password: '',
  enabled_clauses: ['3(i)(a)', '3(ii)(a)', '3(iii)', '3(vii)(a)', '3(ix)', '3(xi)'],
  disabled_clauses: [], custom_clauses: [], clause_version: '1.0', clause_fy: '2025-26',
  tax_audit_applicable: false, statutory_audit_applicable: true,
  audit_frequency: 'Financial Year', audit_reviewer: '', audit_approver: '', audit_due_date: '',
  compliance_masters: ['GST Return Types', 'TDS Return Types', 'TDS Sections', 'Audit Types', 'Notice Types'],
  email_notifications: true, whatsapp_notifications: true, portal_notifications: true,
  auto_doc_requests: true, reminder_notifications: true,
  reminder_frequency: 'Weekly', escalation_days: '7',
  doc_categories: ['GST', 'TDS', 'Financial Statements', 'Bank Statements'],
}

// ─── Reusable atoms ──────────────────────────────────────────────────────────
function F({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold" style={{ color: G.secondary }}>
        {label}{required && <span className="ml-0.5 font-bold" style={{ color: '#E53935' }}>*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px]" style={{ color: G.muted }}>{hint}</p>}
    </div>
  )
}

function TI({ value, onChange, placeholder, type = 'text', disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
      style={{
        background: disabled ? G.canvas : G.white,
        border: `1.5px solid ${G.border}`,
        color: G.primary,
        boxShadow: '0 1px 2px rgba(13,31,53,0.04)',
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = G.accent
        e.currentTarget.style.boxShadow = `0 0 0 3px ${G.accent}22, 0 1px 2px rgba(13,31,53,0.04)`
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = G.border
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(13,31,53,0.04)'
      }}
    />
  )
}

function Sel({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none appearance-none pr-9 transition-all"
        style={{
          background: G.white, border: `1.5px solid ${G.border}`,
          color: value ? G.primary : G.muted,
          boxShadow: '0 1px 2px rgba(13,31,53,0.04)',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = G.accent }}
        onBlur={e => { e.currentTarget.style.borderColor = G.border }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o} style={{ color: G.primary }}>{o}</option>)}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke={G.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg cursor-pointer select-none transition-all"
      style={{ background: value ? G.accent + '0D' : G.white, border: `1.5px solid ${value ? G.accent + '55' : G.border}` }}
      onClick={() => onChange(!value)}>
      <span className="text-sm font-medium" style={{ color: G.primary }}>{label}</span>
      <div className="relative flex h-5 w-9 shrink-0 items-center rounded-full transition-all"
        style={{ background: value ? G.accent : '#C8D6E5' }}>
        <span className="absolute h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform"
          style={{ transform: value ? 'translateX(18px)' : 'translateX(2px)' }} />
      </div>
    </div>
  )
}

function MultiSelect({ options, value, onChange }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o])
  return (
    <div className="flex flex-wrap gap-2 p-3 rounded-lg" style={{ background: G.canvas, border: `1.5px solid ${G.border}` }}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{
            background: value.includes(o) ? G.accent : G.white,
            color: value.includes(o) ? G.accentFg : G.secondary,
            border: `1px solid ${value.includes(o) ? G.accent : G.border}`,
            boxShadow: value.includes(o) ? `0 2px 6px ${G.accent}44` : 'none',
          }}>
          {value.includes(o) && <Check className="h-2.5 w-2.5" />}{o}
        </button>
      ))}
    </div>
  )
}

function PwdInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm outline-none transition-all"
        style={{ background: G.white, border: `1.5px solid ${G.border}`, color: G.primary, boxShadow: '0 1px 2px rgba(13,31,53,0.04)' }}
        onFocus={e => { e.currentTarget.style.borderColor = G.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${G.accent}22` }}
        onBlur={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.boxShadow = '0 1px 2px rgba(13,31,53,0.04)' }} />
      <button type="button" onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2">
        {show ? <EyeOff className="h-4 w-4" style={{ color: G.muted }} /> : <Eye className="h-4 w-4" style={{ color: G.muted }} />}
      </button>
    </div>
  )
}

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6 pb-4" style={{ borderBottom: `1px solid ${G.divider}` }}>
      <h3 className="text-base font-bold" style={{ color: G.primary }}>{title}</h3>
      {sub && <p className="text-xs mt-1.5" style={{ color: G.muted }}>{sub}</p>}
    </div>
  )
}

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-5`}>{children}</div>
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Puducherry', 'Chandigarh', 'Lakshadweep', 'Andaman & Nicobar Islands',
]

// ═══════════════════════════════════════════════════════════════════════════════
// HORIZONTAL STEPPER
// ═══════════════════════════════════════════════════════════════════════════════
function HorizontalStepper({ currentStep, onStepClick }: {
  currentStep: number; onStepClick: (step: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const activeEl = container.querySelector(`[data-step="${currentStep}"]`) as HTMLElement
    if (activeEl) {
      const containerRect = container.getBoundingClientRect()
      const elRect = activeEl.getBoundingClientRect()
      const offset = elRect.left - containerRect.left - (containerRect.width / 2) + (elRect.width / 2)
      container.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }, [currentStep])

  return (
    <div ref={scrollRef}
      className="overflow-x-auto"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
      <div className="flex items-center gap-1 px-6 py-3 min-w-max">
        {STEPS.map((s, idx) => {
          const done = s.id < currentStep
          const active = s.id === currentStep
          const SIcon = s.icon
          const isLast = idx === STEPS.length - 1

          return (
            <div key={s.id} className="flex items-center" data-step={s.id}>
              <button onClick={() => onStepClick(s.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all shrink-0"
                style={{
                  background: active ? G.accent + '12' : 'transparent',
                  border: `1.5px solid ${active ? G.accent + '55' : 'transparent'}`,
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = G.canvas
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all"
                  style={{
                    background: done ? G.success : active ? G.accent : G.white,
                    border: done || active ? 'none' : `1.5px solid ${G.border}`,
                    boxShadow: active ? `0 2px 8px ${G.accent}55` : done ? `0 2px 4px ${G.success}33` : 'none',
                  }}>
                  {done
                    ? <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                    : active
                      ? <SIcon className="h-3.5 w-3.5 text-white" />
                      : <span className="text-[11px] font-bold" style={{ color: G.muted }}>{s.id}</span>
                  }
                </div>
                <div className="flex flex-col items-start text-left whitespace-nowrap">
                  <span className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: active ? G.accent : G.muted, letterSpacing: '0.08em' }}>
                    {s.group}
                  </span>
                  <span className="text-xs font-semibold leading-tight"
                    style={{ color: active ? G.accent : done ? G.secondary : G.muted }}>
                    {s.label}
                  </span>
                </div>
              </button>

              {!isLast && (
                <div className="h-px w-6 mx-1 shrink-0"
                  style={{ background: done ? G.success : G.border }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEPS
// ═══════════════════════════════════════════════════════════════════════════════

function Step1({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  return (
    <div>
      <SectionHead title="Organization Details" sub="Basic legal and business information about the organization" />
      <Grid cols={2}>
        <F label="Legal Name" required><TI value={f.legal_name} onChange={v => set('legal_name', v)} placeholder="As per MCA/ROC records" /></F>
        <F label="Trade Name"><TI value={f.trade_name} onChange={v => set('trade_name', v)} placeholder="Brand or trade name if different" /></F>
        <F label="PAN Number" required><TI value={f.pan} onChange={v => set('pan', v.toUpperCase())} placeholder="AABCS1234D" /></F>
        <F label="Organization Type" required>
          <Sel value={f.org_type} onChange={v => set('org_type', v)} placeholder="Select type" options={[
            'Private Limited Company', 'Public Limited Company', 'Partnership Firm',
            'LLP-LLPIN', 'Proprietorship', 'Trust', 'Society', 'NGO', 'Other',
          ]} />
        </F>
        <F label="CIN Number" hint="For registered companies"><TI value={f.cin} onChange={v => set('cin', v.toUpperCase())} placeholder="U17000KA2015PTC081234" /></F>
        <F label="Date of Incorporation"><TI type="date" value={f.incorporation_date} onChange={v => set('incorporation_date', v)} /></F>
        <F label="Email" required><TI type="email" value={f.email} onChange={v => set('email', v)} placeholder="contact@company.com" /></F>
        <F label="Mobile" required><TI value={f.mobile} onChange={v => set('mobile', v)} placeholder="+91 XXXXXXXXXX" /></F>
        <F label="Website"><TI value={f.website} onChange={v => set('website', v)} placeholder="https://www.company.com" /></F>
        <F label="Nature of Business"><TI value={f.nature_of_business} onChange={v => set('nature_of_business', v)} placeholder="e.g. Manufacturing, Trading, Services" /></F>
        <F label="Industry Type">
          <Sel value={f.industry_type} onChange={v => set('industry_type', v)} placeholder="Select industry" options={[
            'Manufacturing', 'Trading', 'Services', 'IT/Software', 'Real Estate',
            'Healthcare', 'Education', 'Finance/Banking', 'Retail', 'Hospitality', 'Other',
          ]} />
        </F>
        <F label="Financial Year" hint="Start Month → End Month (default: Apr → Mar)">
          <div className="grid grid-cols-2 gap-2">
            <Sel value={f.fy_start} onChange={v => set('fy_start', v)} options={['04', '01', '07', '10']} />
            <Sel value={f.fy_end} onChange={v => set('fy_end', v)} options={['03', '12', '06', '09']} />
          </div>
        </F>
      </Grid>
      <div className="mt-6 space-y-3">
        <Toggle value={f.msme_registered} onChange={v => set('msme_registered', v)} label="MSME Registered" />
        {f.msme_registered && (
          <F label="MSME Number"><TI value={f.msme_number} onChange={v => set('msme_number', v)} placeholder="Udyam Registration Number" /></F>
        )}
      </div>
    </div>
  )
}

function Step2({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  return (
    <div>
      <SectionHead title="Registered Address" sub="Primary registered office address for compliance purposes" />
      <div className="mb-5">
        <F label="Address Type" required>
          <Sel value={f.addr_type} onChange={v => set('addr_type', v)} options={['Registered Office', 'Corporate Office', 'Branch Office']} />
        </F>
      </div>
      <Grid cols={2}>
        <F label="Address Line 1" required><TI value={f.addr_line1} onChange={v => set('addr_line1', v)} placeholder="House/Flat No., Building Name" /></F>
        <F label="Address Line 2"><TI value={f.addr_line2} onChange={v => set('addr_line2', v)} placeholder="Street, Area" /></F>
        <F label="Landmark"><TI value={f.landmark} onChange={v => set('landmark', v)} placeholder="Near landmark" /></F>
        <F label="Pincode" required><TI value={f.pincode} onChange={v => set('pincode', v)} placeholder="560001" /></F>
        <F label="City" required><TI value={f.city} onChange={v => set('city', v)} placeholder="City" /></F>
        <F label="District"><TI value={f.district} onChange={v => set('district', v)} placeholder="District" /></F>
        <F label="State" required>
          <Sel value={f.state} onChange={v => set('state', v)} placeholder="Select state" options={INDIAN_STATES} />
        </F>
        <F label="Country" required>
          <Sel value={f.country} onChange={v => set('country', v)} options={['India', 'Other']} />
        </F>
      </Grid>
      <div className="mt-5">
        <F label="Google Maps Location Link" hint="Paste the Google Maps share link for the office location">
          <TI value={f.google_location} onChange={v => set('google_location', v)} placeholder="https://maps.google.com/..." />
        </F>
      </div>
    </div>
  )
}

function Step3({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  const kmps = f.kmps
  const update = (idx: number, key: keyof KMP, val: any) => {
    const next = kmps.map((k, i) => i === idx ? { ...k, [key]: val } : k)
    set('kmps', next)
  }
  const remove = (idx: number) => set('kmps', kmps.filter((_, i) => i !== idx))
  return (
    <div>
      <SectionHead title="Key Management Persons" sub="Directors, partners, authorized signatories and other KMPs" />
      <div className="space-y-5">
        {kmps.map((kmp, idx) => (
          <div key={kmp.id} className="rounded-xl p-5" style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold" style={{ color: G.primary }}>Person {idx + 1}</span>
              {kmps.length > 1 && (
                <button type="button" onClick={() => remove(idx)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                  style={{ color: '#EF4444', background: '#FEF2F2', border: '1px solid #EF444433' }}>
                  <Trash2 className="h-3 w-3" />Remove
                </button>
              )}
            </div>
            <Grid cols={2}>
              <F label="Full Name" required><TI value={kmp.full_name} onChange={v => update(idx, 'full_name', v)} placeholder="Full legal name" /></F>
              <F label="Designation" required>
                <Sel value={kmp.designation} onChange={v => update(idx, 'designation', v)} placeholder="Select designation" options={[
                  'Director', 'Managing Director', 'Partner', 'Proprietor',
                  'CEO', 'CFO', 'Authorized Signatory', 'Compliance Officer', 'Other',
                ]} />
              </F>
              <F label="Email" required><TI type="email" value={kmp.email} onChange={v => update(idx, 'email', v)} placeholder="email@company.com" /></F>
              <F label="Mobile" required><TI value={kmp.mobile} onChange={v => update(idx, 'mobile', v)} placeholder="+91 XXXXXXXXXX" /></F>
              <F label="DIN Number" hint="For Directors"><TI value={kmp.din} onChange={v => update(idx, 'din', v)} placeholder="8-digit DIN" /></F>
              <F label="Date of Birth"><TI type="date" value={kmp.dob} onChange={v => update(idx, 'dob', v)} /></F>
            </Grid>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Toggle value={kmp.is_primary} onChange={v => update(idx, 'is_primary', v)} label="Primary Contact" />
              <Toggle value={kmp.is_signatory} onChange={v => update(idx, 'is_signatory', v)} label="Authorized Signatory" />
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set('kmps', [...kmps, INITIAL_KMP()])}
          className="flex items-center gap-2 w-full justify-center py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: G.white, border: `2px dashed ${G.border}`, color: G.secondary }}>
          <Plus className="h-4 w-4" />Add Another KMP
        </button>
      </div>
    </div>
  )
}

function Step4({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  const branches = f.branches
  const update = (idx: number, key: keyof Branch, val: any) => {
    set('branches', branches.map((b, i) => i === idx ? { ...b, [key]: val } : b))
  }
  const remove = (idx: number) => set('branches', branches.filter((_, i) => i !== idx))
  return (
    <div>
      <SectionHead title="Branch Details" sub="Add all branch offices. Skip if single-location organization." />
      <div className="space-y-5">
        {branches.length === 0 && (
          <div className="py-12 text-center rounded-xl" style={{ background: G.canvas, border: `1.5px dashed ${G.border}` }}>
            <GitBranch className="h-10 w-10 mx-auto mb-3" style={{ color: G.muted }} />
            <p className="text-sm" style={{ color: G.secondary }}>No branches added yet</p>
            <p className="text-xs mt-1" style={{ color: G.muted }}>Click below to add a branch</p>
          </div>
        )}
        {branches.map((br, idx) => (
          <div key={br.id} className="rounded-xl p-5" style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold" style={{ color: G.primary }}>Branch {idx + 1}</span>
              <button type="button" onClick={() => remove(idx)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                style={{ color: '#EF4444', background: '#FEF2F2', border: '1px solid #EF444433' }}>
                <Trash2 className="h-3 w-3" />Remove
              </button>
            </div>
            <Grid cols={2}>
              <F label="Branch Name" required><TI value={br.name} onChange={v => update(idx, 'name', v)} placeholder="e.g. Mumbai Branch" /></F>
              <F label="Branch Code" required><TI value={br.code} onChange={v => update(idx, 'code', v)} placeholder="e.g. MUM-001" /></F>
              <F label="State" required>
                <Sel value={br.state} onChange={v => update(idx, 'state', v)} placeholder="Select state" options={INDIAN_STATES} />
              </F>
              <F label="Status">
                <Sel value={br.status} onChange={v => update(idx, 'status', v)} options={['active', 'inactive']} />
              </F>
              <F label="Contact Person"><TI value={br.contact_person} onChange={v => update(idx, 'contact_person', v)} /></F>
              <F label="Contact Number"><TI value={br.contact_number} onChange={v => update(idx, 'contact_number', v)} /></F>
              <F label="Email"><TI type="email" value={br.email} onChange={v => update(idx, 'email', v)} /></F>
              <F label="Audit Type Applicable">
                <Sel value={br.audit_applicable} onChange={v => update(idx, 'audit_applicable', v)} placeholder="Select" options={['None', 'Internal Audit', 'Statutory Audit', 'Tax Audit', 'All']} />
              </F>
            </Grid>
            <div className="mt-4">
              <F label="Address" required>
                <textarea value={br.address} onChange={e => update(idx, 'address', e.target.value)} rows={2}
                  placeholder="Full branch address"
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none resize-none transition-all"
                  style={{ background: G.white, border: `1.5px solid ${G.border}`, color: G.primary }} />
              </F>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Toggle value={br.gst_applicable} onChange={v => update(idx, 'gst_applicable', v)} label="GST Applicable" />
              <Toggle value={br.tds_applicable} onChange={v => update(idx, 'tds_applicable', v)} label="TDS Applicable" />
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set('branches', [...branches, INITIAL_BRANCH()])}
          className="flex items-center gap-2 w-full justify-center py-3 rounded-xl text-sm font-semibold"
          style={{ background: G.white, border: `2px dashed ${G.border}`, color: G.secondary }}>
          <Plus className="h-4 w-4" />Add Branch
        </button>
      </div>
    </div>
  )
}

function Step5({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  const regs = f.gst_registrations
  const update = (idx: number, key: keyof GSTReg, val: any) => {
    set('gst_registrations', regs.map((r, i) => i === idx ? { ...r, [key]: val } : r))
  }
  const remove = (idx: number) => set('gst_registrations', regs.filter((_, i) => i !== idx))
  return (
    <div>
      <SectionHead title="GST Registration" sub="Add all GSTIN registrations across states and branches" />
      <div className="space-y-5">
        {regs.map((reg, idx) => (
          <div key={reg.id} className="rounded-xl p-5" style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold" style={{ color: G.primary }}>GST Registration {idx + 1}</span>
              {regs.length > 1 && (
                <button type="button" onClick={() => remove(idx)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                  style={{ color: '#EF4444', background: '#FEF2F2', border: '1px solid #EF444433' }}>
                  <Trash2 className="h-3 w-3" />Remove
                </button>
              )}
            </div>
            <Grid cols={2}>
              <F label="GSTIN" required><TI value={reg.gstin} onChange={v => update(idx, 'gstin', v.toUpperCase())} placeholder="29AABCS1234D1Z5" /></F>
              <F label="Registration Type" required>
                <Sel value={reg.registration_type} onChange={v => update(idx, 'registration_type', v)} placeholder="Select type" options={[
                  'Regular', 'Composition', 'SEZ', 'ISD', 'Casual Taxable Person', 'Non Resident Taxable Person',
                ]} />
              </F>
              <F label="State" required>
                <Sel value={reg.state} onChange={v => update(idx, 'state', v)} placeholder="Select state" options={INDIAN_STATES} />
              </F>
              <F label="Branch">
                <Sel value={reg.branch} onChange={v => update(idx, 'branch', v)} placeholder="Select branch (if applicable)"
                  options={['Head Office', ...f.branches.map(b => b.name).filter(Boolean)]} />
              </F>
              <F label="Registration Date" required><TI type="date" value={reg.registration_date} onChange={v => update(idx, 'registration_date', v)} /></F>
              <F label="GST Status">
                <Sel value={reg.gst_status} onChange={v => update(idx, 'gst_status', v)} options={['Active', 'Suspended', 'Cancelled']} />
              </F>
              <F label="Authorized Signatory" required>
                <Sel value={reg.authorized_signatory} onChange={v => update(idx, 'authorized_signatory', v)} placeholder="Select from KMPs"
                  options={f.kmps.filter(k => k.is_signatory && k.full_name).map(k => k.full_name)} />
              </F>
            </Grid>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Toggle value={reg.eway_bill} onChange={v => update(idx, 'eway_bill', v)} label="E-Way Bill Applicable" />
              <Toggle value={reg.reconciliation} onChange={v => update(idx, 'reconciliation', v)} label="GST Reconciliation Required" />
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set('gst_registrations', [...regs, INITIAL_GST_REG()])}
          className="flex items-center gap-2 w-full justify-center py-3 rounded-xl text-sm font-semibold"
          style={{ background: G.white, border: `2px dashed ${G.border}`, color: G.secondary }}>
          <Plus className="h-4 w-4" />Add GST Registration
        </button>
      </div>
    </div>
  )
}

function Step6({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  return (
    <div>
      <SectionHead title="GST Filing Configuration" sub="Configure GST return filing preferences and portal credentials" />
      <Grid cols={2}>
        <F label="State Code" required><TI value={f.state_code} onChange={v => set('state_code', v)} placeholder="e.g. 29" /></F>
        <F label="GST Filing Frequency" required>
          <Sel value={f.gst_frequency} onChange={v => set('gst_frequency', v)} options={['Monthly', 'Quarterly']} />
        </F>
      </Grid>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Toggle value={f.sez_payer} onChange={v => set('sez_payer', v)} label="SEZ Payer" />
        <Toggle value={f.einvoicing} onChange={v => set('einvoicing', v)} label="E-Invoicing Applicable" />
      </div>
      <div className="mt-5">
        <F label="GST Return Types" required hint="Select all applicable return types">
          <MultiSelect
            options={['GSTR1', 'GSTR1A', 'GSTR2B', 'GSTR3B', 'GSTR9', 'GSTR9C']}
            value={f.gst_return_types} onChange={v => set('gst_return_types', v)} />
        </F>
      </div>
      <div className="mt-6 rounded-xl p-5 space-y-4" style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: G.secondary }}>GST Portal Credentials</p>
        <Grid cols={2}>
          <F label="GST Portal Username" required><TI value={f.gst_username} onChange={v => set('gst_username', v)} /></F>
          <F label="GST Portal Password" required><PwdInput value={f.gst_password} onChange={v => set('gst_password', v)} /></F>
          <F label="GST Registered Mobile"><TI value={f.gst_mobile} onChange={v => set('gst_mobile', v)} /></F>
          <F label="GST Registered Email"><TI type="email" value={f.gst_email} onChange={v => set('gst_email', v)} /></F>
        </Grid>
      </div>
      <div className="mt-5 rounded-xl p-5 space-y-4" style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: G.secondary }}>Default Assignments</p>
        <Grid cols={2}>
          <F label="Default GST Reviewer"><TI value={f.gst_reviewer} onChange={v => set('gst_reviewer', v)} placeholder="Team member name" /></F>
          <F label="Default GST Approver"><TI value={f.gst_approver} onChange={v => set('gst_approver', v)} placeholder="Team member name" /></F>
        </Grid>
      </div>
    </div>
  )
}

function Step7({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  return (
    <div>
      <SectionHead title="TDS Configuration" sub="Configure TDS deductor details and portal credentials" />
      <Toggle value={f.tds_applicable} onChange={v => set('tds_applicable', v)} label="TDS Applicable for this Organization" />
      {f.tds_applicable && (
        <div className="mt-6 space-y-6">
          <Grid cols={2}>
            <F label="TAN Number" required><TI value={f.tan} onChange={v => set('tan', v.toUpperCase())} placeholder="MUMC12345D" /></F>
            <F label="Deductor Type" required>
              <Sel value={f.deductor_type} onChange={v => set('deductor_type', v)} placeholder="Select type" options={[
                'Company', 'Partnership', 'LLP', 'Trust', 'Proprietorship', 'Government', 'Others',
              ]} />
            </F>
            <F label="Name (as per TAN)" required><TI value={f.tds_name} onChange={v => set('tds_name', v)} /></F>
            <F label="Branch">
              <Sel value={f.tds_branch} onChange={v => set('tds_branch', v)} placeholder="Select branch"
                options={['Head Office', ...f.branches.map(b => b.name).filter(Boolean)]} />
            </F>
            <F label="State"><Sel value={f.tds_state} onChange={v => set('tds_state', v)} placeholder="Select state" options={INDIAN_STATES} /></F>
            <F label="Effective Date" required><TI type="date" value={f.effective_date} onChange={v => set('effective_date', v)} /></F>
          </Grid>

          <div className="rounded-xl p-5 space-y-4" style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: G.secondary }}>Deductor Address</p>
            <Grid cols={2}>
              <F label="Flat No."><TI value={f.flat_no} onChange={v => set('flat_no', v)} /></F>
              <F label="Premises / Building Name"><TI value={f.premises_name} onChange={v => set('premises_name', v)} /></F>
              <F label="Road / Street / Lane"><TI value={f.road_street} onChange={v => set('road_street', v)} /></F>
              <F label="Area / Location"><TI value={f.area_location} onChange={v => set('area_location', v)} /></F>
              <F label="City"><TI value={f.tds_city} onChange={v => set('tds_city', v)} /></F>
              <F label="District"><TI value={f.tds_district} onChange={v => set('tds_district', v)} /></F>
              <F label="State"><Sel value={f.tds_state2} onChange={v => set('tds_state2', v)} placeholder="Select state" options={INDIAN_STATES} /></F>
              <F label="Pincode"><TI value={f.tds_pincode} onChange={v => set('tds_pincode', v)} /></F>
              <F label="Telephone Number"><TI value={f.telephone} onChange={v => set('telephone', v)} /></F>
              <F label="Email"><TI type="email" value={f.tds_email} onChange={v => set('tds_email', v)} /></F>
            </Grid>
          </div>

          <div className="rounded-xl p-5 space-y-4" style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: G.secondary }}>Government / PAO / DDO Details (if applicable)</p>
            <Grid cols={2}>
              <F label="Ministry / Dept Name"><TI value={f.ministry_dept} onChange={v => set('ministry_dept', v)} /></F>
              <F label="PAO Code"><TI value={f.pao_code} onChange={v => set('pao_code', v)} /></F>
              <F label="PAO Registration Number"><TI value={f.pao_reg_no} onChange={v => set('pao_reg_no', v)} /></F>
              <F label="DDO Code"><TI value={f.ddo_code} onChange={v => set('ddo_code', v)} /></F>
              <F label="DDO Registration Number"><TI value={f.ddo_reg_no} onChange={v => set('ddo_reg_no', v)} /></F>
            </Grid>
          </div>

          <div className="rounded-xl p-5 space-y-4" style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: G.secondary }}>TDS Portal Credentials</p>
            <Grid cols={2}>
              <F label="TDS Portal Username" required><TI value={f.tds_portal_username} onChange={v => set('tds_portal_username', v)} /></F>
              <F label="TDS Portal Password" required><PwdInput value={f.tds_portal_password} onChange={v => set('tds_portal_password', v)} /></F>
            </Grid>
          </div>
          <Toggle value={f.tds_reconciliation} onChange={v => set('tds_reconciliation', v)} label="TDS Reconciliation Required" />
        </div>
      )}
    </div>
  )
}

function Step8({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  const TDS_RETURNS = [
    { code: '24Q', new: '138-TDS', desc: 'Salary' },
    { code: '26Q', new: '140-TDS', desc: 'Non-salary domestic' },
    { code: '27Q', new: '144-TDS', desc: 'Non-resident payments' },
    { code: '27EQ', new: '143-TDS', desc: 'TCS' },
  ]
  const TDS_SECTIONS = ['192', '193', '194', '194A', '194B', '194C', '194D', '194E', '194G', '194H', '194I', '194IA', '194IB', '194J', '194K', '194N', '194Q', '195', '206C', '206CR']
  return (
    <div>
      <SectionHead title="TDS Filing Configuration" sub="Configure TDS return types, applicable sections and TRACES credentials" />
      <F label="Applicable TDS Return Types" required>
        <div className="space-y-2 mt-1">
          {TDS_RETURNS.map(r => (
            <div key={r.code}
              onClick={() => {
                const cur = f.tds_return_types
                set('tds_return_types', cur.includes(r.code) ? cur.filter(x => x !== r.code) : [...cur, r.code])
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
              style={{
                background: f.tds_return_types.includes(r.code) ? G.accent + '12' : G.canvas,
                border: `1px solid ${f.tds_return_types.includes(r.code) ? G.accent : G.border}`,
              }}>
              <div className="flex h-4 w-4 items-center justify-center rounded"
                style={{ border: `2px solid ${f.tds_return_types.includes(r.code) ? G.accent : G.border}`, background: f.tds_return_types.includes(r.code) ? G.accent : 'transparent' }}>
                {f.tds_return_types.includes(r.code) && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <span className="text-sm font-semibold" style={{ color: G.primary }}>Form {r.code}</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: G.accent + '18', color: G.accent }}>{r.new}</span>
              <span className="text-xs" style={{ color: G.muted }}>— {r.desc}</span>
            </div>
          ))}
        </div>
      </F>
      <div className="mt-5">
        <F label="Applicable TDS Sections" hint="Select all sections under which deductions are made">
          <MultiSelect options={TDS_SECTIONS} value={f.tds_sections} onChange={v => set('tds_sections', v)} />
        </F>
      </div>
      <div className="mt-6 rounded-xl p-5 space-y-4" style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: G.secondary }}>TRACES Credentials</p>
        <Grid cols={2}>
          <F label="TRACES Username" required><TI value={f.traces_username} onChange={v => set('traces_username', v)} /></F>
          <F label="TRACES Password" required><PwdInput value={f.traces_password} onChange={v => set('traces_password', v)} /></F>
          <F label="Registered Mobile"><TI value={f.traces_mobile} onChange={v => set('traces_mobile', v)} /></F>
          <F label="Registered Email"><TI type="email" value={f.traces_email} onChange={v => set('traces_email', v)} /></F>
        </Grid>
      </div>
      <div className="mt-5 rounded-xl p-5 space-y-4" style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: G.secondary }}>Default Assignments</p>
        <Grid cols={2}>
          <F label="Default Reviewer"><TI value={f.tds_reviewer} onChange={v => set('tds_reviewer', v)} placeholder="First level reviewer" /></F>
          <F label="Default Approver"><TI value={f.tds_approver} onChange={v => set('tds_approver', v)} placeholder="Final approver" /></F>
        </Grid>
      </div>
    </div>
  )
}

function Step9({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  return (
    <div>
      <SectionHead title="Income Tax Configuration" sub="Income tax portal credentials and tax audit applicability" />
      <div className="rounded-xl p-5 space-y-4" style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: G.secondary }}>Income Tax Portal Credentials</p>
        <Grid cols={2}>
          <F label="PAN Number" required><TI value={f.it_pan} onChange={v => set('it_pan', v.toUpperCase())} placeholder="AABCS1234D" /></F>
          <F label="IT Portal Username" required><TI value={f.it_username} onChange={v => set('it_username', v)} /></F>
          <F label="IT Portal Password" required><PwdInput value={f.it_password} onChange={v => set('it_password', v)} /></F>
          <F label="Registered Mobile"><TI value={f.it_mobile} onChange={v => set('it_mobile', v)} /></F>
          <F label="Registered Email"><TI type="email" value={f.it_email} onChange={v => set('it_email', v)} /></F>
        </Grid>
      </div>
      <div className="mt-5">
        <Toggle value={f.tax_audit_applicable} onChange={v => set('tax_audit_applicable', v)} label="Tax Audit Applicable (u/s 44AB)" />
      </div>
      <div className="mt-5 rounded-xl p-5 space-y-4" style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: G.secondary }}>Default Assignments</p>
        <Grid cols={2}>
          <F label="Default Reviewer" hint="First level review"><TI value={f.it_reviewer} onChange={v => set('it_reviewer', v)} placeholder="Team member name" /></F>
          <F label="Default Approver" hint="Final sign-off"><TI value={f.it_approver} onChange={v => set('it_approver', v)} placeholder="Team member name" /></F>
        </Grid>
      </div>
    </div>
  )
}

function Step10({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  return (
    <div>
      <SectionHead title="Client Admin Creation" sub="Create the primary admin user for the client organization. They will receive OTP for verification." />
      <div className="rounded-xl p-4 mb-6" style={{ background: '#EFF8FF', border: `1px solid ${G.accent}33` }}>
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="h-4 w-4" style={{ color: G.accent }} />
          <p className="text-sm font-semibold" style={{ color: G.accent }}>Role: CLIENT_ADMIN</p>
        </div>
        <p className="text-xs" style={{ color: G.secondary }}>
          This user will have full access to the client's compliance portal. Email OTP and Mobile OTP verification will be triggered on creation.
        </p>
      </div>
      <Grid cols={2}>
        <F label="Full Name" required><TI value={f.admin_name} onChange={v => set('admin_name', v)} placeholder="Full name" /></F>
        <F label="Designation" required>
          <Sel value={f.admin_designation} onChange={v => set('admin_designation', v)} placeholder="Select" options={[
            'Director', 'CFO', 'Finance Manager', 'Accounts Manager', 'Compliance Officer', 'CEO', 'Other',
          ]} />
        </F>
        <F label="Email" required><TI type="email" value={f.admin_email} onChange={v => set('admin_email', v)} placeholder="admin@company.com" /></F>
        <F label="Mobile" required><TI value={f.admin_mobile} onChange={v => set('admin_mobile', v)} placeholder="+91 XXXXXXXXXX" /></F>
        <div className="md:col-span-2">
          <F label="Temporary Password" required hint="User will be prompted to change on first login">
            <PwdInput value={f.admin_password} onChange={v => set('admin_password', v)} placeholder="Min 8 characters" />
          </F>
        </div>
      </Grid>
    </div>
  )
}

function Step11({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  const ALL_CLAUSES = [
    '3(i)(a)', '3(i)(b)', '3(i)(c)', '3(ii)(a)', '3(ii)(b)', '3(iii)',
    '3(iv)', '3(v)', '3(vi)', '3(vii)(a)', '3(vii)(b)', '3(viii)',
    '3(ix)', '3(x)', '3(xi)', '3(xii)', '3(xiii)', '3(xiv)',
    '3(xv)', '3(xvi)', '3(xvii)', '3(xviii)', '3(xix)', '3(xx)', '3(xxi)',
  ]
  const [newClause, setNewClause] = useState('')
  return (
    <div>
      <SectionHead title="Audit Clause Configuration" sub="Enable or disable CARO 2020 clauses applicable to this organization" />
      <Grid cols={2}>
        <F label="Configuration Financial Year">
          <Sel value={f.clause_fy} onChange={v => set('clause_fy', v)} options={['2025-26', '2024-25', '2026-27']} />
        </F>
        <F label="Configuration Version"><TI value={f.clause_version} onChange={v => set('clause_version', v)} placeholder="1.0" /></F>
      </Grid>
      <div className="mt-6">
        <F label="Enabled Clauses" hint="Click to toggle. Green = enabled, Gray = disabled">
          <div className="flex flex-wrap gap-2 mt-1">
            {ALL_CLAUSES.map(c => {
              const enabled = f.enabled_clauses.includes(c)
              return (
                <button key={c} type="button"
                  onClick={() => {
                    if (enabled) {
                      set('enabled_clauses', f.enabled_clauses.filter(x => x !== c))
                      set('disabled_clauses', [...f.disabled_clauses, c])
                    } else {
                      set('disabled_clauses', f.disabled_clauses.filter(x => x !== c))
                      set('enabled_clauses', [...f.enabled_clauses, c])
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: enabled ? '#F0FDF4' : G.canvas,
                    color: enabled ? '#10B981' : G.muted,
                    border: `1px solid ${enabled ? '#10B98133' : G.border}`,
                  }}>
                  {enabled && <Check className="h-2.5 w-2.5 inline mr-1" />}{c}
                </button>
              )
            })}
          </div>
        </F>
      </div>
      <div className="mt-6">
        <F label="Custom Clauses" hint="Add organization-specific audit clauses">
          <div className="flex gap-2">
            <input value={newClause} onChange={e => setNewClause(e.target.value)}
              placeholder="Enter custom clause description"
              className="flex-1 rounded-lg px-3.5 py-2.5 text-sm outline-none"
              style={{ background: G.white, border: `1.5px solid ${G.border}`, color: G.primary }} />
            <button type="button"
              onClick={() => { if (newClause.trim()) { set('custom_clauses', [...f.custom_clauses, newClause.trim()]); setNewClause('') } }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: G.accent }}>Add</button>
          </div>
          {f.custom_clauses.length > 0 && (
            <div className="mt-3 space-y-2">
              {f.custom_clauses.map((c, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
                  style={{ background: G.white, border: `1px solid ${G.divider}` }}>
                  <span className="flex-1 text-sm" style={{ color: G.primary }}>{c}</span>
                  <button type="button" onClick={() => set('custom_clauses', f.custom_clauses.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5" style={{ color: '#EF4444' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </F>
      </div>
    </div>
  )
}

function Step12({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  return (
    <div>
      <SectionHead title="Audit Applicability Configuration" sub="Configure which types of audits apply and their scheduling" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Toggle value={f.statutory_audit_applicable} onChange={v => set('statutory_audit_applicable', v)} label="Statutory Audit Applicable" />
        <Toggle value={f.tax_audit_applicable} onChange={v => set('tax_audit_applicable', v)} label="Tax Audit Applicable (u/s 44AB)" />
      </div>
      <div className="mt-6">
        <Grid cols={2}>
          <F label="Audit Frequency">
            <Sel value={f.audit_frequency} onChange={v => set('audit_frequency', v)} options={['Financial Year', 'Assessment Year']} />
          </F>
          <F label="Audit Due Date"><TI type="date" value={f.audit_due_date} onChange={v => set('audit_due_date', v)} /></F>
          <F label="Default Reviewer" hint="First level review">
            <TI value={f.audit_reviewer} onChange={v => set('audit_reviewer', v)} placeholder="CA / Manager" />
          </F>
          <F label="Default Approver" hint="Final approval / sign-off">
            <TI value={f.audit_approver} onChange={v => set('audit_approver', v)} placeholder="Partner / CA" />
          </F>
        </Grid>
      </div>
    </div>
  )
}

function Step13({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  const MASTERS = [
    'GST Return Types', 'GST Registration Types', 'TDS Return Types', 'TDS Sections',
    'Audit Types', 'Notice Types', 'Task Categories', 'Document Categories', 'HSN Codes', 'SAC Codes',
  ]
  return (
    <div>
      <SectionHead title="Compliance Configuration" sub="Select compliance masters to activate for this organization" />
      <div className="rounded-xl p-4 mb-6" style={{ background: '#FFFBEB', border: '1px solid #FCD34D66' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: '#92400E' }}>About Compliance Masters</p>
        <p className="text-xs" style={{ color: '#78350F' }}>
          These are master data repositories used across GST, TDS, Audit and Notice modules. Enable the ones applicable to this client. All are enabled by default.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {MASTERS.map(m => {
          const active = f.compliance_masters.includes(m)
          return (
            <div key={m}
              onClick={() => set('compliance_masters', active ? f.compliance_masters.filter(x => x !== m) : [...f.compliance_masters, m])}
              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
              style={{
                background: active ? G.accent + '10' : G.canvas,
                border: `1px solid ${active ? G.accent + '55' : G.border}`,
              }}>
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                style={{ background: active ? G.accent : 'transparent', border: `2px solid ${active ? G.accent : G.border}` }}>
                {active && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm" style={{ color: active ? G.primary : G.secondary }}>{m}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Step14({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  return (
    <div>
      <SectionHead title="Communication Preferences" sub="Configure how the system communicates with the client organization" />
      <div className="space-y-3">
        <Toggle value={f.email_notifications} onChange={v => set('email_notifications', v)} label="Email Notifications" />
        <Toggle value={f.whatsapp_notifications} onChange={v => set('whatsapp_notifications', v)} label="WhatsApp Notifications" />
        <Toggle value={f.portal_notifications} onChange={v => set('portal_notifications', v)} label="Portal Notifications (in-app)" />
      </div>
      {!f.email_notifications && !f.whatsapp_notifications && !f.portal_notifications && (
        <div className="mt-4 rounded-xl p-3" style={{ background: '#FEF2F2', border: '1px solid #EF444433' }}>
          <p className="text-xs" style={{ color: '#991B1B' }}>⚠ At least one notification channel must be enabled for compliance alerts and document reminders to work.</p>
        </div>
      )}
    </div>
  )
}

function Step15({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  const DOC_CATS = ['GST', 'TDS', 'Audit', 'Financial Statements', 'Bank Statements', 'Legal Documents', 'Notices', 'Compliance Documents']
  return (
    <div>
      <SectionHead title="Document Collection Preferences" sub="Configure automated document collection and reminder settings" />
      <div className="space-y-3">
        <Toggle value={f.auto_doc_requests} onChange={v => set('auto_doc_requests', v)} label="Enable Auto Document Requests" />
        <Toggle value={f.reminder_notifications} onChange={v => set('reminder_notifications', v)} label="Enable Reminder Notifications" />
      </div>
      {f.auto_doc_requests && (
        <div className="mt-6">
          <Grid cols={2}>
            <F label="Reminder Frequency">
              <Sel value={f.reminder_frequency} onChange={v => set('reminder_frequency', v)} options={['Daily', 'Weekly', 'Bi-Weekly', 'Monthly']} />
            </F>
            <F label="Escalation After (Days)">
              <Sel value={f.escalation_days} onChange={v => set('escalation_days', v)} options={['3', '5', '7', '10', '14', '30']} />
            </F>
          </Grid>
        </div>
      )}
      <div className="mt-6">
        <F label="Required Document Categories" hint="Select the document categories to collect from this client">
          <MultiSelect options={DOC_CATS} value={f.doc_categories} onChange={v => set('doc_categories', v)} />
        </F>
      </div>
    </div>
  )
}

function Step16({ f }: { f: FormState }) {
  const sections = [
    {
      label: 'Organization Details', icon: '🏢', items: [
        { k: 'Legal Name', v: f.legal_name }, { k: 'PAN', v: f.pan },
        { k: 'Type', v: f.org_type }, { k: 'Email', v: f.email }, { k: 'Mobile', v: f.mobile },
      ]
    },
    {
      label: 'Registered Address', icon: '📍', items: [
        { k: 'Address', v: [f.addr_line1, f.city, f.state, f.pincode].filter(Boolean).join(', ') },
        { k: 'Type', v: f.addr_type },
      ]
    },
    { label: 'KMPs', icon: '👥', items: f.kmps.map(k => ({ k: k.designation || 'KMP', v: k.full_name || '—' })) },
    { label: 'Branches', icon: '🏪', items: f.branches.length ? f.branches.map(b => ({ k: b.code, v: `${b.name} — ${b.state}` })) : [{ k: 'Branches', v: 'None added' }] },
    { label: 'GST Registrations', icon: '🧾', items: f.gst_registrations.map(g => ({ k: g.state || 'GST', v: g.gstin || '—' })) },
    {
      label: 'GST Filing', icon: '📋', items: [
        { k: 'Frequency', v: f.gst_frequency }, { k: 'Return Types', v: f.gst_return_types.join(', ') || '—' },
        { k: 'SEZ Payer', v: f.sez_payer ? 'Yes' : 'No' }, { k: 'E-Invoicing', v: f.einvoicing ? 'Yes' : 'No' },
      ]
    },
    {
      label: 'TDS Config', icon: '🧮', items: [
        { k: 'TAN', v: f.tan || '—' }, { k: 'Deductor Type', v: f.deductor_type || '—' },
        { k: 'Applicable', v: f.tds_applicable ? 'Yes' : 'No' },
      ]
    },
    {
      label: 'TDS Filing', icon: '📄', items: [
        { k: 'Return Types', v: f.tds_return_types.join(', ') || '—' },
        { k: 'Sections', v: f.tds_sections.slice(0, 4).join(', ') + (f.tds_sections.length > 4 ? '...' : '') },
      ]
    },
    {
      label: 'Income Tax', icon: '🛡️', items: [
        { k: 'IT PAN', v: f.it_pan || '—' }, { k: 'Tax Audit', v: f.tax_audit_applicable ? 'Yes' : 'No' },
      ]
    },
    {
      label: 'Client Admin', icon: '👤', items: [
        { k: 'Name', v: f.admin_name || '—' }, { k: 'Email', v: f.admin_email || '—' },
      ]
    },
    {
      label: 'Audit Setup', icon: '📊', items: [
        { k: 'Statutory', v: f.statutory_audit_applicable ? 'Yes' : 'No' },
        { k: 'Tax Audit', v: f.tax_audit_applicable ? 'Yes' : 'No' },
        { k: 'Frequency', v: f.audit_frequency }, { k: 'Clauses', v: `${f.enabled_clauses.length} enabled` },
      ]
    },
    {
      label: 'Communication', icon: '🔔', items: [
        { k: 'Email', v: f.email_notifications ? '✓ On' : '✗ Off' },
        { k: 'WhatsApp', v: f.whatsapp_notifications ? '✓ On' : '✗ Off' },
        { k: 'Portal', v: f.portal_notifications ? '✓ On' : '✗ Off' },
      ]
    },
    {
      label: 'Documents', icon: '📁', items: [
        { k: 'Auto Requests', v: f.auto_doc_requests ? 'Enabled' : 'Disabled' },
        { k: 'Reminder', v: f.reminder_frequency }, { k: 'Categories', v: `${f.doc_categories.length} selected` },
      ]
    },
  ]
  return (
    <div>
      <SectionHead title="Review & Submit" sub="Verify all information before completing the onboarding process." />
      <div className="rounded-xl p-4 mb-6 flex items-center gap-3"
        style={{ background: '#EBF5FF', border: `1.5px solid ${G.accent}44` }}>
        <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ background: G.accent }}>
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: G.accent }}>Ready to submit</p>
          <p className="text-xs mt-0.5" style={{ color: G.secondary }}>All required sections have been filled. Review the summary below before submitting.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(sec => (
          <div key={sec.label} className="rounded-xl p-4"
            style={{ background: G.canvas, border: `1px solid ${G.divider}` }}>
            <div className="flex items-center gap-2 mb-3 pb-2.5" style={{ borderBottom: `1px solid ${G.divider}` }}>
              <span className="text-base">{sec.icon}</span>
              <p className="text-xs font-bold" style={{ color: G.primary }}>{sec.label}</p>
            </div>
            <div className="space-y-2">
              {sec.items.map(item => (
                <div key={item.k} className="flex items-start gap-2">
                  <span className="text-[10px] shrink-0 w-20 pt-0.5" style={{ color: G.muted }}>{item.k}</span>
                  <span className="text-xs font-medium flex-1 leading-relaxed" style={{ color: item.v === '—' ? G.muted : G.primary }}>{item.v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION BUTTONS COMPONENT (inline at bottom of form)
// ═══════════════════════════════════════════════════════════════════════════════
function NavigationButtons({ step, totalSteps, onBack, onNext, onSaveDraft, onSubmit }: {
  step: number; totalSteps: number; onBack: () => void; onNext: () => void
  onSaveDraft: () => void; onSubmit: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-8 mt-8"
      style={{ borderTop: `1.5px solid ${G.divider}` }}>
      {/* Back Button */}
      <button type="button"
        onClick={onBack}
        disabled={step === 1}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: G.canvas, border: `1.5px solid ${G.border}`, color: G.secondary }}
        onMouseEnter={e => {
          if (step !== 1) {
            ; (e.currentTarget as HTMLElement).style.borderColor = G.borderHov
              ; (e.currentTarget as HTMLElement).style.background = G.white
          }
        }}
        onMouseLeave={e => {
          ; (e.currentTarget as HTMLElement).style.borderColor = G.border
            ; (e.currentTarget as HTMLElement).style.background = G.canvas
        }}>
        <ChevronLeft className="h-4 w-4" />Back
      </button>

      {/* Right side buttons */}
      <div className="flex items-center gap-3">
        {/* Save Draft */}
        <button type="button" onClick={onSaveDraft}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: G.white, color: G.accent, border: `1.5px solid ${G.accent}55` }}
          onMouseEnter={e => {
            ; (e.currentTarget as HTMLElement).style.background = G.accent + '08'
              ; (e.currentTarget as HTMLElement).style.borderColor = G.accent
          }}
          onMouseLeave={e => {
            ; (e.currentTarget as HTMLElement).style.background = G.white
              ; (e.currentTarget as HTMLElement).style.borderColor = G.accent + '55'
          }}>
          <Save className="h-4 w-4" />Save as Draft
        </button>

        {/* Next / Submit */}
        {step < totalSteps ? (
          <button type="button"
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all"
            style={{ background: G.accent, boxShadow: `0 4px 12px ${G.accent}55` }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = G.accentHov }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = G.accent }}>
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={onSubmit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all"
            style={{ background: G.success, boxShadow: '0 4px 12px rgba(18,168,122,0.4)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0E906A' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = G.success }}>
            <CheckCircle2 className="h-4 w-4" />Complete Onboarding
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function ClientOnboardPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INIT)

  const set = (k: keyof FormState, v: any) => setForm(p => ({ ...p, [k]: v }))
  const progress = Math.round((step / STEPS.length) * 100)

  const handleSubmit = () => {
    toast.success(`${form.legal_name || 'Organization'} onboarded successfully!`)
    navigate('/clients')
  }

  const handleSaveDraft = () => {
    toast.success('Draft saved successfully')
  }

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 f={form} set={set} />
      case 2: return <Step2 f={form} set={set} />
      case 3: return <Step3 f={form} set={set} />
      case 4: return <Step4 f={form} set={set} />
      case 5: return <Step5 f={form} set={set} />
      case 6: return <Step6 f={form} set={set} />
      case 7: return <Step7 f={form} set={set} />
      case 8: return <Step8 f={form} set={set} />
      case 9: return <Step9 f={form} set={set} />
      case 10: return <Step10 f={form} set={set} />
      case 11: return <Step11 f={form} set={set} />
      case 12: return <Step12 f={form} set={set} />
      case 13: return <Step13 f={form} set={set} />
      case 14: return <Step14 f={form} set={set} />
      case 15: return <Step15 f={form} set={set} />
      case 16: return <Step16 f={form} />
      default: return null
    }
  }

  const currentStepMeta = STEPS[step - 1]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: G.canvas }}>

      {/* ── TOP HEADER ────────────────────────────────────────── */}
      <div style={{ background: G.white, borderBottom: `1.5px solid ${G.divider}`, boxShadow: '0 1px 3px rgba(13,31,53,0.04)' }}>

        {/* Title Bar */}
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: G.accent + '15', border: `1.5px solid ${G.accent}44` }}>
              <Building2 className="h-5 w-5" style={{ color: G.accent }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: G.accent }}>AuditLens</p>
              <h1 className="text-lg font-bold leading-tight" style={{ color: G.primary }}>Organization Onboarding</h1>
            </div>
          </div>

          {/* Overall progress */}
          <div className="flex items-center gap-3 min-w-[280px]">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-semibold mb-1" style={{ color: G.muted }}>
                <span>Overall progress</span>
                <span style={{ color: G.accent }}>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: G.divider }}>
                <div className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${G.accent}, #38B2F0)` }} />
              </div>
            </div>
            <span className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-lg shrink-0"
              style={{ background: G.accent + '12', color: G.accent }}>
              {step}/{STEPS.length}
            </span>
          </div>
        </div>

        {/* Horizontal Stepper */}
        <div style={{ borderTop: `1px solid ${G.divider}` }}>
          <HorizontalStepper currentStep={step} onStepClick={setStep} />
        </div>
      </div>

      {/* ── MAIN BODY ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          {/* Step header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: G.accent + '15', color: G.accent }}>
                Step {step} of {STEPS.length}
              </span>
              <span className="text-[10px]" style={{ color: G.muted }}>· {currentStepMeta.group}</span>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: G.primary }}>{currentStepMeta.fullLabel}</h2>
          </div>

          {/* Form Card — full width, no max-width constraint */}
          <div className="rounded-2xl p-7"
            style={{ background: G.white, border: `1px solid ${G.divider}`, boxShadow: '0 2px 12px rgba(13,31,53,0.06)' }}>
            {renderStep()}

            {/* Navigation buttons inside the card */}
            <NavigationButtons
              step={step}
              totalSteps={STEPS.length}
              onBack={() => setStep(s => Math.max(1, s - 1))}
              onNext={() => setStep(s => Math.min(STEPS.length, s + 1))}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  )
}