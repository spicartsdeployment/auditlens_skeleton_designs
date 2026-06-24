import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Edit, MessageSquare, Building2, Phone, Mail,
  MapPin, FileText, ReceiptText, Scale, Users, Activity,
  CheckCircle2, AlertCircle, Clock, ExternalLink,
} from 'lucide-react'
import { clientsApi } from '@/shared/api/clients'
import { Avatar } from '@/shared/components/Avatar'
import { SkeletonCard } from '@/shared/components/Skeleton'
import { formatDistanceToNow } from 'date-fns'

// ── Gray palette ─────────────────────────────────────────────
const G = {
  canvas:    '#F8FAFC',
  white:     '#FFFFFF',
  border:    '#E2E8F0',
  icon:      '#94A3B8',
  secondary: '#475569',
  primary:   '#0F172A',
} as const

// ── Section wrapper ──────────────────────────────────────────
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: G.white, border: `1px solid ${G.border}`, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
      <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ borderBottom: `1px solid ${G.border}`, background: G.canvas }}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <Icon className="h-3.5 w-3.5" style={{ color: G.icon }} />
        </div>
        <h2 className="text-sm font-semibold" style={{ color: G.primary }}>{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Info row ────────────────────────────────────────────────
function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: G.icon }}>{label}</dt>
      <dd className={`text-sm ${mono ? 'font-mono' : 'font-medium'}`} style={{ color: G.primary }}>{value}</dd>
    </div>
  )
}

// ── Module badge ────────────────────────────────────────────
function ModuleBadge({ active, icon: Icon, label }: { active: boolean; icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 transition-all"
      style={{
        background: active ? G.white : G.canvas,
        border: `1px solid ${active ? G.border : G.border}`,
        opacity: active ? 1 : 0.5,
      }}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: active ? '#F0FDF4' : G.canvas, border: `1px solid ${active ? '#BBF7D0' : G.border}` }}>
        <Icon className="h-4 w-4" style={{ color: active ? '#166534' : G.icon }} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: G.primary }}>{label}</p>
        <p className="text-[10px]" style={{ color: active ? '#166534' : G.icon }}>{active ? 'Enabled' : 'Disabled'}</p>
      </div>
      {active && <CheckCircle2 className="h-4 w-4 ml-auto" style={{ color: '#22C55E' }} />}
    </div>
  )
}

