import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EditorTabsProps {
    fileNames: string[];
    activeName: string | null;
    onSelect: (name: string) => void;
    onAdd: () => void;
    onClose: (name: string) => void;
    /** Right-aligned controls (Run, language picker). */
    toolbar?: ReactNode;
}

/**
 * Tab strip over the shared `files` map, plus the editor's right-aligned
 * controls.
 *
 * These tabs are not local UI state — each one is a key in the Y.Map that every
 * participant shares. Closing a tab deletes the buffer for the **whole room**,
 * not just locally, so the button only appears on hover and says so in its
 * tooltip. Adding and closing are available to host and candidate alike, because
 * the files belong to both of them.
 *
 * Order follows the map's insertion order (see `useEditorFiles`), so a new file
 * lands to the right of the existing tabs.
 */
export function EditorTabs({ fileNames, activeName, onSelect, onAdd, onClose, toolbar }: EditorTabsProps) {
    // pr-3 rather than pr-2: the language <select> sits flush against the right
    // edge at phone widths and its chevron was clipped by the rail.
    return (
        <div className="flex h-9 shrink-0 items-stretch border-b border-border bg-surface-2/40 pl-2 pr-3">
            <div className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto" role="tablist" aria-label="Open files">
                {fileNames.map((name) => {
                    const isActive = name === activeName;

                    return (
                        <div
                            key={name}
                            className={cn(
                                "group flex shrink-0 items-center gap-1 border-b-2 pl-3 pr-1.5 text-xs transition-colors",
                                isActive
                                    ? "border-accent bg-bg text-fg"
                                    : "border-transparent text-muted hover:text-fg"
                            )}
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => onSelect(name)}
                                className="py-2 font-mono"
                            >
                                {name}
                            </button>
                            <button
                                type="button"
                                onClick={() => onClose(name)}
                                aria-label={`Close ${name}`}
                                title={`Close ${name} for everyone`}
                                className="grid size-4 place-items-center rounded text-muted opacity-0 transition hover:bg-danger/10 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    className="size-3"
                                    aria-hidden="true"
                                >
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    );
                })}

                <button
                    type="button"
                    onClick={onAdd}
                    aria-label="New file"
                    title="New file (shared with the room)"
                    className="grid shrink-0 place-items-center self-center rounded px-2 py-1 text-muted transition-colors hover:bg-accent-soft hover:text-accent-text"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.7}
                        strokeLinecap="round"
                        className="size-3.5"
                        aria-hidden="true"
                    >
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </button>
            </div>

            {toolbar && <div className="flex shrink-0 items-center gap-2 pl-2">{toolbar}</div>}
        </div>
    );
}
