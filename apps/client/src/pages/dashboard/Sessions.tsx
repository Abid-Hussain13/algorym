import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useSessions, useDeleteSession, CreateSessionModal, EditSessionModal } from "@/features/sessions";
import { SessionsFilters } from "@/features/sessions/components/SessionsFilters";
import { SessionListTable } from "@/features/sessions/components/SessionListTable";
import { SessionListMobileCards } from "@/features/sessions/components/SessionListMobileCards";
import { SessionsPagination } from "@/features/sessions/components/SessionsPagination";

export function Sessions() {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editSessionId, setEditSessionId] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [mode, setMode] = useState("");
    const [sortBy, setSortBy] = useState("date_desc");
    const [appliedFilters, setAppliedFilters] = useState({
        search: "",
        mode: "",
        sort_by: "date_desc",
        page: 1,
    });

    const { data, isLoading, error } = useSessions(appliedFilters);
    const deleteSession = useDeleteSession();

    const sessions = data?.sessions ?? [];
    const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 };

    const handleSearch = () => {
        setAppliedFilters({ search, mode, sort_by: sortBy, page: 1 });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleDelete = (id: string) => {
        deleteSession.mutate(id, {
            onSuccess: () => toast.success("Session deleted"),
            onError: (err) => {
                const message = err instanceof Error ? err.message : "Failed to delete session";
                toast.error(message);
            },
        });
    };

    const handleEdit = (id: string) => {
        setEditSessionId(id);
        setEditOpen(true);
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
                    Sessions
                </h1>
                <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                    </svg>
                    Create
                </Button>
            </div>

            <SessionsFilters
                search={search}
                onSearchChange={setSearch}
                onSearchSubmit={handleSearch}
                onKeyDown={handleKeyDown}
                mode={mode}
                onModeChange={setMode}
                sortBy={sortBy}
                onSortByChange={setSortBy}
            />

            <div className="flex-1 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-sm">
                {isLoading ? (
                    <div className="flex h-full min-h-[400px] items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : error ? (
                    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 p-6">
                        <div className="grid size-12 place-items-center rounded-full bg-danger/10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-danger">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-fg">Something went wrong</p>
                        <p className="text-xs text-muted">{error.message}</p>
                        <Button variant="primary" size="sm" onClick={handleSearch}>
                            Try Again
                        </Button>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-2 p-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-8 text-muted">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M16 13H8" />
                            <path d="M16 17H8" />
                            <path d="M10 9H8" />
                        </svg>
                        <p className="text-sm font-medium text-fg">No sessions found</p>
                        <p className="text-xs text-muted">
                            {appliedFilters.search || appliedFilters.mode
                                ? "Try adjusting your filters"
                                : "Create your first session to get started"}
                        </p>
                    </div>
                ) : (
                    <>
                        <SessionListTable
                            sessions={sessions}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            isDeleting={deleteSession.isPending}
                        />
                        <SessionListMobileCards
                            sessions={sessions}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            isDeleting={deleteSession.isPending}
                        />
                        <SessionsPagination
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            total={pagination.total}
                            onPageChange={(p) => {
                                setAppliedFilters((prev) => ({ ...prev, page: p }));
                            }}
                        />
                    </>
                )}
            </div>

            <CreateSessionModal open={createOpen} onOpenChange={setCreateOpen} />
            <EditSessionModal
                open={editOpen}
                sessionId={editSessionId}
                onOpenChange={(v) => {
                    setEditOpen(v);
                    if (!v) setEditSessionId(null);
                }}
            />
        </div>
    );
}
