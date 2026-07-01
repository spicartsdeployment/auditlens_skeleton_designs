import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { BarChart3, TrendingUp, Users, Briefcase, Download } from 'lucide-react'
import { mockComplianceApi } from '@/mock/api'
import { cn } from '@/shared/components/cn'
import { toast } from 'sonner'

const CHART_COLORS = ['#1E40AF', '#0D9488', '#D97706', '#DC2626', '#7C3AED']

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card rounded-xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
      <p className="text-sm font-semibold text-primary-content mt-1">{label}</p>
      <p className="text-xs text-secondary-content mt-0.5">{sub}</p>
    </div>
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
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary-content">Reports</h1>
          <p className="text-sm text-secondary-content">Firm performance and client compliance analytics</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-surface dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-secondary-content hover:text-primary-content"
          onClick={() => toast.info('Exporting report...')}>
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-0.5 mb-6 w-fit">
        {(['firm', 'client'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('rounded-md px-5 py-2 text-sm font-medium capitalize transition-colors', activeTab === t ? 'bg-white dark:bg-neutral-700 text-primary-content shadow-sm' : 'text-secondary-content hover:text-primary-content')}>
            {t} Reports
          </button>
        ))}
      </div>

      {activeTab === 'firm' && firm && (
        <div className="space-y-6">
          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Revenue (YTD)" value={`₹${(totalRevenue / 100000).toFixed(1)}L`} sub="Jan – Jun 2026" color="text-primary-600" />
            <StatCard label="Active Clients" value="5" sub="37 PANs registered" color="text-accent-600" />
            <StatCard label="Avg Compliance Score" value="81%" sub="Firm-wide health" color="text-green-600" />
            <StatCard label="Open Issues" value="7" sub="Obs + notices" color="text-warning-600" />
          </div>

          {/* Revenue chart */}
          <div className="card rounded-xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-primary-content">Monthly Revenue — FY 2025-26</h3>
              <TrendingUp className="h-4 w-4 text-accent-500" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={firm.revenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: any) => [`₹${(v / 1000).toFixed(0)}K`, 'Revenue']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Bar dataKey="amount" fill="#1E40AF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Compliance status pie */}
            <div className="card rounded-xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-semibold text-primary-content mb-4">Compliance Status Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                    {pieData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Staff utilization */}
            <div className="card rounded-xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-semibold text-primary-content mb-4">Staff Utilization</h3>
              <div className="space-y-4">
                {firm.staff_utilization.map((s: any) => (
                  <div key={s.staff}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-primary-content">{s.staff}</span>
                      <span className="text-secondary-content">{s.assigned} tasks · {s.utilization_pct}%</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div className={cn('absolute inset-y-0 left-0 rounded-full', s.utilization_pct >= 85 ? 'bg-accent-500' : s.utilization_pct >= 70 ? 'bg-warning-500' : 'bg-danger-500')} style={{ width: `${s.utilization_pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Client utilization table */}
          <div className="card rounded-xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-sm font-semibold text-primary-content mb-4">Client Billing Summary</h3>
            <table className="data-table">
              <thead><tr><th>Client</th><th>Billed Hours</th><th>Revenue</th><th>Status</th></tr></thead>
              <tbody>
                {firm.client_utilization.map((c: any) => (
                  <tr key={c.client}>
                    <td className="font-medium">{c.client}</td>
                    <td>{c.billed_hours}h</td>
                    <td className="font-financial text-xs">₹{(c.revenue / 1000).toFixed(0)}K</td>
                    <td><span className="badge-done inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'client' && (
        <div className="card rounded-xl border p-10 flex flex-col items-center gap-3" style={{ borderColor: 'var(--color-border)' }}>
          <BarChart3 className="h-14 w-14 text-neutral-300 dark:text-neutral-600" />
          <p className="text-base font-semibold text-primary-content">Per-Client Reports</p>
          <p className="text-sm text-secondary-content">GST Summary, TDS Summary, Audit Summary, and Compliance Health reports — select a client to view.</p>
          <button className="mt-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700" onClick={() => toast.info('Navigate to a client for detailed reports')}>
            Select Client
          </button>
        </div>
      )}
    </div>
  )
}
