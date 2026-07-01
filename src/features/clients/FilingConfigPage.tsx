import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Settings, ChevronDown, Plus, X, Check, Info } from 'lucide-react'
import { cn } from '@/shared/components/cn'
import { MOCK_CLIENTS, MOCK_USERS, MOCK_TDS_RETURNS } from '@/mock/data'

const G = {
  canvas:    '#F8FAFC',
  white:     '#FFFFFF',
  border:    '#E2E8F0',
  muted:     '#94A3B8',
  secondary: '#475569',
  primary:   '#0F172A',
  accent:    '#0584C7',
} as const

// ─── Types ───────────────────────────────────────────────────────────────────

type GSTReturnType = 'GSTR-1' | 'GSTR-1A' | 'GSTR-3B' | 'GSTR-9' | 'GSTR-9C'
type TDSFormType = '24Q' | '26Q' | '27Q' | '27EQ'
type FilingFrequency = 'Monthly' | 'Quarterly' | 'Annually'
type AuditType = 'Statutory Audit' | 'Tax Audit' | 'Internal Audit' | 'Concurrent Audit'
type ReportingStandard = 'Ind AS' | 'AS' | 'IFRS'
type FYEnd = 'March 31' | 'December 31' | 'September 30'

interface GSTINConfig {
  gstin: string
  state: string
  applicableReturns: GSTReturnType[]
  frequency: FilingFrequency
  eInvoicing: boolean
  lut: boolean
  portalUsername: string
  reviewerId: string
  approverId: string
}

interface TANConfig {
  tan: string
  applicableForms: TDSFormType[]
  frequency: 'Quarterly'
  salaryTDS: boolean
  vendorTDS: boolean
  contractorTDS: boolean
  payrollIntegration: boolean
  reviewerId: string
  approverId: string
}

interface AuditTypeConfig {
  enabled: boolean
  engagementPartnerId: string
  engagementManagerId: string
  targetCompletionMonth: string
  previousAuditorName: string
  reportingStandard: ReportingStandard
}

