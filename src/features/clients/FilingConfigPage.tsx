import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Eye, EyeOff, Plus, X, ChevronDown, ChevronUp,
} from 'lucide-react'
import { G, PageHeader } from '@/shared/components/GrayKpi'
import { MOCK_CLIENTS, MOCK_USERS } from '@/mock/data'

// ── Types ─────────────────────────────────────────────────

interface GSTConfig {
  gstin: string
  state: string
  registrationType: string
  returns: string[]
  frequency: string
  eInvoicing: boolean
  lut: boolean
  reverseCharge: boolean
  sezTaxpayer: boolean
  portalUsername: string
  portalPassword: string
  reviewer: string
  approver: string
}

interface TDSConfig {
  tan: string
  forms: string[]
  frequency: string
  salaryTds: boolean
  vendorTds: boolean
  contractorTds: boolean
  payrollIntegration: boolean
  reviewer: string
  approver: string
}

interface AuditTypeConfig {
  enabled: boolean
  partner: string
  manager: string
  targetMonth: string
  previousAuditor: string
  reportingStandard: string
}

interface AuditConfig {
  statutory: AuditTypeConfig
  tax: AuditTypeConfig
  internal: AuditTypeConfig
  concurrent: AuditTypeConfig
  fyEnd: string
  periodFrom: string
  periodTo: string
  leadPartnerSignoff: boolean
  qualityReview: boolean
  qrReviewer: string
  managementLetter: boolean
}

// ── Helpers ───────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  border: `1px solid ${G.border}`,
  background: G.white,
  color: G.primary,
}

const sectionLabel = 'text-xs font-semibold uppercase tracking-wide mb-2'

function Divider() {
  return <div style={{ borderTop: `1px solid ${G.border}`, margin: '16px 0' }} />
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className={sectionLabel} style={{ color: G.icon }}>{children}</p>
}

// iOS-style toggle switch
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: on ? '#0584C7' : G.border,
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
      aria-pressed={on}
    >
      <span style={{
        position: 'absolute', top: 2,
        width: 16, height: 16, borderRadius: '50%',
        background: G.white,
        transform: on ? 'translateX(16px)' : 'translateX(2px)',
        transition: 'transform 0.2s',
        display: 'block',
      }} />
    </button>
  )
}

function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Toggle on={on} onChange={onChange} />
      <span className="text-xs font-medium" style={{ color: G.secondary }}>{label}</span>
    </div>
  )
}

// Pill toggle for multi-select
function PillToggle({ label, active, onChange }: { label: string; active: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="rounded-full px-3 py-1 text-xs font-semibold border cursor-pointer transition-all"
      style={{
        background: active ? '#0584C7' : G.canvas,
        color: active ? G.white : G.secondary,
        border: active ? '1px solid transparent' : `1px solid ${G.border}`,
      }}
    >
      {label}
    </button>
  )
}

// User select (admin + super_admin only)
const adminUsers = MOCK_USERS.filter(u => u.role === 'admin' || u.role === 'super_admin')

function UserSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex-1 min-w-0">
      <SectionLabel>{label}</SectionLabel>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
        style={inputStyle}
      >
        <option value="">— Select —</option>
        {adminUsers.map(u => (
          <option key={u.id} value={String(u.id)}>{u.full_name}</option>
        ))}
      </select>
    </div>
  )
}

// ── GST Card ──────────────────────────────────────────────

const GST_RETURNS = ['GSTR-1', 'GSTR-1A', 'GSTR-3B', 'GSTR-9', 'GSTR-9C']

