import { useMemo } from "react";
import { useFullscreen } from "../../hooks/use-fullscreen";
import type { Collaborator } from "../../hooks/use-collaborators";
import { Button } from "@/components/ui/Button";

interface CandidateIntegritySectionProps {
    isHost: boolean;
    /** Roster from the room's single awareness subscription, not re-read here. */
    collaborators: Collaborator[];
}

/**
 * Live integrity readout, shown only to the host, and **only while the candidate
 * is out of full screen**.
 *
 * There is deliberately no "everything is fine" state. A block that sits there
 * green most of the time teaches the host to stop reading it, so the moment it
 * actually appears it is the only thing on screen that matters — and it
 * disappears the instant the candidate comes back.
 *
 * The permanent totals are not lost: they are recorded to `session_events`
 * during the session and shown as the always-visible IntegrityCard on the
 * session detail page afterwards. This is the live edge of that, not the record.
 */
export function CandidateIntegritySection({
    isHost,
    collaborators,
}: CandidateIntegritySectionProps) {
    const stats = useMemo(() => {
        const guests = collaborators.filter((c) => c.role === "guest");
        const out = guests.filter((c) => !c.isFullscreen);
        const away = guests.filter((c) => c.isAway);
        const exits = guests.reduce((n, c) => n + (c.exitCount ?? 0), 0);
        return { out, away, exits, hasGuests: guests.length > 0 };
    }, [collaborators]);

    // Host has no integrity stake in their own screen, an empty room has nothing
    // to report, and the whole point is to stay silent while things are fine.
    if (!isHost || !stats.hasGuests || stats.out.length === 0) return null;

    const names = (list: Collaborator[]) => list.map((c) => c.displayName).join(", ");

    return (
        <section
            aria-live="assertive"
            className="rounded border border-danger/40 bg-danger/5 px-2.5 py-2"
        >
            <div className="flex items-center gap-1.5">
                <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-danger" aria-hidden="true" />
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-fg">
                    Candidate out of full screen
                </h4>
            </div>

            <p className="mt-1.5 text-[11px] leading-relaxed text-fg">
                {names(stats.out)} left full screen — this interview is not being watched in full
                screen.
            </p>

            {/* The running counter is the reason this block is worth reading: it
                distinguishes one slip from a pattern. */}
            <p className="mt-1 text-[11px] text-muted">
                Full screen exits: <span className="font-medium text-fg">{stats.exits}</span>
                {stats.exits === 1 ? "" : "s"} so far
                {stats.away.length > 0 && (
                    <>
                        {" · "}Tab switches: <span className="font-medium text-fg">{stats.away.length}</span>
                    </>
                )}
            </p>
        </section>
    );
}

interface FullscreenControlProps {
    isHost: boolean;
}

/**
 * Full screen button for the host, for use in Settings.
 *
 * The top strip (`FullscreenGuard`) can be dismissed, so this keeps the action
 * permanently reachable one click away in the sidebar — exactly where the user
 * asked for it to land.
 */
export function FullscreenControl({ isHost }: FullscreenControlProps) {
    const { isFullscreen, enter } = useFullscreen();
    if (!isHost) return null;

    return (
        <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
                <p className="text-xs font-medium text-fg">Full screen</p>
                <p className="text-[11px] text-muted">
                    {isFullscreen ? "You're in full screen." : "Hide the browser chrome."}
                </p>
            </div>
            <Button variant="primary" size="sm" onClick={enter} disabled={isFullscreen}>
                {isFullscreen ? "Full screen" : "Go full screen"}
            </Button>
        </div>
    );
}
