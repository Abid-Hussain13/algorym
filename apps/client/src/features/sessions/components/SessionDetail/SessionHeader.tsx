import { useNavigate } from "react-router-dom";
import type { SessionDetail } from "@algorym/shared-types";
import { MODE_BADGES, MODE_LABELS, STATUS_BADGES, STATUS_LABELS } from "../../constants";
import { formatDate, formatDuration } from "@/lib/utils/date";

interface SessionHeaderProps {
    session: SessionDetail;
}

export function SessionHeader({ session }: SessionHeaderProps) {
    const navigate = useNavigate();
    const hasName = !!session.role_context?.trim();

    return (
        <div className="flex flex-col gap-4">
            <button
                type="button"
                onClick={() => navigate("/app/sessions")}
                className="group inline-flex w-fit items-center gap-1.5 font-body text-sm text-muted transition-colors hover:text-fg"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5"
                    aria-hidden="true"
                >
                    <path d="M19 12H5" />
                    <path d="m12 19-7-7 7-7" />
                </svg>
                Sessions
            </button>

            <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
                        {hasName ? session.role_context : "Untitled Session"}
                    </h1>
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${MODE_BADGES[session.mode] || ""}`}
                    >
                        {MODE_LABELS[session.mode] || session.mode}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted">
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[session.status] || ""}`}
                    >
                        {STATUS_LABELS[session.status] || session.status}
                    </span>
                    <span className="text-border-strong" aria-hidden="true">
                        ·
                    </span>
                    <span>Created {formatDate(session.created_at)}</span>
                    {session.duration_minutes ? (
                        <>
                            <span className="text-border-strong" aria-hidden="true">
                                ·
                            </span>
                            <span>{formatDuration(session.duration_minutes)} slot</span>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
