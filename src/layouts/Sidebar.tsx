import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Briefcase, CheckSquare, MessageSquare,
  FileText, ReceiptText, Scale, Settings, Layers, FolderOpen,
  BarChart3, ShieldAlert, ChevronLeft, ChevronRight, Cpu,
} from 'lucide-react'
import { cn } from '@/shared/components/cn'
import { usePermission } from '@/shared/hooks/usePermission'

const NAV_ITEMS = [
  { to: '/',              label: 'Dashboard',     icon: LayoutDashboard, screen: 'dashboard',     group: 'overview' },
  { to: '/workcenter',    label: 'Work Center',   icon: Cpu,             screen: 'workspace',     group: 'overview' },
  { to: '/gst',           label: 'GST',           icon: FileText,        screen: 'gst',           group: 'compliance' },
  { to: '/tds',           label: 'TDS',           icon: ReceiptText,     screen: 'tds',           group: 'compliance' },
  { to: '/audit',         label: 'Audit',         icon: Scale,           screen: 'audit',         group: 'compliance' },
  { to: '/clients',       label: 'Clients',       icon: Briefcase,       screen: 'clients',       group: 'management' },
  { to: '/documents',     label: 'Documents',     icon: FolderOpen,      screen: 'documents',     group: 'management' },
  { to: '/users',         label: 'Team',          icon: Users,           screen: 'users',         group: 'management' },
  { to: '/communication', label: 'Communication', icon: MessageSquare,   screen: 'communication', group: 'tools' },
  { to: '/reports',       label: 'Reports',       icon: BarChart3,       screen: 'reports',       group: 'tools' },
  { to: '/settings',      label: 'Settings',      icon: Settings,        screen: 'subscription',  group: 'system' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { canAccess } = usePermission()
  const visibleItems = NAV_ITEMS.filter(item => canAccess(item.screen))

  const renderItems = () => {
    const elements: React.ReactNode[] = []
    let lastGroup = ''
    visibleItems.forEach((item) => {
      if (item.group !== lastGroup && lastGroup !== '') {
        elements.push(
          <div key={`div-${item.group}`} className="w-full h-px my-1.5" style={{ background: 'rgba(71,85,105,0.35)' }} />
        )
      }
      lastGroup = item.group
      elements.push(
        <li key={item.screen} className="w-full">
          <NavLink
            to={item.to}
            end={item.to === '/'}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            className={({ isActive }) =>
              cn(
                'relative flex items-center rounded-xl transition-all duration-150 w-full',
                collapsed ? 'h-10 w-10 justify-center mx-auto' : 'h-10 px-3 gap-3',
                isActive ? 'nav-active' : 'nav-inactive'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {!collapsed && (
                  <span className="text-xs font-medium truncate leading-none">{item.label}</span>
                )}
                {isActive && collapsed && (
                  <span className="absolute -right-3.5 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-white" />
                )}
              </>
            )}
          </NavLink>
        </li>
      )
    })
    return elements
  }

  return (
    <aside
      className="hidden lg:flex flex-col py-4 my-auto h-[88%] rounded-3xl shrink-0 shadow-sidebar transition-all duration-300"
      style={{
        width: collapsed ? '64px' : '200px',
        background: 'linear-gradient(to bottom, #0f172a, #1e293b, #0f172a)',
        border: '1px solid rgba(71,85,105,0.5)',
        overflow: 'hidden',
      }}
      aria-label="Main navigation"
    >
      {/* Logo + collapse toggle in same row */}
      <div className={cn('flex items-center mb-4 shrink-0 px-3', collapsed ? 'justify-between' : 'gap-2.5')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 shadow-lg border border-slate-700/60">
          <span className="text-xs font-black text-white tracking-tight">AL</span>
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white leading-none truncate">AuditLens</p>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate">CA Practice Suite</p>
          </div>
        )}

        {/* Collapse / expand toggle — icon only, always visible */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand' : 'Collapse'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronLeft className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar px-2.5" role="navigation" aria-label="App navigation">
        <ul className={cn('flex flex-col gap-0.5', collapsed ? 'items-center' : 'items-stretch')}>
          {renderItems()}
        </ul>
      </nav>
    </aside>
  )
}
