import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Users, Trash2, Settings, Phone, Mail, Shield,
  UserCheck, Clock, Search, ChevronDown, CheckCircle2,
  AlertTriangle, UserX,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { usersApi } from '@/shared/api/users'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Modal } from '@/shared/components/Modal'
import { SkeletonCard } from '@/shared/components/Skeleton'
import { Can } from '@/shared/components/Can'
import { usePermission } from '@/shared/hooks/usePermission'
import type { User, PermissionOverride } from '@/shared/types'

const G = {
  canvas:    '#F8FAFC',
  white:     '#FFFFFF',
  border:    '#E2E8F0',
  icon:      '#94A3B8',
  secondary: '#475569',
  primary:   '#0F172A',
} as const

const createSchema = z.object({
  full_name:        z.string().min(1, 'Name is required'),
  email:            z.string().email('Invalid email'),
  password:         z.string().min(8, 'Minimum 8 characters'),
  role:             z.enum(['super_admin', 'admin', 'article']),
  phone:            z.string().optional(),
  emergency_name:   z.string().optional(),
  emergency_phone:  z.string().optional(),
})
type CreateForm = z.infer<typeof createSchema>

const SCREENS = ['clients', 'tasks', 'gst', 'tds', 'audit', 'users', 'communication', 'subscription']

const ROLE_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  super_admin: { label: 'Super Admin', color: '#DC2626', bg: '#FEF2F2', icon: Shield },
  admin:       { label: 'Admin CA',    color: '#0584C7', bg: '#EFF6FF', icon: UserCheck },
  article:     { label: 'Article',     color: '#475569', bg: '#F8FAFC', icon: Users },
}

