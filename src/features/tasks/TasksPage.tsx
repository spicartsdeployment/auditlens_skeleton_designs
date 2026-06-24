import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { List, LayoutGrid, Plus, CheckSquare, FileCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { tasksApi } from '@/shared/api/tasks'
import { clientsApi } from '@/shared/api/clients'
import { usersApi } from '@/shared/api/users'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Badge } from '@/shared/components/Badge'
import { StatusPill } from '@/shared/components/StatusPill'
import { EmptyState } from '@/shared/components/EmptyState'
import { SkeletonCard } from '@/shared/components/Skeleton'
import { Can } from '@/shared/components/Can'
import { usePermission } from '@/shared/hooks/usePermission'
import type { Task, TaskStatus } from '@/shared/types'
import { formatDistanceToNow } from 'date-fns'

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'In Review' },
  { id: 'done', label: 'Done' },
]

const PRIORITY_LABELS = { 1: 'High', 2: 'Medium', 3: 'Low' }
const PRIORITY_COLORS = { 1: 'danger', 2: 'warning', 3: 'default' } as const

const taskSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  title: z.string().min(1, 'Title is required'),
  task_type: z.enum(['gst', 'tds', 'audit', 'other']),
  assigned_to_id: z.string().optional(),
  priority: z.string(),
  deadline: z.string().optional(),
  description: z.string().optional(),
})
type TaskForm = z.infer<typeof taskSchema>

function TaskCard({ task, onStatusChange }: { task: Task; onStatusChange: (id: number, status: TaskStatus) => void }) {
  const uploaded = task.document_requests.filter((d) => d.is_uploaded).length
  const total = task.document_requests.length

  const nextStatus: Record<TaskStatus, TaskStatus | null> = {
    todo: 'in_progress',
    in_progress: 'in_review',
    in_review: 'done',
    done: null,
  }

  return (
    <article
      className="rounded-lg border border-neutral-200 bg-surface p-3 shadow-card hover:shadow-dropdown transition-shadow"
      aria-label={task.title}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-neutral-900 leading-tight">{task.title}</p>
        <Badge variant={PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || 'default'} className="shrink-0 text-xs">
          {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS] || 'Medium'}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs capitalize">{task.task_type}</Badge>
        {task.deadline && (
          <span className="text-xs text-neutral-500">
            Due {new Date(task.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-500">Docs {uploaded}/{total}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-200" aria-hidden>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ background: '#0F172A', width: `${total > 0 ? (uploaded / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {nextStatus[task.status] && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs mt-1"
          onClick={() => onStatusChange(task.id, nextStatus[task.status]!)}
        >
          Move to {COLUMNS.find(c => c.id === nextStatus[task.status])?.label}
        </Button>
      )}
    </article>
  )
}

export function TasksPage() {
  const qc = useQueryClient()
  const { isAdmin, isSuperAdmin, isArticle } = usePermission()
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [createOpen, setCreateOpen] = useState(false)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list().then((r) => r.data),
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list().then((r) => r.data),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { task_type: 'gst', priority: '2' },
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task created'); setCreateOpen(false); reset() },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to create task'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => tasksApi.update(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Status updated') },
  })

  const onSubmit = (data: TaskForm) => {
    createMutation.mutate({
      client_id: Number(data.client_id),
      assigned_to_id: data.assigned_to_id ? Number(data.assigned_to_id) : undefined,
      title: data.title,
      task_type: data.task_type,
      priority: Number(data.priority),
      deadline: data.deadline || undefined,
      description: data.description,
    })
  }

  const clientOptions = clients.map((c: any) => ({ value: String(c.id), label: c.legal_name }))
  const articleOptions = users
    .filter((u: any) => u.role === 'article')
    .map((u: any) => ({ value: String(u.id), label: u.full_name }))

  if (isLoading) {
    return <div className="p-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tasks</h1>
          <p className="text-sm text-neutral-500">{tasks.length} total tasks</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden" role="group" aria-label="View toggle">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-2 text-sm transition-colors`}
              style={view === 'kanban' ? { background: '#F1F5F9', color: '#0F172A' } : { color: '#64748B' }}
              aria-pressed={view === 'kanban'}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden /> <span className="sr-only">Kanban</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 text-sm transition-colors`}
              style={view === 'list' ? { background: '#F1F5F9', color: '#0F172A' } : { color: '#64748B' }}
              aria-pressed={view === 'list'}
            >
              <List className="h-4 w-4" aria-hidden /> <span className="sr-only">List</span>
            </button>
          </div>
          <Can roles={['super_admin', 'admin']}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Assign Task
            </Button>
          </Can>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks yet" description="Assign tasks to your team." action={{ label: 'Assign Task', onClick: () => setCreateOpen(true) }} />
      ) : view === 'kanban' ? (
        // Kanban board
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t: Task) => t.status === col.id)
            return (
              <section
                key={col.id}
                className="rounded-xl bg-neutral-50 border border-neutral-200 p-3"
                aria-label={col.label}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-neutral-700">{col.label}</h2>
                  <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task: Task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-center text-xs text-neutral-400 py-4">Empty</p>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        // List view
        <Card padding="none">
          <ul className="divide-y divide-neutral-100" role="list">
            {tasks.map((task: Task) => (
              <li key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{task.title}</p>
                  <p className="text-xs text-neutral-500 capitalize">{task.task_type}</p>
                </div>
                <StatusPill status={task.status} />
                <Badge variant={PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || 'default'}>
                  {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                </Badge>
                {task.deadline && (
                  <span className="text-xs text-neutral-400 hidden sm:block">
                    {new Date(task.deadline).toLocaleDateString('en-IN')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Create task modal */}
      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Assign Task" size="md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Select label="Client" options={clientOptions} placeholder="Select client..." />
          <Input label="Task Title" required placeholder="e.g. GSTR-1 for March 2024" error={errors.title?.message} {...register('title')} />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              options={[
                { value: 'gst', label: 'GST' },
                { value: 'tds', label: 'TDS' },
                { value: 'audit', label: 'Audit' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Select
              label="Priority"
              options={[
                { value: '1', label: 'High' },
                { value: '2', label: 'Medium' },
                { value: '3', label: 'Low' },
              ]}
            />
          </div>
          <Select label="Assign To (Article)" options={[{ value: '', label: 'Unassigned' }, ...articleOptions]} placeholder="Select article..." />
          <Input label="Deadline" type="date" {...register('deadline')} />
          <Input label="Description" placeholder="Additional notes..." {...register('description')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending}>Create Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
