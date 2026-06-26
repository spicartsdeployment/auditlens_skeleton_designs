/**
 * Profile & Account Settings Modal
 * Full-screen overlay with vertical tab navigation
 */

import { useState } from 'react'
import { X, User, Lock, Monitor, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/shared/hooks/useAuthStore'

// ─── Gray palette ──────────────────────────────────────────
const G = {
  canvas:    '#F8FAFC',
  white:     '#FFFFFF',
  border:    '#E2E8F0',
  muted:     '#94A3B8',
  secondary: '#475569',
  primary:   '#0F172A',
} as const

// ─── Tab definitions ───────────────────────────────────────
type TabId = 'profile' | 'password' | 'sessions' | 'notifications'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile Information',     icon: User    },
  { id: 'password',      label: 'Change Password',         icon: Lock    },
  { id: 'sessions',      label: 'Active Sessions',         icon: Monitor },
  { id: 'notifications', label: 'Notification Preferences',icon: Bell    },
]

// ─── Password strength ─────────────────────────────────────
function passwordStrength(pw: string): { label: string; color: string; pct: number } {
  if (!pw) return { label: '', color: G.border, pct: 0 }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return { label: 'Weak',   color: '#EF4444', pct: 33  }
  if (score <= 3) return { label: 'Medium', color: '#F59E0B', pct: 66  }
  return              { label: 'Strong', color: '#16A34A', pct: 100 }
}

// ─── Profile Tab ───────────────────────────────────────────
function ProfileTab() {
  const user = useAuthStore(s => s.user)
  const [form, setForm] = useState({
    full_name:   user?.full_name ?? '',
    mobile:      user?.phone ?? '',
    designation: 'Senior Auditor',
    department:  'Audit & Assurance',
  })

  const handleSave = () => toast.success('Profile updated')

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: G.secondary }}>Full Name</label>
        <input
          type="text"
          value={form.full_name}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors"
          style={{ borderColor: G.border, color: G.primary, background: G.white }}
          onFocus={e => (e.target.style.borderColor = G.primary)}
          onBlur={e => (e.target.style.borderColor = G.border)}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: G.secondary }}>Email</label>
        <input
          type="email"
          value={user?.email ?? ''}
          readOnly
          className="w-full rounded-xl border px-3 py-2 text-sm"
          style={{ borderColor: G.border, color: G.muted, background: G.canvas, cursor: 'not-allowed' }}
        />
        <p className="mt-1 text-[10px]" style={{ color: G.muted }}>Email cannot be changed</p>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: G.secondary }}>Mobile</label>
        <input
          type="tel"
          value={form.mobile}
          onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors"
          style={{ borderColor: G.border, color: G.primary, background: G.white }}
          onFocus={e => (e.target.style.borderColor = G.primary)}
          onBlur={e => (e.target.style.borderColor = G.border)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: G.secondary }}>Designation</label>
          <input
            type="text"
            value={form.designation}
            onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors"
            style={{ borderColor: G.border, color: G.primary, background: G.white }}
            onFocus={e => (e.target.style.borderColor = G.primary)}
            onBlur={e => (e.target.style.borderColor = G.border)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: G.secondary }}>Department</label>
          <input
            type="text"
            value={form.department}
            onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors"
            style={{ borderColor: G.border, color: G.primary, background: G.white }}
            onFocus={e => (e.target.style.borderColor = G.primary)}
            onBlur={e => (e.target.style.borderColor = G.border)}
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        className="w-full rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: G.primary, color: G.white }}
      >
        Save Changes
      </button>
    </div>
  )
}

