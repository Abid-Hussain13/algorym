import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useFullscreen } from "../../hooks/use-fullscreen";

interface SessionEndedDialogProps {
    /** Which event ended it — cancelled reads very differently from completed. */
    outcome: "completed" | "cancelled" | "expired";
    /** The host's name, so the message can address them. */
    hostName: string;
    onDismiss: () => void;
}

/**
 * Blocking notice shown to the **candidate** when the host ends the session.
 *
 * It is deliberately not dismissable by accident: the session is over, there is
 * nothing left to edit, and leaving the candidate staring at a live editor they
 * can no longer use is worse than one clear screen with a way out. The only ways
 * forward are the buttons.
 *
 * **Exit full screen** is offered first and prominently. The room puts people in
 * full screen to stop them wandering off mid-interview, so the courtesy of
 * switching it back off when the interview is genuinely over matters — and
 * `Esc` is not something a non-technical candidate will think to try.
 */
export function SessionEndedDialog({ outcome, hostName, onDismiss }: SessionEndedDialogProps) {
    const navigate = useNavigate();
    const { isFullscreen, exit } = useFullscreen();

    const wasCancelled = outcome === "cancelled";
    const wasExpired = outcome === "expired";

    const leave = () => {
        onDismiss();
        // A candidate has no account, so /app/sessions would bounce them to login.
        navigate("/");
    };

    return (
        <div
            className="fixed inset-0 z-50 grid place-items-center bg-bg/90 p-6 backdrop-blur-sm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-ended-title"
        >
            <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl">
                <span
                    className={`grid size-11 place-items-center rounded-full ${
                        wasCancelled ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                    }`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.7}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-5"
                        aria-hidden="true"
                    >
                        {wasCancelled || wasExpired ? (
                            <>
                                <circle cx="12" cy="12" r="9" />
                                <path d="m15 9-6 6M9 9l6 6" />
                            </>
                        ) : (
                            <>
                                <path d="M20 6 9 17l-5-5" />
                            </>
                        )}
                    </svg>
                </span>

                <div className="flex flex-col gap-1.5">
                    <h1 id="session-ended-title" className="font-display text-base font-semibold text-fg">
                        {wasExpired
                            ? "This session has ended"
                            : wasCancelled
                              ? "This session was cancelled"
                              : "That's a wrap"}
                    </h1>
                    <p className="text-xs leading-relaxed text-muted">
                        {wasExpired ? (
                            <>
                                This interview reached its time limit, so the editor is now closed. Your
                                work is saved, but nothing further will be collected.
                            </>
                        ) : wasCancelled ? (
                            <>The interview ended early. Your work is saved, but nothing further was collected.</>
                        ) : (
                            // A candidate has no access to the host-scoped session
                            // detail, so the name comes from the presence roster
                            // they are already on.
                            hostName ? (
                                <>
                                    {hostName} has ended the interview. Thanks for your time.
                                </>
                            ) : (
                                <>The interview is complete. Thanks for your time.</>
                            )
                        )}
                    </p>
                </div>

                <div className="flex w-full flex-col gap-2">
                    {isFullscreen && (
                        <Button variant="primary" size="sm" onClick={() => void exit()}>
                            Exit full screen
                        </Button>
                    )}

                    <Button variant={isFullscreen ? "ghost" : "primary"} size="sm" onClick={leave}>
                        {isFullscreen ? "Leave the room" : "Leave the room"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
