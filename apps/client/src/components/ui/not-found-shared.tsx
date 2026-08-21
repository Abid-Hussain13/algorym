'use client'

import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

export interface NotFoundProps {
  className?: string
  code?: string
  title?: string
  description?: string
  homeHref?: string
  homeLabel?: string
}

export function NotFoundActions({
  homeHref = '/',
  homeLabel = 'Back home',
  className,
}: {
  homeHref?: string
  homeLabel?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-3', className)}>
      <Button variant="primary" size="lg" asChild>
        <Link to={homeHref}>{homeLabel}</Link>
      </Button>
    </div>
  )
}

export function NotFoundStage({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex min-h-[420px] w-full flex-col items-center justify-center gap-8 px-4 text-center',
        className,
      )}
    >
      {children}
    </div>
  )
}
