import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

/** One titled block in the Settings panel. . */
export function SettingsSection({
    title,
    description,
    children,
    className,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn("border-t border-border/60 pt-4 first:border-t-0 first:pt-0", className)}>
            <div className="mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg">
                    {title}
                </h3>
                {description && (
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">{description}</p>
                )}
            </div>
            <div className="flex flex-col gap-3">{children}</div>
        </section>
    );
}

/** A labelled read-only fact: label on the left, value on the right. . */
export function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-1">
            <dt className="shrink-0 text-[11px] tracking-wide text-muted">{label}</dt>
            <dd className="min-w-0 truncate text-right text-xs text-fg">{children}</dd>
        </div>
    );
}

/** A bordered card, used for anything interactive inside a section. . */
export function SettingsCard({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "rounded-lg border border-border/70 bg-surface-2/30 px-3 py-3",
                className
            )}
        >
            {children}
        </div>
    );
}

/** Section heading for a group of related controls, used inside cards. . */
export function SettingsField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <div>
                <span className="text-xs font-medium text-fg">{label}</span>
                {hint && <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{hint}</p>}
            </div>
            {children}
        </div>
    );
}
