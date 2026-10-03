import { useEffect, useState } from "react";
import { STATUS_BADGES, STATUS_LABELS } from "@/features/sessions";
import { cn } from "@/lib/utils/cn";
import type { RoomSession } from "@algorym/shared-types";

interface SessionSettingsPanelProps {
    session: RoomSession | null;
    collaboratorCount: number;
    isHost: boolean;
    onCopyInvite?: () => void;
}

/**
 * Read-only session facts for both roles.
 *
 * Deliberately has no destructive controls. Ending a session from inside the
 * room would be one misclick from killing an interview, so that stays on the
 * host's dashboard; the room shows status and timing only.
 */
export function SessionSettingsPanel({
    session,
    collaboratorCount,
    isHost,
    onCopyInvite,
}: SessionSettingsPanelProps) {
    // The clock is an external system, so it is subscribed to rather than read
    // during render (which would be impure and would never tick anyway).
    // Declared before the early return to respect the Rules of Hooks.
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(timer);
    }, []);

    if (!session) return <p className="p-4 text-xs text-muted">Loading…</p>;

    const startedAt = session.started_at ? new Date(session.started_at).getTime() : null;
    const elapsedMinutes = startedAt !== null ? Math.floor((now - startedAt) / 60000) : null;
    const durationMinutes = session.duration_minutes;

    const rows: Array<[string, React.ReactNode]> = [
        [
            "Status",
            <span
                key="status"
                className={cn(
                    "rounded px-1.5 py-0.5 text-[11px] font-medium",
                    STATUS_BADGES[session.status] || "bg-muted/10 text-muted"
                )}
            >
                {STATUS_LABELS[session.status] || session.status}
            </span>,
        ],
        ["Role", isHost ? "Host (you)" : "Candidate"],
        ["Mode", <span key="mode" className="capitalize">{session.mode}</span>],
        ["Language", session.language ?? "Not set"],
        ["In the room", `${collaboratorCount} ${collaboratorCount === 1 ? "person" : "people"}`],
    ];

    if (session.role_context) rows.push(["Focus", session.role_context]);
    if (elapsedMinutes !== null) {
        rows.push(["Elapsed", `${elapsedMinutes} min`]);
    }
    if (durationMinutes) rows.push(["Planned", `${durationMinutes} min`]);

    return (
        <div className="flex flex-col gap-3 p-3">
            <dl className="flex flex-col gap-1.5">
                {rows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3 text-xs">
                        <dt className="text-muted">{label}</dt>
                        <dd className="truncate text-right text-fg">{value}</dd>
                    </div>
                ))}
            </dl>

            {isHost && onCopyInvite && (
                <button
                    type="button"
                    onClick={onCopyInvite}
                    className="rounded border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
                >
                    Copy invite link
                </button>
            )}
        </div>
    );
}
