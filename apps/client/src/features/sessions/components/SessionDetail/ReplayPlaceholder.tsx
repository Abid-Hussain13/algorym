import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

interface ReplayPlaceholderProps {
    className?: string;
}

export function ReplayPlaceholder({ className }: ReplayPlaceholderProps) {
    return (
        <Card className={cn(className)}>
            <CardHeader>
                <CardTitle>Session Replay</CardTitle>
                <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    Coming soon
                </span>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-12 text-center">
                    <div className="grid size-12 place-items-center rounded-full bg-accent-soft">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.7}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-5 text-accent-text"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m10 8 6 4-6 4Z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-fg">Replay is on the way</p>
                    <p className="max-w-md text-xs leading-relaxed text-muted">
                        Code snapshots, run results and the full interaction timeline will be
                        playable here — built from session events, never from your device.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
