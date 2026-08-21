import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

interface SpinnerProps extends React.ComponentProps<'svg'> {
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-12 w-12' }

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      className={cn('animate-spin', sizeMap[size], className)}
      {...props}
    />
  )
}
