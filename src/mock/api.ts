/**
 * Mock API — returns dummy data without a backend.
 * Enabled when VITE_USE_MOCK=true in .env.local
 */

import {
  MOCK_USERS, MOCK_CLIENTS, MOCK_TASKS, MOCK_FILINGS,
  MOCK_THREADS, MOCK_MESSAGES, MOCK_ALERTS, MOCK_ACTIVITY,
  MOCK_DASHBOARD, MOCK_COMPLIANCE_HEALTH, MOCK_GST_RETURNS,
  MOCK_GST_RECONCILIATION, MOCK_TDS_RETURNS, MOCK_TDS_ISSUES,
  MOCK_AUDITS, MOCK_WORKING_PAPERS, MOCK_OBSERVATIONS,
  MOCK_APPROVALS, MOCK_MISSING_DOCS, MOCK_NOTICES,
  MOCK_DOCUMENTS, MOCK_CALENDAR_EVENTS, MOCK_REPORTS, MOCK_FIRM,
} from './data'
import type { User, Client, Task, Filing, Thread, Message, Alert } from '@/shared/types'

let _currentUser: User = MOCK_USERS[0]
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// ── Auth ──────────────────────────────────────────────────
export const mockAuth = {
  login: async (email: string, _password: string) => {
    await delay()
    const user = MOCK_USERS.find((u) => u.email === email)
    if (!user) throw { response: { data: { detail: 'Invalid credentials' } } }
    _currentUser = user
    return { data: { access_token: 'mock-token' } }
  },
  me: async () => { await delay(100); return { data: _currentUser } },
  logout: async () => { await delay(100); return { data: {} } },
  seedDemo: async () => { await delay(200); return { data: { message: 'Demo users already exist', users: [] } } },
}

// ── Users ─────────────────────────────────────────────────
export const mockUsers = {
  list: async () => { await delay(); return { data: MOCK_USERS } },
  get: async (id: number) => { await delay(); return { data: MOCK_USERS.find(u => u.id === id)! } },
  create: async (data: any) => {
    await delay()
    const user: User = { ...data, id: Date.now(), firm_id: 1, is_active: true, created_at: new Date().toISOString() }
    MOCK_USERS.push(user)
    return { data: user }
  },
  update: async (id: number, data: any) => {
    await delay()
    const idx = MOCK_USERS.findIndex(u => u.id === id)
    if (idx !== -1) Object.assign(MOCK_USERS[idx], data)
    return { data: MOCK_USERS[idx] }
  },
  delete: async (_id: number) => { await delay(); return { data: {} } },
  setPermissions: async (_id: number, perms: any[]) => { await delay(); return { data: perms } },
}