function GSTCard({ config, onChange, onSave }: {
  config: GSTConfig
  onChange: (c: GSTConfig) => void
  onSave: () => void
}) {
  const [showPwd, setShowPwd] = useState(false)

  function toggleReturn(r: string) {
    const next = config.returns.includes(r)
      ? config.returns.filter(x => x !== r)
      : [...config.returns, r]
    onChange({ ...config, returns: next })
  }

  return (
    <div className="rounded-2xl p-5 border mb-4" style={{ background: G.white, borderColor: G.border }}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="text-sm font-bold font-mono" style={{ color: G.primary }}>{config.gstin}</span>
        <span className="rounded-full text-[10px] font-semibold px-2.5 py-0.5"
          style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
          {config.state}
        </span>
        <span className="rounded-full text-[10px] font-semibold px-2.5 py-0.5"
          style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
          {config.registrationType}
        </span>
      </div>

      <Divider />

      {/* Return Types */}
      <SectionLabel>Return Types Applicable</SectionLabel>
      <div className="flex flex-wrap gap-2 mb-4">
        {GST_RETURNS.map(r => (
          <PillToggle key={r} label={r} active={config.returns.includes(r)} onChange={() => toggleReturn(r)} />
        ))}
      </div>

      {/* Filing Frequency */}
      <SectionLabel>Filing Frequency</SectionLabel>
      <select
        value={config.frequency}
        onChange={e => onChange({ ...config, frequency: e.target.value })}
        className="rounded-xl border px-3 py-2 text-sm focus:outline-none mb-4"
        style={inputStyle}
      >
        {['Monthly', 'Quarterly', 'Annually'].map(f => <option key={f}>{f}</option>)}
      </select>

      <Divider />

      {/* Toggles */}
      <SectionLabel>Applicable Settings</SectionLabel>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <ToggleRow label="E-Invoicing Applicable" on={config.eInvoicing} onChange={v => onChange({ ...config, eInvoicing: v })} />
        <ToggleRow label="LUT Applicable" on={config.lut} onChange={v => onChange({ ...config, lut: v })} />
        <ToggleRow label="Reverse Charge Applicable" on={config.reverseCharge} onChange={v => onChange({ ...config, reverseCharge: v })} />
        <ToggleRow label="SEZ Taxpayer" on={config.sezTaxpayer} onChange={v => onChange({ ...config, sezTaxpayer: v })} />
      </div>

      <Divider />

      {/* Portal Credentials */}
      <SectionLabel>Portal Credentials</SectionLabel>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-medium mb-1 block" style={{ color: G.icon }}>Username</label>
          <input
            type="text"
            value={config.portalUsername}
            onChange={e => onChange({ ...config, portalUsername: e.target.value })}
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium mb-1 block" style={{ color: G.icon }}>Password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={config.portalPassword}
              onChange={e => onChange({ ...config, portalPassword: e.target.value })}
              className="w-full rounded-xl px-3 py-2 pr-9 text-sm focus:outline-none"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: G.icon }}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <Divider />

      {/* Assignment */}
      <SectionLabel>Default Assignment</SectionLabel>
      <div className="flex gap-3 mb-4">
        <UserSelect label="Default Reviewer" value={config.reviewer} onChange={v => onChange({ ...config, reviewer: v })} />
        <UserSelect label="Default Approver" value={config.approver} onChange={v => onChange({ ...config, approver: v })} />
      </div>

      {/* Footer */}
      <button
        type="button"
        onClick={onSave}
        className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
        style={{ background: G.primary }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
        onMouseLeave={e => (e.currentTarget.style.background = G.primary)}
      >
        Save Configuration
      </button>
    </div>
  )
}

// ── TDS Card ──────────────────────────────────────────────

const TDS_FORMS = ['24Q (Salary)', '26Q (Non-Salary)', '27Q (NRI)', '27EQ (TCS)']