interface AuditConfig {
  types: Record<AuditType, AuditTypeConfig>
  fyEnd: FYEnd
  auditPeriodFrom: string
  auditPeriodTo: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GST_RETURN_TYPES: GSTReturnType[] = ['GSTR-1', 'GSTR-1A', 'GSTR-3B', 'GSTR-9', 'GSTR-9C']
const TDS_FORM_TYPES: TDSFormType[] = ['24Q', '26Q', '27Q', '27EQ']
const AUDIT_TYPES: AuditType[] = ['Statutory Audit', 'Tax Audit', 'Internal Audit', 'Concurrent Audit']

const STATE_CODES: Record<string, string> = {
  '27': 'Maharashtra', '07': 'Delhi', '29': 'Karnataka', '33': 'Tamil Nadu',
  '19': 'West Bengal', '24': 'Gujarat', '06': 'Haryana', '09': 'Uttar Pradesh',
  '08': 'Rajasthan', '36': 'Telangana', '32': 'Kerala', '23': 'Madhya Pradesh',
}

function getStateFromGSTIN(gstin: string): string {
  const code = gstin.substring(0, 2)
  return STATE_CODES[code] ?? 'Unknown'
}

function defaultGSTINConfig(gstin: string): GSTINConfig {
  return {
    gstin,
    state: getStateFromGSTIN(gstin),
    applicableReturns: [],
    frequency: 'Monthly',
    eInvoicing: false,
    lut: false,
    portalUsername: '',
    reviewerId: '',
    approverId: '',
  }
}

function defaultTANConfig(tan: string): TANConfig {
  return {
    tan,
    applicableForms: [],
    frequency: 'Quarterly',
    salaryTDS: false,
    vendorTDS: false,
    contractorTDS: false,
    payrollIntegration: false,
    reviewerId: '',
    approverId: '',
  }
}

function defaultAuditTypeConfig(): AuditTypeConfig {
  return {
    enabled: false,
    engagementPartnerId: '',
    engagementManagerId: '',
    targetCompletionMonth: '',
    previousAuditorName: '',
    reportingStandard: 'Ind AS',
  }
}

function defaultAuditConfig(): AuditConfig {
  return {
    types: {
      'Statutory Audit': defaultAuditTypeConfig(),
      'Tax Audit': defaultAuditTypeConfig(),
      'Internal Audit': defaultAuditTypeConfig(),
      'Concurrent Audit': defaultAuditTypeConfig(),
    },
    fyEnd: 'March 31',
    auditPeriodFrom: '',
    auditPeriodTo: '',
  }
}

// Seed mock data for Sunrise Textiles
const SUNRISE_CLIENT_ID = MOCK_CLIENTS[0]?.id ?? 1
const PRIYA_ID = String(MOCK_USERS.find(u => u.full_name === 'Priya Sharma')?.id ?? '')
const ARJUN_ID = String(MOCK_USERS.find(u => u.full_name === 'Arjun Mehta')?.id ?? '')

function clientDisplayName(c: (typeof MOCK_CLIENTS)[number]) {
  return c.trade_name ?? c.legal_name
}

function seedGSTForClient(clientId: number): GSTINConfig[] {
  const client = MOCK_CLIENTS.find(c => c.id === clientId)
  if (!client?.gstin) return []
  const config = defaultGSTINConfig(client.gstin)
  if (clientId === SUNRISE_CLIENT_ID) {
    config.applicableReturns = ['GSTR-1', 'GSTR-3B', 'GSTR-9']
    config.frequency = 'Monthly'
    config.eInvoicing = true
    config.lut = false
    config.portalUsername = 'sunrise_gst'
    config.reviewerId = PRIYA_ID
    config.approverId = ARJUN_ID
  }
  return [config]
}

function seedTDSForClient(clientId: number): TANConfig[] {
  const existing = MOCK_TDS_RETURNS.filter(r => r.client_id === clientId)
  if (existing.length > 0 && clientId !== SUNRISE_CLIENT_ID) {
    const forms = [...new Set(existing.map(r => r.return_type))].filter(
      (f): f is TDSFormType => TDS_FORM_TYPES.includes(f as TDSFormType)
    )
    const config = defaultTANConfig('DELS12345A')
    config.applicableForms = forms
    return [config]
  }
  // Fallback mock TAN for Sunrise Textiles
  if (clientId === SUNRISE_CLIENT_ID) {
    const config = defaultTANConfig('DELS12345A')
    config.applicableForms = ['24Q', '26Q']
    config.salaryTDS = true
    config.vendorTDS = true
    config.contractorTDS = false
    config.reviewerId = PRIYA_ID
    config.approverId = ARJUN_ID
    return [config]
  }
  return []
}

function seedAuditForClient(clientId: number): AuditConfig {
  const config = defaultAuditConfig()
  if (clientId === SUNRISE_CLIENT_ID) {
    config.types['Statutory Audit'].enabled = true
    config.types['Statutory Audit'].engagementPartnerId = ARJUN_ID
    config.types['Statutory Audit'].engagementManagerId = PRIYA_ID
    config.types['Statutory Audit'].reportingStandard = 'Ind AS'
  }
  return config
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean
  onChange: (val: boolean) => void
  label?: string
  tooltip?: string
}

function ToggleSwitch({ checked, onChange, label, tooltip }: ToggleSwitchProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          backgroundColor: checked ? G.accent : '#CBD5E1',
          position: 'relative',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: G.white,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.2s',
          }}
        />
      </button>
      {label && (
        <span className="text-sm" style={{ color: G.secondary }}>
          {label}
        </span>
      )}
      {tooltip && (
        <span title={tooltip}>
          <Info size={14} style={{ color: G.muted }} />
        </span>
      )}
    </div>
  )
}

interface PillToggleProps {
  label: string
  active: boolean
  onClick: () => void
}

function PillToggle({ label, active, onClick }: PillToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-1 text-xs font-semibold border transition-all"
      style={
        active
          ? { backgroundColor: G.accent, color: G.white, borderColor: 'transparent' }
          : { backgroundColor: G.canvas, color: G.secondary, borderColor: G.border }
      }
    >
      {label}
    </button>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: G.muted }}>
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-400 pr-8"
        >
          <option value="">— Select —</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: G.muted }} />
      </div>
    </div>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  type?: string
}

