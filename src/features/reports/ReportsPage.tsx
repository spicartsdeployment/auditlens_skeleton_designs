import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, Users, Briefcase, Download } from 'lucide-react'
import { mockComplianceApi } from '@/mock/api'
import { toast } from 'sonner'
import { G, PageHeader, OutlineBtn, TabBar, ContentCard } from '@/shared/components/GrayKpi'

/* Chart palette — brand blue + slate family for enterprise look */
const CHART_COLORS = ['#0584C7', '#0F172A', '#475569', '#94A3B8', '#CBD5E1']

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <ContentCard>
      <div className="p-5">
        <p className="text-2xl font-bold tabular-nums" style={{ color: G.primary }}>{value}</p>
        <p className="text-sm font-semibold mt-1" style={{ color: G.primary }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: G.secondary }}>{sub}</p>
      </div>
    </ContentCard>
  )
}

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'firm' | 'client'>('firm')
  const { data: reports } = useQuery({ queryKey: ['reports'], queryFn: () => mockComplianceApi.reports().then(r => r.data) })

  const firm = reports?.firm
  const totalRevenue = firm?.revenue.reduce((a: number, r: any) => a + r.amount, 0) ?? 0
  const compStatus = firm?.compliance_status

  const pieData = compStatus ? [
    { name: 'GST Filed', value: compStatus.gst.filed },
    { name: 'GST Pending', value: compStatus.gst.pending },
    { name: 'TDS Filed', value: compStatus.tds.filed },
    { name: 'TDS Pending', value: compStatus.tds.pending },
  ] : []

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto" style={{ background: G.canvas }}>
      <PageHeader title="Reports" sub="Firm performance and client compliance analytics">
        <OutlineBtn onClick={() => toast.info('Exporting report...')}><Download className="h-4 w-4" />Export</OutlineBtn>
      </PageHeader>

      <TabBar tabs={['firm', 'client']} active={activeTab} onChange={t => setActiveTab(t as 'firm' | 'client')} />

      {activeTab === 'firm' && firm && (
        <div className="space-y-6">
          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Revenue (YTD)" value={`₹${(totalRevenue / 100000).toFixed(1)}L`} sub="Jan – Jun 2026" />
            <StatCard label="Active Clients" value="5" sub="37 PANs registered" />
            <StatCard label="Avg Compliance Score" value="81%" sub="Firm-wide health" />
            <StatCard label="Open Issues" value="7" sub="Obs + notices" />
          </div>

          {/* Revenue chart */}
          <ContentCard>
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold" style={{ color: G.primary }}>Monthly Revenue — FY 2025-26</h3>
                <TrendingUp className="h-4 w-4" style={{ color: G.icon }} />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={firm.revenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: G.secondary }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: G.secondary }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: any) => [`₹${(v / 1000).toFixed(0)}K`, 'Revenue']}
                    contentStyle={{ borderRadius: 12, border: `1px solid ${G.border}`, boxShadow: '0 4px 12px rgba(15,23,42,0.10)', fontSize: 12, background: G.white }} />
                  <Bar dataKey="amount" fill={G.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ContentCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Compliance status pie */}
            <ContentCard>
              <div className="p-5">
                <h3 className="text-sm font-semibold mb-4" style={{ color: G.primary }}>Compliance Status Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                      {pieData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${G.border}`, fontSize: 12, background: G.white }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ContentCard>

            {/* Staff utilization */}
            <ContentCard>
              <div className="p-5">
                <h3 className="text-sm font-semibold mb-4" style={{ color: G.primary }}>Staff Utilization</h3>
                <div className="space-y-4">
                  {firm.staff_utilization.map((s: any) => (
                    <div key={s.staff}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium" style={{ color: G.primary }}>{s.staff}</span>
                        <span style={{ color: G.secondary }}>{s.assigned} tasks · {s.utilization_pct}%</span>
                      </div>
                      <div className="relative h-2 rounded-full" style={{ background: G.border }}>
                        <div className="absolute inset-y-0 left-0 rounded-full"
                          style={{ width: `${s.utilization_pct}%`, background: s.utilization_pct >= 85 ? '#DC2626' : G.primary }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ContentCard>
          </div>

          {/* Client billing table */}
          <ContentCard>
            <div className="p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: G.primary }}>Client Billing Summary</h3>
              <table className="data-table">
                <thead><tr><th>Client</th><th>Billed Hours</th><th>Revenue</th><th>Status</th></tr></thead>
                <tbody>
                  {firm.client_utilization.map((c: any) => (
                    <tr key={c.client}>
                      <td style={{ fontWeight: 500 }}>{c.client}</td>
                      <td>{c.billed_hours}h</td>
                      <td className="font-mono text-xs">₹{(c.revenue / 1000).toFixed(0)}K</td>
                      <td>
                        <span className="rounded-full text-[10px] font-semibold"
                          style={{ background: G.canvas, border: `1px solid ${G.border}`, color: '#166534', padding: '1px 8px' }}>
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentCard>
        </div>
      )}

      {activeTab === 'client' && (
        <ContentCard>
          <div className="p-10 flex flex-col items-center gap-3">
            <TrendingUp className="h-14 w-14" style={{ color: G.icon }} />
            <p className="text-base font-semibold" style={{ color: G.primary }}>Per-Client Reports</p>
            <p className="text-sm text-center" style={{ color: G.secondary }}>GST Summary, TDS Summary, Audit Summary, and Compliance Health reports — select a client to view.</p>
            <button className="mt-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
              style={{ background: G.primary }}
              onClick={() => toast.info('Navigate to a client for detailed reports')}>
              Select Client
            </button>
          </div>
        </ContentCard>
      )}
    </div>
  )
}