// ── Clients ───────────────────────────────────────────────
export const mockClients = {
  list: async () => { await delay(); return { data: MOCK_CLIENTS } },
  get: async (id: number) => { await delay(); return { data: MOCK_CLIENTS.find(c => c.id === id)! } },
  create: async (data: any) => {
    await delay()
    const client: Client = { ...data, id: Date.now(), firm_id: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    MOCK_CLIENTS.push(client)
    return { data: client }
  },
  update: async (id: number, data: any) => {
    await delay()
    const idx = MOCK_CLIENTS.findIndex(c => c.id === id)
    if (idx !== -1) Object.assign(MOCK_CLIENTS[idx], data)
    return { data: MOCK_CLIENTS[idx] }
  },
  getActivity: async (id: number) => { await delay(); return { data: MOCK_ACTIVITY[id] ?? [] } },
}

// ── Tasks ─────────────────────────────────────────────────
export const mockTasks = {
  list: async () => { await delay(); return { data: MOCK_TASKS } },
  get: async (id: number) => { await delay(); return { data: MOCK_TASKS.find(t => t.id === id)! } },
  create: async (data: any) => {
    await delay()
    const task: Task = { ...data, id: Date.now(), firm_id: 1, assigned_by_id: _currentUser.id, status: 'todo', document_requests: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    MOCK_TASKS.push(task)
    return { data: task }
  },
  update: async (id: number, data: any) => {
    await delay()
    const idx = MOCK_TASKS.findIndex(t => t.id === id)
    if (idx !== -1) Object.assign(MOCK_TASKS[idx], data)
    return { data: MOCK_TASKS[idx] }
  },
  markDocUploaded: async (taskId: number, docId: number) => {
    await delay(150)
    MOCK_TASKS.forEach(t => t.document_requests.forEach(d => {
      if (d.id === docId) { d.is_uploaded = true; d.uploaded_at = new Date().toISOString() }
    }))
    return { data: { message: 'Marked uploaded' } }
  },
}

// ── Filings ───────────────────────────────────────────────
export const mockFilings = {
  list: async (params?: { client_id?: number; filing_type?: string }) => {
    await delay()
    let data = MOCK_FILINGS
    if (params?.client_id) data = data.filter(f => f.client_id === params.client_id)
    if (params?.filing_type) data = data.filter(f => f.filing_type === params.filing_type)
    return { data }
  },
  get: async (id: number) => { await delay(); return { data: MOCK_FILINGS.find(f => f.id === id)! } },
  create: async (data: any) => {
    await delay()
    const filing: Filing = { ...data, id: Date.now(), firm_id: 1, filled_by_id: _currentUser.id, status: 'draft', created_at: new Date().toISOString() }
    MOCK_FILINGS.push(filing)
    return { data: filing }
  },
  update: async (id: number, data: any) => {
    await delay()
    const idx = MOCK_FILINGS.findIndex(f => f.id === id)
    if (idx !== -1) Object.assign(MOCK_FILINGS[idx], data)
    return { data: MOCK_FILINGS[idx] }
  },
}

// ── Communications ────────────────────────────────────────
export const mockComms = {
  listThreads: async () => { await delay(); return { data: MOCK_THREADS } },
  createThread: async (data: any) => {
    await delay()
    const thread = { ...data, id: Date.now(), firm_id: 1, created_at: new Date().toISOString(), channel: 'internal' as const, unread_count: 0 }
    MOCK_THREADS.push(thread)
    MOCK_MESSAGES[thread.id] = []
    return { data: thread }
  },
  getMessages: async (threadId: number) => { await delay(); return { data: MOCK_MESSAGES[threadId] ?? [] } },
  sendMessage: async (threadId: number, content: string) => {
    await delay(200)
    const msg = { id: Date.now(), thread_id: threadId, sender_id: _currentUser.id, content, is_read: false, created_at: new Date().toISOString(), source: 'internal' as const }
    if (!MOCK_MESSAGES[threadId]) MOCK_MESSAGES[threadId] = []
    MOCK_MESSAGES[threadId].push(msg)
    return { data: msg }
  },
}

// ── Alerts ────────────────────────────────────────────────
export const mockAlerts = {
  list: async (unreadOnly?: boolean) => {
    await delay()
    return { data: unreadOnly ? MOCK_ALERTS.filter(a => !a.is_read) : MOCK_ALERTS }
  },
  markRead: async (id: number) => {
    await delay(100)
    const a = MOCK_ALERTS.find(a => a.id === id)
    if (a) a.is_read = true
    return { data: {} }
  },
  markAllRead: async () => { await delay(100); MOCK_ALERTS.forEach(a => a.is_read = true); return { data: {} } },
}

// ── Dashboard ─────────────────────────────────────────────
export const mockDashboard = {
  get: async () => { await delay(); return { data: MOCK_DASHBOARD } },
}

// ── New module APIs ───────────────────────────────────────
export const mockComplianceApi = {
  health: async () => { await delay(); return { data: MOCK_COMPLIANCE_HEALTH } },
  gstReturns: async (params?: any) => {
    await delay()
    let data = MOCK_GST_RETURNS
    if (params?.client_id) data = data.filter(r => r.client_id === params.client_id)
    if (params?.return_type) data = data.filter(r => r.return_type === params.return_type)
    return { data }
  },
  gstReconciliation: async () => { await delay(); return { data: MOCK_GST_RECONCILIATION } },
  tdsReturns: async (params?: any) => {
    await delay()
    let data = MOCK_TDS_RETURNS
    if (params?.client_id) data = data.filter(r => r.client_id === params.client_id)
    return { data }
  },
  tdsIssues: async () => { await delay(); return { data: MOCK_TDS_ISSUES } },
  audits: async () => { await delay(); return { data: MOCK_AUDITS } },
  workingPapers: async (auditId: number) => { await delay(); return { data: MOCK_WORKING_PAPERS.filter(w => w.audit_id === auditId) } },
  observations: async (auditId?: number) => {
    await delay()
    return { data: auditId ? MOCK_OBSERVATIONS.filter(o => o.audit_id === auditId) : MOCK_OBSERVATIONS }
  },
  approvals: async () => { await delay(); return { data: MOCK_APPROVALS } },
  missingDocs: async () => { await delay(); return { data: MOCK_MISSING_DOCS } },
  notices: async () => { await delay(); return { data: MOCK_NOTICES } },
  documents: async (params?: any) => {
    await delay()
    let data = MOCK_DOCUMENTS
    if (params?.client_id) data = data.filter(d => d.client_id === params.client_id)
    if (params?.category) data = data.filter(d => d.category === params.category)
    return { data }
  },
  calendarEvents: async () => { await delay(); return { data: MOCK_CALENDAR_EVENTS } },
  reports: async () => { await delay(); return { data: MOCK_REPORTS } },
  firm: async () => { await delay(); return { data: MOCK_FIRM } },
}
