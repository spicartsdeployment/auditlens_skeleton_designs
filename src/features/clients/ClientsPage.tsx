import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, Search, Plus, ChevronRight, CheckCircle2,
  AlertTriangle, LayoutGrid, List,
} from 'lucide-react'
import { clientsApi } from '@/shared/api/clients'
import { mockComplianceApi } from '@/mock/api'
import type { Client } from '@/shared/types'
import { G, GrayKpi, PageHeader, DarkBtn, TabBar } from '@/shared/components/GrayKpi'

// ─── Folder (Card) View ──────────────────────────────────────────────────────
function ClientCard({ client, score }: { client: Client; score?: number }) {
  const navigate = useNavigate()
  const modules = [
    client.gst_enabled && 'GST',
    client.tds_enabled && 'TDS',
    client.audit_enabled && 'Audit',
  ].filter(Boolean) as string[]

  return (
    <div
      className="rounded-2xl p-5 cursor-pointer transition-all group"
      style={{
        background: G.white,
        border: `1px solid ${G.border}`,
        boxShadow: '0 1px 3px 0 rgba(15,23,42,0.06)',
      }}
      onMouseEnter={e => {
        ; (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1'
          ; (e.currentTarget as HTMLElement).style.boxShadow =
            '0 4px 12px 0 rgba(15,23,42,0.10)'
      }}
      onMouseLeave={e => {
        ; (e.currentTarget as HTMLElement).style.borderColor = G.border
          ; (e.currentTarget as HTMLElement).style.boxShadow =
            '0 1px 3px 0 rgba(15,23,42,0.06)'
      }}
      onClick={() => navigate(`/clients/${client.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/clients/${client.id}`)}
      aria-label={`View ${client.legal_name}`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
          style={{
            background: G.canvas,
            border: `1px solid ${G.border}`,
            color: G.primary,
          }}
        >
          {client.legal_name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate" style={{ color: G.primary }}>
            {client.legal_name}
          </p>
          {client.trade_name && (
            <p className="text-xs truncate" style={{ color: G.secondary }}>
              {client.trade_name}
            </p>
          )}
          <p
            className="text-[10px] font-mono mt-0.5"
            style={{ color: G.icon }}
          >
            {client.pan}
          </p>
        </div>
        {score !== undefined && (
          <p
            className="text-sm font-bold shrink-0 tabular-nums"
            style={{
              color:
                score >= 85
                  ? '#166534'
                  : score >= 70
                    ? '#92400E'
                    : '#991B1B',
            }}
          >
            {score}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {modules.map(m => (
          <span
            key={m}
            className="rounded-full text-[10px] font-semibold uppercase tracking-wide"
            style={{
              background: G.canvas,
              border: `1px solid ${G.border}`,
              color: G.secondary,
              padding: '2px 8px',
            }}
          >
            {m}
          </span>
        ))}
        {!client.is_active && (
          <span
            className="rounded-full text-[10px] font-semibold uppercase"
            style={{
              background: G.canvas,
              border: `1px solid ${G.border}`,
              color: G.icon,
              padding: '2px 8px',
            }}
          >
            Inactive
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        {[
          {
            label: 'Assigned CA',
            value: client.assigned_admin?.full_name ?? '—',
          },
          {
            label: 'Article',
            value: client.assigned_article?.full_name ?? '—',
          },
          { label: 'Contact', value: client.contact_name },
          { label: 'State', value: client.state ?? '—' },
        ].map(item => (
          <div key={item.label}>
            <p style={{ color: G.icon }}>{item.label}</p>
            <p
              className="font-medium truncate"
              style={{ color: G.primary }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold"
          style={{ color: client.is_active ? '#166534' : G.icon }}
        >
          ● {client.is_active ? 'Active' : 'Inactive'}
        </span>
        <span
          className="text-xs font-semibold flex items-center gap-1"
          style={{ color: '#0584C7' }}
        >
          View Details <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  )
}

// ─── List View Row ───────────────────────────────────────────────────────────
function ClientRow({ client, score }: { client: Client; score?: number }) {
  const navigate = useNavigate()
  const modules = [
    client.gst_enabled && 'GST',
    client.tds_enabled && 'TDS',
    client.audit_enabled && 'Audit',
  ].filter(Boolean) as string[]

  return (
    <tr
      className="cursor-pointer transition-colors"
      style={{ borderBottom: `1px solid ${G.border}` }}
      onClick={() => navigate(`/clients/${client.id}`)}
      onMouseEnter={e =>
        ((e.currentTarget as HTMLElement).style.background = G.canvas)
      }
      onMouseLeave={e =>
        ((e.currentTarget as HTMLElement).style.background = 'transparent')
      }
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/clients/${client.id}`)}
      aria-label={`View ${client.legal_name}`}
    >
      {/* Client Name + PAN */}
      <td className="px-3 py-2.5" style={{ maxWidth: 180 }}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
            style={{
              background: G.canvas,
              border: `1px solid ${G.border}`,
              color: G.primary,
            }}
          >
            {client.legal_name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-semibold truncate"
              title={client.legal_name}
              style={{ color: G.primary, maxWidth: 140 }}
            >
              {client.legal_name}
            </p>
            <p
              className="text-[9px] font-mono"
              style={{ color: G.icon }}
            >
              {client.pan}
            </p>
          </div>
        </div>
      </td>

      {/* Trade Name */}
      <td className="px-3 py-2.5 hidden md:table-cell" style={{ maxWidth: 130 }}>
        <span
          className="text-xs truncate block"
          title={client.trade_name || '—'}
          style={{ color: G.secondary, maxWidth: 120 }}
        >
          {client.trade_name || '—'}
        </span>
      </td>

      {/* Modules */}
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap gap-1">
          {modules.map(m => (
            <span
              key={m}
              className="rounded-full text-[8px] font-semibold uppercase tracking-wide"
              style={{
                background: G.canvas,
                border: `1px solid ${G.border}`,
                color: G.secondary,
                padding: '1px 5px',
              }}
            >
              {m}
            </span>
          ))}
          {modules.length === 0 && (
            <span className="text-[10px]" style={{ color: G.icon }}>
              —
            </span>
          )}
        </div>
      </td>

      {/* Assigned CA */}
      <td className="px-3 py-2.5 hidden lg:table-cell" style={{ maxWidth: 120 }}>
        <span
          className="text-xs truncate block"
          title={client.assigned_admin?.full_name ?? '—'}
          style={{ color: G.secondary, maxWidth: 110 }}
        >
          {client.assigned_admin?.full_name ?? '—'}
        </span>
      </td>

      {/* Article */}
      <td className="px-3 py-2.5 hidden lg:table-cell" style={{ maxWidth: 120 }}>
        <span
          className="text-xs truncate block"
          title={client.assigned_article?.full_name ?? '—'}
          style={{ color: G.secondary, maxWidth: 110 }}
        >
          {client.assigned_article?.full_name ?? '—'}
        </span>
      </td>

      {/* Contact */}
      <td className="px-3 py-2.5 hidden xl:table-cell" style={{ maxWidth: 120 }}>
        <span
          className="text-xs truncate block"
          title={client.contact_name}
          style={{ color: G.secondary, maxWidth: 110 }}
        >
          {client.contact_name}
        </span>
      </td>

      {/* State */}
      <td className="px-3 py-2.5 hidden xl:table-cell">
        <span className="text-xs" style={{ color: G.secondary }}>
          {client.state ?? '—'}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-2.5">
        <span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
          style={{
            background: client.is_active ? '#F0FDF4' : G.canvas,
            color: client.is_active ? '#166534' : G.icon,
            border: `1px solid ${client.is_active ? '#BBF7D0' : G.border}`,
          }}
        >
          <span
            className="h-1 w-1 rounded-full"
            style={{
              background: client.is_active ? '#16A34A' : G.icon,
            }}
          />
          {client.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>

      {/* Score */}
      <td className="px-3 py-2.5">
        {score !== undefined ? (
          <span
            className="text-xs font-bold tabular-nums"
            style={{
              color:
                score >= 85
                  ? '#166534'
                  : score >= 70
                    ? '#92400E'
                    : '#991B1B',
            }}
          >
            {score}
          </span>
        ) : (
          <span className="text-[10px]" style={{ color: G.icon }}>
            —
          </span>
        )}
      </td>

      {/* Action */}
      <td className="px-3 py-2.5">
        <span
          className="text-[10px] font-semibold flex items-center gap-0.5 whitespace-nowrap"
          style={{ color: '#0584C7' }}
        >
          View <ChevronRight className="h-2.5 w-2.5" />
        </span>
      </td>
    </tr>
  )
}

// ─── View Toggle Component ───────────────────────────────────────────────────
type ViewMode = 'folder' | 'list'

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode
  onChange: (v: ViewMode) => void
}) {
  return (
    <div
      className="flex rounded-xl overflow-hidden shrink-0"
      style={{ border: `1px solid ${G.border}`, background: G.white }}
    >
      <button
        onClick={() => onChange('folder')}
        className="flex items-center justify-center h-[34px] w-[34px] transition-all"
        style={{
          background: view === 'folder' ? '#0F172A' : 'transparent',
          color: view === 'folder' ? '#FFFFFF' : G.icon,
        }}
        aria-label="Folder view"
        title="Folder view"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onChange('list')}
        className="flex items-center justify-center h-[34px] w-[34px] transition-all"
        style={{
          background: view === 'list' ? '#0F172A' : 'transparent',
          color: view === 'list' ? '#FFFFFF' : G.icon,
          borderLeft: `1px solid ${G.border}`,
        }}
        aria-label="List view"
        title="List view"
      >
        <List className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function ClientsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [viewMode, setViewMode] = useState<ViewMode>('folder')

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list().then(r => r.data),
  })
  const { data: health } = useQuery({
    queryKey: ['compliance-health'],
    queryFn: () => mockComplianceApi.health().then(r => r.data),
  })

  const scoreMap = Object.fromEntries(
    (health?.client_scores ?? []).map((s: any) => [s.client_id, s.score]),
  )

  const filtered = (clients as Client[]).filter(c => {
    const matchSearch =
      c.legal_name.toLowerCase().includes(search.toLowerCase()) ||
      c.pan?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && c.is_active) ||
      (filter === 'inactive' && !c.is_active)
    return matchSearch && matchFilter
  })

  return (
    <div
      className="p-4 md:p-6 max-w-[1400px] mx-auto"
      style={{ background: G.canvas }}
    >
      <PageHeader title="Client Management">
        <DarkBtn onClick={() => navigate('/clients/new')}>
          <Plus className="h-3.5 w-3.5" />
          Onboard Client
        </DarkBtn>
        <DarkBtn onClick={() => navigate('/clients/new')}>
          <Plus className="h-3.5 w-3.5" />
          Import Client Template
        </DarkBtn>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <GrayKpi
          label="Total Clients"
          value={(clients as Client[]).length}
          icon={Briefcase}
          sub="All firms"
        />
        <GrayKpi
          label="Active"
          value={(clients as Client[]).filter(c => c.is_active).length}
          icon={CheckCircle2}
          sub="Currently engaged"
        />
        <GrayKpi
          label="Inactive"
          value={(clients as Client[]).filter(c => !c.is_active).length}
          icon={AlertTriangle}
          sub="On hold"
        />
      </div>

      {/* Search + Filter + View Toggle — all in one row, search narrower */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-60 shrink-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
            style={{ color: G.icon }}
          />
          <input
            type="search"
            placeholder="Search name or PAN…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl pl-8 pr-3 py-[7px] text-xs"
            style={{
              background: G.white,
              border: `1px solid ${G.border}`,
              color: G.primary,
            }}
          />
        </div>
        <div className="flex-1" />
        <TabBar
          tabs={['all', 'active', 'inactive']}
          active={filter}
          onChange={setFilter}
        />
        <ViewToggle view={viewMode} onChange={setViewMode} />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="shimmer rounded-2xl h-52" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <Briefcase className="h-12 w-12" style={{ color: G.icon }} />
          <p className="text-sm" style={{ color: G.secondary }}>
            No clients found
          </p>
        </div>
      ) : viewMode === 'folder' ? (
        /* ── FOLDER (GRID) VIEW ── */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              score={scoreMap[client.id]}
            />
          ))}
        </div>
      ) : (
        /* ── LIST (TABLE) VIEW ── */
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: G.white,
            border: `1px solid ${G.border}`,
            boxShadow: '0 1px 3px 0 rgba(15,23,42,0.06)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '18%' }} />   {/* Client */}
                <col className="hidden md:table-column" style={{ width: '12%' }} /> {/* Trade Name */}
                <col style={{ width: '10%' }} />   {/* Modules */}
                <col className="hidden lg:table-column" style={{ width: '12%' }} /> {/* Assigned CA */}
                <col className="hidden lg:table-column" style={{ width: '12%' }} /> {/* Article */}
                <col className="hidden xl:table-column" style={{ width: '10%' }} /> {/* Contact */}
                <col className="hidden xl:table-column" style={{ width: '7%' }} />  {/* State */}
                <col style={{ width: '7%' }} />    {/* Status */}
                <col style={{ width: '5%' }} />    {/* Score */}
                <col style={{ width: '5%' }} />    {/* Action */}
              </colgroup>
              <thead>
                <tr style={{ background: G.canvas }}>
                  {[
                    { label: 'Client', className: '' },
                    { label: 'Trade Name', className: 'hidden md:table-cell' },
                    { label: 'Modules', className: '' },
                    { label: 'Assigned CA', className: 'hidden lg:table-cell' },
                    { label: 'Article', className: 'hidden lg:table-cell' },
                    { label: 'Contact', className: 'hidden xl:table-cell' },
                    { label: 'State', className: 'hidden xl:table-cell' },
                    { label: 'Status', className: '' },
                    { label: 'Score', className: '' },
                    { label: '', className: '' },
                  ].map((h, i) => (
                    <th
                      key={i}
                      className={`text-left px-3 py-2.5 text-[9px] font-semibold uppercase tracking-wider border-b whitespace-nowrap ${h.className}`}
                      style={{
                        color: G.secondary,
                        borderColor: G.border,
                      }}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    score={scoreMap[client.id]}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {/* <div
            className="px-4 py-2 flex items-center justify-between"
            style={{
              background: G.canvas,
              borderTop: `1px solid ${G.border}`,
            }}
          >
            <span
              className="text-[10px] font-medium"
              style={{ color: G.icon }}
            >
              Showing {filtered.length} of {(clients as Client[]).length}{' '}
              clients
            </span>
            <span
              className="text-[10px] font-medium"
              style={{ color: G.secondary }}
            >
              {filter === 'all'
                ? 'All'
                : filter === 'active'
                  ? 'Active only'
                  : 'Inactive only'}
            </span>
          </div> */}
        </div>
      )}
    </div>
  )
}