import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/shared/components/Button'

export function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <ShieldOff className="h-20 w-20 mb-6" style={{ color: '#CBD5E1' }} aria-hidden />
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">Access Denied</h1>
      <p className="text-neutral-500 mb-2">You don't have permission to view this page.</p>
      <p className="text-sm text-neutral-400 mb-6">Contact your Admin to request access.</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
        <Button onClick={() => navigate('/')}>Dashboard</Button>
      </div>
    </div>
  )
}
