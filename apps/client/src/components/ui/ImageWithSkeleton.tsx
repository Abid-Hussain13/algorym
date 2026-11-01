import { useEffect, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils/cn'

interface ImageWithSkeletonProps extends ComponentPropsWithoutRef<'img'> {
    wrapperClassName?: string
    pendingClassName?: string
    skeletonClassName?: string
}

export function ImageWithSkeleton({
    wrapperClassName,
    pendingClassName,
    skeletonClassName,
    className,
    onLoad,
    onError,
    ...props
}: ImageWithSkeletonProps) {
    const [loaded, setLoaded] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        if (imgRef.current?.complete) setLoaded(true)
    }, [])

    const markLoaded = () => setLoaded(true)

    return (
        <span className={cn('relative', wrapperClassName, !loaded && pendingClassName)}>
            {!loaded && (
                <span
                    className={cn('absolute inset-0 z-[1] animate-pulse bg-surface-2 rounded-sm', skeletonClassName)}
                    aria-hidden="true"
                />
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
