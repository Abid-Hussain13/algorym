import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useFullscreen } from "../../hooks/use-fullscreen";

interface SessionEndedDialogProps {
    outcome: "completed" | "cancelled" | "expired";
    hostName: string;
    /** True for the host, who stays in the room to rate the candidate. */
    isHost: boolean;
    onDismiss: () => void;
}

/**
 * Blocking notice shown when a session ends.
 *
 * **One button, and which one depends on who you are.**
 *
 * - **Candidate** — leaves full screen (the room put them in it, so switching it
 *   back off is a courtesy they won't think to ask for) and goes to the public
 *   home page, since they have no account and `/app/sessions` would bounce them
 *   to the login screen.
 * - **Host** — goes back to wherever they came from with `navigate(-1)`, which
 *   puts them on their own sessions list or wherever they launched the room
 *   from. They must be able to reach the rating, and `navigate(-1)` never leaves
 *   them stranded on a marketing page they did not ask for.
 *
 * Not dismissable by accident: the session is over, there is nothing left to
 * edit, and leaving someone in a live editor they can no longer use is worse
 * than one clear screen with a way out.
 */
export function SessionEndedDialog({
    outcome,
    hostName,
    isHost,
    onDismiss,
}: SessionEndedDialogProps) {
    const navigate = useNavigate();
    const { isFullscreen, exit } = useFullscreen();

    const wasCancelled = outcome === "cancelled";
    const wasExpired = outcome === "expired";

    const leave = async () => {
        if (isFullscreen) await exit();
        onDismiss();
        if (isHost) navigate(-1);
        else navigate("/");
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
                        wasCancelled || wasExpired
                            ? "bg-danger/10 text-danger"
                            : "bg-success/10 text-success"
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
                            <path d="M20 6 9 17l-5-5" />
                        )}
                    </svg>
                </span>

                <div className="flex flex-col gap-1.5">
                    <h1
                        id="session-ended-title"
                        className="font-display text-base font-semibold text-fg"
                    >
                        {wasExpired
                            ? "This session has ended"
                            : wasCancelled
                              ? "This session was cancelled"
                              : "That's a wrap"}
                    </h1>
                    <p className="text-xs leading-relaxed text-muted">
                        {wasExpired ? (
                            <>
                                Nobody joined this session, so it timed out. Nothing was collected.
                            </>
                        ) : wasCancelled ? (
                            <>The interview ended early. Your work is saved, but nothing further was collected.</>
                        ) : hostName ? (
                            <>
                                {hostName} has ended the interview. Thanks for your time.
                            </>
                        ) : (
                            <>The interview is complete. Thanks for your time.</>
                        )}
                    </p>
                </div>

                <div className="flex w-full flex-col gap-2">
                    <Button variant="primary" size="sm" onClick={() => void leave()}>
                        {isHost ? "Go back" : "Leave full screen and finish"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
