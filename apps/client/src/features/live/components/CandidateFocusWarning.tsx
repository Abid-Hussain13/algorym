import type { Collaborator } from "../hooks/use-collaborators";

interface CandidateFocusWarningProps {
    /** Everyone in the room except the viewer. */
    collaborators: Collaborator[];
}

/**
 * The host's live view of whether the candidate is actually present.
 *
 * **This is the host's only signal**, so it is deliberately persistent: it stays
 * up for as long as the candidate is out of full screen and disappears the moment
 * they return. A toast that faded after three seconds would let the host glance
 * away during exactly the moment that matters.
 *
 * Counts are cumulative for the session, so a candidate who has drifted in and
 * out ten times is obviously different from one who drifted once.
 */
export function CandidateFocusWarning({ collaborators }: CandidateFocusWarningProps) {
    const candidates = collaborators.filter((c) => !c.isSelf && c.role === "guest");
    const outOfFullscreen = candidates.filter((c) => !c.isFullscreen);

    // Nothing to say before a candidate has even joined.
    if (candidates.length === 0) return null;

    const isClear = outOfFullscreen.length === 0;
    const totalExits = candidates.reduce((n, c) => n + (c.exitCount ?? 0), 0);

    // The running total matters in *both* states: while they are out it explains
    // whether this is a one-off or a pattern, and it is the only place the host
    // can see the count without waiting for the session to end.
    const counter =
        totalExits > 0 ? (
            <span className="text-muted">
                {" · "}
                {totalExits} full screen {totalExits === 1 ? "exit" : "exits"} so far
            </span>
        ) : null;

    return (
        <div
            role="status"
            aria-live="assertive"
            className={`flex shrink-0 flex-wrap items-center gap-2.5 border-b px-5 py-2 text-xs ${
                isClear
                    ? "border-success/30 bg-success/10 text-fg"
                    : "border-danger/40 bg-danger/10 text-fg"
            }`}
        >
            <span
                className={`size-2 shrink-0 rounded-full ${
                    isClear ? "bg-success" : "animate-pulse bg-danger"
                }`}
                aria-hidden="true"
            />

            {isClear ? (
                <p>
                    Candidate is in full screen
                    {counter}
                </p>
            ) : (
                <p className="font-medium">
                    {outOfFullscreen.map((c) => c.displayName).join(", ")} left full screen — the
                    interview is not being watched in full screen
                    {counter}
                </p>
            )}
        </div>
    );
}