function TextField({ label, value, onChange, placeholder, type = 'text' }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: G.muted }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-400"
      />
    </div>
  )
}

// ─── GST Tab ─────────────────────────────────────────────────────────────────

interface GSTTabProps {
  configs: GSTINConfig[]
  onUpdate: (configs: GSTINConfig[]) => void
}

function GSTTab({ configs, onUpdate }: GSTTabProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newGSTIN, setNewGSTIN] = useState('')
  const [newStateCode, setNewStateCode] = useState('')

  const userOptions = MOCK_USERS
    .filter(u => u.role === 'admin' || u.role === 'super_admin')
    .map(u => ({ value: String(u.id), label: `${u.full_name} (${u.role})` }))

  function updateConfig(idx: number, patch: Partial<GSTINConfig>) {
    const next = configs.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    onUpdate(next)
  }

  function toggleReturn(idx: number, ret: GSTReturnType) {
    const cur = configs[idx].applicableReturns
    const next = cur.includes(ret) ? cur.filter(r => r !== ret) : [...cur, ret]
    updateConfig(idx, { applicableReturns: next })
  }

  function handleAddGSTIN() {
    if (!newGSTIN.trim()) return
    const gstin = newGSTIN.trim().toUpperCase()
    const state = newStateCode ? (STATE_CODES[newStateCode] ?? 'Unknown') : getStateFromGSTIN(gstin)
    const config = { ...defaultGSTINConfig(gstin), state }
    onUpdate([...configs, config])
    setNewGSTIN('')
    setNewStateCode('')
    setShowAddForm(false)
    toast.success(`GSTIN ${gstin} added`)
  }

  return (
    <div className="flex flex-col gap-6">
      {configs.map((cfg, idx) => (
        <div
          key={cfg.gstin}
          className="rounded-2xl border p-5"
          style={{ background: G.white, borderColor: G.border }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold" style={{ color: G.primary }}>
                {cfg.gstin}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: '#EFF6FF', color: '#1D4ED8' }}
              >
                {cfg.state}
              </span>
            </div>
          </div>

          {/* Return Types */}
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: G.muted }}>
              Applicable Returns
            </p>
            <div className="flex flex-wrap gap-2">
              {GST_RETURN_TYPES.map(rt => (
                <PillToggle
                  key={rt}
                  label={rt}
                  active={cfg.applicableReturns.includes(rt)}
                  onClick={() => toggleReturn(idx, rt)}
                />
              ))}
            </div>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <SelectField
              label="Filing Frequency"
              value={cfg.frequency}
              onChange={val => updateConfig(idx, { frequency: val as FilingFrequency })}
              options={[
                { value: 'Monthly', label: 'Monthly' },
                { value: 'Quarterly', label: 'Quarterly' },
                { value: 'Annually', label: 'Annually' },
              ]}
            />
            <TextField
              label="Portal Username"
              value={cfg.portalUsername}
              onChange={val => updateConfig(idx, { portalUsername: val })}
              placeholder="GST portal username"
            />
            <SelectField
              label="Default Reviewer"
              value={cfg.reviewerId}
              onChange={val => updateConfig(idx, { reviewerId: val })}
              options={userOptions}
            />
            <SelectField
              label="Default Approver"
              value={cfg.approverId}
              onChange={val => updateConfig(idx, { approverId: val })}
              options={userOptions}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: G.muted }}>
                E-Invoicing
              </p>
              <ToggleSwitch
                checked={cfg.eInvoicing}
                onChange={val => updateConfig(idx, { eInvoicing: val })}
                label={cfg.eInvoicing ? 'Applicable' : 'Not Applicable'}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: G.muted }}>
                LUT
              </p>
              <ToggleSwitch
                checked={cfg.lut}
                onChange={val => updateConfig(idx, { lut: val })}
                label={cfg.lut ? 'Applicable' : 'Not Applicable'}
              />
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => toast.success(`GST configuration saved for ${cfg.gstin}`)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
              style={{ background: G.primary }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
              onMouseLeave={e => (e.currentTarget.style.background = G.primary)}
            >
              Save
            </button>
          </div>
        </div>
      ))}

      {/* Add GSTIN */}
      {showAddForm ? (
        <div
          className="rounded-2xl border p-5"
          style={{ background: G.white, borderColor: G.border }}
        >
          <p className="text-sm font-semibold mb-4" style={{ color: G.primary }}>
            Add New GSTIN
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <TextField
              label="GSTIN"
              value={newGSTIN}
              onChange={setNewGSTIN}
              placeholder="27AABCS1429B1ZB"
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: G.muted }}>
                State Code (optional)
              </label>
              <div className="relative">
                <select
                  value={newStateCode}
                  onChange={e => setNewStateCode(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-400 pr-8"
                >
                  <option value="">Auto-detect from GSTIN</option>
                  {Object.entries(STATE_CODES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {code} — {name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: G.muted }} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewGSTIN(''); setNewStateCode('') }}
              className="rounded-xl px-4 py-2 text-sm font-medium border transition-colors"
              style={{ color: G.secondary, borderColor: G.border, background: G.canvas }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddGSTIN}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
              style={{ background: G.primary }}
            >
              Add GSTIN
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-colors self-start"
          style={{ color: G.accent, borderColor: G.accent, background: 'transparent' }}
        >
          <Plus size={16} />
          Add GSTIN
        </button>
      )}
    </div>
  )
}

