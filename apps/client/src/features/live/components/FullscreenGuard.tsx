import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useFullscreen } from "../hooks/use-fullscreen";

interface FullscreenGuardProps {
    /** Re-shown if they leave fullscreen after entering it. */
    isHost?: boolean;
}

/**
 * Thin strip across the top of the live room.
 *
 * Honest about what this can do: nothing in a browser can stop a determined
 * candidate from opening a new tab. What it does is raise the effort, make the
 * expectation explicit, and leave the host's screen recording showing the gap.
 * It is deliberately a strip rather than a modal so it never blocks the room.
 */
export function FullscreenGuard({ isHost = false }: FullscreenGuardProps) {
    const { isFullscreen, enter } = useFullscreen();
    const [dismissed, setDismissed] = useState(false);

    if (isFullscreen || dismissed) return null;

    return (
        <div
            role="status"
            className="flex shrink-0 items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-5 py-2"
        >
            <p className="text-xs leading-relaxed text-fg">
                <span className="font-semibold">Stay in this window.</span>{" "}
                {isHost
                    ? "The candidate shares this screen — leaving it takes you out of the interview."
                    : "This is a live interview. Please don't close, refresh or switch tabs — it may end your session."}
            </p>

            <div className="flex shrink-0 items-center gap-2">
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
        </div>
    );
}
