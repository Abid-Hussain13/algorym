import { useNavigate } from "react-router-dom";

interface Session {
    id: string;
    title: string;
    candidate: string;
    date: string;
    status: "completed" | "in-progress" | "scheduled";
}

const mockSessions: Session[] = [
    { id: "1", title: "Senior Frontend Interview", candidate: "Alice Johnson", date: "Sep 8, 2026", status: "completed" },
    { id: "2", title: "Backend Developer Screen", candidate: "Bob Smith", date: "Sep 7, 2026", status: "completed" },
    { id: "3", title: "Fullstack Role Review", candidate: "Carol White", date: "Sep 6, 2026", status: "in-progress" },
    { id: "4", title: "DevOps Engineer Call", candidate: "Dave Brown", date: "Sep 5, 2026", status: "scheduled" },
    { id: "5", title: "Product Manager Interview", candidate: "Eve Davis", date: "Sep 4, 2026", status: "completed" },
];

const statusStyles: Record<Session["status"], string> = {
    completed: "bg-success/10 text-success",
    "in-progress": "bg-accent-soft text-accent-text",
    scheduled: "bg-info/10 text-info",
};

const statusLabels: Record<Session["status"], string> = {
    completed: "Completed",
    "in-progress": "In Progress",
    scheduled: "Scheduled",
};

export function SessionsTable() {
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

            <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="px-5 py-2.5 font-medium text-muted">Session</th>
                            <th className="px-5 py-2.5 font-medium text-muted">Candidate</th>
                            <th className="px-5 py-2.5 font-medium text-muted">Date</th>
                            <th className="px-5 py-2.5 font-medium text-muted">Status</th>
                            <th className="w-12 px-5 py-2.5"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockSessions.map((session) => (
                            <tr
                                key={session.id}
                                className="border-b border-border last:border-0 transition-colors hover:bg-surface"
                            >
                                <td className="px-5 py-4 font-medium text-fg">{session.title}</td>
                                <td className="px-5 py-1 text-muted">{session.candidate}</td>
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
        </div>
    );
}
