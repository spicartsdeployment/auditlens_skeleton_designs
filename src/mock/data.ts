import type {
  User, Client, Task, Filing, Thread, Message,
  Alert, DashboardData, DocumentRequest
} from '@/shared/types'

// ── Firm ─────────────────────────────────────────────────
export const MOCK_FIRM = { id: 1, name: 'AuditLens Demo CA Firm', plan: 'Professional', renewal_date: '2027-03-31', max_pans: 50, used_pans: 37, max_storage_gb: 100, used_storage_gb: 42, active_users: 4 }

// ── Users ─────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: 1, firm_id: 1, email: 'superadmin@auditlens.demo', full_name: 'Arjun Mehta', role: 'super_admin', phone: '+91 98765 00001', is_active: true, last_active: '2026-06-23T07:00:00Z', created_at: '2026-01-01T00:00:00Z', permissions: [] },
  { id: 2, firm_id: 1, email: 'admin@auditlens.demo', full_name: 'Priya Sharma', role: 'admin', phone: '+91 98765 00002', is_active: true, last_active: '2026-06-22T14:30:00Z', created_at: '2026-01-05T00:00:00Z', permissions: [] },
  { id: 3, firm_id: 1, email: 'article@auditlens.demo', full_name: 'Rohan Verma', role: 'article', phone: '+91 98765 00003', is_active: true, last_active: '2026-06-23T06:00:00Z', created_at: '2026-02-10T00:00:00Z', permissions: [] },
  { id: 4, firm_id: 1, email: 'article2@auditlens.demo', full_name: 'Sneha Iyer', role: 'article', phone: '+91 98765 00004', is_active: true, last_active: '2026-06-21T10:00:00Z', created_at: '2026-03-01T00:00:00Z', permissions: [] },
]

