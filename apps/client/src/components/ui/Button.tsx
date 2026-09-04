import type { ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils/cn'
import { Spinner } from './Spinner'

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-[9px] rounded-sm border font-body text-sm font-semibold tracking-[0.02em] transition-all duration-1 ease-default cursor-pointer no-underline hover:no-underline',
    {
        variants: {
            variant: {
                primary:
                    'bg-accent border-accent text-on-accent shadow-sm hover:bg-accent-hover hover:border-accent-hover active:bg-accent-active active:translate-y-px',
                ghost: 'bg-transparent border-transparent text-muted hover:bg-surface-2 hover:text-fg',
                default: 'bg-surface border-border-strong text-fg hover:bg-surface-2',
            },
            size: {
                sm: 'px-[15px] py-[7px] text-[13px]',
                md: 'px-5 py-[11px] text-sm',
                lg: 'px-[26px] py-[13px] text-[15px]',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    },
)

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    loading?: boolean
}

export function Button({
    variant = 'default',
    size = 'md',
    className,
    asChild = false,
    loading = false,
    type = 'button',
    disabled,
    children,
    ...props
}: ButtonProps) {
    const Comp = asChild ? Slot : 'button'
    return (
        <Comp
            type={type}
            disabled={disabled || loading}
            className={cn(buttonVariants({ variant, size, className }), loading && 'pointer-events-none')}
            {...props}
        >
            {loading ? (
                <>
                    <Spinner className="shrink-0" size='sm' />
                    {children}
                </>
            ) : (
                children
            )}
        </Comp>
    )
}
