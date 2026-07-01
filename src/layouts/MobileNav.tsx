import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, MessageSquare, FileText, X, ReceiptText, Scale, Users, Settings,
  FolderOpen, Cpu,
} from 'lucide-react'
import { cn } from '@/shared/components/cn'
import { usePermission } from '@/shared/hooks/usePermission'
import { create } from 'zustand'

interface MobileMenuStore {
  open: boolean
  toggle: () => void
  close: () => void
}

export const useMobileMenuStore = create<MobileMenuStore>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
}))

const bottomTabs = [
  { to: '/', label: 'Home', icon: LayoutDashboard, screen: 'dashboard' },
  { to: '/clients', label: 'Clients', icon: Briefcase, screen: 'clients' },
  { to: '/workcenter', label: 'Work', icon: Cpu, screen: 'workspace' },
  { to: '/communication', label: 'Comms', icon: MessageSquare, screen: 'communication' },
]

const drawerItems = [
  { to: '/gst', label: 'GST', icon: FileText, screen: 'gst' },
  { to: '/tds', label: 'TDS', icon: ReceiptText, screen: 'tds' },
  { to: '/audit', label: 'Audit', icon: Scale, screen: 'audit' },
  { to: '/documents', label: 'Documents', icon: FolderOpen, screen: 'documents' },
  { to: '/users', label: 'Team', icon: Users, screen: 'users' },
  { to: '/settings', label: 'Settings', icon: Settings, screen: 'subscription' },
]

export function MobileBottomNav() {
  const { canAccess } = usePermission()
  const visibleTabs = bottomTabs.filter((t) => canAccess(t.screen))

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t px-2 pb-safe"
      style={{ background: '#FFFFFF', borderColor: '#E2E8F0' }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      {visibleTabs.map(({ to, label, icon: Icon, screen }) => (
        <NavLink
          key={screen}
          to={to}
          end={to === '/'}
          className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 text-xs font-medium min-h-[56px] min-w-[56px] rounded-lg transition-colors"
          aria-label={label}
        >
          {({ isActive }) => (
            <>
              <Icon className="h-5 w-5" style={{ color: isActive ? '#0F172A' : '#94A3B8' }} aria-hidden />
              <span style={{ color: isActive ? '#0F172A' : '#94A3B8' }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function MobileDrawer() {
  const { open, close } = useMobileMenuStore()
  const { canAccess } = usePermission()
  const visibleItems = drawerItems.filter((t) => canAccess(t.screen))

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden" onClick={close} aria-hidden />
      <aside
        className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col lg:hidden"
        style={{ background: '#FFFFFF', borderRight: '1px solid #E2E8F0' }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900">
              <span className="text-xs font-black text-white">AL</span>
            </div>
            <span className="font-bold text-sm" style={{ color: '#0F172A' }}>AuditLens</span>
          </div>
          <button
            onClick={close}
            className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" style={{ color: '#475569' }} aria-hidden />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {visibleItems.map(({ to, label, icon: Icon, screen }) => (
            <NavLink
              key={screen}
              to={to}
              onClick={close}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium min-h-[44px] transition-colors"
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-4 w-4 shrink-0" style={{ color: isActive ? '#0F172A' : '#94A3B8' }} aria-hidden />
                  <span style={{ color: isActive ? '#0F172A' : '#475569' }}>{label}</span>
                  {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: '#0F172A' }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
