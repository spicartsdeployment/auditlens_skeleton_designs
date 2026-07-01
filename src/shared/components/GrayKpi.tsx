/**
 * Shared gray-scale UI components — 5-ratio enterprise system
 *
 * G1 #F8FAFC  icon bg / canvas
 * G2 #E2E8F0  borders / dividers
 * G3 #94A3B8  decorative icons
 * G4 #475569  secondary text / labels
 * G5 #0F172A  numbers / headings / CTA fill
 */
import { cn } from './cn'

export const G = {
  canvas:    '#F8FAFC',
  white:     '#FFFFFF',
  border:    '#E2E8F0',
  icon:      '#94A3B8',
  secondary: '#475569',
  primary:   '#0F172A',
} as const

/** White KPI metric card — no color tints */
export function GrayKpi({
  label, value, icon: Icon, sub, urgent, onClick,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  sub?: string
  urgent?: boolean
  onClick?: () => void
}) {
  return (
    <button
      className="rounded-2xl text-left w-full p-4 transition-all group"
      style={{ background: G.white, border: `1px solid ${G.border}`, boxShadow: '0 1px 3px 0 rgba(15,23,42,0.06)' }}
      onClick={onClick}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px 0 rgba(15,23,42,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px 0 rgba(15,23,42,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = G.border }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl mb-3"
        style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
        <Icon className="h-4 w-4" style={{ color: urgent ? '#DC2626' : G.icon }} aria-hidden />
      </div>
      <p className="text-2xl font-bold leading-none mb-1.5 tabular-nums"
        style={{ color: urgent ? '#DC2626' : G.primary }}>{value}</p>
      <p className="text-xs font-semibold" style={{ color: G.secondary }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: G.icon }}>{sub}</p>}
    </button>
  )
}

/** Page title + sub */
export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: G.primary }}>{title}</h1>
        {sub && <p className="text-sm mt-0.5" style={{ color: G.secondary }}>{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

/** Primary CTA button */
export function DarkBtn({ onClick, children, className = '' }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all active:scale-[0.98]', className)}
      style={{ background: G.primary }}
      onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
      onMouseLeave={e => (e.currentTarget.style.background = G.primary)}
    >
      {children}
    </button>
  )
}

/** Secondary outlined button */
export function OutlineBtn({ onClick, children, className = '' }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all', className)}
      style={{ background: G.white, border: `1px solid ${G.border}`, color: G.secondary }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1'; (e.currentTarget as HTMLElement).style.color = G.primary }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = G.border; (e.currentTarget as HTMLElement).style.color = G.secondary }}
    >
      {children}
    </button>
  )
}

/** Tab bar */
export function TabBar<T extends string>({
  tabs, active, onChange,
}: { tabs: T[]; active: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-0.5 rounded-xl p-0.5 w-fit mb-5"
      style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)}
          className="rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-all"
          style={active === t
            ? { background: G.primary, color: G.white, boxShadow: '0 1px 3px 0 rgba(15,23,42,0.20)' }
            : { background: 'transparent', color: G.secondary }
          }
          onMouseEnter={e => { if (active !== t) (e.currentTarget as HTMLElement).style.color = G.primary }}
          onMouseLeave={e => { if (active !== t) (e.currentTarget as HTMLElement).style.color = G.secondary }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

/** Filter pill strip */
export function FilterPills<T extends string>({
  pills, active, onChange,
}: { pills: T[]; active: T; onChange: (t: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {pills.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
          style={active === p
            ? { background: G.primary, color: G.white }
            : { background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }
          }
        >
          {p}
        </button>
      ))}
    </div>
  )
}

/** White content card */
export function ContentCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl', className)}
      style={{ background: G.white, border: `1px solid ${G.border}`, boxShadow: '0 1px 3px 0 rgba(15,23,42,0.06)' }}>
      {children}
    </div>
  )
}

/** Status badge — gray canvas, semantic text */
export function StatusBadge({ status }: { status: string }) {
  const textColors: Record<string, string> = {
    filed: '#166534', done: '#166534', approved: '#166534',
    submitted: '#065F46',
    in_review: '#1E40AF', inprogress: '#1E40AF',
    pending: '#92400E',
    draft: '#475569', todo: '#475569',
    overdue: '#991B1B', open: '#991B1B',
    resolved: '#166534', closed: '#475569',
  }
  const color = textColors[status.toLowerCase().replace(' ', '_')] ?? '#475569'
  return (
    <span
      className="inline-flex items-center rounded-full text-[9px] font-bold uppercase tracking-tight"
      style={{ background: G.canvas, border: `1px solid ${G.border}`, color, padding: '2px 8px' }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}

/** Section heading inside a card */
export function SectionHead({ icon: Icon, title, right }: { icon?: React.ElementType; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-1"
      style={{ borderBottom: `1px solid ${G.border}` }}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" style={{ color: G.icon }} aria-hidden />}
        <h2 className="text-sm font-semibold" style={{ color: G.primary }}>{title}</h2>
      </div>
      {right}
    </div>
  )
}
