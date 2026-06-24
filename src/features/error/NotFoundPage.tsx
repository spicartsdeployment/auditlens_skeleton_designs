import { useNavigate } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { Button } from '@/shared/components/Button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <SearchX className="h-20 w-20 text-neutral-200 mb-6" aria-hidden />
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">404</h1>
      <p className="text-neutral-500 mb-6">The page you're looking for doesn't exist.</p>
      <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
    </div>
  )
}
