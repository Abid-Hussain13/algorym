import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useFullscreen } from "../hooks/use-fullscreen";

/** Fullscreen strip for the **host** only. . */
export function FullscreenGuard() {
    const { isFullscreen, enter } = useFullscreen();
    const [dismissed, setDismissed] = useState(false);

    if (isFullscreen || dismissed) return null;

    return (
        <div
            role="status"
            className="flex shrink-0 items-center justify-end gap-2 border-b border-warning/30 bg-warning/10 px-5 py-1.5"
        >
            <Button variant="primary" size="sm" onClick={enter}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-3.5"
                    aria-hidden="true"
                >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
                Go full screen
            </Button>
            <button
                type="button"
                onClick={() => setDismissed(true)}
                className="rounded px-1.5 py-1 text-xs text-muted transition-colors hover:text-fg"
            >
                Dismiss
            </button>
        </div>
    );
}