// ─── TDS Tab ──────────────────────────────────────────────────────────────────

interface TDSTabProps {
  configs: TANConfig[]
  onUpdate: (configs: TANConfig[]) => void
}

function TDSTab({ configs, onUpdate }: TDSTabProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTAN, setNewTAN] = useState('')
  const [payrollTooltip, setPayrollTooltip] = useState<number | null>(null)

  const userOptions = MOCK_USERS
    .filter(u => u.role === 'admin' || u.role === 'super_admin')
    .map(u => ({ value: String(u.id), label: `${u.full_name} (${u.role})` }))

  function updateConfig(idx: number, patch: Partial<TANConfig>) {
    const next = configs.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    onUpdate(next)
  }

  function toggleForm(idx: number, form: TDSFormType) {
    const cur = configs[idx].applicableForms
    const next = cur.includes(form) ? cur.filter(f => f !== form) : [...cur, form]
    updateConfig(idx, { applicableForms: next })
  }

  function handleAddTAN() {
    if (!newTAN.trim()) return
    const tan = newTAN.trim().toUpperCase()
    onUpdate([...configs, defaultTANConfig(tan)])
    setNewTAN('')
    setShowAddForm(false)
    toast.success(`TAN ${tan} added`)
  }

  const TDS_FORM_LABELS: Record<TDSFormType, string> = {
    '24Q': '24Q (Salary)',
    '26Q': '26Q (Non-Salary)',
    '27Q': '27Q (NRI)',
    '27EQ': '27EQ (TCS)',
  }

  return (
    <div className="flex flex-col gap-6">
      {configs.map((cfg, idx) => (
        <div
          key={cfg.tan}
          className="rounded-2xl border p-5"
          style={{ background: G.white, borderColor: G.border }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-sm font-bold" style={{ color: G.primary }}>
              TAN: {cfg.tan}
            </span>
          </div>

          {/* Forms */}
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: G.muted }}>
              Applicable TDS Forms
            </p>
            <div className="flex flex-wrap gap-2">
              {TDS_FORM_TYPES.map(form => (
                <PillToggle
                  key={form}
                  label={TDS_FORM_LABELS[form]}
                  active={cfg.applicableForms.includes(form)}
                  onClick={() => toggleForm(idx, form)}
                />
              ))}
            </div>
          </div>

          {/* Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <SelectField
              label="Filing Frequency"
              value={cfg.frequency}
              onChange={() => {}}
              options={[{ value: 'Quarterly', label: 'Quarterly' }]}
            />
            <SelectField
              label="Default Reviewer"
              value={cfg.reviewerId}
              onChange={val => updateConfig(idx, { reviewerId: val })}
              options={userOptions}
            />
            <SelectField
              label="Default Approver"
              value={cfg.approverId}
              onChange={val => updateConfig(idx, { approverId: val })}
              options={userOptions}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: G.muted }}>
                Salary TDS
              </p>
              <ToggleSwitch
                checked={cfg.salaryTDS}
                onChange={val => updateConfig(idx, { salaryTDS: val })}
                label={cfg.salaryTDS ? 'Applicable' : 'Not Applicable'}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: G.muted }}>
                Vendor TDS
              </p>
              <ToggleSwitch
                checked={cfg.vendorTDS}
                onChange={val => updateConfig(idx, { vendorTDS: val })}
                label={cfg.vendorTDS ? 'Applicable' : 'Not Applicable'}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: G.muted }}>
                Contractor TDS
              </p>
              <ToggleSwitch
                checked={cfg.contractorTDS}
                onChange={val => updateConfig(idx, { contractorTDS: val })}
                label={cfg.contractorTDS ? 'Applicable' : 'Not Applicable'}
              />
            </div>
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: G.muted }}>
                Payroll Integration
              </p>
              <ToggleSwitch
                checked={cfg.payrollIntegration}
                onChange={val => {
                  updateConfig(idx, { payrollIntegration: val })
                  if (val) setPayrollTooltip(idx)
                }}
                label={cfg.payrollIntegration ? 'Enabled' : 'Disabled'}
                tooltip="Coming soon"
              />
              {payrollTooltip === idx && cfg.payrollIntegration && (
                <div
                  className="absolute left-0 mt-1 z-10 rounded-lg px-3 py-2 text-xs shadow-lg"
                  style={{ background: G.primary, color: G.white, whiteSpace: 'nowrap', top: '100%' }}
                >
                  Payroll Integration — Coming Soon
                  <button
                    onClick={() => setPayrollTooltip(null)}
                    className="ml-2 opacity-70 hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => toast.success(`TDS configuration saved for TAN ${cfg.tan}`)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
              style={{ background: G.primary }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
              onMouseLeave={e => (e.currentTarget.style.background = G.primary)}
            >
              Save
            </button>
          </div>
        </div>
      ))}

      {/* Add TAN */}
      {showAddForm ? (
        <div
          className="rounded-2xl border p-5"
          style={{ background: G.white, borderColor: G.border }}
        >
          <p className="text-sm font-semibold mb-4" style={{ color: G.primary }}>
            Add New TAN
          </p>
          <div className="mb-4 max-w-sm">
            <TextField
              label="TAN Number"
              value={newTAN}
              onChange={setNewTAN}
              placeholder="DELS12345A"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewTAN('') }}
              className="rounded-xl px-4 py-2 text-sm font-medium border"
              style={{ color: G.secondary, borderColor: G.border, background: G.canvas }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddTAN}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: G.primary }}
            >
              Add TAN
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-colors self-start"
          style={{ color: G.accent, borderColor: G.accent, background: 'transparent' }}
        >
          <Plus size={16} />
          Add TAN
        </button>
      )}
    </div>
  )
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────

