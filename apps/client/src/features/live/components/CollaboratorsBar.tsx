import { cn } from "@/lib/utils/cn";
import type { Collaborator } from "../hooks/use-collaborators";

interface CollaboratorsBarProps {
    collaborators: Collaborator[];
    connected: boolean;
    className?: string;
}

const initialsOf = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "?";

export function CollaboratorsBar({ collaborators, connected, className }: CollaboratorsBarProps) {
    const others = collaborators.filter((c) => !c.isSelf);

    return (
        <div
            className={cn("flex items-center gap-3", className)}
            aria-label="People in this session"
            aria-live="polite"
        >
            <span
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted"
                title={connected ? "Live sync connected" : "Connecting to live sync…"}
            >
                <span
                    className={cn(
                        "size-1.5 rounded-full",
                        connected ? "bg-success" : "animate-pulse bg-muted"
                    )}
                    aria-hidden="true"
                />
                {connected ? "Live" : "Connecting"}
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

            <span className="text-xs text-muted">
                {others.length === 0
                    ? "Waiting for others to join…"
                    : `${others.map((c) => c.displayName).join(", ")} ${
                          others.length === 1 ? "is" : "are"
                      } here${others.some((c) => c.isAway) ? " · away" : ""}`}
            </span>
        </div>
    );
}
