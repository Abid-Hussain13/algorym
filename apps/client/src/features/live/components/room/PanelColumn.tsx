import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PanelColumnProps {
    title: string;
    onClose: () => void;
    /** Resizable width in pixels, from `useResizablePane`. */
    width: number;
    handleProps: React.HTMLAttributes<HTMLElement>;
    children: ReactNode;
    footer?: ReactNode;
}

/**
 * The side panel that opens beside the rail.
 *
 * It is a real column in the layout, not an overlay: no backdrop, no dimming,
 * and the editor keeps its size and scroll position. That matters in a live
 * interview — a panel that covers the code the moment you open it would be
 * unusable.
 *
 * The grab handle sits on the column's inner edge (the right side, because the
 * panel is docked to the left) so dragging it right widens the panel. Dragging
 * further right widens; there is no overlay to click away, so the close button
 * and Escape both dismiss.
 */
export function PanelColumn({
    title,
    onClose,
    width,
    handleProps,
    children,
    footer,
}: PanelColumnProps) {
    return (
        <aside
            className="relative flex shrink-0 flex-col border-r border-border bg-bg"
            style={{ width }}
        >
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5">
                <h2 className="truncate font-display text-xs font-semibold uppercase tracking-wide text-muted">
                    {title}
                </h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={`Close ${title}`}
                    className="grid size-6 shrink-0 place-items-center rounded text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-3.5" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

            {footer}

            <div
                {...handleProps}
                role="separator"
                aria-orientation="vertical"
                aria-label={`Resize ${title} panel`}
                className={cn(
                    "absolute inset-y-0 -right-1 w-2 cursor-col-resize",
                    "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2",
                    "after:bg-transparent after:transition-colors hover:after:bg-accent/50"
                )}
            />
        </aside>
    );
}
