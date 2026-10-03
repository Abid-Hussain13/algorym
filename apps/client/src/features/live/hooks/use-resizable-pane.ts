import { useCallback, useRef, useState } from "react";

/** Which pointer axis the drag tracks, and which CSS dimension it controls. */
type PaneAxis = "vertical" | "horizontal";

interface UseResizablePaneOptions {
    /** Initial size in pixels. */
    initial: number;
    min: number;
    max: number;
    /**
     * `vertical` = the pane's size is its **width** and the drag tracks X
     * (a side column). `horizontal` = the size is its **height** and the drag
     * tracks Y (the bottom drawer).
     */
    axis?: PaneAxis;
    /**
     * Set for panes that grow as you drag *left* or *up* — i.e. whose grab edge
     * moves toward the origin. The left-hand side column and the bottom drawer
     * both need this.
     */
    invert?: boolean;
    /** Persisted under this key so a reload keeps the user's chosen size. */
    storageKey?: string;
}

const readStored = (key: string | undefined, fallback: number): number => {
    if (!key) return fallback;
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw === null ? Number.NaN : Number(raw);
        return Number.isFinite(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
};

/**
 * Drag-to-resize for the room's side column and bottom drawer.
 *
 * Uses Pointer Events with pointer capture, so the drag keeps working once the
 * cursor leaves the handle. A plain `mousemove` bound to the handle stalls the
 * moment the pointer moves off it, which is the usual complaint with
 * hand-rolled resizers.
 *
 * The value is clamped during the drag rather than validated afterwards, and is
 * persisted so a refresh keeps the chosen size. Keyboard resizing is
 * deliberately not implemented — the collapse toggle and the rail buttons cover
 * the non-drag path.
 */
export function useResizablePane({
    initial,
    min,
    max,
    axis = "vertical",
    invert = false,
    storageKey,
}: UseResizablePaneOptions) {
    const [size, setSize] = useState(() => readStored(storageKey, initial));
    const originRef = useRef<{ pointer: number; size: number } | null>(null);

    const onPointerDown = useCallback(
        (event: React.PointerEvent<HTMLElement>) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            originRef.current = {
                pointer: axis === "vertical" ? event.clientX : event.clientY,
                size,
            };
        },
        [axis, size]
    );

    const onPointerMove = useCallback(
        (event: React.PointerEvent<HTMLElement>) => {
            const origin = originRef.current;
            if (!origin) return;

            const current = axis === "vertical" ? event.clientX : event.clientY;
            const delta = current - origin.pointer;
            const next = Math.min(max, Math.max(min, origin.size + (invert ? -delta : delta)));

            setSize(next);

            if (storageKey) {
                try {
                    localStorage.setItem(storageKey, String(Math.round(next)));
                } catch {
                    /* private mode — the pane still resizes for this session */
                }
            }
        },
        [axis, invert, max, min, storageKey]
    );

    const endDrag = useCallback((event: React.PointerEvent<HTMLElement>) => {
        originRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    }, []);

    return {
        size,
        /** CSS property this pane's `size` should be assigned to. */
        dimension: (axis === "vertical" ? "width" : "height") as "width" | "height",
        handleProps: {
            onPointerDown,
            onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
            style: { touchAction: "none" as const },
        },
    };
}
