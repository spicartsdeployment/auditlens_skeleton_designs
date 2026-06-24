import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ProtectedRoute } from './guards/ProtectedRoute'
import { SkeletonCard } from '@/shared/components/Skeleton'

import { LoginPage } from '@/features/auth/LoginPage'

const DashboardPage        = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ComplianceWorkspace  = lazy(() => import('@/features/workspace/ComplianceWorkspace').then(m => ({ default: m.ComplianceWorkspace })))
const ClientsPage          = lazy(() => import('@/features/clients/ClientsPage').then(m => ({ default: m.ClientsPage })))
const ClientDetailPage     = lazy(() => import('@/features/clients/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })))
const ClientOnboardPage    = lazy(() => import('@/features/clients/ClientOnboardPage').then(m => ({ default: m.ClientOnboardPage })))
const UsersPage            = lazy(() => import('@/features/users/UsersPage').then(m => ({ default: m.UsersPage })))
const TasksPage            = lazy(() => import('@/features/tasks/TasksPage').then(m => ({ default: m.TasksPage })))
const GSTPage              = lazy(() => import('@/features/gst/GSTPage').then(m => ({ default: m.GSTPage })))
const TDSPage              = lazy(() => import('@/features/tds/TDSPage').then(m => ({ default: m.TDSPage })))
const AuditPage            = lazy(() => import('@/features/audit/AuditPage').then(m => ({ default: m.AuditPage })))
const CommunicationPage    = lazy(() => import('@/features/communication/CommunicationPage').then(m => ({ default: m.CommunicationPage })))
const DocumentsPage        = lazy(() => import('@/features/documents/DocumentsPage').then(m => ({ default: m.DocumentsPage })))
const ReportsPage          = lazy(() => import('@/features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })))
const NoticesPage          = lazy(() => import('@/features/notices/NoticesPage').then(m => ({ default: m.NoticesPage })))
const WorkCenterPage       = lazy(() => import('@/features/workcenter/WorkCenterPage').then(m => ({ default: m.WorkCenterPage })))
const SettingsPage         = lazy(() => import('@/features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const NotFoundPage         = lazy(() => import('@/features/error/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const ForbiddenPage        = lazy(() => import('@/features/error/ForbiddenPage').then(m => ({ default: m.ForbiddenPage })))

function PageLoader() {
  return (
    <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
    </div>
  )
}
function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Lazy><DashboardPage /></Lazy> },
          { path: 'workspace', element: <Lazy><ComplianceWorkspace /></Lazy> },
          { path: 'workcenter', element: <Lazy><WorkCenterPage /></Lazy> },
          {
            path: 'clients',
            element: <ProtectedRoute screen="clients" />,
            children: [
              { index: true, element: <Lazy><ClientsPage /></Lazy> },
              { path: 'new', element: <Lazy><ClientOnboardPage /></Lazy> },
              { path: ':id', element: <Lazy><ClientDetailPage /></Lazy> },
            ],
          },
          {
            path: 'users',
            element: <ProtectedRoute screen="users" />,
            children: [{ index: true, element: <Lazy><UsersPage /></Lazy> }],
          },
          { path: 'tasks', element: <Navigate to="/workcenter" replace /> },
          {
            path: 'gst',
            element: <ProtectedRoute screen="gst" />,
            children: [{ index: true, element: <Lazy><GSTPage /></Lazy> }],
          },
          {
            path: 'tds',
            element: <ProtectedRoute screen="tds" />,
            children: [{ index: true, element: <Lazy><TDSPage /></Lazy> }],
          },
          {
            path: 'audit',
            element: <ProtectedRoute screen="audit" />,
            children: [{ index: true, element: <Lazy><AuditPage /></Lazy> }],
          },
          {
            path: 'communication',
            element: <ProtectedRoute screen="communication" />,
            children: [{ index: true, element: <Lazy><CommunicationPage /></Lazy> }],
          },
          { path: 'documents', element: <Lazy><DocumentsPage /></Lazy> },
          { path: 'calendar', element: <Navigate to="/" replace /> },
          {
            path: 'reports',
            element: <ProtectedRoute screen="reports" />,
            children: [{ index: true, element: <Lazy><ReportsPage /></Lazy> }],
          },
          { path: 'notices', element: <Navigate to="/workcenter" replace /> },
          { path: 'settings', element: <Lazy><SettingsPage /></Lazy> },
          { path: '403', element: <Lazy><ForbiddenPage /></Lazy> },
          { path: '*', element: <Lazy><NotFoundPage /></Lazy> },
        ],
      },
    ],
  },
])
