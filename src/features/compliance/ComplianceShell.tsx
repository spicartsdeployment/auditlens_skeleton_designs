import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import { Plus, ChevronRight } from 'lucide-react'
import { clientsApi } from '@/shared/api/clients'
import { filingsApi } from '@/shared/api/filings'
import { Button } from '@/shared/components/Button'
import { Select } from '@/shared/components/Select'
import { Card, CardHeader, CardTitle, CardBody } from '@/shared/components/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/Table'
import { StatusPill } from '@/shared/components/StatusPill'
import { Badge } from '@/shared/components/Badge'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { EmptyState } from '@/shared/components/EmptyState'
import { SkeletonTable } from '@/shared/components/Skeleton'
import { usePermission } from '@/shared/hooks/usePermission'
import type { FilingType, FilingStatus } from '@/shared/types'
import { toast } from 'sonner'

interface ComplianceShellProps {
  title: string
  icon: React.ElementType
  filingTypes: { value: FilingType; label: string; description: string }[]
  module: string
}

const WORKFLOW_STEPS = ['Data Entry', 'Reconciliation', 'Review', 'Submit']

function WorkflowStepper({ status }: { status: FilingStatus }) {
  const stepMap: Record<FilingStatus, number> = {
    draft: 0,
    in_review: 2,
    submitted: 3,
    filed: 3,
  }
  const current = stepMap[status] ?? 0

  return (
    <nav aria-label="Filing progress" className="flex items-center gap-1">
      {WORKFLOW_STEPS.map((step, i) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              i <= current ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-500'
            }`}
            aria-current={i === current ? 'step' : undefined}
          >
            <span className="h-4 w-4 rounded-full flex items-center justify-center text-xs">
              {i < current ? '✓' : i + 1}
            </span>
            <span className="hidden sm:block">{step}</span>
          </div>
          {i < WORKFLOW_STEPS.length - 1 && (
            <ChevronRight className="h-3 w-3 text-neutral-300 mx-0.5" aria-hidden />
          )}
        </div>
      ))}
    </nav>
  )
}

export function ComplianceShell({ title, icon: Icon, filingTypes, module }: ComplianceShellProps) {
  const qc = useQueryClient()
  const { isArticle } = usePermission()
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string>(filingTypes[0]?.value || '')
  const [period, setPeriod] = useState('')
  const [activeFiling, setActiveFiling] = useState<any>(null)

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list().then((r) => r.data),
  })

  const clientOptions = clients.map((c: any) => ({ value: String(c.id), label: c.legal_name }))

  const { data: filings = [], isLoading } = useQuery({
    queryKey: ['filings', module, selectedClientId],
    queryFn: () => filingsApi.list({
      client_id: selectedClientId ? Number(selectedClientId) : undefined,
      filing_type: undefined,
    }).then((r) => r.data.filter((f) => filingTypes.map(t => t.value).includes(f.filing_type as FilingType))),
    enabled: true,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => filingsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['filings', module] })
      toast.success('Filing created')
      setCreateOpen(false)
    },
    onError: () => toast.error('Failed to create filing'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: FilingStatus }) => filingsApi.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['filings', module] })
      toast.success('Filing status updated')
      setActiveFiling(null)
    },
    onError: () => toast.error('Failed to update status'),
  })

  const nextStatus: Record<FilingStatus, FilingStatus | null> = {
    draft: 'in_review',
    in_review: 'submitted',
    submitted: 'filed',
    filed: null,
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <Icon className="h-5 w-5 text-primary-600" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
            <p className="text-sm text-neutral-500">Select a client to view filings</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Filing
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-64">
          <Select
            label="Client"
            options={[{ value: '', label: 'All Clients' }, ...clientOptions]}
            value={selectedClientId}
            onValueChange={setSelectedClientId}
            placeholder="Filter by client..."
          />
        </div>
      </div>

      {/* Filing types overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {filingTypes.map((ft) => (
          <Card key={ft.value} padding="sm" className="text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors">
            <p className="text-sm font-semibold text-neutral-900">{ft.label}</p>
            <p className="text-xs text-neutral-500 mt-1">{ft.description}</p>
          </Card>
        ))}
      </div>

      {/* Filings table */}
      <Card padding="none">
        <CardHeader className="px-4 py-3 border-b border-neutral-100">
          <CardTitle>Filings</CardTitle>
        </CardHeader>
        {isLoading ? <SkeletonTable rows={4} /> : filings.length === 0 ? (
          <EmptyState
            icon={Icon as LucideIcon}
            title="No filings yet"
            description={`Create a new ${title} filing to get started.`}
            action={{ label: 'New Filing', onClick: () => setCreateOpen(true) }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filings.map((filing: any) => (
                <TableRow key={filing.id}>
                  <TableCell>
                    <span className="font-medium text-neutral-900 uppercase text-xs">
                      {filingTypes.find(f => f.value === filing.filing_type)?.label || filing.filing_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-financial text-sm">{filing.period}</span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={filing.status} />
                  </TableCell>
                  <TableCell>
                    <WorkflowStepper status={filing.status} />
                  </TableCell>
                  <TableCell>
                    {nextStatus[filing.status as FilingStatus] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMutation.mutate({ id: filing.id, status: nextStatus[filing.status as FilingStatus]! })}
                        loading={updateMutation.isPending}
                      >
                        {filing.status === 'draft' && 'Submit for Review'}
                        {filing.status === 'in_review' && 'Mark Submitted'}
                        {filing.status === 'submitted' && 'Mark Filed'}
                      </Button>
                    )}
                    {filing.status === 'filed' && (
                      <Badge variant="success">Filed</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* New Filing modal */}
      <Modal open={createOpen} onOpenChange={setCreateOpen} title={`New ${title} Filing`} size="md">
        <div className="space-y-4">
          <Select
            label="Client"
            options={clientOptions}
            value={selectedClientId}
            onValueChange={setSelectedClientId}
            placeholder="Select client..."
          />
          <Select
            label="Filing Type"
            options={filingTypes.map(f => ({ value: f.value, label: f.label }))}
            value={selectedType}
            onValueChange={setSelectedType}
          />
          <Input
            label="Period"
            placeholder={module === 'gst' ? 'e.g. 2024-03 or 2024-25' : 'e.g. 2024-Q1'}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            hint="For monthly: YYYY-MM. For annual: YYYY-YY. For quarterly: YYYY-Q1"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              loading={createMutation.isPending}
              onClick={() => {
                if (!selectedClientId || !period) return
                createMutation.mutate({
                  client_id: Number(selectedClientId),
                  filing_type: selectedType,
                  period,
                })
              }}
            >
              Create Filing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
