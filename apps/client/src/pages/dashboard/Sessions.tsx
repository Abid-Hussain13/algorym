import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { sessionsApi } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/dropdown";
import { Spinner } from "@/components/ui/Spinner";
import type {
    SessionListItem,
    SessionListParams,
} from "@algorym/shared-types";

const SORT_OPTIONS = [
    { value: "date_desc", label: "Newest First" },
    { value: "date_asc", label: "Oldest First" },
    { value: "status", label: "Status" },
    { value: "rating", label: "Rating" },
] as const;

const MODE_OPTIONS = [
    { value: "", label: "All Modes" },
    { value: "interview", label: "Interview" },
    { value: "practice", label: "Practice" },
] as const;

const STATUS_BADGES: Record<string, string> = {
    completed: "bg-success/10 text-success",
    live: "bg-accent-soft text-accent-text",
    scheduled: "bg-info/10 text-info",
    cancelled: "bg-muted/10 text-muted",
    expired: "bg-danger/10 text-danger",
};

const STATUS_LABELS: Record<string, string> = {
    completed: "Completed",
    live: "Live",
    scheduled: "Scheduled",
    cancelled: "Cancelled",
    expired: "Expired",
};

const RATING_BADGES: Record<string, string> = {
    strong: "bg-success/10 text-success",
    average: "bg-info/10 text-info",
    weak: "bg-danger/10 text-danger",
};

const RATING_LABELS: Record<string, string> = {
    strong: "Strong",
    average: "Average",
    weak: "Weak",
};

const MODE_BADGES: Record<string, string> = {
    interview: "bg-accent-soft text-accent-text",
    practice: "bg-info/10 text-info",
};

