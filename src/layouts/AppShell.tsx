import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileBottomNav, MobileDrawer } from './MobileNav'
import { useQuery } from '@tanstack/react-query'
import { alertsApi } from '@/shared/api/alerts'

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', 'unread'],
    queryFn: () => alertsApi.list(true).then((r) => r.data),
    refetchInterval: 60_000,
  })

  return (
    <div className="flex h-dvh overflow-hidden p-3 gap-3" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* Desktop sidebar — collapses/expands */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(o => !o)} />

      {/* Mobile drawer overlay */}
      <MobileDrawer />

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden gap-3">

        {/* Floating topbar */}
        <TopBar alertCount={alerts.length} />

        {/* Content area */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto rounded-3xl pb-20 lg:pb-4"
          tabIndex={-1}
          style={{ backgroundImage: 'linear-gradient(135deg, rgba(5,132,199,0.02) 0%, #f8fafc 50%, rgba(235,245,253,0.4) 100%)' }}
        >
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>
    </div>
  )
}
