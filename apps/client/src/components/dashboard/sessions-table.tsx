import { useNavigate } from "react-router-dom";

interface Session {
    id: string;
    title: string;
    candidateEmail: string;
    date: string;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'expired';
}

interface SessionsTableProps {
    sessions: Session[];
}

const statusStyles: Record<Session["status"], string> = {
    completed: "bg-success/10 text-success",
    live: "bg-accent-soft text-accent-text",
    scheduled: "bg-info/10 text-info",
    cancelled: "bg-warning/10 text-warning",
    expired: "bg-danger/10 text-danger",
};

const statusLabels: Record<Session["status"], string> = {
    completed: "Completed",
    live: "Live",
    scheduled: "Scheduled",
    cancelled: "Cancelled",
    expired: "Expired",
};

export function SessionsTable({ sessions }: SessionsTableProps) {
    const navigate = useNavigate();

    return (
        <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-surface-2 shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <h2 className="text-sm font-semibold text-fg">Recent Sessions</h2>
                <button
                    type="button"
                    onClick={() => navigate("/app/sessions")}
                    className="text-xs font-medium text-accent-text transition-colors hover:text-accent-hover"
                >
                    View all
                </button>
            </div>

            {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-8 text-muted">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M16 13H8" />
                        <path d="M16 17H8" />
                        <path d="M10 9H8" />
                    </svg>
                    <p className="text-sm text-muted">No sessions yet</p>
                    <p className="text-xs text-muted">Create your first session to get started</p>
                </div>
            ) : (
            <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="px-5 py-2.5 font-medium text-muted">Session</th>
                            <th className="px-5 py-2.5 font-medium text-muted">Candidate Email</th>
                            <th className="px-5 py-2.5 font-medium text-muted">Date</th>
                            <th className="px-5 py-2.5 font-medium text-muted">Status</th>
                            <th className="w-12 px-5 py-2.5"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((session) => (
                            <tr
                                key={session.id}
                                className="border-b border-border last:border-0 transition-colors hover:bg-surface"
                            >
                                <td className="px-5 py-4 font-medium text-fg">{session.title}</td>
                                <td className="px-5 py-1 text-muted">{session.candidateEmail}</td>
                                <td className="px-5 py-1 text-muted">{session.date}</td>
                                <td className="px-5 py-1">
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusStyles[session.status]}`}>
                                        {statusLabels[session.status]}
                                    </span>
                                </td>
                                <td className="px-4 py-1">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/app/sessions/${session.id}`)}
                                        className="grid px-2 py-2 place-items-center rounded-lg text-muted transition-colors hover:text-fg"
                                        aria-label={`Open ${session.title}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                            <path d="M7 7h10v10" />
                                            <path d="M7 17 17 7" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
        </div>
    );
}