function TDSCard({ config, onChange, onSave }: {
  config: TDSConfig
  onChange: (c: TDSConfig) => void
  onSave: () => void
}) {
  function toggleForm(f: string) {
    const key = f.split(' ')[0]
    const next = config.forms.includes(key)
      ? config.forms.filter(x => x !== key)
      : [...config.forms, key]
    onChange({ ...config, forms: next })
  }

  return (
    <div className="rounded-2xl p-5 border mb-4" style={{ background: G.white, borderColor: G.border }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-bold font-mono" style={{ color: G.primary }}>TAN: {config.tan}</span>
      </div>

      <Divider />

      {/* TDS Forms */}
      <SectionLabel>Applicable TDS Forms</SectionLabel>
      <div className="flex flex-wrap gap-2 mb-4">
        {TDS_FORMS.map(f => {
          const key = f.split(' ')[0]
          return (
            <PillToggle key={f} label={f} active={config.forms.includes(key)} onChange={() => toggleForm(f)} />
          )
        })}
      </div>

      {/* Filing Frequency */}
      <SectionLabel>Filing Frequency</SectionLabel>
      <div className="mb-1">
        <select
          value="Quarterly"
          disabled
          className="rounded-xl border px-3 py-2 text-sm focus:outline-none opacity-60"
          style={inputStyle}
        >
          <option>Quarterly</option>
        </select>
      </div>
      <p className="text-[10px] mb-4" style={{ color: G.icon }}>
        TDS returns are filed quarterly as per Income Tax rules
      </p>

      <Divider />

      {/* Toggles */}
      <SectionLabel>TDS Category Settings</SectionLabel>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <ToggleRow label="Salary TDS (24Q)" on={config.salaryTds} onChange={v => onChange({ ...config, salaryTds: v })} />
        <ToggleRow label="Vendor/Contractor TDS (26Q)" on={config.vendorTds} onChange={v => onChange({ ...config, vendorTds: v })} />
        <ToggleRow label="Contractor TDS" on={config.contractorTds} onChange={v => onChange({ ...config, contractorTds: v })} />
        <div className="flex items-center gap-3 relative group">
          <Toggle
            on={config.payrollIntegration}
            onChange={v => {
              if (v) toast.info('Payroll Integration — Coming Soon')
              onChange({ ...config, payrollIntegration: false })
            }}
          />
          <span className="text-xs font-medium" style={{ color: G.secondary }}>
            Payroll Integration
            <span className="ml-1 text-[10px]" style={{ color: G.icon }}>(Coming soon)</span>
          </span>
        </div>
      </div>

      <Divider />

      {/* Assignment */}
      <SectionLabel>Default Assignment</SectionLabel>
      <div className="flex gap-3 mb-4">
        <UserSelect label="Default Reviewer" value={config.reviewer} onChange={v => onChange({ ...config, reviewer: v })} />
        <UserSelect label="Default Approver" value={config.approver} onChange={v => onChange({ ...config, approver: v })} />
      </div>

      <button
        type="button"
        onClick={onSave}
        className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
        style={{ background: G.primary }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
        onMouseLeave={e => (e.currentTarget.style.background = G.primary)}
      >
        Save Configuration
      </button>
    </div>
  )
}

// ── Audit Sub-panel ───────────────────────────────────────

function AuditSubPanel({ config, onChange }: {
  config: AuditTypeConfig
  onChange: (c: AuditTypeConfig) => void
}) {
  return (
    <div className="mt-3 ml-12 rounded-xl p-4" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <SectionLabel>Engagement Partner</SectionLabel>
          <select
            value={config.partner}
            onChange={e => onChange({ ...config, partner: e.target.value })}
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          >
            <option value="">— Select —</option>
            {adminUsers.map(u => <option key={u.id} value={String(u.id)}>{u.full_name}</option>)}
          </select>
        </div>
        <div>
          <SectionLabel>Engagement Manager</SectionLabel>
          <select
            value={config.manager}
            onChange={e => onChange({ ...config, manager: e.target.value })}
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          >
            <option value="">— Select —</option>
            {MOCK_USERS.map(u => <option key={u.id} value={String(u.id)}>{u.full_name}</option>)}
          </select>
        </div>
        <div>
          <SectionLabel>Target Completion Month</SectionLabel>
          <input
            type="month"
            value={config.targetMonth}
            onChange={e => onChange({ ...config, targetMonth: e.target.value })}
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <SectionLabel>Previous Auditor Name</SectionLabel>
          <input
            type="text"
            value={config.previousAuditor}
            onChange={e => onChange({ ...config, previousAuditor: e.target.value })}
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
            placeholder="Firm name"
          />
        </div>
        <div className="col-span-2">
          <SectionLabel>Reporting Standard</SectionLabel>
          <select
            value={config.reportingStandard}
            onChange={e => onChange({ ...config, reportingStandard: e.target.value })}
            className="rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          >
            <option value="Ind AS">Ind AS</option>
            <option value="AS">AS (Accounting Standards)</option>
            <option value="IFRS">IFRS</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// ── Audit Tab ─────────────────────────────────────────────

function AuditTab({ config, onChange, clientName }: {
  config: AuditConfig
  onChange: (c: AuditConfig) => void
  clientName: string
}) {
  const auditTypes: { key: keyof Pick<AuditConfig, 'statutory' | 'tax' | 'internal' | 'concurrent'>; label: string }[] = [
    { key: 'statutory', label: 'Statutory Audit' },
    { key: 'tax', label: 'Tax Audit' },
    { key: 'internal', label: 'Internal Audit' },
    { key: 'concurrent', label: 'Concurrent Audit' },
  ]

  return (
    <div className="rounded-2xl p-5 border" style={{ background: G.white, borderColor: G.border }}>
      {/* Section 1: Audit Types */}
      <p className="text-sm font-semibold mb-4" style={{ color: G.primary }}>Audit Types Applicable</p>
      <div className="flex flex-col gap-3 mb-2">
        {auditTypes.map(({ key, label }) => {
          const atConfig = config[key]
          return (
            <div key={key}>
              <div className="flex items-center gap-3">
                <Toggle
                  on={atConfig.enabled}
                  onChange={v => onChange({ ...config, [key]: { ...atConfig, enabled: v } })}
                />
                <span className="text-sm font-medium" style={{ color: G.primary }}>{label}</span>
                {atConfig.enabled
                  ? <ChevronUp className="h-4 w-4 ml-auto" style={{ color: G.icon }} />
                  : <ChevronDown className="h-4 w-4 ml-auto" style={{ color: G.icon }} />
                }
              </div>
              {atConfig.enabled && (
                <AuditSubPanel
                  config={atConfig}
                  onChange={v => onChange({ ...config, [key]: v })}
                />
              )}
            </div>
          )
        })}
      </div>

      <Divider />

      {/* Section 2: Financial Year & Period */}
      <p className="text-sm font-semibold mb-3" style={{ color: G.primary }}>Financial Year & Period</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <SectionLabel>Financial Year End</SectionLabel>
          <select
            value={config.fyEnd}
            onChange={e => onChange({ ...config, fyEnd: e.target.value })}
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          >
            <option value="March 31">March 31</option>
            <option value="December 31">December 31</option>
            <option value="September 30">September 30</option>
          </select>
        </div>
        <div>
          <SectionLabel>Audit Period From</SectionLabel>
          <input
            type="date"
            value={config.periodFrom}
            onChange={e => onChange({ ...config, periodFrom: e.target.value })}
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <SectionLabel>Audit Period To</SectionLabel>
          <input
            type="date"
            value={config.periodTo}
            onChange={e => onChange({ ...config, periodTo: e.target.value })}
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <Divider />

      {/* Section 3: Reporting Configuration */}
      <p className="text-sm font-semibold mb-3" style={{ color: G.primary }}>Reporting Configuration</p>
      <div className="flex flex-col gap-3 mb-4">
        <ToggleRow
          label="Lead Partner Sign-off Required"
          on={config.leadPartnerSignoff}
          onChange={v => onChange({ ...config, leadPartnerSignoff: v })}
        />
        <div>
          <ToggleRow
            label="Quality Review Required"
            on={config.qualityReview}
            onChange={v => onChange({ ...config, qualityReview: v })}
          />
          {config.qualityReview && (
            <div className="mt-2 ml-12">
              <SectionLabel>QR Reviewer</SectionLabel>
              <select
                value={config.qrReviewer}
                onChange={e => onChange({ ...config, qrReviewer: e.target.value })}
                className="rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              >
                <option value="">— Select —</option>
                {adminUsers.map(u => <option key={u.id} value={String(u.id)}>{u.full_name}</option>)}
              </select>
            </div>
          )}
        </div>
        <ToggleRow
          label="Management Letter Required"
          on={config.managementLetter}
          onChange={v => onChange({ ...config, managementLetter: v })}
        />
      </div>

      <button
        type="button"
        onClick={() => toast.success(`Audit configuration saved for ${clientName}`)}
        className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
        style={{ background: G.primary }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
        onMouseLeave={e => (e.currentTarget.style.background = G.primary)}
      >
        Save All Audit Configuration
      </button>
    </div>
  )
}

// ── Config Summary Panel ──────────────────────────────────

function ConfigSummary({
  clientName,
  gstConfigs,
  tdsConfigs,
  auditConfig,
}: {
  clientName: string
  gstConfigs: GSTConfig[]
  tdsConfigs: TDSConfig[]
  auditConfig: AuditConfig
}) {
  // Calculate completion: each section gets a point if reviewer+approver set
  let completed = 0
  let total = 0

  gstConfigs.forEach(g => {
    total++
    if (g.reviewer && g.approver) completed++
  })
  tdsConfigs.forEach(t => {
    total++
    if (t.reviewer && t.approver) completed++
  })
  // Audit counts if at least one audit type enabled
  total++
  if (auditConfig.statutory.enabled || auditConfig.tax.enabled || auditConfig.internal.enabled || auditConfig.concurrent.enabled) {
    completed++
  }

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const gstEnabled = gstConfigs[0]
  const tdsEnabled = tdsConfigs[0]

  return (
    <div className="rounded-2xl p-5 border" style={{ background: G.white, borderColor: G.border, boxShadow: '0 1px 3px 0 rgba(15,23,42,0.06)' }}>
      <p className="text-sm font-bold mb-0.5" style={{ color: G.primary }}>{clientName || '— Select a client —'}</p>
      <p className="text-[10px] mb-3" style={{ color: G.icon }}>Last updated: Just now</p>

      <div style={{ borderTop: `1px solid ${G.border}`, marginBottom: 12 }} />

      {/* GST */}
      <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: G.secondary }}>GST</p>
      {gstEnabled ? (
        <div className="mb-3 text-xs" style={{ color: G.secondary }}>
          <p>GSTINs configured: {gstConfigs.length}</p>
          <p>Returns: {gstEnabled.returns.join(', ') || '—'}</p>
          <p>Frequency: {gstEnabled.frequency}</p>
          <p>E-Invoicing: {gstEnabled.eInvoicing ? '✓' : '✗'} | LUT: {gstEnabled.lut ? '✓' : '✗'}</p>
        </div>
      ) : (
        <p className="text-xs mb-3" style={{ color: G.icon }}>Not configured</p>
      )}

      <div style={{ borderTop: `1px solid ${G.border}`, marginBottom: 12 }} />

      {/* TDS */}
      <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: G.secondary }}>TDS</p>
      {tdsEnabled ? (
        <div className="mb-3 text-xs" style={{ color: G.secondary }}>
          <p>TANs configured: {tdsConfigs.length}</p>
          <p>Forms: {tdsEnabled.forms.join(', ') || '—'}</p>
          <p>Frequency: {tdsEnabled.frequency}</p>
          <p>Salary TDS: {tdsEnabled.salaryTds ? '✓' : '✗'} | Vendor: {tdsEnabled.vendorTds ? '✓' : '✗'}</p>
        </div>
      ) : (
        <p className="text-xs mb-3" style={{ color: G.icon }}>Not configured</p>
      )}

      <div style={{ borderTop: `1px solid ${G.border}`, marginBottom: 12 }} />

      {/* Audit */}
      <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: G.secondary }}>Audit</p>
      <div className="mb-4 text-xs" style={{ color: G.secondary }}>
        <p>Statutory: {auditConfig.statutory.enabled ? '✓' : '✗'}</p>
        <p>Tax Audit: {auditConfig.tax.enabled ? '✓' : '✗'}</p>
        <p>Internal: {auditConfig.internal.enabled ? '✓' : '✗'}</p>
        <p>Concurrent: {auditConfig.concurrent.enabled ? '✓' : '✗'}</p>
      </div>

      <div style={{ borderTop: `1px solid ${G.border}`, marginBottom: 12 }} />

      {/* Completion */}
      <p className="text-[10px] font-semibold mb-1.5" style={{ color: G.icon }}>Configuration Completeness</p>
      <div className="rounded-full h-2 overflow-hidden mb-1" style={{ background: G.border }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct === 100 ? '#166534' : '#0584C7' }}
        />
      </div>
      <p className="text-xs font-semibold tabular-nums" style={{ color: pct === 100 ? '#166534' : G.secondary }}>{pct}% Complete</p>
    </div>
  )
}

