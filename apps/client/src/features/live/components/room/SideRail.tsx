import { cn } from "@/lib/utils/cn";

export type RailPanel = "question" | "questions" | "browse" | "actions" | "settings" | null;

interface SideRailProps {
    /** Host-only panels; hidden entirely for a candidate. */
    isHost: boolean;
    active: RailPanel;
    onSelect: (panel: RailPanel) => void;
    /** True when the session can still be ended, so the actions icon is shown. */
    canEndSession: boolean;
}

interface RailButtonProps {
    label: string;
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

const RailButton = ({ label, active, onClick, children }: RailButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        aria-expanded={active}
        className={cn(
            "grid size-9 place-items-center rounded-lg transition-colors",
            active ? "bg-accent-soft text-accent-text" : "text-muted hover:bg-surface-2 hover:text-fg"
        )}
    >
        {children}
    </button>
);

const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="size-4" aria-hidden="true">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="size-4" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
    </svg>
);

const GearIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const QuestionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.2 9a2.8 2.8 0 0 1 5.5.8c0 1.9-2.7 2.2-2.7 3.9" />
        <path d="M12 17h.01" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="size-4" aria-hidden="true">
        <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
);

/**
 * The vertical icon column on the **left** edge of the room.
 *
 * Order: **question** (everyone) → assigned questions → all questions → end
 * session (host only) → settings.
 *
 * The question comes first because it is the one panel both roles need, and it
 * is a peer of the others rather than a permanent column — the editor gets the
 * full width until someone asks for it.
 *
 * Every button toggles its panel; clicking the open one closes it. The panel is
 * a resizable column beside this rail, not an overlay, so opening one never dims
 * or covers the editor.
 *
 * **Panel state is per-viewer.** It is plain React state in `LiveRoomShell`, so
 * two people in the same room can have different panels open, different sizes and
 * completely different themes at the same time.
 */
export function SideRail({ isHost, active, onSelect, canEndSession }: SideRailProps) {
    return (
        <nav
            className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface-2/30 py-2"
            aria-label="Room panels"
        >
            <RailButton
                label="Question"
                active={active === "question"}
                onClick={() => onSelect(active === "question" ? null : "question")}
            >
                <QuestionIcon />
            </RailButton>

            {isHost && (
                <>
                    <RailButton
                        label="Assigned questions"
                        active={active === "questions"}
                        onClick={() => onSelect(active === "questions" ? null : "questions")}
                    >
                        <ListIcon />
                    </RailButton>
                    <RailButton
                        label="All questions"
                        active={active === "browse"}
                        onClick={() => onSelect(active === "browse" ? null : "browse")}
                    >
                        <SearchIcon />
                    </RailButton>
                </>
            )}

            {/* Ending a session lives on its own panel so it is never one stray
                click away from the question list. */}
            {isHost && canEndSession && (
                <RailButton
                    label="End session"
                    active={active === "actions"}
                    onClick={() => onSelect(active === "actions" ? null : "actions")}
                >
                    <StopIcon />
                </RailButton>
            )}

            <div className="flex-1" />

            <RailButton
                label="Session settings"
                active={active === "settings"}
                onClick={() => onSelect(active === "settings" ? null : "settings")}
            >
                <GearIcon />
            </RailButton>
        </nav>
    );
}
