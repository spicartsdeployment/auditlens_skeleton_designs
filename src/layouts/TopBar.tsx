import {
  Bell, Menu, Search, Sun, Moon, Plus,
  FileText, CheckSquare, Users, Briefcase, FolderOpen,
  ShieldAlert, BarChart3, ReceiptText, Scale, Upload,
  ChevronDown, LogOut, Settings, UserPlus, Info,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { format } from 'date-fns'
import { useAuthStore } from '@/shared/hooks/useAuthStore'
import { useThemeStore } from '@/shared/hooks/useThemeStore'
import { usePermission } from '@/shared/hooks/usePermission'
import { useMobileMenuStore } from './MobileNav'
import { authApi } from '@/shared/api/auth'
import { toast } from 'sonner'
import { cn } from '@/shared/components/cn'
import { ProfileSettingsModal } from '@/features/settings/ProfileSettingsModal'

interface TopBarProps { alertCount?: number }

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'deadline', title: 'GSTR-1 Due Tomorrow', body: 'Sunrise Textiles · May 2026', time: '2h ago', read: false },
  { id: 2, type: 'assignment', title: 'Task Assigned to You', body: 'TDS Return 26Q · Sneha Iyer', time: '4h ago', read: false },
  { id: 3, type: 'approval', title: 'Extension Request Pending', body: 'Rohan Verma · BlueSky Tech Audit', time: '6h ago', read: false },
  { id: 4, type: 'alert', title: 'Notice Response Overdue', body: 'Green Pharma · ITO Notice', time: '1d ago', read: true },
  { id: 5, type: 'system', title: 'Document Uploaded', body: 'Redwood Constructions · Balance Sheet', time: '1d ago', read: true },
  { id: 6, type: 'deadline', title: 'TDS Q4 Filing Due in 3 days', body: 'Apex Auto Parts · 26Q', time: '2d ago', read: true },
]

const SA_ACTIONS = [
  { label: 'Onboard Client',   icon: Briefcase,   path: '/clients/new', desc: 'Onboard a new client' },
  { label: 'Add User',         icon: Users,        path: '/users',     desc: 'Invite team member' },
  { label: 'Add Notice',       icon: ShieldAlert,  path: '/notices',   desc: 'Log a compliance notice' },
  { label: 'View Reports',     icon: BarChart3,    path: '/reports',   desc: 'Firm analytics' },
  { label: 'Upload Document',  icon: Upload,       path: '/documents', desc: 'Upload to repository' },
]
const ADMIN_ACTIONS = [
  { label: 'New GST Filing',   icon: FileText,     path: '/gst',       desc: 'Start a GST return' },
  { label: 'New TDS Filing',   icon: ReceiptText,  path: '/tds',       desc: 'Start a TDS return' },
  { label: 'Create Audit',     icon: Scale,        path: '/audit',     desc: 'New audit engagement' },
  { label: 'Assign Task',      icon: CheckSquare,  path: '/tasks',     desc: 'Assign task to article' },
  { label: 'Onboard Client',   icon: Briefcase,    path: '/clients/new', desc: 'Onboard a new client' },
  { label: 'Upload Document',  icon: Upload,       path: '/documents', desc: 'Upload client document' },
]
const ARTICLE_ACTIONS = [
  { label: 'Upload Document',  icon: Upload,       path: '/documents', desc: 'Upload client document' },
  { label: 'My Tasks',         icon: CheckSquare,  path: '/tasks',     desc: 'Your assigned tasks' },
  { label: 'Check Filings',    icon: FileText,     path: '/workspace', desc: 'Review filing status' },
]

