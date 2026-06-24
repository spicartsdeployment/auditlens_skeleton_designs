import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #EBF5FD 0%, #F8FAFC 50%, #EBF5FD 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white text-lg font-black shadow-lg"
            style={{ background: '#0F172A' }}
          >
            AL
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AuditLens</h1>
          <p className="mt-1 text-sm text-slate-500">CA firm compliance platform</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