// ── Add GSTIN Inline Form ─────────────────────────────────

function AddGSTINForm({ onAdd, onCancel }: {
  onAdd: (gstin: string, state: string) => void
  onCancel: () => void
}) {
  const [gstin, setGstin] = useState('')
  const [state, setState] = useState('')

  return (
    <div className="rounded-2xl p-4 border mb-4" style={{ background: G.canvas, borderColor: G.border }}>
      <p className="text-xs font-semibold mb-3" style={{ color: G.secondary }}>Add New GSTIN</p>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-[10px] font-medium mb-1 block" style={{ color: G.icon }}>GSTIN</label>
          <input
            type="text"
            value={gstin}
            onChange={e => setGstin(e.target.value.toUpperCase())}
            maxLength={15}
            placeholder="27AABCS1429B1ZB"
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none font-mono"
            style={inputStyle}
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-medium mb-1 block" style={{ color: G.icon }}>State</label>
          <input
            type="text"
            value={state}
            onChange={e => setState(e.target.value)}
            placeholder="e.g. Gujarat"
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        <button
          type="button"
          onClick={() => { if (gstin && state) { onAdd(gstin, state); setGstin(''); setState('') } }}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: G.primary }}
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-3 py-2"
          style={{ color: G.secondary }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Add TAN Inline Form ───────────────────────────────────

function AddTANForm({ onAdd, onCancel }: {
  onAdd: (tan: string) => void
  onCancel: () => void
}) {
  const [tan, setTan] = useState('')

  return (
    <div className="rounded-2xl p-4 border mb-4" style={{ background: G.canvas, borderColor: G.border }}>
      <p className="text-xs font-semibold mb-3" style={{ color: G.secondary }}>Add New TAN</p>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-[10px] font-medium mb-1 block" style={{ color: G.icon }}>TAN</label>
          <input
            type="text"
            value={tan}
            onChange={e => setTan(e.target.value.toUpperCase())}
            maxLength={10}
            placeholder="DELS12345A"
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none font-mono"
            style={inputStyle}
          />
        </div>
        <button
          type="button"
          onClick={() => { if (tan) { onAdd(tan); setTan('') } }}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: G.primary }}
        >
          Add
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl px-3 py-2" style={{ color: G.secondary }}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Default Configs ───────────────────────────────────────

function defaultGSTConfig(gstin: string, state: string): GSTConfig {
  return {
    gstin, state, registrationType: 'Regular',
    returns: ['GSTR-1', 'GSTR-3B'],
    frequency: 'Monthly',
    eInvoicing: false, lut: false, reverseCharge: false, sezTaxpayer: false,
    portalUsername: '', portalPassword: '',
    reviewer: '', approver: '',
  }
}

function defaultTDSConfig(tan: string): TDSConfig {
  return {
    tan, forms: ['26Q'], frequency: 'Quarterly',
    salaryTds: false, vendorTds: true, contractorTds: false, payrollIntegration: false,
    reviewer: '', approver: '',
  }
}

function defaultAuditTypeConfig(): AuditTypeConfig {
  return {
    enabled: false, partner: '', manager: '',
    targetMonth: '', previousAuditor: '', reportingStandard: 'Ind AS',
  }
}

function defaultAuditConfig(): AuditConfig {
  return {
    statutory: defaultAuditTypeConfig(),
    tax: defaultAuditTypeConfig(),
    internal: defaultAuditTypeConfig(),
    concurrent: defaultAuditTypeConfig(),
    fyEnd: 'March 31', periodFrom: '', periodTo: '',
    leadPartnerSignoff: false, qualityReview: false, qrReviewer: '', managementLetter: false,
  }
}

// TAN map for known clients
const CLIENT_TAN: Record<number, string | null> = {
  1: 'DELS12345A',
  2: 'MUMS67890B',
  4: 'LKOS11223C',
}

function buildInitialGSTConfigs(clientId: number): GSTConfig[] {
  const client = MOCK_CLIENTS.find(c => c.id === clientId)
  if (!client || !client.gst_enabled || !client.gstin) return []

  if (clientId === 1) {
    return [{
      gstin: '27AABCS1429B1ZB',
      state: 'Gujarat',
      registrationType: 'Regular',
      returns: ['GSTR-1', 'GSTR-3B', 'GSTR-9'],
      frequency: 'Monthly',
      eInvoicing: true, lut: false, reverseCharge: false, sezTaxpayer: false,
      portalUsername: 'sunrise_gst_user',
      portalPassword: '',
      reviewer: '2', approver: '1',
    }]
  }
  return [defaultGSTConfig(client.gstin, client.state ?? '')]
}

function buildInitialTDSConfigs(clientId: number): TDSConfig[] {
  const client = MOCK_CLIENTS.find(c => c.id === clientId)
  if (!client || !client.tds_enabled) return []
  const tan = CLIENT_TAN[clientId]
  if (!tan) return []

  if (clientId === 1) {
    return [{
      tan: 'DELS12345A',
      forms: ['24Q', '26Q'],
      frequency: 'Quarterly',
      salaryTds: true, vendorTds: true, contractorTds: false, payrollIntegration: false,
      reviewer: '2', approver: '1',
    }]
  }
  return [defaultTDSConfig(tan)]
}

function buildInitialAuditConfig(clientId: number): AuditConfig {
  if (clientId === 1) {
    return {
      ...defaultAuditConfig(),
      statutory: { ...defaultAuditTypeConfig(), enabled: true },
    }
  }
  return defaultAuditConfig()
}

// ── Main Page ─────────────────────────────────────────────

export function FilingConfigPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    id ? Number(id) : null
  )
  const [activeTab, setActiveTab] = useState<'gst' | 'tds' | 'audit'>('gst')

  const client = MOCK_CLIENTS.find(c => c.id === selectedClientId) ?? null

  // GST State
  const [gstConfigs, setGstConfigs] = useState<GSTConfig[]>(() =>
    selectedClientId ? buildInitialGSTConfigs(selectedClientId) : []
  )
  const [showAddGSTIN, setShowAddGSTIN] = useState(false)

  // TDS State
  const [tdsConfigs, setTdsConfigs] = useState<TDSConfig[]>(() =>
    selectedClientId ? buildInitialTDSConfigs(selectedClientId) : []
  )
  const [showAddTAN, setShowAddTAN] = useState(false)

  // Audit State
  const [auditConfig, setAuditConfig] = useState<AuditConfig>(() =>
    selectedClientId ? buildInitialAuditConfig(selectedClientId) : defaultAuditConfig()
  )

  function handleClientChange(clientId: number | null) {
    setSelectedClientId(clientId)
    if (clientId) {
      setGstConfigs(buildInitialGSTConfigs(clientId))
      setTdsConfigs(buildInitialTDSConfigs(clientId))
      setAuditConfig(buildInitialAuditConfig(clientId))
    } else {
      setGstConfigs([])
      setTdsConfigs([])
      setAuditConfig(defaultAuditConfig())
    }
  }

  const tabs: { key: 'gst' | 'tds' | 'audit'; label: string }[] = [
    { key: 'gst', label: 'GST' },
    { key: 'tds', label: 'TDS' },
    { key: 'audit', label: 'Audit' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto" style={{ background: G.canvas }}>
      <PageHeader
        title="Filing Configuration"
        sub="Configure compliance obligations and filing settings per client"
      >
        <select
          value={selectedClientId ?? ''}
          onChange={e => handleClientChange(e.target.value ? Number(e.target.value) : null)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
        >
          <option value="">— Select a client —</option>
          {MOCK_CLIENTS.map(c => (
            <option key={c.id} value={c.id}>
              {c.legal_name} ({c.pan})
            </option>
          ))}
        </select>
      </PageHeader>

      {!selectedClientId ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: G.border }}>
            <span className="text-2xl">⚙️</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: G.secondary }}>Select a client to configure filing obligations</p>
          <p className="text-xs" style={{ color: G.icon }}>Choose a client from the dropdown above</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6 items-start">
          {/* Left — tabs + content (2/3) */}
          <div className="col-span-2">
            {/* Tab bar */}
            <div className="flex gap-2 mb-5">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-5 py-2 text-sm font-semibold rounded-xl transition-all"
                  style={activeTab === tab.key
                    ? { background: G.primary, color: G.white }
                    : { background: G.white, color: G.secondary, border: `1px solid ${G.border}` }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* GST Tab */}
            {activeTab === 'gst' && (
              <div>
                {gstConfigs.length === 0 && (
                  <div className="rounded-2xl p-5 border mb-4 text-center" style={{ background: G.white, borderColor: G.border }}>
                    <p className="text-sm" style={{ color: G.secondary }}>No GST configuration — GST not enabled for this client</p>
                  </div>
                )}
                {gstConfigs.map((cfg, i) => (
                  <GSTCard
                    key={cfg.gstin}
                    config={cfg}
                    onChange={updated => {
                      const next = [...gstConfigs]
                      next[i] = updated
                      setGstConfigs(next)
                    }}
                    onSave={() => toast.success(`GST configuration saved for ${cfg.gstin}`)}
                  />
                ))}
                {showAddGSTIN && (
                  <AddGSTINForm
                    onAdd={(gstin, state) => {
                      setGstConfigs(prev => [...prev, defaultGSTConfig(gstin, state)])
                      setShowAddGSTIN(false)
                    }}
                    onCancel={() => setShowAddGSTIN(false)}
                  />
                )}
                {!showAddGSTIN && (
                  <button
                    type="button"
                    onClick={() => setShowAddGSTIN(true)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
                    style={{ background: G.white, border: `1px solid ${G.border}`, color: G.secondary }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = G.border)}
                  >
                    <Plus className="h-4 w-4" /> Add GSTIN
                  </button>
                )}
              </div>
            )}

            {/* TDS Tab */}
            {activeTab === 'tds' && (
              <div>
                {tdsConfigs.length === 0 ? (
                  <div className="rounded-2xl p-5 border mb-4 text-center" style={{ background: G.white, borderColor: G.border }}>
                    <p className="text-sm" style={{ color: G.secondary }}>No TDS configuration — TDS not enabled for this client</p>
                  </div>
                ) : (
                  tdsConfigs.map((cfg, i) => (
                    <TDSCard
                      key={cfg.tan}
                      config={cfg}
                      onChange={updated => {
                        const next = [...tdsConfigs]
                        next[i] = updated
                        setTdsConfigs(next)
                      }}
                      onSave={() => toast.success(`TDS configuration saved for TAN ${cfg.tan}`)}
                    />
                  ))
                )}
                {showAddTAN && (
                  <AddTANForm
                    onAdd={tan => {
                      setTdsConfigs(prev => [...prev, defaultTDSConfig(tan)])
                      setShowAddTAN(false)
                    }}
                    onCancel={() => setShowAddTAN(false)}
                  />
                )}
                {!showAddTAN && (
                  <button
                    type="button"
                    onClick={() => setShowAddTAN(true)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
                    style={{ background: G.white, border: `1px solid ${G.border}`, color: G.secondary }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = G.border)}
                  >
                    <Plus className="h-4 w-4" /> Add TAN
                  </button>
                )}
              </div>
            )}

            {/* Audit Tab */}
            {activeTab === 'audit' && (
              <AuditTab
                config={auditConfig}
                onChange={setAuditConfig}
                clientName={client?.legal_name ?? ''}
              />
            )}
          </div>

          {/* Right — Config Summary sticky (1/3) */}
          <div className="col-span-1 sticky top-6">
            <ConfigSummary
              clientName={client?.legal_name ?? ''}
              gstConfigs={gstConfigs}
              tdsConfigs={tdsConfigs}
              auditConfig={auditConfig}
            />
          </div>
        </div>
      )}
    </div>
  )
}
