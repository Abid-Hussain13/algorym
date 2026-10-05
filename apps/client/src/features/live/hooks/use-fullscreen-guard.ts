import { useCallback, useEffect, useRef, useState } from "react";
import type { WebsocketProvider } from "y-websocket";
import type { SessionSocket } from "./use-session-socket";
import { useFullscreen } from "./use-fullscreen";

/** Derived from the provider so we depend on no extra package. */
type Awareness = WebsocketProvider["awareness"];

export interface FocusGuard {
    isFullscreen: boolean;
    enterFullscreen: () => void;
    /**
     * The candidate has been out of full screen and has not come back within the
     * grace period. The editor blurs behind the full screen button — the only way
     * forward is to enter full screen.
     */
    isBlocking: boolean;
    /** How many times this participant has left full screen. */
    exitCount: number;
}

/** Grace period before the editor is blurred. */
const ESCALATE_AFTER_MS = 4000;

interface UseFullscreenGuardOptions {
    awareness: Awareness | null;
    socket: SessionSocket;
    /** Candidate only — the host is never guarded or reported. */
    enabled: boolean;
}

/**
 * Single owner of the awareness `focus` field: `{ away, since, fullscreen, exitCount }`.
 *
 * **It must stay the only writer.** An earlier revision had a second hook
 * (`useAwaySignal`) publishing `focus` too, and the two silently clobbered each
 * other: the away signal wrote `{ away, since }` with no `fullscreen` key, so the
 * moment a candidate switched tabs the field lost `fullscreen`, the reader
 * defaulted it to `true`, and **the host's warning disappeared exactly when it
 * mattered**. Awareness fields are whole-object writes, so last writer wins — two
 * owners of one field is always a race.
 *
 * Live state goes on awareness (appears and clears instantly, expires on its own
 * if the tab dies). Durable evidence goes over `/ws` as a `focus_event`, which the
 * server writes to `session_events` and the session detail page reads.
 *
 * Reported **once per transition**, on the way out, so a candidate who never comes
 * back still leaves a record.
 *
 * Nothing here can *prevent* leaving — browsers do not allow that. It makes every
 * departure visible to the host and permanent in the transcript.
 */
export function useFullscreenGuard({ awareness, socket, enabled }: UseFullscreenGuardOptions): FocusGuard {
    const { isFullscreen, enter } = useFullscreen();
    const [exitCount, setExitCount] = useState(0);

    /**
     * Timestamp of when the grace period elapsed. The blocking flag is derived
     * from this rather than stored, so returning to full screen clears it with no
     * state write.
     */
    const [graceElapsedAt, setGraceElapsedAt] = useState<number | null>(null);

    /** True once they have been in full screen, so only real exits count. */
    const wasInFullscreenRef = useRef(false);
    const awaySinceRef = useRef<number | null>(null);

    const { send } = socket;

    const report = useCallback(
        (kind: "fullscreen_exit" | "tab_away") => {
            if (!enabled) return;
            send({ type: "focus_event", payload: { kind } });
        },
        [send, enabled]
    );

    // Publish on every change, from one place, always as a complete object.
    useEffect(() => {
        if (!awareness) return;

        awareness.setLocalStateField("focus", {
            away: awaySinceRef.current !== null,
            since: awaySinceRef.current,
            fullscreen: isFullscreen,
            exitCount,
        });
    }, [awareness, isFullscreen, exitCount]);

    // Count a full screen exit.
    useEffect(() => {
        if (!enabled) return;

        if (isFullscreen) {
            wasInFullscreenRef.current = true;
            return;
        }

        // Only a transition out of full screen counts. Someone who never entered
        // is not an "exit" — the grace period below still holds them to the rule.
        if (wasInFullscreenRef.current) {
            wasInFullscreenRef.current = false;
            setExitCount((count) => count + 1);
            report("fullscreen_exit");
        }
    }, [enabled, isFullscreen, report]);

    // Tab-away, folded in so it shares the single `focus` writer above.
    useEffect(() => {
        if (!enabled) return;

        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                // Only the transition counts, and only once per stint.
                if (awaySinceRef.current === null) {
                    awaySinceRef.current = Date.now();
                    report("tab_away");
                }
            } else {
                awaySinceRef.current = null;
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    }, [enabled, report]);

    // Escalate: out of full screen and not back within the grace period. Starts on
    // mount too, so a candidate who skips the prompt is held to the same rule.
    useEffect(() => {
        if (!enabled || isFullscreen) return;

        const timer = setTimeout(() => setGraceElapsedAt(Date.now()), ESCALATE_AFTER_MS);
        return () => clearTimeout(timer);
    }, [enabled, isFullscreen, exitCount]);

    const isBlocking = Boolean(enabled && !isFullscreen && graceElapsedAt !== null);

    return { isFullscreen, enterFullscreen: () => void enter(), isBlocking, exitCount };
}
