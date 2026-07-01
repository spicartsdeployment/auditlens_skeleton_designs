import { useState } from 'react'
import { X, User, Lock, Monitor, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/shared/hooks/useAuthStore'

const G = {
  canvas: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#94A3B8',
  secondary: '#475569',
  primary: '#0F172A',
  accent: '#0584C7',
} as const

type TabId = 'profile' | 'password' | 'sessions' | 'notifications'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile Information', icon: User },
  { id: 'password', label: 'Change Password', icon: Lock },
  { id: 'sessions', label: 'Active Sessions', icon: Monitor },
  { id: 'notifications', label: 'Notification Preferences', icon: Bell },
]

export function ProfileSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const user = useAuthStore(s => s.user)
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [profile, setProfile] = useState({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
    designation: 'Senior Auditor',
    department: 'Audit & Assurance',
  })

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
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: G.canvas, border: `1px solid ${G.border}` }}
          aria-label="Close settings"
        >
          <X className="h-3.5 w-3.5" style={{ color: G.secondary }} />
        </button>

        <nav className="flex w-52 shrink-0 flex-col py-6 px-3" style={{ background: G.canvas, borderRight: `1px solid ${G.border}` }}>
          <p className="px-3 mb-4 text-xs font-black uppercase tracking-wider" style={{ color: G.muted }}>Settings</p>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium mb-1"
                style={isActive ? { background: G.primary, color: G.white } : { color: G.secondary }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="leading-snug">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-base font-bold mb-5" style={{ color: G.primary }}>
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: G.secondary }}>Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: G.border, color: G.primary, background: G.white }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: G.secondary }}>Email</label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: G.border, color: G.muted, background: G.canvas }}
                />
              </div>
              <button
                type="button"
                onClick={() => toast.success('Profile updated')}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ background: G.primary }}
              >
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'password' && (
            <p className="text-sm" style={{ color: G.secondary }}>Password change form (mock UI).</p>
          )}
          {activeTab === 'sessions' && (
            <p className="text-sm" style={{ color: G.secondary }}>Active sessions list (mock UI).</p>
          )}
          {activeTab === 'notifications' && (
            <p className="text-sm" style={{ color: G.secondary }}>Notification preferences (mock UI).</p>
          )}
        </div>
      </div>
    </div>
  )
}