export function TopBar({ alertCount = 0 }: TopBarProps) {
  const user = useAuthStore(s => s.user)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const toggleMenu = useMobileMenuStore(s => s.toggle)
  const { theme, toggle: toggleTheme } = useThemeStore()
  const { isSuperAdmin, isAdmin } = usePermission()
  const navigate = useNavigate()
  const [quickOpen, setQuickOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [readIds, setReadIds] = useState<number[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read && !readIds.includes(n.id)).length

  const notifIcon = (type: string) => {
    if (type === 'assignment') return UserPlus
    if (type === 'approval') return CheckSquare
    if (type === 'system') return Info
    return Bell
  }

  const markAllRead = () => setReadIds(MOCK_NOTIFICATIONS.map(n => n.id))
  const markRead = (id: number) => setReadIds(prev => prev.includes(id) ? prev : [...prev, id])

  const actions = isSuperAdmin() ? SA_ACTIONS : isAdmin() ? ADMIN_ACTIONS : ARTICLE_ACTIONS
  const roleName = user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin CA' : 'Article'

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const greetEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙'

  const handleLogout = async () => {
    setProfileOpen(false)
    try { await authApi.logout() } finally {
      clearAuth(); navigate('/login'); toast.success('Logged out')
    }
  }

  return (
    <>
    <header
      className="flex h-12 shrink-0 items-center justify-between rounded-2xl border px-4 shadow-sm gap-3"
      style={{ background: 'var(--glass-bg-strong)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor: 'var(--color-border)' }}
      role="banner"
    >
      {/* ── Left: mobile menu + greeting card ───────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button */}
        <button
          className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
          onClick={toggleMenu} aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Mobile logo */}
        <span className="lg:hidden text-sm font-black text-slate-900 tracking-tight shrink-0">AuditLens</span>

        {/* Greeting card — desktop only */}
        {user && (
          <div className="hidden lg:flex items-center gap-2 min-w-0">
            <span className="text-base leading-none">{greetEmoji}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight truncate" style={{ color: '#0F172A' }}>
                {greeting}, {user.full_name.split(' ')[0]}
              </p>
              <p className="text-[10px] leading-tight" style={{ color: '#94A3B8' }}>
                {format(now, 'EEE, d MMM yyyy')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: search + quick actions + theme + bell + user ── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Search — desktop, moved to right */}
        <button
          className="hidden lg:flex items-center gap-2 h-8 w-48 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400 hover:border-slate-300 hover:bg-white transition-all"
          onClick={() => toast.info('Search coming soon')}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>Search…</span>
          <kbd className="ml-auto text-[10px] border border-slate-200 rounded px-1 text-slate-300">⌘K</kbd>
        </button>

        {/* Quick Actions dropdown */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setQuickOpen(o => !o)}
            className="flex items-center gap-1.5 h-8 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Quick Actions
            <ChevronDown className={cn('h-3 w-3 transition-transform', quickOpen && 'rotate-180')} />
          </button>

          {quickOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setQuickOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-slate-200 bg-white/95 shadow-dropdown overflow-hidden"
                style={{ backdropFilter: 'blur(12px)' }}>
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">Quick Actions</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{roleName} workspace</p>
                </div>
                <div className="py-1">
                  {actions.map(item => (
                    <button key={item.label}
                      className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                      onClick={() => { navigate(item.path); setQuickOpen(false) }}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <item.icon className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                        <p className="text-[10px] text-slate-400">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme toggle */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon style={{ width: 15, height: 15 }} /> : <Sun style={{ width: 15, height: 15 }} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            className="relative flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            onClick={() => setNotifOpen(o => !o)}
            aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
          >
            <Bell style={{ width: 15, height: 15 }} aria-hidden />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-dropdown overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-800">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white px-1">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Mark all read
                  </button>
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {MOCK_NOTIFICATIONS.map(n => {
                    const isRead = n.read || readIds.includes(n.id)
                    const Icon = notifIcon(n.type)
                    return (
                      <button
                        key={n.id}
                        className="relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors border-b border-slate-50 hover:bg-slate-50"
                        style={{ background: isRead ? '#F8FAFC' : '#FFFFFF' }}
                        onClick={() => markRead(n.id)}
                      >
                        {!isRead && (
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-500" />
                        )}
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 mt-0.5">
                          <Icon className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 leading-tight">{n.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{n.body}</p>
                        </div>
                        <span className="shrink-0 text-[10px] text-slate-400 whitespace-nowrap mt-0.5">{n.time}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 py-2.5 text-center">
                  <button
                    className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                    onClick={() => { setNotifOpen(false); navigate('/workspace') }}
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 mx-0.5" aria-hidden />

        {/* User pill + dropdown with logout */}
        {user && (
          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-slate-50 transition-colors"
              onClick={() => setProfileOpen(o => !o)}
              aria-label="User menu"
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-[10px] font-black shadow-sm"
                style={{ background: '#0F172A' }}
              >
                {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block leading-none text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user.full_name.split(' ')[0]}</p>
                <p className="text-[9px] text-slate-400 leading-tight">{roleName}</p>
              </div>
              <ChevronDown className={cn('h-3 w-3 text-slate-400 transition-transform hidden sm:block', profileOpen && 'rotate-180')} />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl border border-slate-200 bg-white shadow-dropdown overflow-hidden">
                  {/* Profile header */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-xs font-black"
                        style={{ background: '#0F172A' }}>
                        {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.full_name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <span className="mt-2 inline-block rounded-full text-[10px] font-semibold px-2 py-0.5"
                      style={{ background: '#F1F5F9', color: '#475569' }}>{roleName}</span>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      onClick={() => { setSettingsOpen(true); setProfileOpen(false) }}
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      Settings
                    </button>
                    <div className="my-1 h-px bg-slate-100" />
                    <button
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
    <ProfileSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
