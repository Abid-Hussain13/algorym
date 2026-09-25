import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/Spinner";
import { STATUS_BADGES, STATUS_LABELS, RATING_BADGES, RATING_LABELS, MODE_BADGES } from "../constants";
import type { SessionListItem } from "@algorym/shared-types";

interface SessionListTableProps {
    sessions: SessionListItem[];
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

export function SessionListTable({ sessions, onEdit, onDelete, isDeleting }: SessionListTableProps) {
    const navigate = useNavigate();

    return (
        <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-border">
                        <th className="px-5 py-3 font-medium text-muted">Session</th>
                        <th className="px-5 py-3 font-medium text-muted">Mode</th>
                        <th className="px-5 py-3 font-medium text-muted">Candidate</th>
                        <th className="px-5 py-3 font-medium text-muted">Language</th>
                        <th className="px-5 py-3 font-medium text-muted">Status</th>
                        <th className="px-5 py-3 font-medium text-muted">Rating</th>
                        <th className="px-5 py-3 font-medium text-muted">Date</th>
                        <th className="w-16 px-3 py-3 font-medium text-muted">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sessions.map((session) => (
                        <tr
                            key={session.id}
                            className="border-b border-border last:border-0 transition-colors hover:bg-surface"
                        >
                            <td className="px-5 py-3.5 font-medium text-fg">
                                {session.role_context || "Session"}
                            </td>
                            <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${MODE_BADGES[session.mode] || ""}`}>
                                    {session.mode === "interview" ? "Interview" : "Practice"}
                                </span>
                            </td>
                            <td className="px-5 py-3.5 text-muted">
                                {session.candidate_name || session.candidate_email || "—"}
                            </td>
                            <td className="px-5 py-3.5 text-muted">
                                {session.language || "—"}
                            </td>
                            <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[session.status] || ""}`}>
                                    {STATUS_LABELS[session.status] || session.status}
                                </span>
                            </td>
                            <td className="px-5 py-3.5">
                                {session.rating ? (
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${RATING_BADGES[session.rating] || ""}`}>
                                        {RATING_LABELS[session.rating] || session.rating}
                                    </span>
                                ) : (
                                    <span className="text-muted">—</span>
                                )}
                            </td>
                            <td className="px-5 py-3.5 text-muted">
                                {formatDate(session.created_at)}
                            </td>
                            <td className="px-3 py-3.5">
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
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
