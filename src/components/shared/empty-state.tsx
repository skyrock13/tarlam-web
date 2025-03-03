// src/components/shared/empty-state.tsx
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel: string
  actionHref: string
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-muted-foreground">{description}</p>
        <Link href={actionHref} className="mt-4 inline-block">
          <Button>{actionLabel}</Button>
        </Link>
      </div>
    </div>
  )
}