import { useNow } from "../hooks/use-now";
import type { RoomSession } from "@algorym/shared-types";

interface SessionTimeWarningProps {
    session: RoomSession | null;
}

/** Show the warning once this much time is left. */
const WARN_WITHIN_MS = 5 * 60 * 1000;

/**
 * Tells the host how long is left, once it starts to matter.
 *
 * Silent until five minutes remain on purpose: a countdown that is always on
 * screen is just noise the host learns to ignore. Below the threshold it is
 * persistent and states the actual remaining time, because at that point the
 * useful thing is not "time is short" but "how short".
 *
 * The deadline comes from `expires_at`, falling back to `started_at +
 * duration_minutes` — a session created without a duration has no deadline and is
 * never warned about, which is correct: there is nothing to warn about.
 */
export function SessionTimeWarning({ session }: SessionTimeWarningProps) {
    // Ticks more often near the end so the final minutes are not chunky.
    const now = useNow(20_000);

    if (!session) return null;

    const deadline = session.expires_at
        ? new Date(session.expires_at).getTime()
        : session.started_at && session.duration_minutes
          ? new Date(session.started_at).getTime() + session.duration_minutes * 60_000
          : null;

    if (deadline === null) return null;

    const remainingMs = deadline - now;

    // Already past it — the expiry cron owns that, not this banner.
    if (remainingMs <= 0) return null;
    if (remainingMs > WARN_WITHIN_MS) return null;

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const urgent = remainingMs <= 60_000;

    return (
        <div
            role="status"
            aria-live="polite"
            className={`flex shrink-0 items-center gap-2.5 border-b px-5 py-2 text-xs ${
                urgent
                    ? "border-danger/40 bg-danger/10 text-fg"
                    : "border-warning/30 bg-warning/10 text-fg"
            }`}
        >
            <span
                className={`size-2 shrink-0 rounded-full ${urgent ? "animate-pulse bg-danger" : "bg-warning"}`}
                aria-hidden="true"
            />
            <p className="font-medium">
                {minutes >= 1
                    ? `This session will end in about ${minutes} minute${minutes === 1 ? "" : "s"}.`
                    : `This session will end in under a minute.`}
                <span className="ml-2 font-mono text-muted">
                    {minutes}:{String(seconds).padStart(2, "0")}
                </span>
                <span className="ml-2 font-normal text-muted">
                    Complete it when you're ready — it can't be reopened.
                </span>
            </p>
        </div>
    );
}
