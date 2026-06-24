import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Search, Plus, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { clientsApi } from '@/shared/api/clients'
import { mockComplianceApi } from '@/mock/api'
import type { Client } from '@/shared/types'
import { G, GrayKpi, PageHeader, DarkBtn, TabBar } from '@/shared/components/GrayKpi'

function ClientCard({ client, score }: { client: Client; score?: number }) {
  const navigate = useNavigate()
  const modules = [client.gst_enabled && 'GST', client.tds_enabled && 'TDS', client.audit_enabled && 'Audit'].filter(Boolean) as string[]
  return (
    <div
      className="rounded-2xl p-5 cursor-pointer transition-all group"
      style={{ background: G.white, border: `1px solid ${G.border}`, boxShadow: '0 1px 3px 0 rgba(15,23,42,0.06)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px 0 rgba(15,23,42,0.10)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = G.border; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px 0 rgba(15,23,42,0.06)' }}
      onClick={() => navigate(`/clients/${client.id}`)}
      role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/clients/${client.id}`)}
      aria-label={`View ${client.legal_name}`}
    >
      <div className="flex items-start gap-3 mb-4">
        {/* Initials avatar — gray */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
          style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.primary }}>
          {client.legal_name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate" style={{ color: G.primary }}>{client.legal_name}</p>
          {client.trade_name && <p className="text-xs truncate" style={{ color: G.secondary }}>{client.trade_name}</p>}
          <p className="text-[10px] font-mono mt-0.5" style={{ color: G.icon }}>{client.pan}</p>
        </div>
        {/* Compliance score — number only, no color block */}
        {score !== undefined && (
          <p className="text-sm font-bold shrink-0 tabular-nums"
            style={{ color: score >= 85 ? '#166534' : score >= 70 ? '#92400E' : '#991B1B' }}>
            {score}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {modules.map(m => (
          <span key={m} className="rounded-full text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary, padding: '2px 8px' }}>
            {m}
          </span>
        ))}
        {!client.is_active && (
          <span className="rounded-full text-[10px] font-semibold uppercase"
            style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.icon, padding: '2px 8px' }}>
            Inactive
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        {[
          { label: 'Assigned CA', value: client.assigned_admin?.full_name ?? '—' },
          { label: 'Article', value: client.assigned_article?.full_name ?? '—' },
          { label: 'Contact', value: client.contact_name },
          { label: 'State', value: client.state ?? '—' },
        ].map(item => (
          <div key={item.label}>
            <p style={{ color: G.icon }}>{item.label}</p>
            <p className="font-medium truncate" style={{ color: G.primary }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold" style={{ color: client.is_active ? '#166534' : G.icon }}>
          ● {client.is_active ? 'Active' : 'Inactive'}
        </span>
        <span className="text-xs font-semibold flex items-center gap-1" style={{ color: '#0584C7' }}>
          View Details <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  )
}

export function ClientsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active')

  const { data: clients = [], isLoading } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.list().then(r => r.data) })
  const { data: health } = useQuery({ queryKey: ['compliance-health'], queryFn: () => mockComplianceApi.health().then(r => r.data) })

  const scoreMap = Object.fromEntries((health?.client_scores ?? []).map((s: any) => [s.client_id, s.score]))

  const filtered = (clients as Client[]).filter(c => {
    const matchSearch = c.legal_name.toLowerCase().includes(search.toLowerCase()) || c.pan?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'active' && c.is_active) || (filter === 'inactive' && !c.is_active)
    return matchSearch && matchFilter
  })

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto" style={{ background: G.canvas }}>
      <PageHeader title="Client Management" sub={`${(clients as Client[]).filter(c => c.is_active).length} active clients`}>
        <DarkBtn onClick={() => navigate('/clients/new')}><Plus className="h-3.5 w-3.5" />Onboard Client</DarkBtn>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <GrayKpi label="Total Clients" value={(clients as Client[]).length} icon={Briefcase} sub="All firms" />
        <GrayKpi label="Active" value={(clients as Client[]).filter(c => c.is_active).length} icon={CheckCircle2} sub="Currently engaged" />
        <GrayKpi label="Inactive" value={(clients as Client[]).filter(c => !c.is_active).length} icon={AlertTriangle} sub="On hold" />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: G.icon }} />
          <input
            type="search" placeholder="Search by name or PAN..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl pl-9 pr-4 py-2 text-sm"
            style={{ background: G.white, border: `1px solid ${G.border}`, color: G.primary }}
          />
        </div>
        <TabBar tabs={['all', 'active', 'inactive']} active={filter} onChange={setFilter} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="shimmer rounded-2xl h-52" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <Briefcase className="h-12 w-12" style={{ color: G.icon }} />
          <p className="text-sm" style={{ color: G.secondary }}>No clients found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(client => <ClientCard key={client.id} client={client} score={scoreMap[client.id]} />)}
        </div>
      )}
    </div>
  )
}
