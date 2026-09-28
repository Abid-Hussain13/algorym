import { toast } from "sonner";
import { buildInviteUrl } from "@/lib/session-urls";

interface StepSuccessProps {
    mode: "interview" | "practice";
    sessionId: string | undefined;
    accessToken: string | undefined;
}

export function StepSuccess({ mode, sessionId, accessToken }: StepSuccessProps) {
    const inviteUrl = sessionId && accessToken ? buildInviteUrl(sessionId, accessToken) : null;

    return (
        <div className="flex flex-col items-center gap-4 py-6">
            <div className="grid size-14 place-items-center rounded-full bg-success/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-7 text-success">
                    <path d="M20 6 9 17l-5-5" />
                </svg>
            </div>
            <div className="text-center">
                <p className="text-base font-semibold text-fg">Session Created!</p>
                <p className="mt-1 text-sm text-muted">
                    Your {mode} session has been created successfully.
                </p>
            </div>

            {inviteUrl && (
                <div className="w-full rounded-lg border border-border bg-surface p-3">
                    <p className="mb-1 text-[11px] text-muted">
                        Share this link — the candidate pastes it in their browser to join
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 truncate rounded bg-surface-2 px-2 py-1.5 font-mono text-xs text-fg">
                            {inviteUrl}
                        </code>
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(inviteUrl);
                                toast.success("Invite link copied to clipboard");
                            }}
                            className="grid size-8 shrink-0 place-items-center rounded-md border border-border text-muted transition-colors hover:text-fg"
                            aria-label="Copy invite link"
                            title="Copy invite link"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                                <rect width="14" height="14" x="8" y="8" rx="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {inviteUrl && (
                <p className="text-center text-[11px] text-muted">
                    You can open the room any time from the sessions list while it&apos;s live.
                </p>
            )}
        </div>
    );
}
