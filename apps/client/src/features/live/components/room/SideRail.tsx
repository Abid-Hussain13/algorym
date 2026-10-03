import { cn } from "@/lib/utils/cn";

export type RailPanel = "questions" | "browse" | "settings" | null;

interface SideRailProps {
    /** Host-only panels; hidden entirely for a candidate. */
    isHost: boolean;
    active: RailPanel;
    onSelect: (panel: RailPanel) => void;
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

/**
 * The vertical icon column on the **left** edge of the room.
 *
 * Order is deliberate and matches the agreed layout: **assigned questions → all
 * questions → settings**. The first two are host-only, so a candidate sees just
 * the settings button rather than a column of controls they cannot use.
 *
 * Each button toggles its panel; clicking the open one closes it. The panel
 * itself is a resizable column beside this rail — not an overlay — so opening
 * one never dims or covers the editor.
 */
export function SideRail({ isHost, active, onSelect }: SideRailProps) {
    return (
        <nav
            className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface-2/30 py-2"
            aria-label="Room panels"
        >
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