// ── Team member card ─────────────────────────────────────────
function TeamCard({ name, role, email }: { name: string; role: string; email?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
      <Avatar name={name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: G.primary }}>{name}</p>
        <p className="text-xs" style={{ color: G.secondary }}>{role}</p>
        {email && <p className="text-[10px] truncate" style={{ color: G.icon }}>{email}</p>}
      </div>
    </div>
  )
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.get(Number(id)).then((r) => r.data),
  })
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['client-activity', id],
    queryFn: () => clientsApi.getActivity(Number(id)).then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    )
  }

  if (!client) return <p className="p-6" style={{ color: '#DC2626' }}>Client not found</p>

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4" style={{ background: G.canvas }}>

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ background: G.white, border: `1px solid ${G.border}` }}
            onClick={() => navigate('/clients')}
            aria-label="Back to clients"
          >
            <ArrowLeft className="h-4 w-4" style={{ color: G.secondary }} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: G.primary }}>{client.legal_name}</h1>
            {client.gstin && (
              <p className="text-sm font-mono mt-0.5" style={{ color: G.secondary }}>{client.gstin}</p>
            )}
          </div>
          {/* Active badge */}
          <span className="rounded-full text-[10px] font-bold px-2.5 py-1"
            style={{ background: client.is_active ? '#F0FDF4' : G.canvas, border: `1px solid ${client.is_active ? '#BBF7D0' : G.border}`, color: client.is_active ? '#166534' : G.icon }}>
            {client.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
            style={{ background: G.white, border: `1px solid ${G.border}`, color: G.secondary }}
            onClick={() => navigate('/communication')}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Message
          </button>
          <button
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
            style={{ background: G.primary, color: '#FFFFFF' }}
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* ── 1. Company Information ──────────────────────────── */}
      <Section title="Company Information" icon={Building2}>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <InfoRow label="Legal Name" value={client.legal_name} />
          <InfoRow label="Trade Name" value={client.trade_name} />
          <InfoRow label="PAN" value={client.pan} mono />
          <InfoRow label="GSTIN" value={client.gstin} mono />
          <InfoRow label="State" value={client.state} />
          <InfoRow label="Address" value={client.address} />
        </dl>
      </Section>

      {/* ── 2. Contact Details ──────────────────────────────── */}
      <Section title="Contact Details" icon={Phone}>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: G.white, border: `1px solid ${G.border}` }}>
              <Users className="h-4 w-4" style={{ color: G.icon }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: G.icon }}>Contact Person</p>
              <p className="text-sm font-semibold" style={{ color: G.primary }}>{client.contact_name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: G.white, border: `1px solid ${G.border}` }}>
              <Mail className="h-4 w-4" style={{ color: G.icon }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: G.icon }}>Email</p>
              <p className="text-sm font-semibold truncate" style={{ color: G.primary }}>{client.contact_email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: G.white, border: `1px solid ${G.border}` }}>
              <Phone className="h-4 w-4" style={{ color: G.icon }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: G.icon }}>Phone</p>
              <p className="text-sm font-semibold" style={{ color: G.primary }}>{client.contact_phone || '—'}</p>
            </div>
          </div>
        </dl>
      </Section>

      {/* ── 3. Compliance Modules ───────────────────────────── */}
      <Section title="Compliance Modules" icon={FileText}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <ModuleBadge active={client.gst_enabled} icon={FileText} label="GST Filing" />
          <ModuleBadge active={client.tds_enabled} icon={ReceiptText} label="TDS Filing" />
          <ModuleBadge active={client.audit_enabled} icon={Scale} label="Statutory Audit" />
        </div>

        {/* Inline GST summary */}
        {client.gst_enabled && (
          <div className="mb-3 rounded-xl p-4" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: G.primary }}>
              <FileText className="h-3.5 w-3.5" style={{ color: G.icon }} /> GST Details
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: 'GSTR-1 Filed', value: '5/6' },
                { label: 'GSTR-3B Filed', value: '5/6' },
                { label: 'Pending', value: '1' },
                { label: 'Overdue', value: '0' },
              ].map(item => (
                <div key={item.label} className="rounded-lg p-2.5" style={{ background: G.white, border: `1px solid ${G.border}` }}>
                  <p className="text-lg font-bold tabular-nums" style={{ color: G.primary }}>{item.value}</p>
                  <p className="text-[10px]" style={{ color: G.secondary }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline TDS summary */}
        {client.tds_enabled && (
          <div className="mb-3 rounded-xl p-4" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: G.primary }}>
              <ReceiptText className="h-3.5 w-3.5" style={{ color: G.icon }} /> TDS Details
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: 'Form 26Q', value: '3/4' },
                { label: 'Form 24Q', value: '2/4' },
                { label: 'Challans', value: '11' },
                { label: 'Pending', value: '1' },
              ].map(item => (
                <div key={item.label} className="rounded-lg p-2.5" style={{ background: G.white, border: `1px solid ${G.border}` }}>
                  <p className="text-lg font-bold tabular-nums" style={{ color: G.primary }}>{item.value}</p>
                  <p className="text-[10px]" style={{ color: G.secondary }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Audit summary */}
        {client.audit_enabled && (
          <div className="rounded-xl p-4" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: G.primary }}>
              <Scale className="h-3.5 w-3.5" style={{ color: G.icon }} /> Audit Details
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: 'Current Phase', value: 'Planning' },
                { label: 'Observations', value: '3' },
                { label: 'Resolved', value: '1' },
                { label: 'FY', value: '2025-26' },
              ].map(item => (
                <div key={item.label} className="rounded-lg p-2.5" style={{ background: G.white, border: `1px solid ${G.border}` }}>
                  <p className="text-sm font-bold" style={{ color: G.primary }}>{item.value}</p>
                  <p className="text-[10px]" style={{ color: G.secondary }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── 4. Assigned Team ────────────────────────────────── */}
      <Section title="Assigned Team" icon={Users}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {client.assigned_admin ? (
            <TeamCard
              name={client.assigned_admin.full_name}
              role="Admin / Reviewing CA"
              email={client.assigned_admin.email}
            />
          ) : (
            <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: G.canvas, border: `1px dashed ${G.border}` }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: G.border }}>
                <Users className="h-4 w-4" style={{ color: G.icon }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: G.secondary }}>No Admin Assigned</p>
                <p className="text-[10px]" style={{ color: G.icon }}>Assign an admin CA</p>
              </div>
            </div>
          )}
          {client.assigned_article ? (
            <TeamCard
              name={client.assigned_article.full_name}
              role="Article / Filing Executive"
              email={client.assigned_article.email}
            />
          ) : (
            <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: G.canvas, border: `1px dashed ${G.border}` }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: G.border }}>
                <Users className="h-4 w-4" style={{ color: G.icon }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: G.secondary }}>No Article Assigned</p>
                <p className="text-[10px]" style={{ color: G.icon }}>Assign an article</p>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── 5. Recent Activity ──────────────────────────────── */}
      <Section title="Recent Activity" icon={Activity}>
        {(activityLogs as any[]).length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <Clock className="h-8 w-8" style={{ color: G.icon }} />
            <p className="text-sm" style={{ color: G.secondary }}>No activity recorded yet</p>
          </div>
        ) : (
          <ul className="space-y-0">
            {(activityLogs as any[]).slice(0, 10).map((log: any, i: number) => (
              <li key={log.id}
                className="flex items-start gap-3 py-2.5"
                style={{ borderBottom: i < activityLogs.length - 1 ? `1px solid ${G.border}` : 'none' }}>
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: G.icon }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm" style={{ color: G.primary }}>{log.description}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: G.secondary }}>
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </p>
                </div>
                <span className="shrink-0 rounded-full text-[10px] font-semibold capitalize"
                  style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary, padding: '1px 8px' }}>
                  {log.action}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

    </div>
  )
}
