export type UserRole = 'super_admin' | 'admin' | 'article'

export interface User {
  id: number
  firm_id: number
  email: string
  full_name: string
  role: UserRole
  phone?: string
  is_active: boolean
  last_active?: string
  created_at: string
  permissions?: PermissionOverride[]
}

export interface PermissionOverride {
  screen: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

export interface Client {
  id: number
  firm_id: number
  legal_name: string
  trade_name?: string
  gstin?: string
  pan?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  state?: string
  assigned_admin_id?: number
  assigned_article_id?: number
  assigned_admin?: User
  assigned_article?: User
  gst_enabled: boolean
  tds_enabled: boolean
  audit_enabled: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
export type TaskType = 'gst' | 'tds' | 'audit' | 'other'

export interface DocumentRequest {
  id: number
  name: string
  description?: string
  is_required: boolean
  is_uploaded: boolean
  uploaded_at?: string
}

export interface Task {
  id: number
  firm_id: number
  client_id: number
  assigned_by_id: number
  assigned_to_id?: number
  title: string
  description?: string
  task_type: TaskType
  status: TaskStatus
  priority: number
  deadline?: string
  created_at: string
  updated_at: string
  document_requests: DocumentRequest[]
}

export type FilingType =
  | 'gstr1' | 'gstr2b' | 'gstr3b' | 'gstr9' | 'gstr9c'
  | 'tds_24q' | 'tds_26q'
  | 'audit_statutory' | 'audit_tax'

export type FilingStatus = 'draft' | 'in_review' | 'submitted' | 'filed'

export interface Filing {
  id: number
  firm_id: number
  client_id: number
  filled_by_id?: number
  reviewed_by_id?: number
  filing_type: FilingType
  status: FilingStatus
  period: string
  reference_id?: string
  notes?: string
  due_date?: string
  submitted_at?: string
  filed_at?: string
  created_at: string
}

export type AlertSeverity = 'info' | 'warning' | 'danger'

export interface Alert {
  id: number
  severity: AlertSeverity
  title: string
  message: string
  entity_type?: string
  entity_id?: number
  is_read: boolean
  created_at: string
}

export interface Thread {
  id: number
  firm_id: number
  title?: string
  is_group: boolean
  created_at: string
}

export interface Message {
  id: number
  thread_id: number
  sender_id: number
  content?: string
  file_name?: string
  is_read: boolean
  created_at: string
}

export interface DashboardStats {
  total_clients: number
  active_tasks: number
  pending_filings: number
  overdue_count: number
}

export interface DashboardData {
  stats: DashboardStats
  recent_alerts: Alert[]
  upcoming_deadlines: Array<{
    id: number
    title: string
    deadline?: string
    client_id: number
    task_type: TaskType
  }>
}
