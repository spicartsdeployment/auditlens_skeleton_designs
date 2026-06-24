import { useQuery } from '@tanstack/react-query'
import { CreditCard, Database, Users, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { mockComplianceApi } from '@/mock/api'
import { toast } from 'sonner'
import { G, PageHeader, DarkBtn, OutlineBtn, ContentCard } from '@/shared/components/GrayKpi'

function UsageBar({ used, max, label }: { used: number; max: number; label: string }) {
  const pct = Math.round((used / max) * 100)
  const isHigh = pct > 85
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: G.secondary }}>{label}</span>
        <span className="font-semibold" style={{ color: G.primary }}>
          {used} / {max} <span style={{ color: G.icon, fontWeight: 400 }}>({pct}%)</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: G.border }}>
        <div className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${pct}%`, background: isHigh ? '#DC2626' : G.primary }} />
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { data: firm } = useQuery({ queryKey: ['firm'], queryFn: () => mockComplianceApi.firm().then(r => r.data) })

  const renewalDate = firm ? parseISO(firm.renewal_date) : null
  const daysToRenewal = renewalDate ? differenceInDays(renewalDate, new Date()) : null

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto" style={{ background: G.canvas }}>
      <PageHeader title="Settings" sub="Firm settings, subscription, and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Subscription + Firm settings */}
        <div className="lg:col-span-2 space-y-5">

          {/* Plan card */}
          <ContentCard>
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                      <CreditCard className="h-4 w-4" style={{ color: G.icon }} />
                    </div>
                    <h2 className="text-base font-bold" style={{ color: G.primary }}>Subscription</h2>
                  </div>
                  <p className="text-sm" style={{ color: G.secondary }}>Manage your plan and billing</p>
                </div>
                {/* Plan badge — dark slate pill */}
                <span className="rounded-xl px-3 py-1.5 text-xs font-bold"
                  style={{ background: G.primary, color: '#FFFFFF' }}>
                  {firm?.plan ?? 'Professional'}
                </span>
              </div>

              {/* Plan info mini cards */}
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Plan', value: firm?.plan ?? 'Professional', icon: CreditCard },
                  { label: 'Active Users', value: firm?.active_users ?? 4, icon: Users },
                  { label: 'Renewal', value: renewalDate ? format(renewalDate, 'd MMM yyyy') : '—', icon: Calendar },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-4"
                    style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                    <item.icon className="h-5 w-5 mb-2" style={{ color: G.icon }} />
                    <p className="text-lg font-bold" style={{ color: G.primary }}>{item.value}</p>
                    <p className="text-xs" style={{ color: G.secondary }}>{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Renewal notice — gray border, text color only */}
              {daysToRenewal !== null && daysToRenewal < 60 && (
                <div className="flex items-center gap-3 rounded-xl p-3 mb-5"
                  style={{ background: G.canvas, border: `1px solid ${daysToRenewal < 30 ? '#FDE68A' : G.border}` }}>
                  <AlertTriangle className="h-4 w-4 shrink-0"
                    style={{ color: daysToRenewal < 30 ? '#D97706' : G.secondary }} />
                  <p className="text-xs" style={{ color: G.primary }}>
                    Subscription renews in <strong>{daysToRenewal} days</strong> — {format(renewalDate!, 'd MMMM yyyy')}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <UsageBar used={firm?.used_pans ?? 37} max={firm?.max_pans ?? 50} label="PANs (Client Registrations)" />
                <UsageBar used={firm?.used_storage_gb ?? 42} max={firm?.max_storage_gb ?? 100} label="Storage (GB)" />
                <UsageBar used={firm?.active_users ?? 4} max={10} label="User Seats" />
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <DarkBtn className="flex-1 justify-center" onClick={() => toast.info('Upgrade plan')}>Upgrade Plan</DarkBtn>
                <OutlineBtn className="flex-1 justify-center" onClick={() => toast.info('View billing history')}>Billing History</OutlineBtn>
              </div>
            </div>
          </ContentCard>

          {/* Firm settings */}
          <ContentCard>
            <div className="p-6">
              <h2 className="text-base font-bold mb-5" style={{ color: G.primary }}>Firm Settings</h2>
              <div className="space-y-1">
                {[
                  { label: 'Firm Name', value: firm?.name ?? 'AuditLens Demo CA Firm' },
                  { label: 'GST Compliance Reminder', value: 'Enabled — 5 days before due date' },
                  { label: 'TDS Reminder', value: 'Enabled — 7 days before due date' },
                  { label: 'Document Expiry Alert', value: 'Enabled — 30 days before expiry' },
                  { label: 'Auto-assign Articles', value: 'Disabled' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-3"
                    style={{ borderBottom: `1px solid ${G.border}` }}>
                    <span className="text-sm" style={{ color: G.primary }}>{item.label}</span>
                    <span className="text-sm" style={{ color: G.secondary }}>{item.value}</span>
                  </div>
                ))}
              </div>
              <OutlineBtn className="mt-4" onClick={() => toast.info('Edit firm settings')}>Edit Settings</OutlineBtn>
            </div>
          </ContentCard>
        </div>

        {/* RIGHT panel */}
        <div className="space-y-5">
          {/* Plan features */}
          <ContentCard>
            <div className="p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: G.primary }}>Professional Plan Includes</h3>
              <ul className="space-y-2">
                {[
                  'Up to 50 PAN registrations', '10 user seats', '100 GB document storage',
                  'GST, TDS & Audit modules', 'Notice Management', 'Compliance Calendar',
                  'Reports & Analytics', 'Email notifications', 'Priority support',
                ].map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: G.icon }} />
                    <span style={{ color: G.secondary }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ContentCard>

          {/* AI add-ons */}
          <ContentCard>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl"
                  style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                  <Database className="h-3.5 w-3.5" style={{ color: G.icon }} />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: G.primary }}>AI Add-ons (Coming Soon)</h3>
              </div>
              <ul className="space-y-2">
                {[
                  'OCR Document Extraction', 'AI Compliance Copilot', 'GST Mismatch Explanation',
                  'Audit Observation Suggestions', 'Risk Prediction Engine', 'AI Chat Assistant',
                ].map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: G.icon }} />
                    <span style={{ color: G.secondary }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ContentCard>
        </div>
      </div>
    </div>
  )
}
