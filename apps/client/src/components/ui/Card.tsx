import type { HTMLAttributes, Ref } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    ref?: Ref<HTMLDivElement>;
}

export function Card({ className, children, ref, ...props }: CardProps) {
    return (
        <div ref={ref} className={cn("rounded-xl border border-border bg-surface-2 shadow-sm", className)} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("flex items-center justify-between gap-3 border-b border-border px-5 py-4", className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn("text-sm font-semibold text-fg", className)} {...props}>
            {children}
        </h3>
    );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("p-5", className)} {...props}>
            {children}
        </div>
    );
}