// ── Clients ───────────────────────────────────────────────
export const MOCK_CLIENTS: Client[] = [
  { id: 1, firm_id: 1, legal_name: 'Sunrise Textiles Pvt Ltd', trade_name: 'Sunrise Textiles', gstin: '27AABCS1429B1ZB', pan: 'AABCS1429B', contact_name: 'Rahul Desai', contact_email: 'rahul@sunrisetextiles.com', contact_phone: '+91 98700 11111', address: '12, Industrial Estate, Surat, Gujarat', state: 'Gujarat', assigned_admin_id: 2, assigned_article_id: 3, assigned_admin: MOCK_USERS[1], assigned_article: MOCK_USERS[2], gst_enabled: true, tds_enabled: true, audit_enabled: true, is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-06-20T00:00:00Z' },
  { id: 2, firm_id: 1, legal_name: 'BlueSky Software Solutions', trade_name: 'BlueSky Tech', gstin: '29AADCB2230M1ZV', pan: 'AADCB2230M', contact_name: 'Ananya Krishnan', contact_email: 'ananya@bluesky.io', contact_phone: '+91 98700 22222', address: '45, Koramangala, Bengaluru, Karnataka', state: 'Karnataka', assigned_admin_id: 2, assigned_article_id: 4, assigned_admin: MOCK_USERS[1], assigned_article: MOCK_USERS[3], gst_enabled: true, tds_enabled: true, audit_enabled: false, is_active: true, created_at: '2026-02-01T00:00:00Z', updated_at: '2026-06-18T00:00:00Z' },
  { id: 3, firm_id: 1, legal_name: 'Redwood Constructions LLP', trade_name: undefined, gstin: '07AAECR1234F1ZQ', pan: 'AAECR1234F', contact_name: 'Vikram Singh', contact_email: 'vikram@redwoodconstruct.in', contact_phone: '+91 98700 33333', address: 'Plot 22, Sector 62, Noida, UP', state: 'Uttar Pradesh', assigned_admin_id: 2, assigned_article_id: 3, assigned_admin: MOCK_USERS[1], assigned_article: MOCK_USERS[2], gst_enabled: true, tds_enabled: false, audit_enabled: false, is_active: true, created_at: '2026-03-10T00:00:00Z', updated_at: '2026-06-15T00:00:00Z' },
  { id: 4, firm_id: 1, legal_name: 'Green Pharma Distributors', trade_name: 'GreenPharma', gstin: '09AABHG5678K1ZY', pan: 'AABHG5678K', contact_name: 'Meena Kapoor', contact_email: 'meena@greenpharma.com', contact_phone: '+91 98700 44444', address: '88, MG Road, Lucknow, UP', state: 'Uttar Pradesh', assigned_admin_id: 2, assigned_article_id: 4, assigned_admin: MOCK_USERS[1], assigned_article: MOCK_USERS[3], gst_enabled: true, tds_enabled: true, audit_enabled: true, is_active: false, created_at: '2025-11-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
  { id: 5, firm_id: 1, legal_name: 'Apex Auto Parts', trade_name: undefined, gstin: '24AAAPA9012J1ZK', pan: 'AAAPA9012J', contact_name: 'Suresh Patel', contact_email: 'suresh@apexauto.in', contact_phone: '+91 98700 55555', address: '5, GIDC, Rajkot, Gujarat', state: 'Gujarat', assigned_admin_id: 2, assigned_article_id: 3, assigned_admin: MOCK_USERS[1], assigned_article: MOCK_USERS[2], gst_enabled: true, tds_enabled: false, audit_enabled: false, is_active: true, created_at: '2026-04-01T00:00:00Z', updated_at: '2026-06-22T00:00:00Z' },
]

// ── Compliance Health ─────────────────────────────────────
export const MOCK_COMPLIANCE_HEALTH = {
  overall: 82,
  factors: { gst: 88, tds: 75, audit: 70, documents: 90 },
  client_scores: [
    { client_id: 1, client_name: 'Sunrise Textiles', score: 91, trend: 'up' },
    { client_id: 2, client_name: 'BlueSky Tech', score: 85, trend: 'stable' },
    { client_id: 3, client_name: 'Redwood Constructions', score: 78, trend: 'down' },
    { client_id: 4, client_name: 'Green Pharma', score: 65, trend: 'down' },
    { client_id: 5, client_name: 'Apex Auto Parts', score: 88, trend: 'up' },
  ]
}

// ── GST Returns ───────────────────────────────────────────
export const MOCK_GST_RETURNS = [
  { id: 1, client_id: 1, client_name: 'Sunrise Textiles', return_type: 'GSTR-1', period: 'May 2026', due_date: '2026-06-11', status: 'overdue', assigned_to: 'Rohan Verma', amount: null },
  { id: 2, client_id: 1, client_name: 'Sunrise Textiles', return_type: 'GSTR-3B', period: 'May 2026', due_date: '2026-06-20', status: 'filed', filed_date: '2026-06-19', assigned_to: 'Rohan Verma', amount: 245800 },
  { id: 3, client_id: 2, client_name: 'BlueSky Tech', return_type: 'GSTR-1', period: 'May 2026', due_date: '2026-06-11', status: 'pending', assigned_to: 'Sneha Iyer', amount: null },
  { id: 4, client_id: 2, client_name: 'BlueSky Tech', return_type: 'GSTR-3B', period: 'May 2026', due_date: '2026-06-20', status: 'pending', assigned_to: 'Sneha Iyer', amount: null },
  { id: 5, client_id: 3, client_name: 'Redwood Constructions', return_type: 'GSTR-1', period: 'May 2026', due_date: '2026-06-11', status: 'filed', filed_date: '2026-06-10', assigned_to: 'Rohan Verma', amount: 112300 },
  { id: 6, client_id: 3, client_name: 'Redwood Constructions', return_type: 'GSTR-3B', period: 'May 2026', due_date: '2026-06-20', status: 'filed', filed_date: '2026-06-19', assigned_to: 'Rohan Verma', amount: 98500 },
  { id: 7, client_id: 5, client_name: 'Apex Auto Parts', return_type: 'GSTR-1', period: 'May 2026', due_date: '2026-06-11', status: 'in_review', assigned_to: 'Rohan Verma', amount: null },
  { id: 8, client_id: 1, client_name: 'Sunrise Textiles', return_type: 'GSTR-9', period: 'FY 2025-26', due_date: '2026-12-31', status: 'pending', assigned_to: 'Rohan Verma', amount: null },
]

export const MOCK_GST_RECONCILIATION = {
  summary: { matched: 142, partial: 18, mismatched: 7, missing: 4 },
  mismatches: [
    { id: 1, gstin: '27AABCS1429B1ZB', vendor_name: 'Rama Cotton Ltd', period: 'Mar 2026', books_amount: 45000, portal_amount: 42000, difference: 3000, status: 'pending' },
    { id: 2, gstin: '29AADCB2230M1ZV', vendor_name: 'Delta Supplies', period: 'Apr 2026', books_amount: 12500, portal_amount: 15000, difference: -2500, status: 'under_review' },
    { id: 3, gstin: '24AAAPA9012J1ZK', vendor_name: 'Veena Traders', period: 'May 2026', books_amount: 8800, portal_amount: 9200, difference: -400, status: 'pending' },
  ]
}

// ── TDS Returns ───────────────────────────────────────────
export const MOCK_TDS_RETURNS = [
  { id: 1, client_id: 1, client_name: 'Sunrise Textiles', return_type: '26Q', quarter: 'Q4 FY 2025-26', due_date: '2026-06-30', status: 'pending', deductees: 14, total_tds: 182000, assigned_to: 'Rohan Verma' },
  { id: 2, client_id: 2, client_name: 'BlueSky Tech', return_type: '26Q', quarter: 'Q4 FY 2025-26', due_date: '2026-06-30', status: 'in_review', deductees: 8, total_tds: 95000, assigned_to: 'Sneha Iyer' },
  { id: 3, client_id: 1, client_name: 'Sunrise Textiles', return_type: '24Q', quarter: 'Q4 FY 2025-26', due_date: '2026-06-30', status: 'filed', filed_date: '2026-06-25', deductees: 45, total_tds: 520000, assigned_to: 'Rohan Verma' },
  { id: 4, client_id: 4, client_name: 'Green Pharma', return_type: '26Q', quarter: 'Q4 FY 2025-26', due_date: '2026-06-30', status: 'overdue', deductees: 6, total_tds: 48000, assigned_to: 'Sneha Iyer' },
  { id: 5, client_id: 3, client_name: 'Redwood Constructions', return_type: '26Q', quarter: 'Q3 FY 2025-26', due_date: '2026-01-31', status: 'filed', filed_date: '2026-01-29', deductees: 12, total_tds: 145000, assigned_to: 'Rohan Verma' },
]

export const MOCK_TDS_ISSUES = [
  { id: 1, type: 'pan_invalid', client_name: 'Sunrise Textiles', vendor_name: 'Rama Cotton Ltd', pan: 'ABCDE1234Z', issue: 'PAN not found in Income Tax database' },
  { id: 2, type: 'challan', client_name: 'BlueSky Tech', quarter: 'Q4 FY 2025-26', challan_no: 'BSR001234', issue: 'Challan amount mismatch — booked ₹12,500, portal shows ₹10,000' },
  { id: 3, type: 'lower_deduction', client_name: 'Sunrise Textiles', vendor_name: 'Delta Services', pan: 'PQRST9876Y', issue: 'Lower deduction certificate expired on 31 Mar 2026' },
]

// ── Audit ─────────────────────────────────────────────────
export const MOCK_AUDITS = [
  { id: 1, client_id: 1, client_name: 'Sunrise Textiles Pvt Ltd', type: 'statutory', fy: 'FY 2025-26', status: 'in_progress', phase: 'working_papers', risk_level: 'medium', assigned_to: 3, started_at: '2026-05-01', expected_completion: '2026-09-30', completion_pct: 45 },
  { id: 2, client_id: 4, client_name: 'Green Pharma Distributors', type: 'tax', fy: 'FY 2025-26', status: 'in_progress', phase: 'risk_assessment', risk_level: 'high', assigned_to: 4, started_at: '2026-06-10', expected_completion: '2026-10-31', completion_pct: 20 },
  { id: 3, client_id: 2, client_name: 'BlueSky Software Solutions', type: 'internal', fy: 'FY 2025-26', status: 'planning', phase: 'planning', risk_level: 'low', assigned_to: 3, started_at: '2026-06-20', expected_completion: '2026-08-31', completion_pct: 10 },
  { id: 4, client_id: 3, client_name: 'Redwood Constructions LLP', type: 'statutory', fy: 'FY 2024-25', status: 'completed', phase: 'final_signoff', risk_level: 'low', assigned_to: 3, started_at: '2025-05-01', expected_completion: '2025-09-30', completion_pct: 100 },
]

export const MOCK_WORKING_PAPERS = [
  { id: 1, audit_id: 1, title: 'Cash & Bank Verification', area: 'Balance Sheet', status: 'completed', reviewer: 'Priya Sharma', due_date: '2026-07-15', completed_at: '2026-07-10', version: 3, has_observations: false },
  { id: 2, audit_id: 1, title: 'Trade Receivables Schedule', area: 'Balance Sheet', status: 'in_review', reviewer: 'Priya Sharma', due_date: '2026-07-20', completed_at: null, version: 2, has_observations: true },
  { id: 3, audit_id: 1, title: 'Fixed Assets Verification', area: 'Balance Sheet', status: 'in_progress', reviewer: 'Priya Sharma', due_date: '2026-07-25', completed_at: null, version: 1, has_observations: false },
  { id: 4, audit_id: 1, title: 'Revenue Recognition Testing', area: 'P&L', status: 'pending', reviewer: null, due_date: '2026-08-05', completed_at: null, version: 1, has_observations: false },
  { id: 5, audit_id: 1, title: 'Related Party Transactions', area: 'Disclosures', status: 'pending', reviewer: null, due_date: '2026-08-10', completed_at: null, version: 1, has_observations: true },
]

export const MOCK_OBSERVATIONS = [
  { id: 1, audit_id: 1, obs_id: 'OBS-2026-001', area: 'Trade Receivables', severity: 'high', title: 'Overdue receivables not adequately provided', description: 'Receivables outstanding for >180 days amounting to ₹34.2L have no provision. Per Ind AS 109, these require expected credit loss provisioning.', evidence: 'Debtor ageing schedule, AR ledger extracts', recommendation: 'Create provision of minimum ₹10.26L (30%) for 180+ day overdue debtors as per ECL model', management_response: 'Management agrees and will create provision in Q1 FY 2026-27', status: 'open', created_at: '2026-07-12T00:00:00Z' },
  { id: 2, audit_id: 1, obs_id: 'OBS-2026-002', area: 'Related Party', severity: 'medium', title: 'Related party disclosures incomplete', description: 'Transactions with M/s Mehta Trading (promoter-owned entity) not disclosed in notes to accounts. Transactions total ₹8.5L during FY 2025-26.', evidence: 'Bank statements, payment vouchers, ROC records', recommendation: 'Disclose all related party transactions as required under Ind AS 24.', management_response: null, status: 'open', created_at: '2026-07-14T00:00:00Z' },
  { id: 3, audit_id: 2, obs_id: 'OBS-2026-003', area: 'Inventory', severity: 'critical', title: 'Physical inventory not conducted', description: 'No physical stock count was done at year end. Management relies solely on book records. Per SA 501, physical verification is mandatory.', evidence: 'Audit inquiry memo dated 15 Jun 2026', recommendation: 'Conduct physical inventory immediately and reconcile with books. Implement quarterly stock takes.', management_response: null, status: 'open', created_at: '2026-06-15T00:00:00Z' },
  { id: 4, audit_id: 1, obs_id: 'OBS-2026-004', area: 'Cash', severity: 'low', title: 'Cash in hand exceeds daily limit policy', description: 'Cash in hand on 3 occasions exceeded the internal policy limit of ₹50,000. Maximum observed: ₹1,85,000.', evidence: 'Petty cash register for Apr-May 2026', recommendation: 'Enforce daily cash deposit policy. Configure ERP alert for limit breach.', management_response: 'Cashier has been counselled. New SOP issued.', status: 'resolved', created_at: '2026-07-10T00:00:00Z' },
]

// ── Tasks ─────────────────────────────────────────────────
const DOCS_GSTR1: DocumentRequest[] = [
  { id: 1, name: 'Sales Register', description: 'Month-wise sales data', is_required: true, is_uploaded: true, uploaded_at: '2026-06-10T00:00:00Z' },
  { id: 2, name: 'B2B Invoice Summary', description: 'GST-registered buyer invoices', is_required: true, is_uploaded: true, uploaded_at: '2026-06-11T00:00:00Z' },
  { id: 3, name: 'B2C Invoice Summary', description: 'Consumer invoices', is_required: false, is_uploaded: false },
]
const DOCS_AUDIT: DocumentRequest[] = [
  { id: 4, name: 'Balance Sheet FY 2025-26', description: 'Audited financials', is_required: true, is_uploaded: false },
  { id: 5, name: 'P&L Statement', description: 'Profit & Loss account', is_required: true, is_uploaded: false },
  { id: 6, name: 'Bank Statements (all accounts)', description: '12 months', is_required: true, is_uploaded: true, uploaded_at: '2026-06-05T00:00:00Z' },
]
const DOCS_TDS: DocumentRequest[] = [
  { id: 7, name: 'Salary Details (Form 16)', description: 'For all employees', is_required: true, is_uploaded: true, uploaded_at: '2026-06-08T00:00:00Z' },
  { id: 8, name: 'TDS Challan Details', description: 'Quarter challans', is_required: true, is_uploaded: false },
]

export const MOCK_TASKS: Task[] = [
  { id: 1, firm_id: 1, client_id: 1, assigned_by_id: 2, assigned_to_id: 3, title: 'GSTR-1 Filing — May 2026', description: 'Monthly GST return for outward supplies', task_type: 'gst', status: 'in_progress', priority: 1, deadline: '2026-06-11T00:00:00Z', created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-09T00:00:00Z', document_requests: DOCS_GSTR1 },
  { id: 2, firm_id: 1, client_id: 2, assigned_by_id: 2, assigned_to_id: 4, title: 'TDS Return 26Q — Q4 FY 2025-26', description: 'Non-salary TDS return filing', task_type: 'tds', status: 'todo', priority: 2, deadline: '2026-06-30T00:00:00Z', created_at: '2026-06-03T00:00:00Z', updated_at: '2026-06-03T00:00:00Z', document_requests: DOCS_TDS },
  { id: 3, firm_id: 1, client_id: 1, assigned_by_id: 2, assigned_to_id: 3, title: 'Statutory Audit FY 2025-26 — Sunrise Textiles', description: 'Annual statutory audit under Companies Act 2013', task_type: 'audit', status: 'in_review', priority: 1, deadline: '2026-09-30T00:00:00Z', created_at: '2026-05-01T00:00:00Z', updated_at: '2026-06-20T00:00:00Z', document_requests: DOCS_AUDIT },
  { id: 4, firm_id: 1, client_id: 3, assigned_by_id: 2, assigned_to_id: 3, title: 'GSTR-3B Filing — May 2026', description: 'Monthly summary GST return', task_type: 'gst', status: 'done', priority: 2, deadline: '2026-06-20T00:00:00Z', created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-19T00:00:00Z', document_requests: [] },
  { id: 5, firm_id: 1, client_id: 5, assigned_by_id: 2, assigned_to_id: 4, title: 'GSTR-1 Filing — May 2026 — Apex Auto', description: 'Monthly return', task_type: 'gst', status: 'todo', priority: 3, deadline: '2026-06-11T00:00:00Z', created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', document_requests: [] },
  { id: 6, firm_id: 1, client_id: 4, assigned_by_id: 2, assigned_to_id: 4, title: 'Tax Audit — Green Pharma FY 2025-26', description: 'Section 44AB tax audit report', task_type: 'audit', status: 'todo', priority: 1, deadline: '2026-10-31T00:00:00Z', created_at: '2026-06-10T00:00:00Z', updated_at: '2026-06-10T00:00:00Z', document_requests: [] },
]

// ── Approval Queue ────────────────────────────────────────
export const MOCK_APPROVALS = [
  { id: 1, type: 'gst_filing', title: 'GSTR-3B — Sunrise Textiles — May 2026', prepared_by: 3, prepared_by_name: 'Rohan Verma', submitted_at: '2026-06-18T10:00:00Z', status: 'pending_review', module: 'gst', client_id: 1, client_name: 'Sunrise Textiles' },
  { id: 2, type: 'tds_return', title: '26Q — BlueSky Tech — Q4 FY 2025-26', prepared_by: 4, prepared_by_name: 'Sneha Iyer', submitted_at: '2026-06-22T14:00:00Z', status: 'pending_approval', module: 'tds', client_id: 2, client_name: 'BlueSky Tech' },
  { id: 3, type: 'audit_wp', title: 'Working Paper: Trade Receivables — Sunrise', prepared_by: 3, prepared_by_name: 'Rohan Verma', submitted_at: '2026-07-11T09:00:00Z', status: 'pending_review', module: 'audit', client_id: 1, client_name: 'Sunrise Textiles' },
  { id: 4, type: 'gst_filing', title: 'GSTR-1 — Apex Auto — May 2026', prepared_by: 4, prepared_by_name: 'Sneha Iyer', submitted_at: '2026-06-10T16:00:00Z', status: 'approved', module: 'gst', client_id: 5, client_name: 'Apex Auto Parts', approved_by: 2, approved_at: '2026-06-11T09:00:00Z' },
]

// ── Missing Documents ────────────────────────────────────
export const MOCK_MISSING_DOCS = [
  { id: 1, client_id: 1, client_name: 'Sunrise Textiles', document: 'Balance Sheet FY 2025-26', module: 'audit', requested_date: '2026-06-01', reminder_count: 3, status: 'overdue' },
  { id: 2, client_id: 1, client_name: 'Sunrise Textiles', document: 'P&L Statement FY 2025-26', module: 'audit', requested_date: '2026-06-01', reminder_count: 3, status: 'overdue' },
  { id: 3, client_id: 2, client_name: 'BlueSky Tech', document: 'TDS Challan Details Q4', module: 'tds', requested_date: '2026-06-10', reminder_count: 1, status: 'pending' },
  { id: 4, client_id: 4, client_name: 'Green Pharma', document: 'TDS Challan Details Q4', module: 'tds', requested_date: '2026-06-10', reminder_count: 2, status: 'pending' },
  { id: 5, client_id: 4, client_name: 'Green Pharma', document: 'Stock Statement Mar 2026', module: 'audit', requested_date: '2026-06-15', reminder_count: 1, status: 'pending' },
  { id: 6, client_id: 3, client_name: 'Redwood Constructions', document: 'B2C Invoice Summary May 2026', module: 'gst', requested_date: '2026-06-08', reminder_count: 0, status: 'requested' },
]

// ── Notices ───────────────────────────────────────────────
export const MOCK_NOTICES = [
  { id: 1, notice_no: 'GST/NOT/2026/00145', client_id: 1, client_name: 'Sunrise Textiles', type: 'gst', sub_type: 'Scrutiny', subject: 'GSTR-1 vs GSTR-3B Mismatch — FY 2024-25', received_date: '2026-05-15', due_date: '2026-07-15', status: 'response_preparation', assigned_to: 3, priority: 'high' },
  { id: 2, notice_no: 'ITAX/SCR/2025/4421', client_id: 4, client_name: 'Green Pharma', type: 'income_tax', sub_type: 'Assessment', subject: 'Selected for Limited Scrutiny — AY 2024-25', received_date: '2026-04-01', due_date: '2026-06-30', status: 'overdue', assigned_to: 2, priority: 'critical' },
  { id: 3, notice_no: 'GST/NOT/2026/00198', client_id: 2, client_name: 'BlueSky Tech', type: 'gst', sub_type: 'Demand', subject: 'ITC mismatch for Q3 FY 2024-25', received_date: '2026-06-01', due_date: '2026-08-01', status: 'assigned', assigned_to: 4, priority: 'medium' },
  { id: 4, notice_no: 'GST/NOT/2025/09876', client_id: 3, client_name: 'Redwood Constructions', type: 'gst', sub_type: 'Routine', subject: 'Annual information return verification', received_date: '2025-12-15', due_date: '2026-02-15', status: 'closed', assigned_to: 3, priority: 'low' },
]

// ── Documents Repository ──────────────────────────────────
export const MOCK_DOCUMENTS = [
  // Sunrise Textiles
  { id: 1, client_id: 1, client_name: 'Sunrise Textiles', fy: 'FY 2025-26', category: 'GST', name: 'GSTR-3B May 2026 Acknowledgement.pdf', size_kb: 245, uploaded_by: 3, uploaded_at: '2026-06-19T10:00:00Z', version: 1 },
  { id: 2, client_id: 1, client_name: 'Sunrise Textiles', fy: 'FY 2025-26', category: 'Financials', name: 'Bank Statement Apr 2026.pdf', size_kb: 1240, uploaded_by: 3, uploaded_at: '2026-06-05T00:00:00Z', version: 1 },
  { id: 3, client_id: 1, client_name: 'Sunrise Textiles', fy: 'FY 2025-26', category: 'TDS', name: 'Form 16 FY 2025-26.pdf', size_kb: 890, uploaded_by: 3, uploaded_at: '2026-06-08T00:00:00Z', version: 2 },
  { id: 4, client_id: 1, client_name: 'Sunrise Textiles', fy: 'FY 2024-25', category: 'Audit', name: 'Audit Report FY 2024-25.pdf', size_kb: 3400, uploaded_by: 2, uploaded_at: '2025-09-28T00:00:00Z', version: 1 },
  // BlueSky Tech
  { id: 5, client_id: 2, client_name: 'BlueSky Tech', fy: 'FY 2025-26', category: 'GST', name: 'GSTR-1 Apr 2026 Acknowledgement.pdf', size_kb: 198, uploaded_by: 4, uploaded_at: '2026-05-10T00:00:00Z', version: 1 },
  { id: 6, client_id: 2, client_name: 'BlueSky Tech', fy: 'FY 2025-26', category: 'Financials', name: 'Balance Sheet Q3 FY 2025-26.xlsx', size_kb: 456, uploaded_by: 4, uploaded_at: '2026-04-15T00:00:00Z', version: 3 },
  // Redwood
  { id: 7, client_id: 3, client_name: 'Redwood Constructions', fy: 'FY 2025-26', category: 'GST', name: 'GSTR-3B May 2026.pdf', size_kb: 210, uploaded_by: 3, uploaded_at: '2026-06-19T11:00:00Z', version: 1 },
  { id: 8, client_id: 3, client_name: 'Redwood Constructions', fy: 'FY 2025-26', category: 'Legal', name: 'LLP Agreement.pdf', size_kb: 1850, uploaded_by: 2, uploaded_at: '2026-01-10T00:00:00Z', version: 1 },
]

// ── Calendar Events ───────────────────────────────────────
export const MOCK_CALENDAR_EVENTS = [
  // GST deadlines
  { id: 1, type: 'gst', title: 'GSTR-1 Due — All Clients', date: '2026-07-11', color: 'blue', client_ids: [1,2,3,4,5] },
  { id: 2, type: 'gst', title: 'GSTR-3B Due — All Clients', date: '2026-07-20', color: 'blue', client_ids: [1,2,3,4,5] },
  { id: 3, type: 'gst', title: 'GSTR-1 Due — All Clients', date: '2026-08-11', color: 'blue', client_ids: [1,2,3,4,5] },
  { id: 4, type: 'gst', title: 'GSTR-3B Due — All Clients', date: '2026-08-20', color: 'blue', client_ids: [1,2,3,4,5] },
  // TDS deadlines
  { id: 5, type: 'tds', title: 'TDS 26Q Q4 Due — Sunrise & BlueSky', date: '2026-06-30', color: 'amber', client_ids: [1,2] },
  { id: 6, type: 'tds', title: 'TDS Challan Due (Monthly)', date: '2026-07-07', color: 'amber', client_ids: [1,2] },
  // Audit
  { id: 7, type: 'audit', title: 'Working Papers Review — Sunrise', date: '2026-07-20', color: 'green', client_ids: [1] },
  { id: 8, type: 'audit', title: 'Tax Audit Due Date', date: '2026-10-31', color: 'green', client_ids: [4] },
  { id: 9, type: 'audit', title: 'Statutory Audit Due Date', date: '2026-09-30', color: 'green', client_ids: [1] },
  // Notice deadlines
  { id: 10, type: 'notice', title: 'GST Notice Reply Due — Sunrise', date: '2026-07-15', color: 'red', client_ids: [1] },
  { id: 11, type: 'notice', title: 'IT Notice Reply Due — Green Pharma', date: '2026-06-30', color: 'red', client_ids: [4] },
  // Meetings
  { id: 12, type: 'meeting', title: 'Client Review — BlueSky Tech', date: '2026-06-28', color: 'purple', client_ids: [2] },
  { id: 13, type: 'meeting', title: 'Annual Planning — Sunrise Textiles', date: '2026-07-05', color: 'purple', client_ids: [1] },
]

// ── Reports Data ──────────────────────────────────────────
export const MOCK_REPORTS = {
  firm: {
    revenue: [
      { month: 'Jan 26', amount: 285000 }, { month: 'Feb 26', amount: 310000 },
      { month: 'Mar 26', amount: 420000 }, { month: 'Apr 26', amount: 275000 },
      { month: 'May 26', amount: 330000 }, { month: 'Jun 26', amount: 295000 },
    ],
    client_utilization: [
      { client: 'Sunrise Textiles', billed_hours: 128, revenue: 192000, status: 'active' },
      { client: 'BlueSky Tech', billed_hours: 64, revenue: 96000, status: 'active' },
      { client: 'Redwood Constructions', billed_hours: 48, revenue: 72000, status: 'active' },
      { client: 'Green Pharma', billed_hours: 96, revenue: 144000, status: 'active' },
      { client: 'Apex Auto Parts', billed_hours: 32, revenue: 48000, status: 'active' },
    ],
    staff_utilization: [
      { staff: 'Rohan Verma', assigned: 4, completed: 2, utilization_pct: 85 },
      { staff: 'Sneha Iyer', assigned: 3, completed: 1, utilization_pct: 72 },
      { staff: 'Priya Sharma', assigned: 8, completed: 6, utilization_pct: 90 },
    ],
    compliance_status: { gst: { total: 8, filed: 4, pending: 3, overdue: 1 }, tds: { total: 5, filed: 2, pending: 2, overdue: 1 }, audit: { total: 4, completed: 1, in_progress: 2, planned: 1 } }
  }
}

// ── Filings ───────────────────────────────────────────────
export const MOCK_FILINGS: Filing[] = [
  { id: 1, firm_id: 1, client_id: 1, filled_by_id: 3, reviewed_by_id: 2, filing_type: 'gstr3b', status: 'filed', period: '2026-05', reference_id: 'AA2605001ZZ', due_date: '2026-06-20T00:00:00Z', filed_at: '2026-06-19T10:00:00Z', submitted_at: '2026-06-18T00:00:00Z', created_at: '2026-06-01T00:00:00Z' },
  { id: 2, firm_id: 1, client_id: 1, filled_by_id: 3, reviewed_by_id: undefined, filing_type: 'gstr1', status: 'in_review', period: '2026-05', reference_id: undefined, due_date: '2026-06-11T00:00:00Z', created_at: '2026-06-01T00:00:00Z' },
  { id: 3, firm_id: 1, client_id: 2, filled_by_id: 4, reviewed_by_id: undefined, filing_type: 'tds_26q', status: 'draft', period: '2026-Q4', due_date: '2026-06-30T00:00:00Z', created_at: '2026-06-03T00:00:00Z' },
  { id: 4, firm_id: 1, client_id: 3, filled_by_id: 3, reviewed_by_id: 2, filing_type: 'gstr3b', status: 'filed', period: '2026-05', reference_id: 'CC2605003YY', due_date: '2026-06-20T00:00:00Z', filed_at: '2026-06-19T11:00:00Z', submitted_at: '2026-06-18T00:00:00Z', created_at: '2026-06-01T00:00:00Z' },
  { id: 5, firm_id: 1, client_id: 1, filled_by_id: undefined, reviewed_by_id: undefined, filing_type: 'audit_statutory', status: 'draft', period: '2025-26', due_date: '2026-09-30T00:00:00Z', created_at: '2026-05-01T00:00:00Z' },
  { id: 6, firm_id: 1, client_id: 2, filled_by_id: 4, reviewed_by_id: undefined, filing_type: 'gstr1', status: 'submitted', period: '2026-04', reference_id: undefined, due_date: '2026-05-11T00:00:00Z', submitted_at: '2026-05-10T00:00:00Z', created_at: '2026-05-01T00:00:00Z' },
]

// ── Threads & Messages (with channel metadata) ───────────
export type ChannelType = 'internal' | 'whatsapp' | 'email' | 'portal'
export interface ThreadExt extends Thread {
  channel: ChannelType
  client_id?: number
  client_name?: string
  unread_count?: number
  last_message?: string
  last_message_at?: string
  participants?: number[]
}
export interface MessageExt extends Message {
  source: ChannelType
  sender_name?: string  // for external messages
  external_ref?: string // WhatsApp msg ID / email message-ID
  subject?: string      // for email
  attachments?: { name: string; size: string }[]
}

export const MOCK_THREADS: ThreadExt[] = [
  {
    id: 1, firm_id: 1, title: 'Sunrise Textiles — Audit Docs', is_group: true, created_at: '2026-06-15T09:00:00Z',
    channel: 'internal', participants: [2, 3], unread_count: 0,
    last_message: 'Followed up — client said they will send by tomorrow.', last_message_at: '2026-06-16T11:00:00Z',
  },
  {
    id: 2, firm_id: 1, title: 'GSTR-1 Deadline — Rohan', is_group: false, created_at: '2026-06-10T08:00:00Z',
    channel: 'internal', participants: [2, 3], unread_count: 0,
    last_message: 'On it, will submit today evening.', last_message_at: '2026-06-10T08:30:00Z',
  },
  {
    id: 3, firm_id: 1, title: 'Q4 TDS Coordination', is_group: true, created_at: '2026-06-20T09:00:00Z',
    channel: 'internal', participants: [2, 4], unread_count: 1,
    last_message: 'Form 16 is uploaded. TDS challan still pending from client.', last_message_at: '2026-06-20T09:15:00Z',
  },
  {
    id: 4, firm_id: 1, title: 'Rahul Desai (Sunrise Textiles)', is_group: false, created_at: '2026-06-18T14:00:00Z',
    channel: 'whatsapp', client_id: 1, client_name: 'Sunrise Textiles', unread_count: 2,
    last_message: "I'll share the Balance Sheet tonight, sorry for delay.", last_message_at: '2026-06-22T20:30:00Z',
  },
  {
    id: 5, firm_id: 1, title: 'Ananya Krishnan (BlueSky Tech)', is_group: false, created_at: '2026-06-19T11:00:00Z',
    channel: 'email', client_id: 2, client_name: 'BlueSky Tech', unread_count: 1,
    last_message: 'Please find attached TDS challan for April 2026...', last_message_at: '2026-06-21T11:30:00Z',
  },
  {
    id: 6, firm_id: 1, title: 'Vikram Singh (Redwood Constructions)', is_group: false, created_at: '2026-06-20T08:00:00Z',
    channel: 'portal', client_id: 3, client_name: 'Redwood Constructions', unread_count: 0,
    last_message: 'Documents uploaded to portal as requested.', last_message_at: '2026-06-20T08:15:00Z',
  },
  {
    id: 7, firm_id: 1, title: 'Meena Kapoor (Green Pharma)', is_group: false, created_at: '2026-06-17T10:00:00Z',
    channel: 'whatsapp', client_id: 4, client_name: 'Green Pharma', unread_count: 0,
    last_message: 'OK I will ask my accountant to share the details.', last_message_at: '2026-06-17T10:45:00Z',
  },
]

export const MOCK_MESSAGES: Record<number, MessageExt[]> = {
  1: [
    { id: 1, thread_id: 1, sender_id: 2, content: 'Hi team, please ensure all audit documents for Sunrise Textiles are ready by June 25th.', is_read: true, created_at: '2026-06-15T09:05:00Z', source: 'internal' },
    { id: 2, thread_id: 1, sender_id: 3, content: 'Balance sheet and P&L are pending. Bank statements already uploaded.', is_read: true, created_at: '2026-06-15T09:20:00Z', source: 'internal' },
    { id: 3, thread_id: 1, sender_id: 2, content: 'Please follow up with the client today.', is_read: true, created_at: '2026-06-15T10:00:00Z', source: 'internal' },
    { id: 4, thread_id: 1, sender_id: 3, content: 'Followed up — client said they will send by tomorrow.', is_read: true, created_at: '2026-06-16T11:00:00Z', source: 'internal' },
  ],
  2: [
    { id: 5, thread_id: 2, sender_id: 2, content: 'Rohan, GSTR-1 for May is due tomorrow. Please prioritize.', is_read: true, created_at: '2026-06-10T08:00:00Z', source: 'internal' },
    { id: 6, thread_id: 2, sender_id: 3, content: 'On it, will submit today evening.', is_read: true, created_at: '2026-06-10T08:30:00Z', source: 'internal' },
  ],
  3: [
    { id: 7, thread_id: 3, sender_id: 2, content: '26Q deadline is June 30. Sneha — BlueSky documents ready?', is_read: true, created_at: '2026-06-20T09:00:00Z', source: 'internal' },
    { id: 8, thread_id: 3, sender_id: 4, content: 'Form 16 is uploaded. TDS challan still pending from client.', is_read: false, created_at: '2026-06-20T09:15:00Z', source: 'internal' },
  ],
  4: [
    { id: 9, thread_id: 4, sender_id: 0, sender_name: 'Rahul Desai', content: 'Hi Priya, I just received the GST notice. What should I do?', is_read: true, created_at: '2026-06-18T14:02:00Z', source: 'whatsapp' },
    { id: 10, thread_id: 4, sender_id: 2, content: 'Hi Rahul, please don\'t worry. We are handling it. Can you share your sales register for May?', is_read: true, created_at: '2026-06-18T14:10:00Z', source: 'internal' },
    { id: 11, thread_id: 4, sender_id: 0, sender_name: 'Rahul Desai', content: "Sure, I'll share it by evening.", is_read: true, created_at: '2026-06-18T14:15:00Z', source: 'whatsapp' },
    { id: 12, thread_id: 4, sender_id: 0, sender_name: 'Rahul Desai', content: "I'll share the Balance Sheet tonight, sorry for delay.", is_read: false, created_at: '2026-06-22T20:30:00Z', source: 'whatsapp' },
  ],
  5: [
    { id: 13, thread_id: 5, sender_id: 0, sender_name: 'Ananya Krishnan', subject: 'TDS Challan — April 2026', content: 'Dear Priya,\n\nPlease find attached TDS challan for April 2026. Let me know if you need anything else.\n\nRegards,\nAnanya', is_read: true, created_at: '2026-06-19T11:00:00Z', source: 'email', attachments: [{ name: 'TDS_Challan_Apr26.pdf', size: '142 KB' }] },
    { id: 14, thread_id: 5, sender_id: 2, content: 'Thank you Ananya. We will process this and update you shortly.', is_read: true, created_at: '2026-06-19T11:30:00Z', source: 'internal' },
    { id: 15, thread_id: 5, sender_id: 0, sender_name: 'Ananya Krishnan', subject: 'Re: TDS Challan — April 2026', content: 'Also, can we schedule a call to discuss the annual audit? Our FY just closed.', is_read: false, created_at: '2026-06-21T11:30:00Z', source: 'email' },
  ],
  6: [
    { id: 16, thread_id: 6, sender_id: 0, sender_name: 'Vikram Singh', content: 'Hi, I have uploaded the documents you requested to the portal. Please check.', is_read: true, created_at: '2026-06-20T08:05:00Z', source: 'portal' },
    { id: 17, thread_id: 6, sender_id: 3, content: 'Thanks Vikram! I can see them. Will review and update you.', is_read: true, created_at: '2026-06-20T08:15:00Z', source: 'internal' },
  ],
  7: [
    { id: 18, thread_id: 7, sender_id: 2, content: 'Meena ji, we need the vendor payment details for TDS filing. Can you share?', is_read: true, created_at: '2026-06-17T10:00:00Z', source: 'internal' },
    { id: 19, thread_id: 7, sender_id: 0, sender_name: 'Meena Kapoor', content: 'OK I will ask my accountant to share the details.', is_read: true, created_at: '2026-06-17T10:45:00Z', source: 'whatsapp' },
  ],
}

// ── Alerts ─────────────────────────────────────────────────
export const MOCK_ALERTS: Alert[] = [
  { id: 1, severity: 'danger', title: 'GSTR-1 Overdue', message: 'GSTR-1 for Sunrise Textiles (May 2026) is past due date.', entity_type: 'filing', entity_id: 2, is_read: false, created_at: '2026-06-12T00:00:00Z' },
  { id: 2, severity: 'warning', title: 'TDS Return Due in 7 days', message: '26Q for BlueSky Software — deadline June 30, 2026.', entity_type: 'task', entity_id: 2, is_read: false, created_at: '2026-06-23T06:00:00Z' },
  { id: 3, severity: 'warning', title: 'Audit Documents Missing', message: 'Balance sheet and P&L not yet uploaded for Sunrise Textiles audit.', entity_type: 'task', entity_id: 3, is_read: false, created_at: '2026-06-22T08:00:00Z' },
  { id: 4, severity: 'danger', title: 'IT Notice Overdue', message: 'Income Tax scrutiny notice response overdue for Green Pharma.', entity_type: 'notice', entity_id: 2, is_read: false, created_at: '2026-07-01T08:00:00Z' },
  { id: 5, severity: 'info', title: 'Task Assigned', message: 'Rohan Verma was assigned GSTR-1 filing for Apex Auto Parts.', entity_type: 'task', entity_id: 5, is_read: true, created_at: '2026-06-23T07:30:00Z' },
  { id: 6, severity: 'info', title: 'Filing Submitted', message: 'GSTR-3B for Sunrise Textiles (May 2026) filed successfully.', entity_type: 'filing', entity_id: 1, is_read: true, created_at: '2026-06-19T10:00:00Z' },
]

// ── Activity Log ──────────────────────────────────────────
export const MOCK_ACTIVITY: Record<number, any[]> = {
  1: [
    // Last 24 hours (Jun 23, 2026)
    { id: 20, action: 'filing',   description: 'GSTR-1 (May 2026) submitted for review — Sunrise Textiles',    user_id: 3, user_name: 'Rohan Verma',   created_at: '2026-06-23T12:45:00Z' },
    { id: 21, action: 'document', description: 'Purchase Register May 2026 uploaded — Sunrise Textiles',         user_id: 3, user_name: 'Rohan Verma',   created_at: '2026-06-23T11:10:00Z' },
    { id: 22, action: 'notice',   description: 'TDS Demand Notice acknowledged — BlueSky Software',              user_id: 2, user_name: 'Priya Sharma',  created_at: '2026-06-23T09:30:00Z' },
    { id: 23, action: 'assign',   description: 'Apex Auto Parts audit assigned to Rohan Verma',                  user_id: 2, user_name: 'Priya Sharma',  created_at: '2026-06-23T08:55:00Z' },
    { id: 24, action: 'update',   description: 'Redwood Constructions contact details updated',                   user_id: 1, user_name: 'Arjun Mehta',   created_at: '2026-06-23T08:15:00Z' },
    { id: 25, action: 'filing',   description: 'TDS 26Q Q4 FY 2025-26 draft created — BlueSky',                  user_id: 4, user_name: 'Sneha Iyer',    created_at: '2026-06-23T07:40:00Z' },
    { id: 26, action: 'document', description: 'Form 16 Q4 uploaded — Green Pharma Distributors',               user_id: 4, user_name: 'Sneha Iyer',    created_at: '2026-06-23T07:05:00Z' },
    { id: 27, action: 'create',   description: 'New client Apex Auto Parts added to firm',                       user_id: 1, user_name: 'Arjun Mehta',   created_at: '2026-06-23T06:30:00Z' },
    // Earlier entries
    { id: 4,  action: 'filing',   description: 'GSTR-3B (May 2026) filed — Ref: AA2605001ZZ',                   user_id: 3, user_name: 'Rohan Verma',   created_at: '2026-06-19T10:00:00Z' },
    { id: 7,  action: 'update',   description: 'Contact phone updated — Sunrise Textiles',                       user_id: 2, user_name: 'Priya Sharma',  created_at: '2026-06-20T14:00:00Z' },
    { id: 5,  action: 'document', description: 'Bank Statement Apr 2026 uploaded — Sunrise Textiles',            user_id: 3, user_name: 'Rohan Verma',   created_at: '2026-06-05T09:00:00Z' },
    { id: 6,  action: 'notice',   description: 'GST Scrutiny Notice received — GSTR-1 vs GSTR-3B mismatch',     user_id: 2, user_name: 'Priya Sharma',  created_at: '2026-05-15T12:00:00Z' },
  ],
  2: [
    { id: 8,  action: 'create',   description: "Created client 'BlueSky Software Solutions'",                    user_id: 1, user_name: 'Arjun Mehta',   created_at: '2026-02-01T10:00:00Z' },
    { id: 9,  action: 'assign',   description: 'Assigned Sneha Iyer as article — BlueSky',                       user_id: 2, user_name: 'Priya Sharma',  created_at: '2026-02-01T10:10:00Z' },
    { id: 10, action: 'filing',   description: 'GSTR-1 (Apr 2026) submitted — BlueSky',                          user_id: 4, user_name: 'Sneha Iyer',    created_at: '2026-05-10T00:00:00Z' },
  ],
}

// ── Dashboard ─────────────────────────────────────────────
export const MOCK_DASHBOARD: DashboardData = {
  stats: { total_clients: 5, active_tasks: 4, pending_filings: 3, overdue_count: 2 },
  recent_alerts: MOCK_ALERTS.filter(a => !a.is_read).slice(0, 4),
  upcoming_deadlines: [
    { id: 2, title: 'TDS Return 26Q — Q4 FY 2025-26', deadline: '2026-06-30T00:00:00Z', client_id: 2, task_type: 'tds' },
    { id: 1, title: 'GSTR-1 Filing — May 2026', deadline: '2026-06-11T00:00:00Z', client_id: 1, task_type: 'gst' },
    { id: 3, title: 'Statutory Audit FY 2025-26', deadline: '2026-09-30T00:00:00Z', client_id: 1, task_type: 'audit' },
  ],
}