// ─── Password Tab ──────────────────────────────────────────
function PasswordTab() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const strength = passwordStrength(form.next)

  const handleSubmit = () => {
    if (!form.current || !form.next || !form.confirm) {
      toast.error('Please fill all fields')
      return
    }
    if (form.next !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    toast.success('Password updated successfully')
    setForm({ current: '', next: '', confirm: '' })
  }

  return (
    <div className="space-y-5">
      {(['current', 'next', 'confirm'] as const).map((field, i) => (
        <div key={field}>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: G.secondary }}>
            {i === 0 ? 'Current Password' : i === 1 ? 'New Password' : 'Confirm New Password'}
          </label>
          <input
            type="password"
            value={form[field]}
            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors"
            style={{ borderColor: G.border, color: G.primary, background: G.white }}
            onFocus={e => (e.target.style.borderColor = G.primary)}
            onBlur={e => (e.target.style.borderColor = G.border)}
          />
        </div>
      ))}

      {/* Strength bar */}
      {form.next && (
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-semibold" style={{ color: G.secondary }}>Password Strength</span>
            <span className="text-[10px] font-bold" style={{ color: strength.color }}>{strength.label}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: G.border }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${strength.pct}%`, background: strength.color }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="w-full rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: G.primary, color: G.white }}
      >
        Update Password
      </button>
    </div>
  )
}

// ─── Sessions Tab ──────────────────────────────────────────
const MOCK_SESSIONS = [
  { id: 1, browser: 'Chrome', os: 'Windows', location: 'Mumbai, IN', last_active: 'Just now', current: true },
  { id: 2, browser: 'Mobile Safari', os: 'iPhone', location: 'New Delhi, IN', last_active: '2 hours ago', current: false },
  { id: 3, browser: 'Firefox', os: 'MacOS', location: 'Bengaluru, IN', last_active: 'Yesterday', current: false },
]

function SessionsTab() {
  const [sessions, setSessions] = useState(MOCK_SESSIONS)

  const revoke = (id: number) => {
    setSessions(s => s.filter(x => x.id !== id))
    toast.warning('Session revoked')
  }

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: G.secondary }}>
        These are the devices that are currently signed in to your account.
      </p>
      {sessions.map(s => (
        <div
          key={s.id}
          className="flex items-start justify-between rounded-xl p-3"
          style={{ border: `1px solid ${G.border}`, background: s.current ? '#F0FDF4' : G.canvas }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
              style={{ background: G.white, border: `1px solid ${G.border}` }}
            >
              <Monitor className="h-4 w-4" style={{ color: G.muted }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: G.primary }}>
                  {s.browser} · {s.os}
                </p>
                {s.current && (
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                    style={{ background: '#DCFCE7', color: '#16A34A' }}>
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: G.secondary }}>{s.location}</p>
              <p className="text-[10px] mt-0.5" style={{ color: G.muted }}>Last active: {s.last_active}</p>
            </div>
          </div>
          {!s.current && (
            <button
              onClick={() => revoke(s.id)}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
              onMouseLeave={e => (e.currentTarget.style.background = '#FEF2F2')}
            >
              Revoke
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Notification Preferences Tab ─────────────────────────
const NOTIF_TYPES = [
  { id: 'deadlines',    label: 'Deadline Reminders'       },
  { id: 'assignments',  label: 'Assignment Notifications' },
  { id: 'extensions',   label: 'Extension Requests'       },
  { id: 'documents',    label: 'Document Uploads'         },
  { id: 'notices',      label: 'Notice Alerts'            },
  { id: 'system',       label: 'System Updates'           },
]

type NotifPrefs = Record<string, { email: boolean; whatsapp: boolean }>

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotifPrefs>(() =>
    Object.fromEntries(NOTIF_TYPES.map(t => [t.id, { email: true, whatsapp: false }]))
  )

  const toggle = (id: string, channel: 'email' | 'whatsapp') =>
    setPrefs(p => ({ ...p, [id]: { ...p[id], [channel]: !p[id][channel] } }))

  return (
    <div className="space-y-4">
      <div
        className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 pb-2 text-[10px] font-bold uppercase"
        style={{ color: G.muted, borderBottom: `1px solid ${G.border}` }}
      >
        <span>Notification Type</span>
        <span className="text-center">In-App</span>
        <span className="text-center">Email</span>
        <span className="text-center">WhatsApp</span>
      </div>

      {NOTIF_TYPES.map(nt => (
        <div
          key={nt.id}
          className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 py-1"
        >
          <span className="text-sm font-medium" style={{ color: G.primary }}>{nt.label}</span>

          {/* In-App — always on, locked */}
          <div className="flex justify-center">
            <input type="checkbox" checked readOnly
              className="h-4 w-4 accent-slate-900 cursor-not-allowed opacity-50" />
          </div>

          {/* Email */}
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={prefs[nt.id].email}
              onChange={() => toggle(nt.id, 'email')}
              className="h-4 w-4 accent-slate-900 cursor-pointer"
            />
          </div>

          {/* WhatsApp */}
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={prefs[nt.id].whatsapp}
              onChange={() => toggle(nt.id, 'whatsapp')}
              className="h-4 w-4 accent-slate-900 cursor-pointer"
            />
          </div>
        </div>
      ))}

      <div className="pt-2" style={{ borderTop: `1px solid ${G.border}` }}>
        <button
          onClick={() => toast.success('Notification preferences saved')}
          className="w-full rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: G.primary, color: G.white }}
        >
          Save Preferences
        </button>
      </div>
    </div>
  )
}

// ─── Main Modal ────────────────────────────────────────────
export function ProfileSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative flex w-full max-w-2xl overflow-hidden rounded-2xl"
        style={{ background: G.white, border: `1px solid ${G.border}`, boxShadow: '0 24px 64px rgba(15,23,42,0.18)', maxHeight: 'calc(100dvh - 64px)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
          style={{ background: G.canvas, border: `1px solid ${G.border}` }}
          onMouseEnter={e => (e.currentTarget.style.background = G.border)}
          onMouseLeave={e => (e.currentTarget.style.background = G.canvas)}
          aria-label="Close settings"
        >
          <X className="h-3.5 w-3.5" style={{ color: G.secondary }} />
        </button>

        {/* Left sidebar */}
        <nav
          className="flex w-52 shrink-0 flex-col py-6 px-3"
          style={{ background: G.canvas, borderRight: `1px solid ${G.border}` }}
        >
          <p className="px-3 mb-4 text-xs font-black uppercase tracking-wider" style={{ color: G.muted }}>Settings</p>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors mb-1"
                style={isActive
                  ? { background: G.primary, color: G.white }
                  : { color: G.secondary, background: 'transparent' }
                }
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = G.border }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span className="leading-snug">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-base font-bold mb-5" style={{ color: G.primary }}>
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>

            {activeTab === 'profile'       && <ProfileTab />}
            {activeTab === 'password'      && <PasswordTab />}
            {activeTab === 'sessions'      && <SessionsTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
          </div>
        </div>
      </div>
    </div>
  )
}
