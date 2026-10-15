import { Button } from "@/components/ui/Button";
import type { FocusGuard } from "../hooks/use-fullscreen-guard";

interface FullscreenGateProps {
    guard: FocusGuard;
    /** Total exits so far, shown to the candidate so the rules are not a secret. . */
    exitCount: number;
}

/** The candidate's full screen gate. **There is no dismiss button, by design.** . */
export function FullscreenGate({ guard, exitCount }: FullscreenGateProps) {
    if (guard.isFullscreen) return null;

    return (
        <>
            <div
                role="status"
                className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-5 py-2.5"
            >
                <p className="text-xs leading-relaxed text-fg">
                    <span className="font-semibold">You left full screen.</span>{" "}
                    The interviewer can see this, and it is recorded with your session.
                    {exitCount > 0 && (
                        <span className="text-muted"> (so far {exitCount}×)</span>
                    )}
                </p>

                <Button variant="primary" size="sm" onClick={guard.enterFullscreen}>
                    Go full screen
                </Button>
            </div>

            {guard.isBlocking && (
                <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-bg/40 backdrop-blur-md">
                    <div className="pointer-events-auto flex max-w-xs flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5 text-center shadow-2xl">
                        <h2 className="font-display text-sm font-semibold text-fg">
                            Full screen is required
                        </h2>
                        <p className="text-xs leading-relaxed text-muted">
                            The editor stays hidden until you return to full screen, so you cannot miss
                            part of the interview.
                        </p>
                        <Button variant="primary" size="sm" onClick={guard.enterFullscreen}>
                            Return to full screen
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}