interface AuditTabProps {
  config: AuditConfig
  onUpdate: (config: AuditConfig) => void
}

function AuditTab({ config, onUpdate }: AuditTabProps) {
  const userOptions = MOCK_USERS
    .filter((u: { role: string }) => u.role === 'admin' || u.role === 'super_admin')
    .map(u => ({ value: String(u.id), label: u.full_name }))

  function updateAuditType(type: AuditType, patch: Partial<AuditTypeConfig>) {
    onUpdate({
      ...config,
      types: {
        ...config.types,
        [type]: { ...config.types[type], ...patch },
      },
    })
  }

  function updateSchedule(patch: Partial<Pick<AuditConfig, 'fyEnd' | 'auditPeriodFrom' | 'auditPeriodTo'>>) {
    onUpdate({ ...config, ...patch })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Audit Types */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: G.white, borderColor: G.border }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: G.muted }}>
          Audit Types Applicable
        </p>

        <div className="flex flex-col gap-6">
          {AUDIT_TYPES.map(type => {
            const cfg = config.types[type]
            return (
              <div key={type} className="flex flex-col gap-3">
                {/* Toggle header */}
                <div className="flex items-center gap-3">
                  <ToggleSwitch
                    checked={cfg.enabled}
                    onChange={val => updateAuditType(type, { enabled: val })}
                  />
                  <span className="text-sm font-semibold" style={{ color: G.primary }}>
                    {type}
                  </span>
                </div>

                {/* Sub-fields when enabled */}
                {cfg.enabled && (
                  <div
                    className="ml-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 rounded-xl p-4"
                    style={{ background: G.canvas, border: `1px solid ${G.border}` }}
                  >
                    <SelectField
                      label="Engagement Partner"
                      value={cfg.engagementPartnerId}
                      onChange={val => updateAuditType(type, { engagementPartnerId: val })}
                      options={userOptions}
                    />
                    <SelectField
                      label="Engagement Manager"
                      value={cfg.engagementManagerId}
                      onChange={val => updateAuditType(type, { engagementManagerId: val })}
                      options={userOptions}
                    />
                    <TextField
                      label="Target Completion Month"
                      value={cfg.targetCompletionMonth}
                      onChange={val => updateAuditType(type, { targetCompletionMonth: val })}
                      type="month"
                    />
                    <TextField
                      label="Previous Auditor Name"
                      value={cfg.previousAuditorName}
                      onChange={val => updateAuditType(type, { previousAuditorName: val })}
                      placeholder="Enter previous auditor"
                    />
                    <SelectField
                      label="Reporting Standard"
                      value={cfg.reportingStandard}
                      onChange={val => updateAuditType(type, { reportingStandard: val as ReportingStandard })}
                      options={[
                        { value: 'Ind AS', label: 'Ind AS' },
                        { value: 'AS', label: 'AS' },
                        { value: 'IFRS', label: 'IFRS' },
                      ]}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Filing Schedule */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: G.white, borderColor: G.border }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: G.muted }}>
          Filing Schedule Configuration
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectField
            label="Financial Year End"
            value={config.fyEnd}
            onChange={val => updateSchedule({ fyEnd: val as FYEnd })}
            options={[
              { value: 'March 31', label: 'March 31' },
              { value: 'December 31', label: 'December 31' },
              { value: 'September 30', label: 'September 30' },
            ]}
          />
          <TextField
            label="Audit Period From"
            value={config.auditPeriodFrom}
            onChange={val => updateSchedule({ auditPeriodFrom: val })}
            type="date"
          />
          <TextField
            label="Audit Period To"
            value={config.auditPeriodTo}
            onChange={val => updateSchedule({ auditPeriodTo: val })}
            type="date"
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => toast.success('Audit configuration saved')}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
          style={{ background: G.primary }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
          onMouseLeave={e => (e.currentTarget.style.background = G.primary)}
        >
          Save All
        </button>
      </div>
    </div>
  )
}

// ─── Configuration Summary Card ───────────────────────────────────────────────

interface SummaryCardProps {
  clientName: string
  gstConfigs: GSTINConfig[]
  tdsConfigs: TANConfig[]
  auditConfig: AuditConfig
}

function SummaryCard({ clientName, gstConfigs, tdsConfigs, auditConfig }: SummaryCardProps) {
  const gstReturns = gstConfigs.flatMap(c => c.applicableReturns)
  const uniqueGSTReturns = [...new Set(gstReturns)]
  const tdsForms = tdsConfigs.flatMap(c => c.applicableForms)
  const uniqueTDSForms = [...new Set(tdsForms)]
  const gstFreq = gstConfigs[0]?.frequency ?? '—'
  const enabledAudits = AUDIT_TYPES.filter(t => auditConfig.types[t].enabled)

  return (
    <div
      className="rounded-2xl border p-5 sticky top-6"
      style={{ background: G.white, borderColor: G.border }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Settings size={16} style={{ color: G.accent }} />
        <span className="text-sm font-bold" style={{ color: G.primary }}>
          Configuration Summary
        </span>
      </div>

      <div className="text-xs font-semibold mb-3" style={{ color: G.secondary }}>
        {clientName}
      </div>
      <div className="mb-4 h-px" style={{ background: G.border }} />

      {/* GST */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: G.accent }}>
          GST
        </p>
        <div className="flex flex-col gap-1">
          <SummaryRow label="GSTINs configured" value={String(gstConfigs.length)} />
          <SummaryRow
            label="Returns enabled"
            value={uniqueGSTReturns.length ? uniqueGSTReturns.join(', ') : '—'}
          />
          <SummaryRow label="Frequency" value={gstFreq} />
        </div>
      </div>

      <div className="mb-4 h-px" style={{ background: G.border }} />

      {/* TDS */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: G.accent }}>
          TDS
        </p>
        <div className="flex flex-col gap-1">
          <SummaryRow label="TANs configured" value={String(tdsConfigs.length)} />
          <SummaryRow
            label="Forms enabled"
            value={uniqueTDSForms.length ? uniqueTDSForms.join(', ') : '—'}
          />
          <SummaryRow label="Frequency" value="Quarterly" />
        </div>
      </div>

      <div className="mb-4 h-px" style={{ background: G.border }} />

      {/* Audit */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: G.accent }}>
          Audit
        </p>
        <div className="flex flex-col gap-1">
          {AUDIT_TYPES.map(type => (
            <SummaryRow
              key={type}
              label={type}
              value=""
              icon={auditConfig.types[type].enabled ? 'check' : 'cross'}
            />
          ))}
        </div>
      </div>

      <div className="mb-2 h-px" style={{ background: G.border }} />
      <p className="text-xs" style={{ color: G.muted }}>
        Last Updated: Just now
      </p>

      {enabledAudits.length > 0 && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-xs"
          style={{ background: '#F0FDF4', color: '#166534' }}
        >
          {enabledAudits.length} audit type{enabledAudits.length > 1 ? 's' : ''} configured
        </div>
      )}
    </div>
  )
}

