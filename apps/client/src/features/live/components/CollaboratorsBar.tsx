import { cn } from "@/lib/utils/cn";
import type { Collaborator } from "../hooks/use-collaborators";

interface CollaboratorsBarProps {
    collaborators: Collaborator[];
    connected: boolean;
    /** Host only: surfaces integrity problems without opening Settings. */
    isHost?: boolean;
    className?: string;
}

const initialsOf = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "?";

export function CollaboratorsBar({
    collaborators,
    connected,
    isHost = false,
    className,
}: CollaboratorsBarProps) {
    const others = collaborators.filter((c) => !c.isSelf);

    // Only the host needs an integrity signal, and only for a candidate.
    const guests = collaborators.filter((c) => c.role === "guest");
    const outOfFullscreen = guests.filter((c) => !c.isFullscreen);
    const totalExits = guests.reduce((n, c) => n + (c.exitCount ?? 0), 0);
    const showAlert = isHost && guests.length > 0 && outOfFullscreen.length > 0;

    return (
        <div
            className={cn("flex items-center gap-3", className)}
            aria-label="People in this session"
            aria-live="polite"
        >
            <span
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted"
                title={connected ? "Live sync connected" : "Connecting to live sync…"}
            >
                <span
                    className={cn(
                        "size-1.5 rounded-full",
                        connected ? "bg-success" : "animate-pulse bg-muted"
                    )}
                    aria-hidden="true"
                />
                {/* The word only appears once there is room for it; the dot alone
                    still carries the state on a phone. */}
                <span className="hidden sm:inline">{connected ? "Live" : "Connecting"}</span>
            </span>

            <ul className="flex items-center gap-1.5">
                {collaborators.map((collaborator) => (
                    <li key={collaborator.clientId} className="relative">
                        <span
                            className={cn(
                                "grid size-7 place-items-center rounded-full border text-[11px] font-semibold",
                                collaborator.isSelf
                                    ? "border-accent bg-accent-soft text-accent-text"
                                    : "border-border"
                            )}
                            // Runtime-derived colour, so it cannot be a Tailwind class.
                            style={
                                collaborator.isSelf
                                    ? undefined
                                    : {
                                          borderColor: `${collaborator.color}59`,
                                          backgroundColor: `${collaborator.color}1f`,
                                          color: collaborator.color,
                                      }
                            }
                            title={
                                collaborator.isSelf
                                    ? `${collaborator.displayName} (you)`
                                    : `${collaborator.displayName} (${collaborator.role})`
                            }
                        >
                            {initialsOf(collaborator.displayName)}
                        </span>
                        {/* Quiet, passive: marks that they are in another tab. Never
                            nags them — it is information for the host, not a warning. */}
                        {collaborator.isAway && (
                            <span
                                className="absolute -left-0.5 -top-0.5 size-2.5 rounded-full border-2 border-bg bg-warning"
                                title={`${collaborator.displayName} is in another tab`}
                            />
                        )}
                        {!collaborator.isFullscreen && collaborator.role === "guest" && (
                            <span
                                className="absolute -right-0.5 -top-0.5 size-2.5 animate-pulse rounded-full border-2 border-bg bg-danger"
                                title={`${collaborator.displayName} is out of full screen`}
                            />
                        )}
                        {collaborator.role === "host" && (
                            <span
                                className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full bg-accent text-[8px] font-bold text-on-accent"
                                title="Host"
                            >
                                H
                            </span>
                        )}
                    </li>
                ))}
            </ul>

            {showAlert && (
                <span
                    role="status"
                    aria-live="assertive"
                    title={`${outOfFullscreen.map((c) => c.displayName).join(", ")} out of full screen`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-danger/50 bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger"
                >
                    <span className="size-1.5 animate-pulse rounded-full bg-danger" aria-hidden="true" />
                    Out of full screen
                    {totalExits > 0 && (
                        <span className="rounded-full bg-danger/20 px-1.5 tabular-nums">
                            {totalExits}
                        </span>
                    )}
                </span>
            )}

            {/* Hidden below md: on a phone this sentence wraps to three lines
                and squeezes the session title down to a few characters. The
                avatars already answer "who is here". */}
            <span className="hidden truncate text-xs text-muted md:inline">
                {others.length === 0
                    ? "Waiting for others to join…"
                    : `${others.map((c) => c.displayName).join(", ")} ${
                          others.length === 1 ? "is" : "are"
                      } here${others.some((c) => c.isAway) ? " · away" : ""}`}
            </span>
        </div>
    );
}