// ── Permission matrix ─────────────────────────────────────
function PermissionMatrix({ userId, onClose }: { userId: number; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.get(userId).then((r) => r.data),
  })

  const [perms, setPerms] = useState<Record<string, PermissionOverride>>(
    Object.fromEntries(
      SCREENS.map((s) => {
        const existing = user?.permissions?.find((p: any) => p.screen === s)
        return [s, existing ?? { screen: s, can_view: true, can_create: false, can_edit: false, can_delete: false }]
      })
    )
  )

  const saveMutation = useMutation({
    mutationFn: () => usersApi.setPermissions(userId, Object.values(perms)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Permissions saved'); onClose() },
    onError: () => toast.error('Failed to save permissions'),
  })

  const toggle = (screen: string, field: keyof Omit<PermissionOverride, 'screen'>) => {
    setPerms((p) => ({ ...p, [screen]: { ...p[screen], [field]: !p[screen][field] } }))
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${G.border}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: G.canvas, borderBottom: `1px solid ${G.border}` }}>
              <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: G.icon }}>Screen</th>
              {['View', 'Create', 'Edit', 'Delete'].map((h) => (
                <th key={h} className="text-center py-2.5 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: G.icon }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCREENS.map((screen, i) => (
              <tr key={screen} style={{ borderBottom: i < SCREENS.length - 1 ? `1px solid ${G.border}` : 'none', background: G.white }}>
                <td className="py-2.5 px-4 capitalize text-sm font-medium" style={{ color: G.primary }}>{screen}</td>
                {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map((field) => (
                  <td key={field} className="text-center py-2.5 px-3">
                    <input
                      type="checkbox"
                      checked={perms[screen][field]}
                      onChange={() => toggle(screen, field)}
                      aria-label={`${field.replace('can_', '')} ${screen}`}
                      className="h-4 w-4 rounded"
                      style={{ accentColor: G.primary }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2">
        <button className="rounded-xl px-4 py-2 text-sm font-semibold transition-all"
          style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}
          onClick={onClose}>Cancel</button>
        <button className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
          style={{ background: G.primary }}
          onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? 'Saving…' : 'Save Permissions'}
        </button>
      </div>
    </div>
  )
}

// ── User Card ─────────────────────────────────────────────
function UserCard({ user, onPermissions, onDelete }: {
  user: User; onPermissions: (id: number) => void; onDelete: (id: number, name: string) => void
}) {
  const [showContact, setShowContact] = useState(false)
  const meta = ROLE_META[user.role] ?? ROLE_META.article
  const RoleIcon = meta.icon
  const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: G.white, border: `1px solid ${G.border}`, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(15,23,42,0.10)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)'}>

      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
            style={{ background: G.primary }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate" style={{ color: G.primary }}>{user.full_name}</p>
            <p className="text-xs truncate mt-0.5" style={{ color: G.secondary }}>{user.email}</p>
            {/* Role badge */}
            <span className="inline-flex items-center gap-1 mt-1.5 rounded-full text-[10px] font-semibold px-2 py-0.5"
              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}22` }}>
              <RoleIcon className="h-2.5 w-2.5" />
              {meta.label}
            </span>
          </div>
          {/* Status dot */}
          <div className="shrink-0 flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: user.is_active ? '#22C55E' : G.icon }} />
              <span className="text-[10px] font-medium" style={{ color: user.is_active ? '#166534' : G.icon }}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Phone quick view */}
        {(user as any).phone && (
          <div className="flex items-center gap-2 mt-3 rounded-xl px-3 py-2" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: G.icon }} />
            <span className="text-xs font-medium" style={{ color: G.secondary }}>{(user as any).phone}</span>
          </div>
        )}

        {/* Last active */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <Clock className="h-3 w-3" style={{ color: G.icon }} />
          <span className="text-[10px]" style={{ color: G.icon }}>
            Last active: {user.last_active ? new Date(user.last_active).toLocaleDateString('en-IN') : 'Never'}
          </span>
        </div>
      </div>

      {/* Emergency contact section */}
      {((user as any).emergency_name || (user as any).emergency_phone) && (
        <div className="px-4 pb-3">
          <button
            className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all"
            style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}
            onClick={() => setShowContact(o => !o)}
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" style={{ color: '#D97706' }} />
              Emergency Contact
            </span>
            <ChevronDown className="h-3 w-3 transition-transform" style={{ transform: showContact ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
          {showContact && (
            <div className="mt-2 rounded-xl px-3 py-2.5 space-y-1.5"
              style={{ background: '#FFFBEB', border: `1px solid #FDE68A` }}>
              {(user as any).emergency_name && (
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" style={{ color: '#D97706' }} />
                  <span className="text-xs font-semibold" style={{ color: '#92400E' }}>{(user as any).emergency_name}</span>
                </div>
              )}
              {(user as any).emergency_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" style={{ color: '#D97706' }} />
                  <span className="text-xs" style={{ color: '#92400E' }}>{(user as any).emergency_phone}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action strip */}
      <div className="flex items-center gap-0 px-3 pb-3" style={{ borderTop: `1px solid ${G.border}` }}>
        <Can roles={['super_admin']}>
          <button
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl mt-2 mr-1 transition-all"
            style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}
            onClick={() => onPermissions(user.id)}
            title="Edit permissions"
          >
            <Settings className="h-3.5 w-3.5" /> Permissions
          </button>
        </Can>
        <Can roles={['super_admin']}>
          <button
            className="flex items-center justify-center rounded-xl mt-2 p-2 transition-all"
            style={{ color: '#DC2626' }}
            onClick={() => onDelete(user.id, user.full_name)}
            title={`Delete ${user.full_name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </Can>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export function UsersPage() {
  const qc = useQueryClient()
  const { isSuperAdmin } = usePermission()
  const [createOpen, setCreateOpen] = useState(false)
  const [permUserId, setPermUserId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'article' },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => usersApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created'); setCreateOpen(false); reset() },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to create user'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted') },
    onError: () => toast.error('Failed to delete user'),
  })

  const filtered = (users as User[]).filter(u => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const roleCounts = (users as User[]).reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto" style={{ background: G.canvas }}>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: G.primary }}>Team Members</h1>
          <p className="text-sm mt-0.5" style={{ color: G.secondary }}>{(users as User[]).length} users · {(users as User[]).filter(u => u.is_active).length} active</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
          style={{ background: G.primary }}
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Users',  value: (users as User[]).length, icon: Users,      color: G.primary },
          { label: 'Super Admins', value: roleCounts.super_admin ?? 0, icon: Shield,  color: '#DC2626' },
          { label: 'Admins (CA)',  value: roleCounts.admin ?? 0, icon: UserCheck,     color: '#0584C7' },
          { label: 'Articles',     value: roleCounts.article ?? 0, icon: Users,       color: G.secondary },
        ].map(stat => {
          const StatIcon = stat.icon
          return (
            <div key={stat.label} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: G.white, border: `1px solid ${G.border}` }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                <StatIcon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums" style={{ color: G.primary }}>{stat.value}</p>
                <p className="text-[10px]" style={{ color: G.secondary }}>{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 rounded-2xl p-3" style={{ background: G.white, border: `1px solid ${G.border}` }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: G.icon }} />
          <input
            type="text" placeholder="Search users..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none"
            style={{ width: 200, background: G.canvas, border: `1px solid ${G.border}`, color: G.primary }}
          />
        </div>
        <div className="w-px h-6 shrink-0" style={{ background: G.border }} />
        <div className="flex gap-1.5">
          {['all', 'super_admin', 'admin', 'article'].map(r => (
            <button key={r}
              className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
              style={roleFilter === r
                ? { background: G.primary, color: '#FFFFFF' }
                : { background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }
              }
              onClick={() => setRoleFilter(r)}>
              {r === 'all' ? 'All' : r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin CA' : 'Article'}
            </button>
          ))}
        </div>
      </div>

      {/* User cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 rounded-2xl"
          style={{ background: G.white, border: `1px solid ${G.border}` }}>
          <UserX className="h-12 w-12" style={{ color: G.icon }} />
          <p className="text-sm font-semibold" style={{ color: G.primary }}>No users found</p>
          <p className="text-xs" style={{ color: G.secondary }}>Try adjusting your search or filters</p>
          <button className="mt-2 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: G.primary }} onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 inline mr-1.5" />Add First User
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onPermissions={setPermUserId}
              onDelete={(id, name) => { if (confirm(`Delete ${name}?`)) deleteMutation.mutate(id) }}
            />
          ))}
        </div>
      )}

      {/* Create user modal */}
      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Add Team Member" size="md">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} noValidate className="space-y-4">
          <Input label="Full Name" required placeholder="Priya Sharma" error={errors.full_name?.message} {...register('full_name')} />
          <Input label="Email" type="email" required placeholder="priya@firm.com" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" required placeholder="Min 8 characters" error={errors.password?.message} {...register('password')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" type="tel" placeholder="+91 98765 43210" {...register('phone')} />
            <Select label="Role" options={[
              { value: 'article',    label: 'Article / Intern' },
              { value: 'admin',      label: 'Admin (Qualified CA)' },
              ...(isSuperAdmin() ? [{ value: 'super_admin', label: 'Super Admin' }] : []),
            ]} />
          </div>
          {/* Emergency contact */}
          <div className="rounded-xl p-3 space-y-3" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
            <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: G.secondary }}>
              <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#D97706' }} />
              Emergency Contact (optional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Contact Name" placeholder="Parent / Spouse" {...register('emergency_name')} />
              <Input label="Contact Phone" type="tel" placeholder="+91 …" {...register('emergency_phone')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}
              onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: G.primary }}
              disabled={isSubmitting || createMutation.isPending}>
              {isSubmitting || createMutation.isPending ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Permission matrix modal */}
      <Modal
        open={permUserId !== null}
        onOpenChange={(o) => { if (!o) setPermUserId(null) }}
        title="Edit Permissions"
        description="Control screen-level access for this user."
        size="lg"
      >
        {permUserId && <PermissionMatrix userId={permUserId} onClose={() => setPermUserId(null)} />}
      </Modal>
    </div>
  )
}