interface SummaryRowProps {
  label: string
  value: string
  icon?: 'check' | 'cross'
}

function SummaryRow({ label, value, icon }: SummaryRowProps) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs" style={{ color: G.muted, flexShrink: 0 }}>
        · {label}
      </span>
      {icon === 'check' ? (
        <Check size={12} style={{ color: '#16A34A', marginTop: 1, flexShrink: 0 }} />
      ) : icon === 'cross' ? (
        <X size={12} style={{ color: G.muted, marginTop: 1, flexShrink: 0 }} />
      ) : (
        <span className="text-xs font-medium text-right" style={{ color: G.secondary }}>
          {value}
        </span>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = 'gst' | 'tds' | 'audit'

const TABS: { id: TabId; label: string }[] = [
  { id: 'gst', label: 'GST' },
  { id: 'tds', label: 'TDS' },
  { id: 'audit', label: 'Audit' },
]

export function FilingConfigPage() {
  const { id: routeClientId } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  // Client selection
  const initialClientId = routeClientId ? Number(routeClientId) : (MOCK_CLIENTS[0]?.id ?? 1)
  const [selectedClientId, setSelectedClientId] = useState<number>(initialClientId)
  const [activeTab, setActiveTab] = useState<TabId>('gst')

  // Per-client config state (lazy init per client selection)
  const [gstConfigsByClient, setGstConfigsByClient] = useState<Record<number, GSTINConfig[]>>({})
  const [tdsConfigsByClient, setTdsConfigsByClient] = useState<Record<number, TANConfig[]>>({})
  const [auditConfigsByClient, setAuditConfigsByClient] = useState<Record<number, AuditConfig>>({})

  function getGSTConfigs(clientId: number): GSTINConfig[] {
    if (!gstConfigsByClient[clientId]) {
      return seedGSTForClient(clientId)
    }
    return gstConfigsByClient[clientId]
  }

  function getTDSConfigs(clientId: number): TANConfig[] {
    if (!tdsConfigsByClient[clientId]) {
      return seedTDSForClient(clientId)
    }
    return tdsConfigsByClient[clientId]
  }

  function getAuditConfig(clientId: number): AuditConfig {
    if (!auditConfigsByClient[clientId]) {
      return seedAuditForClient(clientId)
    }
    return auditConfigsByClient[clientId]
  }

  const selectedClient = useMemo(
    () => MOCK_CLIENTS.find(c => c.id === selectedClientId),
    [selectedClientId]
  )

  const gstConfigs = useMemo(() => getGSTConfigs(selectedClientId), [selectedClientId, gstConfigsByClient])
  const tdsConfigs = useMemo(() => getTDSConfigs(selectedClientId), [selectedClientId, tdsConfigsByClient])
  const auditConfig = useMemo(() => getAuditConfig(selectedClientId), [selectedClientId, auditConfigsByClient])

  function handleClientChange(clientId: string) {
    const id = Number(clientId)
    setSelectedClientId(id)
    setActiveTab('gst')
    if (routeClientId) {
      navigate(`/clients/${clientId}/filing-config`, { replace: true })
    }
  }

  function handleGSTUpdate(configs: GSTINConfig[]) {
    setGstConfigsByClient(prev => ({ ...prev, [selectedClientId]: configs }))
  }

  function handleTDSUpdate(configs: TANConfig[]) {
    setTdsConfigsByClient(prev => ({ ...prev, [selectedClientId]: configs }))
  }

  function handleAuditUpdate(config: AuditConfig) {
    setAuditConfigsByClient(prev => ({ ...prev, [selectedClientId]: config }))
  }

  return (
    <div className="min-h-screen" style={{ background: G.canvas }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: G.primary }}>
            Filing Configuration
          </h1>
          <p className="text-sm mt-1" style={{ color: G.muted }}>
            Configure compliance obligations per client
          </p>
        </div>

        {/* Client Selector */}
        <div
          className="rounded-2xl border p-4 mb-6"
          style={{ background: G.white, borderColor: G.border }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: G.muted }}>
              Select Client
            </label>
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <select
                value={selectedClientId}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-400 pr-8"
              >
                {MOCK_CLIENTS.map(c => (
                  <option key={c.id} value={c.id}>
                    {clientDisplayName(c)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: G.muted }} />
            </div>
            {selectedClient && (
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: '#F0F9FF', color: G.accent }}>
                {selectedClient.gstin ?? 'No GSTIN'}
              </span>
            )}
          </div>
        </div>

        {selectedClientId && (
          <div className="flex gap-6 items-start">
            {/* Left: Tabs + Content */}
            <div className="flex-1 min-w-0">
              {/* Tab Bar */}
              <div
                className="rounded-2xl border mb-6 overflow-hidden"
                style={{ background: G.white, borderColor: G.border }}
              >
                <div
                  role="tablist"
                  className="flex border-b"
                  style={{ borderColor: G.border }}
                >
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px',
                        activeTab === tab.id
                          ? 'border-current'
                          : 'border-transparent'
                      )}
                      style={
                        activeTab === tab.id
                          ? { color: G.accent, borderBottomColor: G.accent }
                          : { color: G.muted, borderBottomColor: 'transparent' }
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'gst' && (
                <GSTTab configs={gstConfigs} onUpdate={handleGSTUpdate} />
              )}
              {activeTab === 'tds' && (
                <TDSTab configs={tdsConfigs} onUpdate={handleTDSUpdate} />
              )}
              {activeTab === 'audit' && (
                <AuditTab config={auditConfig} onUpdate={handleAuditUpdate} />
              )}
            </div>

            {/* Right: Summary Card */}
            <div className="w-72 flex-shrink-0 hidden lg:block">
              <SummaryCard
                clientName={selectedClient ? clientDisplayName(selectedClient) : '—'}
                gstConfigs={gstConfigs}
                tdsConfigs={tdsConfigs}
                auditConfig={auditConfig}
              />
            </div>
          </div>
        )}

        {/* Mobile Summary (below tabs) */}
        {selectedClientId && (
          <div className="mt-6 lg:hidden">
            <SummaryCard
              clientName={selectedClient ? clientDisplayName(selectedClient) : '—'}
              gstConfigs={gstConfigs}
              tdsConfigs={tdsConfigs}
              auditConfig={auditConfig}
            />
          </div>
        )}
      </div>
    </div>
  )
}
