import { useEffect, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils/cn'
import { Spinner } from './Spinner'

interface ImageWithSpinnerProps extends ComponentPropsWithoutRef<'img'> {
    spinnerSize?: 'sm' | 'md' | 'lg'
    wrapperClassName?: string
    pendingClassName?: string
}

export function ImageWithSpinner({
    spinnerSize = 'sm',
    wrapperClassName,
    pendingClassName,
    className,
    onLoad,
    onError,
    ...props
}: ImageWithSpinnerProps) {
    const [loaded, setLoaded] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        if (imgRef.current?.complete) setLoaded(true)
    }, [])

    const markLoaded = () => setLoaded(true)

    return (
        <span className={cn('relative flex justify-center', wrapperClassName, !loaded && pendingClassName)}>
            {!loaded && (
                <span className="absolute inset-0 z-[1] grid place-items-center" aria-hidden="true">
                    <Spinner size={spinnerSize} />
                </span>
            )}
            <img
                ref={imgRef}
                onLoad={(event) => {
                    markLoaded()
                    onLoad?.(event)
                }}
                onError={(event) => {
                    markLoaded()
                    onError?.(event)
                }}
                className={cn('transition-opacity duration-200', loaded ? 'opacity-100' : 'opacity-0', className)}
                {...props}
            />
        </span>
    )
}
