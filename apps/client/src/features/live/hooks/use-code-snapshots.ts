import { useCallback, useEffect, useRef } from "react";
import * as Y from "yjs";
import type { SessionSocket } from "./use-session-socket";

/** Trailing debounce. Snapshots only fire once typing pauses, so a snapshot rate . */
const DEBOUNCE_MS = 5000;

interface UseCodeSnapshotsOptions {
    socket: SessionSocket;
    /** The buffer currently on screen. Observed, not polled. . */
    yText: Y.Text | null;
    filename: string | null;
    /** Off when the room cannot accept runs or the session has ended. . */
    enabled: boolean;
}

/** Records the room's code as it evolves, so a replay can be built from it later. . */
export function useCodeSnapshots({ socket, yText, filename, enabled }: UseCodeSnapshotsOptions) {
    const lastSentRef = useRef<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = useRef<{ filename: string; code: string } | null>(null);
    const { send } = socket;

    const flush = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        const pending = pendingRef.current;
        pendingRef.current = null;
        if (!pending) return;

        lastSentRef.current = pending.code;
        send({ type: "code_snapshot", payload: { code: pending.code, filename: pending.filename } });
    }, [send]);

    useEffect(() => {
        if (!yText || !filename || !enabled) return;

        // A different buffer: drop anything still queued for the previous one
        // after flushing it, so each file's history stays contiguous.
        flush();

        const onChange = () => {
            const code = yText.toString();
            if (code === lastSentRef.current) return;

            pendingRef.current = { filename, code };
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(flush, DEBOUNCE_MS);
        };

        yText.observe(onChange);
        onChange();

        return () => {
            yText.unobserve(onChange);
            // Unmounting on a tab switch or session end — keep the last edit.
            flush();
        };
    }, [yText, filename, enabled, flush]);

    // Do not emit a trailing snapshot for a room that has already ended.
    useEffect(() => {
        if (enabled) return;
        flush();
    }, [enabled, flush]);
}