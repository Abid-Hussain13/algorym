import { toast } from "sonner";

interface StepSuccessProps {
    mode: "interview" | "practice";
    accessToken: string | undefined;
}

export function StepSuccess({ mode, accessToken }: StepSuccessProps) {
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
            {accessToken && (
                <div className="w-full rounded-lg border border-border bg-surface p-3">
                    <p className="text-[11px] text-muted mb-1">Share this link with participants</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs font-mono text-fg truncate bg-surface-2 rounded px-2 py-1.5">
                            {accessToken}
                        </code>
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(accessToken);
                                toast.success("Copied to clipboard");
                            }}
                            className="shrink-0 size-8 grid place-items-center rounded-md border border-border text-muted hover:text-fg transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                                <rect width="14" height="14" x="8" y="8" rx="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
