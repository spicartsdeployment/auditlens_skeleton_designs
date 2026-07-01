/**
 * Client Onboarding Wizard — 7 Steps
 * Layout: Horizontal stepper (top) + form card (full width)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Check, ChevronRight, ChevronLeft, Plus, Trash2, Eye, EyeOff,
  Upload, Building2, Phone, Mail, MapPin, FileText, Shield,
  AlertCircle, Copy, X, Info, Settings, Users, Bell,
  MessageSquare, Smartphone, Globe, FolderOpen,
} from 'lucide-react'
import { MOCK_USERS } from '@/mock/data'
import type { User } from '@/shared/types'

// ─── Design tokens ───────────────────────────────────────────────────────────
const G = {
  canvas: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#94A3B8',
  secondary: '#475569',
  primary: '#0F172A',
  accent: '#0584C7',
} as const

// ─── Static data ─────────────────────────────────────────────────────────────
const ORG_TYPES = [
  'Individual', 'Proprietorship', 'Partnership Firm', 'LLP',
  'Private Limited Company', 'Public Limited Company', 'OPC',
  'Trust', 'Society', 'HUF', 'AOP', 'Government', 'Others',
]

const NATURE_OF_BUSINESS = [
  'Manufacturing', 'Trading', 'Service', 'Works Contract', 'Construction',
  'Professional Services', 'Healthcare', 'Education', 'Hospitality',
  'Transportation', 'Real Estate', 'Agriculture', 'Finance', 'IT',
  'E-Commerce', 'Export', 'Import', 'NGO', 'Government', 'Others',
]

const INDUSTRIES = [
  'Automobile', 'Banking', 'Chemical', 'Construction', 'Education',
  'Engineering', 'FMCG', 'Food Processing', 'Healthcare', 'Hospitality',
  'IT & Software', 'Jewellery', 'Logistics', 'Manufacturing', 'Media',
  'Mining', 'Oil & Gas', 'Pharmaceutical', 'Power', 'Retail',
  'Telecommunication', 'Textile', 'Travel & Tourism', 'Wholesale', 'Others',
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

const DESIGNATION_MAP: Record<string, string[]> = {
  'Private Limited Company': ['Managing Director', 'Director', 'CEO', 'CFO', 'Company Secretary', 'Accounts Manager', 'Finance Manager', 'Authorized Signatory'],
  'Public Limited Company': ['Managing Director', 'Director', 'CEO', 'CFO', 'Company Secretary', 'Accounts Manager', 'Finance Manager', 'Authorized Signatory'],
  'OPC': ['Managing Director', 'Director', 'CEO', 'CFO', 'Company Secretary', 'Accounts Manager', 'Finance Manager', 'Authorized Signatory'],
  'LLP': ['Designated Partner', 'Partner', 'Finance Manager', 'Authorized Signatory'],
  'Partnership Firm': ['Managing Partner', 'Partner', 'Accounts Manager', 'Authorized Signatory'],
  'Proprietorship': ['Proprietor', 'Accounts Manager', 'Authorized Representative'],
  'Trust': ['Managing Trustee', 'Trustee', 'Secretary', 'Treasurer'],
  'Society': ['President', 'Vice President', 'Secretary', 'Treasurer', 'Executive Member'],
}

const DEFAULT_DESIGNATIONS = ['Director', 'Manager', 'Accounts Manager', 'Authorized Signatory']

const REGISTRATIONS = [
  { id: 'GST', label: 'GST', icon: '🧾' },
  { id: 'TAN', label: 'TAN', icon: '📋' },
  { id: 'MSME', label: 'MSME', icon: '🏭' },
  { id: 'IEC', label: 'IEC', icon: '🌐' },
  { id: 'EPF', label: 'EPF', icon: '👥' },
  { id: 'ESI', label: 'ESI', icon: '🏥' },
  { id: 'PT', label: 'Professional Tax', icon: '💼' },
  { id: 'FSSAI', label: 'FSSAI', icon: '🍽️' },
  { id: 'SE', label: 'Shop & Establishment', icon: '🏪' },
  { id: 'FL', label: 'Factory License', icon: '🏗️' },
  { id: 'TL', label: 'Trade License', icon: '📜' },
  { id: 'RERA', label: 'RERA', icon: '🏢' },
  { id: 'SEBI', label: 'SEBI', icon: '📈' },
  { id: '12A', label: '12A', icon: '📄' },
  { id: '80G', label: '80G', icon: '💰' },
  { id: 'NGO', label: 'NGO Darpan', icon: '🤝' },
  { id: 'OTH', label: 'Others', icon: '➕' },
]

const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi',
  '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
  '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
  '24': 'Gujarat', '26': 'Dadra and Nagar Haveli and Daman and Diu', '27': 'Maharashtra',
  '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana', '37': 'Andhra Pradesh',
}

const STEPS_META = [
  { id: 1, label: 'Basic Information', icon: Building2 },
  { id: 2, label: 'Contact Information', icon: Phone },
  { id: 3, label: 'Address', icon: MapPin },
  { id: 4, label: 'Organization Details', icon: FileText },
  { id: 5, label: 'Business & Tax Registrations', icon: Shield },
  { id: 6, label: 'Registration Details', icon: Mail },
  { id: 7, label: 'Settings Profile', icon: Settings },
]

const FY_OPTIONS = ['2025-26', '2024-25', '2023-24']

type CommMode = 'whatsapp' | 'email' | 'portal' | 'internal'
type ModuleKey = 'gst' | 'tds' | 'audit'

interface ModuleDoc {
  id: string
  name: string
  required: boolean
}

const COMM_MODES: { id: CommMode; label: string; icon: typeof MessageSquare; desc: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone, desc: 'Client WhatsApp for reminders & doc requests' },
  { id: 'email', label: 'Email', icon: Mail, desc: 'Official email communication' },
  { id: 'portal', label: 'Client Portal', icon: Globe, desc: 'Secure portal uploads & messaging' },
  { id: 'internal', label: 'In-App Only', icon: MessageSquare, desc: 'Firm team handles all client touchpoints' },
]

const MODULE_DOC_TEMPLATES: Record<ModuleKey, { name: string; defaultRequired: boolean }[]> = {
  gst: [
    { name: 'Sales Invoices / GSTR-1 Data', defaultRequired: true },
    { name: 'Purchase Register', defaultRequired: true },
    { name: 'Bank Statement', defaultRequired: true },
    { name: 'Credit / Debit Notes', defaultRequired: false },
    { name: 'E-way Bills Summary', defaultRequired: false },
  ],
  tds: [
    { name: 'TDS Deduction Statement', defaultRequired: true },
    { name: 'Challan Payment Proofs', defaultRequired: true },
    { name: 'Salary Register (24Q)', defaultRequired: true },
    { name: 'Vendor Master with PAN', defaultRequired: true },
    { name: 'Form 16 / 16A Copies', defaultRequired: false },
  ],
  audit: [
    { name: 'Trial Balance', defaultRequired: true },
    { name: 'Fixed Assets Register', defaultRequired: true },
    { name: 'Bank Statements (All Accounts)', defaultRequired: true },
    { name: 'Board Minutes', defaultRequired: true },
    { name: 'Loan Agreements', defaultRequired: false },
    { name: 'Inventory Valuation Report', defaultRequired: false },
  ],
}

function defaultModuleDocs(module: ModuleKey): ModuleDoc[] {
  return MODULE_DOC_TEMPLATES[module].map(t => ({
    id: uid(),
    name: t.name,
    required: t.defaultRequired,
  }))
}

function buildModuleDocsMap(gst: boolean, tds: boolean, audit: boolean, prev: Partial<Record<ModuleKey, ModuleDoc[]>> = {}) {
  const next: Partial<Record<ModuleKey, ModuleDoc[]>> = { ...prev }
  if (gst && !next.gst) next.gst = defaultModuleDocs('gst')
  if (!gst) delete next.gst
  if (tds && !next.tds) next.tds = defaultModuleDocs('tds')
  if (!tds) delete next.tds
  if (audit && !next.audit) next.audit = defaultModuleDocs('audit')
  if (!audit) delete next.audit
  return next as Record<ModuleKey, ModuleDoc[]>
}

interface SettingsProfile {
  gstEnabled: boolean
  tdsEnabled: boolean
  auditEnabled: boolean
  assignedAdminId: string
  assignedArticleId: string
  financialYear: string
  clientActive: boolean
  notifyFilingReminders: boolean
  notifyDocRequests: boolean
  notifyNoticeAlerts: boolean
  clientPortalAccess: boolean
  primaryCommMode: CommMode
  commWhatsAppEnabled: boolean
  commEmailEnabled: boolean
  commPortalEnabled: boolean
  commInternalEnabled: boolean
  whatsappNumber: string
  whatsappAutoReply: boolean
  emailPrimary: string
  emailCc: string
  emailAutoAck: boolean
  portalInviteEmail: string
  commPreferredLanguage: string
  commBusinessHoursOnly: boolean
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface GSTEntry {
  id: string
  gstin: string
  state: string
  regType: string
  filingFrequency: string
  username: string
  password: string
  gstr1Due?: string
  gstr3bDue?: string
  gstr9Due?: string
}

interface BranchAddress {
  id: string
  address: string
  city: string
  state: string
  pincode: string
  country: string
}

interface ContactPerson {
  id: string
  name: string
  designation: string
  mobile: string
  email: string
}

interface FormState {
  // Step 1
  clientName: string
  displayName: string
  orgType: string
  natureOfBusiness: string
  industry: string
  panNumber: string
  panHolderName: string
  primaryContactName: string
  primaryMobile: string
  primaryEmail: string
  // Step 2 – Primary Contact
  pc_name: string
  pc_designation: string
  pc_mobile: string
  pc_email: string
  // Step 2 – Secondary Contact
  sc_name: string
  sc_designation: string
  sc_mobile: string
  sc_email: string
  // Step 3
  regAddress: string
  city: string
  state: string
  pincode: string
  country: string
  // Step 4
  cin: string
  dateOfIncorporation: string
  authorizedCapital: string
  paidUpCapital: string
  llpin: string
  firmRegNumber: string
  partnershipDeedDate: string
  proprietorName: string
  proprietorAadhaar: string
  trustRegNumber: string
  trustRegDate: string
  societyRegNumber: string
  // Step 6
  tanNumber: string
  tanPassword: string
  msmeNumber: string
  iecNumber: string
  epfNumber: string
  epfUsername: string
  epfPassword: string
  esiNumber: string
  esiUsername: string
  esiPassword: string
  ptNumber: string
  fssaiNumber: string
  seNumber: string
  otherRegName: string
  otherRegNumber: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function getDesignations(orgType: string): string[] {
  return DESIGNATION_MAP[orgType] ?? DEFAULT_DESIGNATIONS
}

function getGSTState(gstin: string): string {
  const code = gstin.slice(0, 2)
  return GST_STATE_CODES[code] ?? ''
}

// ─── UI Primitives ───────────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: G.secondary, marginBottom: 4 }}>
      {children}
      {required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
    </label>
  )
}

function Input({
  value, onChange, placeholder, type = 'text', readOnly, maxLength, style,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  readOnly?: boolean
  maxLength?: number
  style?: React.CSSProperties
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      maxLength={maxLength}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '8px 12px', borderRadius: 8,
        border: `1px solid ${G.border}`,
        fontSize: 14, color: G.primary, background: readOnly ? G.canvas : G.white,
        outline: 'none', fontFamily: 'Inter, sans-serif',
        ...style,
      }}
    />
  )
}

function Textarea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '8px 12px', borderRadius: 8,
        border: `1px solid ${G.border}`,
        fontSize: 14, color: G.primary, background: G.white,
        outline: 'none', fontFamily: 'Inter, sans-serif', resize: 'vertical',
      }}
    />
  )
}

function Select({
  value, onChange, options, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '8px 12px', borderRadius: 8,
        border: `1px solid ${G.border}`,
        fontSize: 14, color: value ? G.primary : G.muted, background: G.white,
        outline: 'none', fontFamily: 'Inter, sans-serif', cursor: 'pointer',
      }}
    >
      <option value="">{placeholder ?? 'Select…'}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function PasswordInput({
  value, onChange, id, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  id: string
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••'}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '8px 36px 8px 12px', borderRadius: 8,
          border: `1px solid ${G.border}`,
          fontSize: 14, color: G.primary, background: G.white,
          outline: 'none', fontFamily: 'Inter, sans-serif',
        }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: G.muted, padding: 0,
        }}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: '#EF4444', fontSize: 12 }}>
      <AlertCircle size={12} />
      {msg}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 15, fontWeight: 600, color: G.primary, margin: '0 0 16px', padding: '0 0 8px', borderBottom: `1px solid ${G.border}` }}>
      {children}
    </h3>
  )
}

function CardBox({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: G.white, borderRadius: 12, border: `1px solid ${G.border}`,
      padding: 20, ...style,
    }}>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
      {children}
    </div>
  )
}

function UploadBtn({ label }: { label?: string }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: G.accent, fontSize: 12, marginTop: 4 }}>
      <input type="file" style={{ display: 'none' }} onChange={() => toast.success('Document uploaded')} />
      <Upload size={12} />
      {label ?? 'Upload Document'}
    </label>
  )
}

function ToggleSwitch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0' }}>
      <span style={{ fontSize: 13, color: G.secondary, fontWeight: 500 }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!on)}
        style={{
          width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: on ? G.accent : G.border, position: 'relative', flexShrink: 0,
          transition: 'background 0.2s',
        }}
        aria-pressed={on}
      >
        <span style={{
          position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
          background: G.white, transform: on ? 'translateX(16px)' : 'translateX(2px)',
          transition: 'transform 0.2s',
        }} />
      </button>
    </div>
  )
}

function CommModePill({
  active, onClick, label, icon: Icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: typeof MessageSquare
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 999, border: `1.5px solid ${active ? G.accent : G.border}`,
        background: active ? G.accent + '12' : G.white,
        color: active ? G.accent : G.secondary,
        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export function ClientOnboardPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState<FormState>({
    clientName: '', displayName: '', orgType: '', natureOfBusiness: '', industry: '',
    panNumber: '', panHolderName: '', primaryContactName: '', primaryMobile: '', primaryEmail: '',
    pc_name: '', pc_designation: '', pc_mobile: '', pc_email: '',
    sc_name: '', sc_designation: '', sc_mobile: '', sc_email: '',
    regAddress: '', city: '', state: '', pincode: '', country: 'India',
    cin: '', dateOfIncorporation: '', authorizedCapital: '', paidUpCapital: '',
    llpin: '', firmRegNumber: '', partnershipDeedDate: '',
    proprietorName: '', proprietorAadhaar: '',
    trustRegNumber: '', trustRegDate: '', societyRegNumber: '',
    tanNumber: '', tanPassword: '', msmeNumber: '', iecNumber: '',
    epfNumber: '', epfUsername: '', epfPassword: '',
    esiNumber: '', esiUsername: '', esiPassword: '',
    ptNumber: '', fssaiNumber: '', seNumber: '',
    otherRegName: '', otherRegNumber: '',
  })

  const [gstEntries, setGstEntries] = useState<GSTEntry[]>([
    { id: uid(), gstin: '', state: '', regType: '', filingFrequency: '', username: '', password: '' },
  ])
  const [branches, setBranches] = useState<BranchAddress[]>([])
  const [additionalContacts, setAdditionalContacts] = useState<ContactPerson[]>([])
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set())
  const [settingsProfile, setSettingsProfile] = useState<SettingsProfile>({
    gstEnabled: false,
    tdsEnabled: false,
    auditEnabled: false,
    assignedAdminId: '',
    assignedArticleId: '',
    financialYear: '2025-26',
    clientActive: true,
    notifyFilingReminders: true,
    notifyDocRequests: true,
    notifyNoticeAlerts: true,
    clientPortalAccess: false,
    primaryCommMode: 'email',
    commWhatsAppEnabled: true,
    commEmailEnabled: true,
    commPortalEnabled: false,
    commInternalEnabled: false,
    whatsappNumber: '',
    whatsappAutoReply: true,
    emailPrimary: '',
    emailCc: '',
    emailAutoAck: true,
    portalInviteEmail: '',
    commPreferredLanguage: 'English',
    commBusinessHoursOnly: false,
  })
  const [moduleDocs, setModuleDocs] = useState<Partial<Record<ModuleKey, ModuleDoc[]>>>({})
  const [newDocDraft, setNewDocDraft] = useState<Partial<Record<ModuleKey, string>>>({})

  const adminUsers = MOCK_USERS.filter((u: User) => u.role === 'admin' || u.role === 'super_admin')
  const articleUsers = MOCK_USERS.filter((u: User) => u.role === 'article')

  const patchSettings = (patch: Partial<SettingsProfile>) => {
    setSettingsProfile(prev => ({ ...prev, ...patch }))
    setErrors(prev => {
      const next = { ...prev }
      Object.keys(patch).forEach(k => delete next[k])
      return next
    })
  }

  const f = (key: keyof FormState) => (val: string) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {}

    if (s === 1) {
      if (!form.clientName.trim()) errs.clientName = 'Client name is required'
      if (!form.orgType) errs.orgType = 'Organization type is required'
      if (!form.natureOfBusiness) errs.natureOfBusiness = 'Nature of business is required'
      if (!form.panNumber.trim()) errs.panNumber = 'PAN number is required'
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber.toUpperCase())) errs.panNumber = 'Invalid PAN format (AAAAA9999A)'
      if (!form.panHolderName.trim()) errs.panHolderName = 'PAN holder name is required'
      if (!form.primaryContactName.trim()) errs.primaryContactName = 'Primary contact name is required'
      if (!form.primaryMobile.trim()) errs.primaryMobile = 'Mobile number is required'
      else if (!/^\d{10}$/.test(form.primaryMobile)) errs.primaryMobile = 'Enter valid 10-digit mobile'
      if (!form.primaryEmail.trim()) errs.primaryEmail = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.primaryEmail)) errs.primaryEmail = 'Enter valid email address'
    }

    if (s === 2) {
      if (!form.pc_name.trim()) errs.pc_name = 'Primary contact name is required'
      if (!form.pc_mobile.trim()) errs.pc_mobile = 'Mobile number is required'
      else if (!/^\d{10}$/.test(form.pc_mobile)) errs.pc_mobile = 'Enter valid 10-digit mobile'
      if (!form.pc_email.trim()) errs.pc_email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.pc_email)) errs.pc_email = 'Enter valid email address'
    }

    if (s === 3) {
      if (!form.regAddress.trim()) errs.regAddress = 'Address is required'
      if (!form.city.trim()) errs.city = 'City is required'
      if (!form.state) errs.state = 'State is required'
      if (!form.pincode.trim()) errs.pincode = 'Pincode is required'
      else if (!/^\d{6}$/.test(form.pincode)) errs.pincode = 'Enter valid 6-digit pincode'
      if (!form.country.trim()) errs.country = 'Country is required'
    }

    if (s === 6) {
      if (selectedRegistrations.has('GST')) {
        gstEntries.forEach((g, i) => {
          if (!g.gstin.trim()) errs[`gst_gstin_${i}`] = 'GSTIN is required'
          else if (g.gstin.length !== 15) errs[`gst_gstin_${i}`] = 'GSTIN must be 15 characters'
          if (!g.regType) errs[`gst_regType_${i}`] = 'Registration type is required'
          if (!g.filingFrequency) errs[`gst_filing_${i}`] = 'Filing frequency is required'
        })
      }
      if (selectedRegistrations.has('TAN')) {
        if (!form.tanNumber.trim()) errs.tanNumber = 'TAN number is required'
        else if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(form.tanNumber.toUpperCase())) errs.tanNumber = 'Invalid TAN format (AAAA99999A)'
      }
    }

    if (s === 7) {
      if (!settingsProfile.assignedAdminId) errs.assignedAdminId = 'Assign an admin to this client'
      if (!settingsProfile.gstEnabled && !settingsProfile.tdsEnabled && !settingsProfile.auditEnabled) {
        errs.modules = 'Enable at least one compliance module'
      }
      const anyComm = settingsProfile.commWhatsAppEnabled || settingsProfile.commEmailEnabled
        || settingsProfile.commPortalEnabled || settingsProfile.commInternalEnabled
      if (!anyComm) errs.commMode = 'Enable at least one communication mode'
      if (settingsProfile.commWhatsAppEnabled && !settingsProfile.whatsappNumber.trim()) {
        errs.whatsappNumber = 'WhatsApp number is required when WhatsApp is enabled'
      }
      if (settingsProfile.commEmailEnabled && !settingsProfile.emailPrimary.trim()) {
        errs.emailPrimary = 'Primary email is required when Email is enabled'
      }
      if (settingsProfile.commPortalEnabled && !settingsProfile.portalInviteEmail.trim()) {
        errs.portalInviteEmail = 'Portal invite email is required when Portal is enabled'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function syncSettingsFromRegistrations() {
    const gstEnabled = selectedRegistrations.has('GST')
    const tdsEnabled = selectedRegistrations.has('TAN')
    patchSettings({
      gstEnabled,
      tdsEnabled,
      emailPrimary: form.pc_email || form.primaryEmail,
      portalInviteEmail: form.pc_email || form.primaryEmail,
      whatsappNumber: form.pc_mobile || form.primaryMobile,
      commPortalEnabled: false,
    })
    setModuleDocs(prev => buildModuleDocsMap(gstEnabled, tdsEnabled, settingsProfile.auditEnabled, prev))
  }

  function handleModuleToggle(key: 'gstEnabled' | 'tdsEnabled' | 'auditEnabled', enabled: boolean) {
    patchSettings({ [key]: enabled })
    const next = {
      gstEnabled: key === 'gstEnabled' ? enabled : settingsProfile.gstEnabled,
      tdsEnabled: key === 'tdsEnabled' ? enabled : settingsProfile.tdsEnabled,
      auditEnabled: key === 'auditEnabled' ? enabled : settingsProfile.auditEnabled,
    }
    setModuleDocs(prev => buildModuleDocsMap(next.gstEnabled, next.tdsEnabled, next.auditEnabled, prev))
  }

  function toggleDocRequired(module: ModuleKey, docId: string) {
    setModuleDocs(prev => ({
      ...prev,
      [module]: (prev[module] ?? []).map(d =>
        d.id === docId ? { ...d, required: !d.required } : d
      ),
    }))
  }

  function removeModuleDoc(module: ModuleKey, docId: string) {
    setModuleDocs(prev => ({
      ...prev,
      [module]: (prev[module] ?? []).filter(d => d.id !== docId),
    }))
  }

  function addModuleDoc(module: ModuleKey, name: string) {
    if (!name.trim()) return
    setModuleDocs(prev => ({
      ...prev,
      [module]: [...(prev[module] ?? []), { id: uid(), name: name.trim(), required: true }],
    }))
  }

  function handleNext() {
    if (!validateStep(step)) return
    if (step === 6) {
      syncSettingsFromRegistrations()
      setStep(7)
      return
    }
    if (step === 7) {
      toast.success('Client onboarded successfully!')
      navigate('/clients')
      return
    }
    setStep(s => s + 1)
  }

  function handleBack() {
    setStep(s => Math.max(1, s - 1))
  }

  // ── GST helpers ───────────────────────────────────────────────────────────
  function updateGST(idx: number, key: keyof GSTEntry, val: string) {
    setGstEntries(prev => prev.map((g, i) => {
      if (i !== idx) return g
      const updated = { ...g, [key]: val }
      if (key === 'gstin') updated.state = getGSTState(val)
      return updated
    }))
  }

  function addGST() {
    setGstEntries(prev => [...prev, { id: uid(), gstin: '', state: '', regType: '', filingFrequency: '', username: '', password: '' }])
  }

  function removeGST(idx: number) {
    setGstEntries(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Branch helpers ────────────────────────────────────────────────────────
  function addBranch() {
    setBranches(prev => [...prev, { id: uid(), address: '', city: '', state: '', pincode: '', country: 'India' }])
  }

  function removeBranch(id: string) {
    setBranches(prev => prev.filter(b => b.id !== id))
  }

  function updateBranch(id: string, key: keyof BranchAddress, val: string) {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, [key]: val } : b))
  }

  // ── Contact helpers ───────────────────────────────────────────────────────
  function addContact() {
    setAdditionalContacts(prev => [...prev, { id: uid(), name: '', designation: '', mobile: '', email: '' }])
  }

  function removeContact(id: string) {
    setAdditionalContacts(prev => prev.filter(c => c.id !== id))
  }

  function updateContact(id: string, key: keyof ContactPerson, val: string) {
    setAdditionalContacts(prev => prev.map(c => c.id === id ? { ...c, [key]: val } : c))
  }

  // ── Registration toggle ───────────────────────────────────────────────────
  function toggleReg(id: string) {
    setSelectedRegistrations(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // ── Org type helpers ──────────────────────────────────────────────────────
  const isCompany = ['Private Limited Company', 'Public Limited Company', 'OPC'].includes(form.orgType)
  const isLLP = form.orgType === 'LLP'
  const isPartnership = form.orgType === 'Partnership Firm'
  const isProprietorship = form.orgType === 'Proprietorship'
  const isTrust = form.orgType === 'Trust'
  const isSociety = form.orgType === 'Society'
  const hasOrgDetails = isCompany || isLLP || isPartnership || isProprietorship || isTrust || isSociety

  // ─────────────────────────────────────────────────────────────────────────
  // Step renderers
  // ─────────────────────────────────────────────────────────────────────────
  function renderStep1() {
    return (
      <div>
        <SectionTitle>Basic Information</SectionTitle>
        <Grid2>
          <div>
            <Label required>Client Name</Label>
            <Input value={form.clientName} onChange={v => { f('clientName')(v); if (form.displayName === form.clientName) f('displayName')(v) }} placeholder="Enter client name" />
            <FieldError msg={errors.clientName} />
          </div>
          <div>
            <Label>Display Name</Label>
            <Input value={form.displayName} onChange={f('displayName')} placeholder="Short display name" />
          </div>
          <div>
            <Label required>Organization Type</Label>
            <Select value={form.orgType} onChange={f('orgType')} options={ORG_TYPES} placeholder="Select type" />
            <FieldError msg={errors.orgType} />
          </div>
          <div>
            <Label required>Nature of Business</Label>
            <Select value={form.natureOfBusiness} onChange={f('natureOfBusiness')} options={NATURE_OF_BUSINESS} placeholder="Select nature" />
            <FieldError msg={errors.natureOfBusiness} />
          </div>
          <div>
            <Label>Industry</Label>
            <Select value={form.industry} onChange={f('industry')} options={INDUSTRIES} placeholder="Select industry" />
          </div>
          <div>
            <Label required>PAN Number</Label>
            <Input value={form.panNumber} onChange={v => f('panNumber')(v.toUpperCase())} placeholder="AAAAA9999A" maxLength={10} />
            <FieldError msg={errors.panNumber} />
          </div>
          <div>
            <Label required>PAN Holder Name</Label>
            <Input value={form.panHolderName} onChange={f('panHolderName')} placeholder="Name as on PAN" />
            <FieldError msg={errors.panHolderName} />
          </div>
          <div>
            <Label required>Primary Contact Name</Label>
            <Input value={form.primaryContactName} onChange={f('primaryContactName')} placeholder="Contact person name" />
            <FieldError msg={errors.primaryContactName} />
          </div>
          <div>
            <Label required>Primary Mobile</Label>
            <Input value={form.primaryMobile} onChange={f('primaryMobile')} placeholder="10-digit mobile" maxLength={10} />
            <FieldError msg={errors.primaryMobile} />
          </div>
          <div>
            <Label required>Primary Email</Label>
            <Input value={form.primaryEmail} onChange={f('primaryEmail')} placeholder="email@example.com" type="email" />
            <FieldError msg={errors.primaryEmail} />
          </div>
        </Grid2>
      </div>
    )
  }

  function renderStep2() {
    const desigs = getDesignations(form.orgType)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Primary Contact */}
        <CardBox>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SectionTitle>Primary Contact</SectionTitle>
            <button
              type="button"
              onClick={() => {
                f('pc_name')(form.primaryContactName)
                f('pc_mobile')(form.primaryMobile)
                f('pc_email')(form.primaryEmail)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 6, border: `1px solid ${G.border}`,
                background: G.white, color: G.accent, fontSize: 12, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Copy size={12} /> Copy from Basic Info
            </button>
          </div>
          <Grid2>
            <div>
              <Label required>Name</Label>
              <Input value={form.pc_name} onChange={f('pc_name')} placeholder="Contact name" />
              <FieldError msg={errors.pc_name} />
            </div>
            <div>
              <Label>Designation</Label>
              <Select value={form.pc_designation} onChange={f('pc_designation')} options={desigs} placeholder="Select designation" />
            </div>
            <div>
              <Label required>Mobile</Label>
              <Input value={form.pc_mobile} onChange={f('pc_mobile')} placeholder="10-digit mobile" maxLength={10} />
              <FieldError msg={errors.pc_mobile} />
            </div>
            <div>
              <Label required>Email</Label>
              <Input value={form.pc_email} onChange={f('pc_email')} placeholder="email@example.com" type="email" />
              <FieldError msg={errors.pc_email} />
            </div>
          </Grid2>
        </CardBox>

        {/* Secondary Contact */}
        <CardBox>
          <SectionTitle>Secondary Contact <span style={{ fontSize: 12, color: G.muted, fontWeight: 400 }}>(optional)</span></SectionTitle>
          <Grid2>
            <div>
              <Label>Name</Label>
              <Input value={form.sc_name} onChange={f('sc_name')} placeholder="Contact name" />
            </div>
            <div>
              <Label>Designation</Label>
              <Select value={form.sc_designation} onChange={f('sc_designation')} options={desigs} placeholder="Select designation" />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input value={form.sc_mobile} onChange={f('sc_mobile')} placeholder="10-digit mobile" maxLength={10} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.sc_email} onChange={f('sc_email')} placeholder="email@example.com" type="email" />
            </div>
          </Grid2>
        </CardBox>

        {/* Additional contacts */}
        {additionalContacts.map((c, idx) => (
          <CardBox key={c.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <SectionTitle>Contact Person {idx + 3}</SectionTitle>
              <button
                type="button"
                onClick={() => removeContact(c.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 0 }}
              >
                <X size={16} />
              </button>
            </div>
            <Grid2>
              <div>
                <Label>Name</Label>
                <Input value={c.name} onChange={v => updateContact(c.id, 'name', v)} placeholder="Contact name" />
              </div>
              <div>
                <Label>Designation</Label>
                <Select value={c.designation} onChange={v => updateContact(c.id, 'designation', v)} options={desigs} placeholder="Select designation" />
              </div>
              <div>
                <Label>Mobile</Label>
                <Input value={c.mobile} onChange={v => updateContact(c.id, 'mobile', v)} placeholder="10-digit mobile" maxLength={10} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={c.email} onChange={v => updateContact(c.id, 'email', v)} placeholder="email@example.com" type="email" />
              </div>
            </Grid2>
          </CardBox>
        ))}

        <button
          type="button"
          onClick={addContact}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
            padding: '8px 16px', borderRadius: 8, border: `1.5px dashed ${G.accent}`,
            background: 'transparent', color: G.accent, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          <Plus size={14} /> Add Contact Person
        </button>
      </div>
    )
  }

  function renderStep3() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <CardBox>
          <SectionTitle>Registered Address</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Label required>Address</Label>
              <Textarea value={form.regAddress} onChange={f('regAddress')} placeholder="Enter registered address" />
              <FieldError msg={errors.regAddress} />
            </div>
            <Grid2>
              <div>
                <Label required>City</Label>
                <Input value={form.city} onChange={f('city')} placeholder="City" />
                <FieldError msg={errors.city} />
              </div>
              <div>
                <Label required>State</Label>
                <Select value={form.state} onChange={f('state')} options={INDIAN_STATES} placeholder="Select state" />
                <FieldError msg={errors.state} />
              </div>
              <div>
                <Label required>Pincode</Label>
                <Input value={form.pincode} onChange={f('pincode')} placeholder="6-digit pincode" maxLength={6} />
                <FieldError msg={errors.pincode} />
              </div>
              <div>
                <Label required>Country</Label>
                <Select value={form.country} onChange={f('country')} options={['India', 'Other']} placeholder="Select country" />
                <FieldError msg={errors.country} />
              </div>
            </Grid2>
          </div>
        </CardBox>

        {/* Branches */}
        {branches.map((b, idx) => (
          <CardBox key={b.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <SectionTitle>Branch {idx + 1}</SectionTitle>
              <button
                type="button"
                onClick={() => removeBranch(b.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 0 }}
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Label>Address</Label>
                <Textarea value={b.address} onChange={v => updateBranch(b.id, 'address', v)} placeholder="Branch address" />
              </div>
              <Grid2>
                <div>
                  <Label>City</Label>
                  <Input value={b.city} onChange={v => updateBranch(b.id, 'city', v)} placeholder="City" />
                </div>
                <div>
                  <Label>State</Label>
                  <Select value={b.state} onChange={v => updateBranch(b.id, 'state', v)} options={INDIAN_STATES} placeholder="Select state" />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input value={b.pincode} onChange={v => updateBranch(b.id, 'pincode', v)} placeholder="6-digit pincode" maxLength={6} />
                </div>
                <div>
                  <Label>Country</Label>
                  <Select value={b.country} onChange={v => updateBranch(b.id, 'country', v)} options={['India', 'Other']} />
                </div>
              </Grid2>
            </div>
          </CardBox>
        ))}

        <button
          type="button"
          onClick={addBranch}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
            padding: '8px 16px', borderRadius: 8, border: `1.5px dashed ${G.accent}`,
            background: 'transparent', color: G.accent, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          <Plus size={14} /> Add Branch
        </button>
      </div>
    )
  }

  function renderStep4() {
    if (!hasOrgDetails) {
      return (
        <CardBox style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <p style={{ color: G.secondary, fontSize: 14, margin: 0 }}>
            No additional organization details required for this type.
          </p>
        </CardBox>
      )
    }

    return (
      <div>
        <SectionTitle>Organization Details</SectionTitle>
        <Grid2>
          {isCompany && (
            <>
              <div>
                <Label>CIN</Label>
                <Input value={form.cin} onChange={f('cin')} placeholder="Company Identification Number" />
              </div>
              <div>
                <Label>Date of Incorporation</Label>
                <Input value={form.dateOfIncorporation} onChange={f('dateOfIncorporation')} type="date" />
              </div>
              <div>
                <Label>Authorized Capital</Label>
                <Input value={form.authorizedCapital} onChange={f('authorizedCapital')} placeholder="e.g. ₹10,00,000" />
              </div>
              <div>
                <Label>Paid-up Capital</Label>
                <Input value={form.paidUpCapital} onChange={f('paidUpCapital')} placeholder="e.g. ₹5,00,000" />
              </div>
            </>
          )}
          {isLLP && (
            <>
              <div>
                <Label>LLPIN</Label>
                <Input value={form.llpin} onChange={f('llpin')} placeholder="LLP Identification Number" />
              </div>
              <div>
                <Label>Date of Incorporation</Label>
                <Input value={form.dateOfIncorporation} onChange={f('dateOfIncorporation')} type="date" />
              </div>
            </>
          )}
          {isPartnership && (
            <>
              <div>
                <Label>Firm Registration Number</Label>
                <Input value={form.firmRegNumber} onChange={f('firmRegNumber')} placeholder="Registration number" />
              </div>
              <div>
                <Label>Partnership Deed Date</Label>
                <Input value={form.partnershipDeedDate} onChange={f('partnershipDeedDate')} type="date" />
              </div>
            </>
          )}
          {isProprietorship && (
            <>
              <div>
                <Label>Proprietor Name</Label>
                <Input value={form.proprietorName} onChange={f('proprietorName')} placeholder="Proprietor full name" />
              </div>
              <div>
                <Label>Proprietor Aadhaar</Label>
                <Input value={form.proprietorAadhaar} onChange={f('proprietorAadhaar')} placeholder="12-digit Aadhaar" maxLength={12} />
              </div>
            </>
          )}
          {isTrust && (
            <>
              <div>
                <Label>Trust Registration Number</Label>
                <Input value={form.trustRegNumber} onChange={f('trustRegNumber')} placeholder="Registration number" />
              </div>
              <div>
                <Label>Registration Date</Label>
                <Input value={form.trustRegDate} onChange={f('trustRegDate')} type="date" />
              </div>
            </>
          )}
          {isSociety && (
            <div>
              <Label>Society Registration Number</Label>
              <Input value={form.societyRegNumber} onChange={f('societyRegNumber')} placeholder="Registration number" />
            </div>
          )}
        </Grid2>
      </div>
    )
  }

  function renderStep5() {
    return (
      <div>
        <SectionTitle>Business & Tax Registrations</SectionTitle>
        <p style={{ fontSize: 13, color: G.muted, marginBottom: 20, margin: '0 0 20px' }}>
          Select all applicable registrations for this client.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {REGISTRATIONS.map(reg => {
            const checked = selectedRegistrations.has(reg.id)
            return (
              <label
                key={reg.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  border: `1.5px solid ${checked ? G.accent : G.border}`,
                  background: checked ? '#EFF8FF' : G.white,
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleReg(reg.id)}
                  style={{ display: 'none' }}
                />
                <span style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${checked ? G.accent : G.border}`,
                  background: checked ? G.accent : G.white,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {checked && <Check size={11} color={G.white} strokeWidth={3} />}
                </span>
                <span style={{ fontSize: 13, color: G.primary, fontWeight: 500 }}>
                  {reg.label}
                </span>
              </label>
            )
          })}
        </div>

        {/* BR007 notice */}
        <div style={{
          marginTop: 24, padding: '14px 16px', borderRadius: 10,
          background: '#F0FDF4', border: '1px solid #BBF7D0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>
            Contract details will be fetched from previous records if available.
          </p>
          <button
            type="button"
            style={{
              padding: '6px 14px', borderRadius: 7, border: '1px solid #16A34A',
              background: 'transparent', color: '#16A34A', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif',
            }}
          >
            Fetch Previous Contract
          </button>
        </div>
      </div>
    )
  }

  function renderStep6() {
    if (selectedRegistrations.size === 0) {
      return (
        <CardBox style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <p style={{ color: G.secondary, fontSize: 14, margin: 0 }}>
            No registrations selected. Go back to Step 5 to select applicable registrations.
          </p>
        </CardBox>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* GST */}
        {selectedRegistrations.has('GST') && (
          <CardBox>
            <SectionTitle>GST Registrations</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {gstEntries.map((g, idx) => (
                <div key={g.id} style={{ padding: 16, borderRadius: 8, background: G.canvas, border: `1px solid ${G.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: G.secondary }}>GSTIN Entry {idx + 1}</span>
                    {gstEntries.length > 1 && (
                      <button type="button" onClick={() => removeGST(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 0 }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <Grid2>
                    <div>
                      <Label required>GSTIN</Label>
                      <Input value={g.gstin} onChange={v => updateGST(idx, 'gstin', v.toUpperCase())} placeholder="15-character GSTIN" maxLength={15} />
                      <FieldError msg={errors[`gst_gstin_${idx}`]} />
                      <UploadBtn />
                    </div>
                    <div>
                      <Label>State (auto-filled)</Label>
                      <Input value={g.state} readOnly placeholder="Auto-filled from GSTIN" style={{ color: G.muted }} />
                    </div>
                    <div>
                      <Label required>Registration Type</Label>
                      <Select
                        value={g.regType}
                        onChange={v => updateGST(idx, 'regType', v)}
                        options={['Regular Taxpayer', 'Composition Taxpayer', 'Input Service Distributor (ISD)', 'E-Commerce Operator']}
                        placeholder="Select type"
                      />
                      <FieldError msg={errors[`gst_regType_${idx}`]} />
                    </div>
                    <div>
                      <Label required>Filing Frequency</Label>
                      <Select
                        value={g.filingFrequency}
                        onChange={v => updateGST(idx, 'filingFrequency', v)}
                        options={['Monthly', 'Quarterly']}
                        placeholder="Select frequency"
                      />
                      <FieldError msg={errors[`gst_filing_${idx}`]} />
                    </div>
                    <div>
                      <Label>GST Username</Label>
                      <Input value={g.username} onChange={v => updateGST(idx, 'username', v)} placeholder="GST portal username" />
                    </div>
                    <div>
                      <Label>GST Password</Label>
                      <PasswordInput value={g.password} onChange={v => updateGST(idx, 'password', v)} id={`gst_pw_${idx}`} />
                    </div>
                  </Grid2>
                </div>
              ))}
              <button
                type="button"
                onClick={addGST}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                  padding: '7px 14px', borderRadius: 8, border: `1.5px dashed ${G.accent}`,
                  background: 'transparent', color: G.accent, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                <Plus size={13} /> Add GSTIN
              </button>
            </div>
          </CardBox>
        )}

        {/* TAN */}
        {selectedRegistrations.has('TAN') && (
          <CardBox>
            <SectionTitle>TAN Registration</SectionTitle>
            <Grid2>
              <div>
                <Label required>TAN Number</Label>
                <Input value={form.tanNumber} onChange={v => f('tanNumber')(v.toUpperCase())} placeholder="AAAA99999A" maxLength={10} />
                <FieldError msg={errors.tanNumber} />
                <UploadBtn />
              </div>
              <div>
                <Label>TAN Username</Label>
                <Input value={form.tanNumber} readOnly placeholder="Auto-filled as TAN Number" style={{ color: G.muted }} />
                <span style={{ fontSize: 11, color: G.muted, marginTop: 3, display: 'block' }}>Username is same as TAN Number</span>
              </div>
              <div>
                <Label>TAN Password</Label>
                <PasswordInput value={form.tanPassword} onChange={f('tanPassword')} id="tan_pw" />
              </div>
            </Grid2>
          </CardBox>
        )}

        {/* MSME */}
        {selectedRegistrations.has('MSME') && (
          <CardBox>
            <SectionTitle>MSME Registration</SectionTitle>
            <div style={{ maxWidth: 360 }}>
              <Label>MSME Number</Label>
              <Input value={form.msmeNumber} onChange={f('msmeNumber')} placeholder="MSME registration number" />
              <UploadBtn />
            </div>
          </CardBox>
        )}

        {/* IEC */}
        {selectedRegistrations.has('IEC') && (
          <CardBox>
            <SectionTitle>IEC Registration</SectionTitle>
            <div style={{ maxWidth: 360 }}>
              <Label>IEC Number</Label>
              <Input value={form.iecNumber} onChange={f('iecNumber')} placeholder="Import Export Code" />
              <UploadBtn />
            </div>
          </CardBox>
        )}

        {/* EPF */}
        {selectedRegistrations.has('EPF') && (
          <CardBox>
            <SectionTitle>EPF Registration</SectionTitle>
            <Grid2>
              <div>
                <Label>EPF Number</Label>
                <Input value={form.epfNumber} onChange={f('epfNumber')} placeholder="EPF registration number" />
                <UploadBtn />
              </div>
              <div>
                <Label>EPF Username</Label>
                <Input value={form.epfUsername} onChange={f('epfUsername')} placeholder="Portal username" />
              </div>
              <div>
                <Label>EPF Password</Label>
                <PasswordInput value={form.epfPassword} onChange={f('epfPassword')} id="epf_pw" />
              </div>
            </Grid2>
          </CardBox>
        )}

        {/* ESI */}
        {selectedRegistrations.has('ESI') && (
          <CardBox>
            <SectionTitle>ESI Registration</SectionTitle>
            <Grid2>
              <div>
                <Label>ESI Number</Label>
                <Input value={form.esiNumber} onChange={f('esiNumber')} placeholder="ESI registration number" />
                <UploadBtn />
              </div>
              <div>
                <Label>ESI Username</Label>
                <Input value={form.esiUsername} onChange={f('esiUsername')} placeholder="Portal username" />
              </div>
              <div>
                <Label>ESI Password</Label>
                <PasswordInput value={form.esiPassword} onChange={f('esiPassword')} id="esi_pw" />
              </div>
            </Grid2>
          </CardBox>
        )}

        {/* Professional Tax */}
        {selectedRegistrations.has('PT') && (
          <CardBox>
            <SectionTitle>Professional Tax</SectionTitle>
            <div style={{ maxWidth: 360 }}>
              <Label>PT Number</Label>
              <Input value={form.ptNumber} onChange={f('ptNumber')} placeholder="Professional Tax number" />
              <UploadBtn />
            </div>
          </CardBox>
        )}

        {/* FSSAI */}
        {selectedRegistrations.has('FSSAI') && (
          <CardBox>
            <SectionTitle>FSSAI Registration</SectionTitle>
            <div style={{ maxWidth: 360 }}>
              <Label>FSSAI Number</Label>
              <Input value={form.fssaiNumber} onChange={f('fssaiNumber')} placeholder="FSSAI license number" />
              <UploadBtn />
            </div>
          </CardBox>
        )}

        {/* Shop & Establishment */}
        {selectedRegistrations.has('SE') && (
          <CardBox>
            <SectionTitle>Shop & Establishment</SectionTitle>
            <div style={{ maxWidth: 360 }}>
              <Label>Shop & Establishment Number</Label>
              <Input value={form.seNumber} onChange={f('seNumber')} placeholder="Registration number" />
              <UploadBtn />
            </div>
          </CardBox>
        )}

        {/* Factory License */}
        {selectedRegistrations.has('FL') && (
          <CardBox>
            <SectionTitle>Factory License</SectionTitle>
            <div style={{ maxWidth: 360 }}>
              <Label>Factory License Number</Label>
              <Input value="" onChange={() => {}} placeholder="License number" />
              <UploadBtn />
            </div>
          </CardBox>
        )}

        {/* Trade License */}
        {selectedRegistrations.has('TL') && (
          <CardBox>
            <SectionTitle>Trade License</SectionTitle>
            <div style={{ maxWidth: 360 }}>
              <Label>Trade License Number</Label>
              <Input value="" onChange={() => {}} placeholder="License number" />
              <UploadBtn />
            </div>
          </CardBox>
        )}

        {/* RERA */}
        {selectedRegistrations.has('RERA') && (
          <CardBox>
            <SectionTitle>RERA Registration</SectionTitle>
            <div style={{ maxWidth: 360 }}>
              <Label>RERA Number</Label>
              <Input value="" onChange={() => {}} placeholder="RERA registration number" />
              <UploadBtn />
            </div>
          </CardBox>
        )}

        {/* SEBI */}
        {selectedRegistrations.has('SEBI') && (
          <CardBox>
            <SectionTitle>SEBI Registration</SectionTitle>
            <div style={{ maxWidth: 360 }}>
              <Label>SEBI Number</Label>
              <Input value="" onChange={() => {}} placeholder="SEBI registration number" />
              <UploadBtn />
            </div>
          </CardBox>
        )}

        {/* 12A */}
        {selectedRegistrations.has('12A') && (
          <CardBox>
            <SectionTitle>12A Registration</SectionTitle>
            <div style={{ maxWidth: 360 }}>
              <Label>12A Number</Label>
              <Input value="" onChange={() => {}} placeholder="12A registration number" />
              <UploadBtn />
            </div>
          </CardBox>
        )}

        {/* 80G */}
        {selectedRegistrations.has('80G') && (
          <CardBox>
            <SectionTitle>80G Registration</SectionTitle>
            <div style={{ maxWidth: 360 }}>
              <Label>80G Number</Label>
              <Input value="" onChange={() => {}} placeholder="80G registration number" />
              <UploadBtn />
            </div>
          </CardBox>
        )}

        {/* NGO Darpan */}
        {selectedRegistrations.has('NGO') && (
          <CardBox>
            <SectionTitle>NGO Darpan</SectionTitle>
            <div style={{ maxWidth: 360 }}>
              <Label>NGO Darpan ID</Label>
              <Input value="" onChange={() => {}} placeholder="Darpan registration ID" />
              <UploadBtn />
            </div>
          </CardBox>
        )}

        {/* Others */}
        {selectedRegistrations.has('OTH') && (
          <CardBox>
            <SectionTitle>Other Registration</SectionTitle>
            <Grid2>
              <div>
                <Label>Registration Name</Label>
                <Input value={form.otherRegName} onChange={f('otherRegName')} placeholder="Name of registration" />
              </div>
              <div>
                <Label>Registration Number</Label>
                <Input value={form.otherRegNumber} onChange={f('otherRegNumber')} placeholder="Registration number" />
                <UploadBtn />
              </div>
            </Grid2>
          </CardBox>
        )}

      </div>
    )
  }

  function renderStep7() {
    const enabledModules = [
      settingsProfile.gstEnabled && 'GST',
      settingsProfile.tdsEnabled && 'TDS',
      settingsProfile.auditEnabled && 'Audit',
    ].filter(Boolean) as string[]

    const moduleKeys: { key: ModuleKey; label: string; enabled: boolean }[] = [
      { key: 'gst', label: 'GST Filing', enabled: settingsProfile.gstEnabled },
      { key: 'tds', label: 'TDS Filing', enabled: settingsProfile.tdsEnabled },
      { key: 'audit', label: 'Statutory Audit', enabled: settingsProfile.auditEnabled },
    ]

    const totalRequiredDocs = moduleKeys
      .filter(m => m.enabled)
      .flatMap(m => moduleDocs[m.key] ?? [])
      .filter(d => d.required).length

    const selectedRegLabels = REGISTRATIONS
      .filter(r => selectedRegistrations.has(r.id))
      .map(r => r.label)

    const primaryCommLabel = COMM_MODES.find(c => c.id === settingsProfile.primaryCommMode)?.label ?? '—'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <CardBox>
          <SectionTitle>Compliance Modules</SectionTitle>
          <p style={{ fontSize: 12, color: G.muted, margin: '0 0 12px' }}>
            Enable modules for this client. GST and TDS are pre-selected based on registrations from the previous step.
          </p>
          <ToggleSwitch
            label="GST Filing"
            on={settingsProfile.gstEnabled}
            onChange={v => handleModuleToggle('gstEnabled', v)}
          />
          <ToggleSwitch
            label="TDS Filing"
            on={settingsProfile.tdsEnabled}
            onChange={v => handleModuleToggle('tdsEnabled', v)}
          />
          <ToggleSwitch
            label="Statutory Audit"
            on={settingsProfile.auditEnabled}
            onChange={v => handleModuleToggle('auditEnabled', v)}
          />
          <FieldError msg={errors.modules} />
        </CardBox>

        {/* Required documents per enabled module */}
        {moduleKeys.some(m => m.enabled) && (
          <CardBox>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FolderOpen size={16} color={G.accent} />
              <SectionTitle>Required Documents</SectionTitle>
            </div>
            <p style={{ fontSize: 12, color: G.muted, margin: '0 0 16px' }}>
              Configure documents to collect for each enabled module. Mark as required or optional.
            </p>
            {moduleKeys.filter(m => m.enabled).map(({ key, label }) => (
              <div key={key} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${G.border}` }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: G.primary, margin: '0 0 10px' }}>{label}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(moduleDocs[key] ?? []).map(doc => (
                    <div key={doc.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                      borderRadius: 8, background: G.canvas, border: `1px solid ${G.border}`,
                    }}>
                      <button
                        type="button"
                        onClick={() => toggleDocRequired(key, doc.id)}
                        style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, border: 'none', cursor: 'pointer',
                          background: doc.required ? '#DCFCE7' : '#F1F5F9',
                          color: doc.required ? '#15803D' : G.secondary,
                        }}
                      >
                        {doc.required ? 'Required' : 'Optional'}
                      </button>
                      <span style={{ flex: 1, fontSize: 13, color: G.primary }}>{doc.name}</span>
                      <button
                        type="button"
                        onClick={() => removeModuleDoc(key, doc.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: G.muted, padding: 0 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <Input
                    value={newDocDraft[key] ?? ''}
                    onChange={v => setNewDocDraft(prev => ({ ...prev, [key]: v }))}
                    placeholder="Add custom document…"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addModuleDoc(key, newDocDraft[key] ?? '')
                      setNewDocDraft(prev => ({ ...prev, [key]: '' }))
                    }}
                    style={{
                      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                      padding: '8px 14px', borderRadius: 8, border: `1px solid ${G.accent}`,
                      background: G.white, color: G.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            ))}
          </CardBox>
        )}

        <CardBox>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <MessageSquare size={16} color={G.accent} />
            <SectionTitle>Communication Mode</SectionTitle>
          </div>
          <p style={{ fontSize: 12, color: G.muted, margin: '0 0 12px' }}>
            Choose how your firm communicates with this client for reminders, document requests, and notices.
          </p>

          <Label>Primary Communication Mode</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {COMM_MODES.map(mode => (
              <CommModePill
                key={mode.id}
                active={settingsProfile.primaryCommMode === mode.id}
                onClick={() => patchSettings({ primaryCommMode: mode.id })}
                label={mode.label}
                icon={mode.icon}
              />
            ))}
          </div>
          <FieldError msg={errors.commMode} />

          <p style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
            Enabled Channels
          </p>
          <ToggleSwitch
            label="WhatsApp"
            on={settingsProfile.commWhatsAppEnabled}
            onChange={v => patchSettings({ commWhatsAppEnabled: v })}
          />
          <ToggleSwitch
            label="Email"
            on={settingsProfile.commEmailEnabled}
            onChange={v => patchSettings({ commEmailEnabled: v })}
          />
          <ToggleSwitch
            label="Client Portal"
            on={settingsProfile.commPortalEnabled}
            onChange={v => patchSettings({ commPortalEnabled: v, clientPortalAccess: v || settingsProfile.clientPortalAccess })}
          />
          <ToggleSwitch
            label="In-App (team managed)"
            on={settingsProfile.commInternalEnabled}
            onChange={v => patchSettings({ commInternalEnabled: v })}
          />

          {settingsProfile.commWhatsAppEnabled && (
            <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#15803D', margin: '0 0 12px' }}>WhatsApp Settings</p>
              <Grid2>
                <div>
                  <Label required>WhatsApp Number</Label>
                  <Input
                    value={settingsProfile.whatsappNumber}
                    onChange={v => patchSettings({ whatsappNumber: v })}
                    placeholder="10-digit mobile"
                    maxLength={10}
                  />
                  <FieldError msg={errors.whatsappNumber} />
                </div>
                <div>
                  <Label>Preferred Language</Label>
                  <Select
                    value={settingsProfile.commPreferredLanguage}
                    onChange={v => patchSettings({ commPreferredLanguage: v })}
                    options={['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu']}
                  />
                </div>
              </Grid2>
              <ToggleSwitch
                label="Send auto-reply for document requests"
                on={settingsProfile.whatsappAutoReply}
                onChange={v => patchSettings({ whatsappAutoReply: v })}
              />
            </div>
          )}

          {settingsProfile.commEmailEnabled && (
            <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', margin: '0 0 12px' }}>Email Settings</p>
              <Grid2>
                <div>
                  <Label required>Primary Email</Label>
                  <Input
                    value={settingsProfile.emailPrimary}
                    onChange={v => patchSettings({ emailPrimary: v })}
                    placeholder="client@company.com"
                    type="email"
                  />
                  <FieldError msg={errors.emailPrimary} />
                </div>
                <div>
                  <Label>CC Email(s)</Label>
                  <Input
                    value={settingsProfile.emailCc}
                    onChange={v => patchSettings({ emailCc: v })}
                    placeholder="accounts@company.com"
                    type="email"
                  />
                </div>
              </Grid2>
              <ToggleSwitch
                label="Send acknowledgement on document receipt"
                on={settingsProfile.emailAutoAck}
                onChange={v => patchSettings({ emailAutoAck: v })}
              />
            </div>
          )}

          {settingsProfile.commPortalEnabled && (
            <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#6D28D9', margin: '0 0 12px' }}>Client Portal Settings</p>
              <div style={{ maxWidth: 360 }}>
                <Label required>Portal Invite Email</Label>
                <Input
                  value={settingsProfile.portalInviteEmail}
                  onChange={v => patchSettings({ portalInviteEmail: v })}
                  placeholder="Email to send portal login invite"
                  type="email"
                />
                <FieldError msg={errors.portalInviteEmail} />
              </div>
              <ToggleSwitch
                label="Enable client portal access"
                on={settingsProfile.clientPortalAccess}
                onChange={v => patchSettings({ clientPortalAccess: v })}
              />
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <ToggleSwitch
              label="Send communications during business hours only (9 AM – 6 PM)"
              on={settingsProfile.commBusinessHoursOnly}
              onChange={v => patchSettings({ commBusinessHoursOnly: v })}
            />
          </div>
        </CardBox>

        <CardBox>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={16} color={G.accent} />
            <SectionTitle>Team Assignment</SectionTitle>
          </div>
          <Grid2>
            <div>
              <Label required>Assigned Admin (CA)</Label>
              <select
                value={settingsProfile.assignedAdminId}
                onChange={e => patchSettings({ assignedAdminId: e.target.value })}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8,
                  border: `1px solid ${G.border}`, fontSize: 14, color: G.primary, background: G.white,
                  outline: 'none', fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                }}
              >
                <option value="">Select admin…</option>
                {adminUsers.map(u => (
                  <option key={u.id} value={String(u.id)}>{u.full_name}</option>
                ))}
              </select>
              <FieldError msg={errors.assignedAdminId} />
            </div>
            <div>
              <Label>Assigned Article</Label>
              <select
                value={settingsProfile.assignedArticleId}
                onChange={e => patchSettings({ assignedArticleId: e.target.value })}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8,
                  border: `1px solid ${G.border}`, fontSize: 14, color: G.primary, background: G.white,
                  outline: 'none', fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                }}
              >
                <option value="">Select article (optional)…</option>
                {articleUsers.map(u => (
                  <option key={u.id} value={String(u.id)}>{u.full_name}</option>
                ))}
              </select>
            </div>
          </Grid2>
        </CardBox>

        <CardBox>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Settings size={16} color={G.accent} />
            <SectionTitle>Client Settings</SectionTitle>
          </div>
          <Grid2>
            <div>
              <Label>Financial Year</Label>
              <Select
                value={settingsProfile.financialYear}
                onChange={v => patchSettings({ financialYear: v })}
                options={FY_OPTIONS}
                placeholder="Select FY"
              />
            </div>
            <div>
              <Label>Client Status</Label>
              <Select
                value={settingsProfile.clientActive ? 'Active' : 'Inactive'}
                onChange={v => patchSettings({ clientActive: v === 'Active' })}
                options={['Active', 'Inactive']}
              />
            </div>
          </Grid2>
          {!settingsProfile.commPortalEnabled && (
            <div style={{ marginTop: 8 }}>
              <ToggleSwitch
                label="Enable client portal access"
                on={settingsProfile.clientPortalAccess}
                onChange={v => patchSettings({ clientPortalAccess: v })}
              />
            </div>
          )}
        </CardBox>

        <CardBox>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Bell size={16} color={G.accent} />
            <SectionTitle>Notification Preferences</SectionTitle>
          </div>
          <ToggleSwitch
            label="Filing due date reminders"
            on={settingsProfile.notifyFilingReminders}
            onChange={v => patchSettings({ notifyFilingReminders: v })}
          />
          <ToggleSwitch
            label="Document request alerts"
            on={settingsProfile.notifyDocRequests}
            onChange={v => patchSettings({ notifyDocRequests: v })}
          />
          <ToggleSwitch
            label="Government notice alerts"
            on={settingsProfile.notifyNoticeAlerts}
            onChange={v => patchSettings({ notifyNoticeAlerts: v })}
          />
        </CardBox>

        <CardBox>
          <SectionTitle>Onboarding Summary</SectionTitle>
          <p style={{ fontSize: 12, color: G.muted, margin: '0 0 16px' }}>
            Review the client profile before submitting.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            {[
              { k: 'Client Name', v: form.clientName || '—' },
              { k: 'Organization Type', v: form.orgType || '—' },
              { k: 'PAN', v: form.panNumber || '—' },
              { k: 'Primary Contact', v: form.pc_name || form.primaryContactName || '—' },
              { k: 'Location', v: [form.city, form.state].filter(Boolean).join(', ') || '—' },
              { k: 'Financial Year', v: settingsProfile.financialYear },
              { k: 'Registrations', v: selectedRegLabels.length ? selectedRegLabels.join(', ') : 'None selected' },
              { k: 'Modules Enabled', v: enabledModules.length ? enabledModules.join(', ') : 'None' },
              { k: 'Communication', v: primaryCommLabel },
              { k: 'Required Documents', v: totalRequiredDocs ? `${totalRequiredDocs} documents configured` : 'None' },
              {
                k: 'Assigned Team',
                v: [
                  adminUsers.find(u => String(u.id) === settingsProfile.assignedAdminId)?.full_name,
                  articleUsers.find(u => String(u.id) === settingsProfile.assignedArticleId)?.full_name,
                ].filter(Boolean).join(' · ') || '—',
              },
              { k: 'Status', v: settingsProfile.clientActive ? 'Active' : 'Inactive' },
            ].map(row => (
              <div key={row.k}>
                <p style={{ fontSize: 10, fontWeight: 600, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>{row.k}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: G.primary, margin: 0 }}>{row.v}</p>
              </div>
            ))}
          </div>
          {selectedRegistrations.has('GST') && gstEntries.some(g => g.gstin) && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${G.border}` }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>GST Filing Due Days</p>
              {gstEntries.filter(g => g.gstin).map(g => (
                <p key={g.id} style={{ fontSize: 12, color: G.secondary, margin: '0 0 4px' }}>
                  {g.gstin}: GSTR-1 → {g.gstr1Due || '—'}th · GSTR-3B → {g.gstr3bDue || '—'}th · GSTR-9/9C → {g.gstr9Due || '31'} Dec
                </p>
              ))}
            </div>
          )}
        </CardBox>
      </div>
    )
  }

  function renderCurrentStep() {
    switch (step) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      case 6: return renderStep6()
      case 7: return renderStep7()
      default: return null
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: G.canvas, fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top header */}
      <div style={{
        background: G.white, borderBottom: `1px solid ${G.border}`,
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: G.primary, margin: 0 }}>Client Onboarding</h1>
          <p style={{ fontSize: 13, color: G.muted, margin: '2px 0 0' }}>Complete all steps to onboard a new client</p>
        </div>
        <div style={{
          padding: '6px 14px', borderRadius: 20,
          background: '#EFF8FF', border: `1px solid ${G.accent}`,
          fontSize: 13, fontWeight: 600, color: G.accent,
        }}>
          Step {step} of 7
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px 24px' }}>

        {/* Horizontal step indicator */}
        <div style={{
          background: G.white, borderRadius: 16, border: `1px solid ${G.border}`,
          padding: '20px 24px', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
            {STEPS_META.map((s, idx) => {
              const done = step > s.id
              const active = step === s.id
              const Icon = s.icon
              return (
                <div key={s.id} style={{ flex: 1, display: 'flex', alignItems: 'flex-start', minWidth: 0 }}>
                  {idx > 0 && (
                    <div style={{
                      flex: 1, height: 2, marginTop: 16, marginRight: 6,
                      background: step > idx ? '#16A34A' : G.border,
                      transition: 'background 0.2s',
                    }} />
                  )}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    flexShrink: 0, width: idx === 0 || idx === STEPS_META.length - 1 ? 88 : 72,
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? '#DCFCE7' : active ? G.accent : G.canvas,
                      border: `2px solid ${done ? '#16A34A' : active ? G.accent : G.border}`,
                      transition: 'all 0.2s',
                    }}>
                      {done
                        ? <Check size={15} color="#16A34A" strokeWidth={2.5} />
                        : <Icon size={15} color={active ? G.white : G.muted} />
                      }
                    </div>
                    <p style={{
                      fontSize: 10, fontWeight: active ? 600 : 500, textAlign: 'center',
                      color: active ? G.primary : done ? '#16A34A' : G.muted,
                      margin: '6px 0 0', lineHeight: 1.3,
                    }}>
                      {s.label}
                    </p>
                  </div>
                  {idx < STEPS_META.length - 1 && (
                    <div style={{
                      flex: 1, height: 2, marginTop: 16, marginLeft: 6,
                      background: step > s.id ? '#16A34A' : G.border,
                      transition: 'background 0.2s',
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form card */}
        <div style={{ width: '100%' }}>
          <div style={{
            background: G.white, borderRadius: 16, border: `1px solid ${G.border}`,
            padding: 32, minHeight: 480,
          }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: G.primary, margin: '0 0 4px' }}>
                {STEPS_META[step - 1].label}
              </h2>
              <p style={{ fontSize: 13, color: G.muted, margin: 0 }}>
                {step === 1 && 'Enter the client\'s core identification and contact details.'}
                {step === 2 && 'Provide primary and secondary contact information.'}
                {step === 3 && 'Enter the registered address and any branch locations.'}
                {step === 4 && 'Provide organization-specific regulatory details.'}
                {step === 5 && 'Select all business and tax registrations applicable to this client.'}
                {step === 6 && 'Enter details for each selected registration.'}
                {step === 7 && 'Configure modules, team assignment, and notification preferences before submitting.'}
              </p>
            </div>
            {renderCurrentStep()}
          </div>

          {/* Footer nav */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 20, padding: '16px 24px',
            background: G.white, borderRadius: 12, border: `1px solid ${G.border}`,
          }}>
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 8,
                border: `1px solid ${G.border}`, background: G.white,
                color: step === 1 ? G.muted : G.secondary,
                fontSize: 14, fontWeight: 500, cursor: step === 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {STEPS_META.map(s => (
                <div
                  key={s.id}
                  style={{
                    width: step === s.id ? 20 : 6, height: 6, borderRadius: 3,
                    background: step > s.id ? '#16A34A' : step === s.id ? G.accent : G.border,
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 24px', borderRadius: 8,
                border: 'none', background: G.accent,
                color: G.white, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              {step === 7 ? (
                <><Check size={15} /> Submit Client</>
              ) : (
                <>Next <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
