import type { ReactNode } from "react";
import type { SessionDetail } from "@algorym/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RATING_BADGES, RATING_LABELS, STATUS_BADGES, STATUS_LABELS } from "../../constants";
import { formatDate, formatDateTime, formatRelativeDuration } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

interface SessionInfoCardProps {
    session: SessionDetail;
    className?: string;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{label}</span>
            <div className="text-sm text-fg">{children}</div>
        </div>
    );
}

function Placeholder({ children }: { children: ReactNode }) {
    return <span className="text-muted">{children}</span>;
}

export function SessionInfoCard({ session, className }: SessionInfoCardProps) {
    const actualDuration = formatRelativeDuration(session.started_at, session.ended_at);

    return (
        <Card className={cn("flex h-full flex-col", className)}>
            <CardHeader>
                <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Candidate">
                        {session.candidate_name || session.candidate_email ? (
                            <div className="flex flex-col gap-0.5">
                                <span className="font-medium">
                                    {session.candidate_name || "Unnamed candidate"}
                                </span>
                                {session.candidate_email ? (
                                    <span className="break-all text-xs text-muted">
                                        {session.candidate_email}
                                    </span>
                                ) : null}
                            </div>
                        ) : (
                            <Placeholder>Not assigned</Placeholder>
                        )}
                    </Field>

                    <Field label="Language">
                        {session.language ? <span>{session.language}</span> : <Placeholder>Any</Placeholder>}
                    </Field>

                    <Field label="Status">
                        <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[session.status] || ""}`}
                        >
                            {STATUS_LABELS[session.status] || session.status}
                        </span>
                    </Field>

                    <Field label="Rating">
                        {session.rating ? (
                            <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${RATING_BADGES[session.rating] || ""}`}
                            >
                                {RATING_LABELS[session.rating] || session.rating}
                            </span>
                        ) : (
                            <Placeholder>Not rated</Placeholder>
                        )}
                    </Field>
                </div>

                <div className="border-t border-border pt-5">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                        {session.questions.length > 1
                            ? `Questions Used (${session.questions.length})`
                            : "Question Used"}
                    </p>
                    {session.questions.length ? (
                        <ol className="flex flex-col gap-2">
                            {session.questions.map((q, index) => (
                                <li key={q.id} className="flex items-start gap-2.5">
                                    <span className="mt-px grid size-5 shrink-0 place-items-center rounded-md bg-surface-2 text-[11px] font-semibold tabular-nums text-muted">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm font-medium text-fg">{q.title}</span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-sm">
                            <Placeholder>No question linked</Placeholder>
                        </p>
                    )}
                </div>

                <div className="border-t border-border pt-5">
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                        Timeline
                    </p>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Created">
                            <span>{formatDate(session.created_at)}</span>
                        </Field>
                        <Field label="Scheduled">
                            <span>{formatDateTime(session.scheduled_at)}</span>
                        </Field>
                        <Field label="Started">
                            <span>{formatDateTime(session.started_at)}</span>
                        </Field>
                        <Field label="Ended">
                            <div className="flex flex-col gap-0.5">
                                <span>{formatDateTime(session.ended_at)}</span>
                                {actualDuration !== "—" ? (
                                    <span className="text-xs text-muted">Ran for {actualDuration}</span>
                                ) : null}
                            </div>
                        </Field>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
