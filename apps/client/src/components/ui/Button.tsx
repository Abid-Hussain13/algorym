import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

type ButtonVariant = 'primary' | 'ghost' | 'default'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const base =
  'inline-flex items-center gap-[9px] rounded-sm border font-body text-sm font-semibold tracking-[0.02em] transition-all duration-1 ease-default cursor-pointer'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent border-accent text-on-accent shadow-sm hover:bg-accent-hover hover:border-accent-hover active:bg-accent-active active:translate-y-px',
  ghost: 'bg-transparent border-transparent text-muted hover:bg-surface-2 hover:text-fg',
  default: 'bg-surface border-border-strong text-fg hover:bg-surface-2',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-[15px] py-[7px] text-[13px]',
  md: 'px-5 py-[11px] text-sm',
  lg: 'px-[26px] py-[13px] text-[15px]',
}

export function Button({
  variant = 'default',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  )
}