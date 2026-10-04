import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { OutputPanel } from "./OutputPanel";
import { HostNotes } from "./HostNotes";
import { useResizablePane } from "../../hooks/use-resizable-pane";
import type { RoomOutputEntry } from "../../hooks/use-room-output";
import type { RunResultPayload } from "@algorym/shared-types";

type BottomTab = "output" | "input" | "notes";

interface BottomTabsProps {
    entries: RoomOutputEntry[];
    localResult: RunResultPayload | null;
    isRunning: boolean;
    nameFor: (participantId: string) => string;
    // stdin lives here, as a tab, rather than in a toolbar row
    stdin: string;
    onStdinChange: (value: string) => void;
    // Host-only
    isHost: boolean;
    sessionId: string;
    initialNotes: string | null;
    /** A save would succeed right now (a candidate exists). */
    notesCanSave: boolean;
    notesBlockedReason?: string | null;
}

const TabButton = ({
    active,
    onClick,
    children,
    badge,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    badge?: number;
}) => (
    <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onClick}
        className={cn(
            "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
            active ? "text-fg" : "text-muted hover:text-fg"
        )}
    >
        {children}
        {badge !== undefined && badge > 0 && (
            <span className="rounded-full bg-surface-2 px-1.5 text-[10px] text-muted">{badge}</span>
        )}
        {active && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" aria-hidden="true" />}
    </button>
);

/**
 * The drawer under the editor: **Output** and **Input** for everyone, plus
 * private **Notes** for the host only.
 *
 * **Notes is not rendered at all for a candidate.** A disabled "Notes" tab would
 * still tell them they are being assessed, which is the one thing an interviewer
 * does not want revealed mid-session.
 *
 * The drawer is resizable: drag the bar on its top edge upward to make it taller,
 * or collapse it to a single tab strip. The size persists across reloads.
 */
export function BottomTabs({
    entries,
    localResult,
    isRunning,
    nameFor,
    stdin,
    onStdinChange,
    isHost,
    sessionId,
    initialNotes,
    notesCanSave,
    notesBlockedReason,
}: BottomTabsProps) {
    const [tab, setTab] = useState<BottomTab>("output");
    const [collapsed, setCollapsed] = useState(false);

    const { size, handleProps } = useResizablePane({
        initial: 240,
        min: 120,
        max: 640,
        axis: "horizontal",
        invert: true,
        storageKey: "algorym:room:drawer-height",
    });

    return (
        <section
            className="relative flex shrink-0 flex-col border-t border-border bg-bg"
            style={collapsed ? undefined : { height: size }}
        >
            {!collapsed && (
                <div
                    {...handleProps}
                    role="separator"
                    aria-orientation="horizontal"
                    aria-label="Resize output drawer"
                    className={cn(
                        "absolute inset-x-0 -top-1 h-2 cursor-row-resize",
                        "after:absolute after:inset-x-0 after:top-1/2 after:h-px after:-translate-y-1/2",
                        "after:bg-transparent after:transition-colors hover:after:bg-accent/50"
                    )}
                />
            )}

            <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border px-1.5">
                <TabButton active={tab === "output"} onClick={() => setTab("output")} badge={entries.length || undefined}>
                    Output
                </TabButton>
                <TabButton active={tab === "input"} onClick={() => setTab("input")}>
                    Input
                </TabButton>
                {isHost && (
                    <TabButton active={tab === "notes"} onClick={() => setTab("notes")}>
                        Notes
                    </TabButton>
                )}

                <div className="flex-1" />

                <button
                    type="button"
                    onClick={() => setCollapsed((prev) => !prev)}
                    aria-label={collapsed ? "Expand drawer" : "Collapse drawer"}
                    title={collapsed ? "Expand" : "Collapse (or drag the top edge upward)"}
                    className="grid size-6 place-items-center rounded text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.7}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn("size-3.5 transition-transform", collapsed && "rotate-180")}
                        aria-hidden="true"
                    >
                        <path d="m18 15-6-6-6 6" />
                    </svg>
                </button>
            </div>

            {!collapsed && (
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {tab === "output" && (
                        <OutputPanel
                            entries={entries}
                            localResult={localResult}
                            isRunning={isRunning}
                            nameFor={nameFor}
                        />
                    )}

                    {tab === "input" && (
                        <div className="p-2.5">
                            <textarea
                                value={stdin}
                                onChange={(event) => onStdinChange(event.target.value)}
                                placeholder="Standard input passed to the program on the next Run."
                                aria-label="Standard input"
                                className="h-full min-h-24 w-full resize-none rounded border border-border bg-surface-2/40 px-2.5 py-2 font-mono text-xs leading-relaxed text-fg placeholder:text-muted/70"
                            />
                        </div>
                    )}

                    {tab === "notes" && (
                        <HostNotes
                            sessionId={sessionId}
                            initialNotes={initialNotes}
                            canSave={notesCanSave}
                            blockedReason={notesBlockedReason}
                        />
                    )}
                </div>
            )}
        </section>
    );
}