export function Sessions() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState<SessionListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
    });

    const [search, setSearch] = useState("");
    const [mode, setMode] = useState("");
    const [sortBy, setSortBy] = useState("date_desc");
    const [page, setPage] = useState(1);

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchSessions = useCallback(
        async (params: SessionListParams) => {
            setLoading(true);
            setError(null);
            try {
                const result = await sessionsApi.list(params);
                setSessions(result.sessions);
                setPagination(result.pagination);
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Failed to load sessions";
                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchSessions({ search, mode, sort_by: sortBy, page });
    }, [fetchSessions, page]);

    const handleSearch = () => {
        setPage(1);
        fetchSessions({ search, mode, sort_by: sortBy, page: 1 });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await sessionsApi.remove(id);
            setSessions((prev) => prev.filter((s) => s.id !== id));
            toast.success("Session deleted");
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to delete session";
            toast.error(message);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
                    Sessions
                </h1>
                <Button variant="primary" size="sm" onClick={() => navigate("/app/sessions/new")}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4"
                    >
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                    </svg>
                    Create
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name, email, or role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-10 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-4 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                </div>

                <Dropdown
                    options={[...MODE_OPTIONS]}
                    value={mode}
                    onChange={setMode}
                    className="shrink-0"
                />

                <Dropdown
                    options={[...SORT_OPTIONS]}
                    value={sortBy}
                    onChange={setSortBy}
                    className="shrink-0"
                />

                <Button variant="primary" size="sm" onClick={handleSearch}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    Search
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-sm">
                {loading ? (
                    <div className="flex h-full min-h-[400px] items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : error ? (
                    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 p-6">
                        <div className="grid size-12 place-items-center rounded-full bg-danger/10">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-6 text-danger"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-fg">
                            Something went wrong
                        </p>
                        <p className="text-xs text-muted">{error}</p>
                        <Button variant="primary" size="sm" onClick={handleSearch}>
                            Try Again
                        </Button>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-2 p-6 text-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-8 text-muted"
                        >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M16 13H8" />
                            <path d="M16 17H8" />
                            <path d="M10 9H8" />
                        </svg>
                        <p className="text-sm font-medium text-fg">No sessions found</p>
                        <p className="text-xs text-muted">
                            {search || mode
                                ? "Try adjusting your filters"
                                : "Create your first session to get started"}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="px-5 py-3 font-medium text-muted">
                                            Session
                                        </th>
                                        <th className="px-5 py-3 font-medium text-muted">
                                            Mode
                                        </th>
                                        <th className="px-5 py-3 font-medium text-muted">
                                            Candidate
                                        </th>
                                        <th className="px-5 py-3 font-medium text-muted">
                                            Lang
                                        </th>
                                        <th className="px-5 py-3 font-medium text-muted">
                                            Status
                                        </th>
                                        <th className="px-5 py-3 font-medium text-muted">
                                            Rating
                                        </th>
                                        <th className="px-5 py-3 font-medium text-muted">
                                            Date
                                        </th>
                                        <th className="w-16 px-3 py-3 font-medium text-muted">
                                            Actions
                                        </th>
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
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${MODE_BADGES[session.mode] || ""}`}
                                                >
                                                    {session.mode === "interview"
                                                        ? "Interview"
                                                        : "Practice"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-muted">
                                                {session.candidate_name ||
                                                    session.candidate_email ||
                                                    "—"}
                                            </td>
                                            <td className="px-5 py-3.5 text-muted">
                                                {session.languages?.join(', ') || "—"}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[session.status] || ""}`}
                                                >
                                                    {STATUS_LABELS[session.status] ||
                                                        session.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {session.rating ? (
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${RATING_BADGES[session.rating] || ""}`}
                                                    >
                                                        {RATING_LABELS[session.rating] ||
                                                            session.rating}
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
                                                        onClick={() =>
                                                            navigate(`/app/sessions/${session.id}`)
                                                        }
                                                        className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:text-fg"
                                                        aria-label="View details"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.7"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="size-3.5"
                                                        >
                                                            <path d="M7 7h10v10" />
                                                            <path d="M7 17 17 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(session.id)}
                                                        disabled={deletingId === session.id}
                                                        className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:text-danger disabled:opacity-50"
                                                        aria-label="Delete session"
                                                    >
                                                        {deletingId === session.id ? (
                                                            <Spinner size="sm" />
                                                        ) : (
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="1.7"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                className="size-3.5"
                                                            >
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

                        {/* Mobile cards */}
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
                                                {session.candidate_name ||
                                                    session.candidate_email ||
                                                    "No candidate"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(`/app/sessions/${session.id}`)
                                                }
                                                className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                                                aria-label="View details"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="size-3.5"
                                                >
                                                    <path d="M7 7h10v10" />
                                                    <path d="M7 17 17 7" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(session.id)}
                                                disabled={deletingId === session.id}
                                                className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                                                aria-label="Delete session"
                                            >
                                                {deletingId === session.id ? (
                                                    <Spinner size="sm" />
                                                ) : (
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.7"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="size-3.5"
                                                    >
                                                        <path d="M3 6h18" />
                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${MODE_BADGES[session.mode] || ""}`}
                                        >
                                            {session.mode === "interview"
                                                ? "Interview"
                                                : "Practice"}
                                        </span>
                                        <span
                                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[session.status] || ""}`}
                                        >
                                            {STATUS_LABELS[session.status] ||
                                                session.status}
                                        </span>
                                        {session.rating && (
                                            <span
                                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${RATING_BADGES[session.rating] || ""}`}
                                            >
                                                {RATING_LABELS[session.rating] ||
                                                    session.rating}
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

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-border px-5 py-3">
                                <p className="text-xs text-muted">
                                    Page {pagination.page} of {pagination.totalPages}{" "}
                                    ({pagination.total} sessions)
                                </p>
                                <div className="flex items-center gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="grid size-6 place-items-center rounded-md border border-border text-muted transition-colors hover:bg-surface hover:text-fg disabled:opacity-40 disabled:hover:bg-transparent"
                                        aria-label="Previous page"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="size-3"
                                        >
                                            <path d="m15 18-6-6 6-6" />
                                        </svg>
                                    </button>
                                    {Array.from(
                                        { length: pagination.totalPages },
                                        (_, i) => i + 1
                                    )
                                        .filter(
                                            (p) =>
                                                p === 1 ||
                                                p === pagination.totalPages ||
                                                Math.abs(p - page) <= 1
                                        )
                                        .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                                            if (i > 0 && p - (arr[i - 1] as number) > 1) {
                                                acc.push("ellipsis");
                                            }
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((item, i) =>
                                            item === "ellipsis" ? (
                                                <span
                                                    key={`e-${i}`}
                                                    className="px-1 text-xs text-muted"
                                                >
                                                    …
                                                </span>
                                            ) : (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => setPage(item)}
                                                    className={`grid size-6 place-items-center rounded-md text-xs font-medium transition-colors ${page === item
                                                        ? "bg-accent text-on-accent"
                                                        : "text-muted hover:bg-surface hover:text-fg"
                                                        }`}
                                                >
                                                    {item}
                                                </button>
                                            )
                                        )}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.min(pagination.totalPages, p + 1)
                                            )
                                        }
                                        disabled={page === pagination.totalPages}
                                        className="grid size-6 place-items-center rounded-md border border-border text-muted transition-colors hover:bg-surface hover:text-fg disabled:opacity-40 disabled:hover:bg-transparent"
                                        aria-label="Next page"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="size-3"
                                        >
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
