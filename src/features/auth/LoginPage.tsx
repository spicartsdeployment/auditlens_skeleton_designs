import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Shield, UserCog, GraduationCap, LogIn, Sparkles, Copy } from 'lucide-react'
import { Input } from '@/shared/components/Input'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/hooks/useAuthStore'
import { useState } from 'react'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

interface DemoUser {
  role: string
  name: string
  email: string
  password: string
  icon: React.ElementType
  color: string
  description: string
}

const DEMO_USERS: DemoUser[] = [
  {
    role: 'Super Admin',
    name: 'Arjun Mehta',
    email: 'superadmin@auditlens.demo',
    password: 'super@123',
    icon: Shield,
    color: 'bg-danger-50 text-danger-600 border-danger-100',
    description: 'Full access — clients, users, settings',
  },
  {
    role: 'Admin (CA)',
    name: 'Priya Sharma',
    email: 'admin@auditlens.demo',
    password: 'admin@123',
    icon: UserCog,
    color: 'bg-primary-50 text-primary-600 border-primary-100',
    description: 'Manage tasks, filings, team',
  },
  {
    role: 'Article',
    name: 'Rohan Verma',
    email: 'article@auditlens.demo',
    password: 'article@123',
    icon: GraduationCap,
    color: 'bg-accent-50 text-accent-600 border-accent-100',
    description: 'Assigned tasks & client filings',
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [seeding, setSeeding] = useState(false)
  const [demoReady, setDemoReady] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const tokenRes = await authApi.login(data.email, data.password)
      const token = tokenRes.data.access_token
      localStorage.setItem('access_token', token)
      const userRes = await authApi.me()
      setAuth(userRes.data, token)
      navigate('/', { replace: true })
      toast.success(`Welcome, ${userRes.data.full_name}!`)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Invalid email or password'
      toast.error(msg)
    }
  }

  const handleSeedDemo = async () => {
    setSeeding(true)
    try {
      await authApi.seedDemo()
      setDemoReady(true)
      toast.success('Demo accounts created! Click any card below to fill in credentials.')
    } catch (err: any) {
      // 409 means already exists — still show the cards
      setDemoReady(true)
      toast.info('Demo accounts already exist — click a card to sign in.')
    } finally {
      setSeeding(false)
    }
  }

  const fillCredentials = (user: DemoUser) => {
    setValue('email', user.email, { shouldValidate: true })
    setValue('password', user.password, { shouldValidate: true })
    toast.info(`Filled credentials for ${user.name}`)
  }

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedEmail(label)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Login card */}
      <Card>
        <h2 className="mb-5 text-xl font-semibold text-neutral-900">Sign in to AuditLens</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@firm.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            <LogIn className="h-4 w-4" aria-hidden />
            Sign in
          </Button>
        </form>
      </Card>

      {/* Demo section */}
      <Card padding="sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-neutral-800">Demo Accounts</p>
            <p className="text-xs text-neutral-500">One click to fill credentials</p>
          </div>
          {!demoReady && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDemo}
              loading={seeding}
              type="button"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Create
            </Button>
          )}
        </div>

        {!demoReady ? (
          <p className="text-xs text-neutral-400 text-center py-2">
            Click "Create" to seed demo accounts, then use the cards to log in instantly.
          </p>
        ) : (
          <div className="space-y-2">
            {DEMO_USERS.map((user) => {
              const Icon = user.icon
              return (
                <div
                  key={user.email}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${user.color} cursor-pointer hover:opacity-90 transition-opacity`}
                  onClick={() => fillCredentials(user)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fillCredentials(user)}
                  aria-label={`Fill credentials for ${user.name} (${user.role})`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/70 shrink-0">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold">{user.role}</p>
                      <span className="text-xs opacity-60">·</span>
                      <p className="text-xs opacity-75">{user.name}</p>
                    </div>
                    <p className="text-xs opacity-60 font-financial truncate">{user.email}</p>
                    <p className="text-xs opacity-50 mt-0.5">{user.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(user.password, user.email) }}
                    className="ml-auto shrink-0 rounded p-1 hover:bg-white/40 transition-colors"
                    aria-label={`Copy password for ${user.name}`}
                    title="Copy password"
                  >
                    {copiedEmail === user.email ? (
                      <span className="text-[10px] font-medium">Copied!</span>
                    ) : (
                      <Copy className="h-3.5 w-3.5 opacity-50" aria-hidden />
                    )}
                  </button>
                </div>
              )
            })}

            <p className="text-center text-xs text-neutral-400 pt-1">
              Click a card to auto-fill ↑ then press Sign in
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
