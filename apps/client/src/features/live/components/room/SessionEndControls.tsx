import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface SessionEndControlsProps {
    status: string;
    onComplete: () => void;
    onCancel: () => void;
    isCompleting: boolean;
    isCancelling: boolean;
}

/**
 * Complete and Cancel — the only two ways to end a session.
 *
 * They sit at the **bottom** of the Settings panel rather than in a rail tab of
 * their own, so they are always reachable without being the first thing the host
 * sees when they open the room. Everything above them is read-only facts, so by
 * the time the eye reaches the end it is already looking at the neutral part.
 *
 * Completing needs no confirmation — it is the intended action and is reversible
 * from the rating step. Cancelling does, because it disconnects the candidate and
 * is recorded as cancelled: there is no undo.
 */
export function SessionEndControls({
    status,
    onComplete,
    onCancel,
    isCompleting,
    isCancelling,
}: SessionEndControlsProps) {
    const [confirmingCancel, setConfirmingCancel] = useState(false);

    if (status !== "live" && status !== "scheduled") return null;

    return (
        <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                End session
            </span>

            <Button variant="primary" size="sm" loading={isCompleting} onClick={onComplete}>
                Complete session
            </Button>

            {confirmingCancel ? (
                <div className="flex flex-col gap-1.5 rounded border border-danger/40 bg-danger/5 p-2">
                    <p className="text-[11px] leading-relaxed text-fg">
                        Cancel this session? The candidate is disconnected and it is recorded as
                        cancelled. This cannot be undone.
                    </p>
                    <div className="flex gap-1.5">
                        <Button
                            variant="default"
                            size="sm"
                            loading={isCancelling}
                            onClick={onCancel}
                            className="border-danger bg-danger text-on-accent hover:border-danger/90 hover:bg-danger/90"
                        >
                            Yes, cancel
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmingCancel(false)}
                        >
                            Keep it
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    variant="default"
                    size="sm"
                    loading={isCancelling}
                    onClick={() => setConfirmingCancel(true)}
                    className="border-danger/50 text-danger hover:border-danger hover:bg-danger/10"
                >
                    Cancel session
                </Button>
            )}
        </div>
    );
}
