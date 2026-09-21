import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/Spinner";
import { STATUS_BADGES, STATUS_LABELS, RATING_BADGES, RATING_LABELS, MODE_BADGES } from "../constants";
import type { Session } from "@algorym/shared-types";

interface SessionListMobileCardsProps {
    sessions: Session[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function SessionListMobileCards({ sessions, onEdit, onDelete, isDeleting }: SessionListMobileCardsProps) {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-3 p-4 md:hidden">
            {sessions.map((session) => (
                <div
                    key={session.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                            <p className="font-medium text-fg">
                                {session.role_context || "Session"}
                            </p>
                            <p className="text-xs text-muted">
                                {session.candidate_name || session.candidate_email || "No candidate"}
                            </p>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <button
                                type="button"
                                onClick={() => navigate(`/app/sessions/${session.id}`)}
                                className="grid size-6 place-items-center rounded text-muted transition-colors hover:text-fg"
                                aria-label="View details"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                                    <path d="M7 7h10v10" />
                                    <path d="M7 17 17 7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => onEdit(session.id)}
                                className="grid size-6 place-items-center rounded text-muted transition-colors hover:text-fg"
                                aria-label="Edit session"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    <path d="m15 5 4 4" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(session.id)}
                                disabled={isDeleting}
                                className="grid size-6 place-items-center rounded text-muted transition-colors hover:text-danger disabled:opacity-50"
                                aria-label="Delete session"
                            >
                                {isDeleting ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${MODE_BADGES[session.mode] || ""}`}>
                            {session.mode === "interview" ? "Interview" : "Practice"}
                        </span>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[session.status] || ""}`}>
                            {STATUS_LABELS[session.status] || session.status}
                        </span>
                        {session.rating && (
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${RATING_BADGES[session.rating] || ""}`}>
                                {RATING_LABELS[session.rating] || session.rating}
                            </span>
                        )}
                        {session.languages?.[0] && (
                            <span className="inline-flex items-center rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
                                {session.languages[0]}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted">
                        {formatDate(session.created_at)}
                    </p>
                </div>
            ))}
        </div>
    );
}
