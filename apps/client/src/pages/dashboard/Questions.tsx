import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/dropdown";
import { Spinner } from "@/components/ui/Spinner";
import {
    useQuestions,
    useDeleteQuestion,
    QuestionFormModal,
    QuestionsGrid,
    QuestionsEmpty,
    QuestionsError,
    SORT_OPTIONS,
    DIFFICULTY_OPTIONS,
} from "@/features/questions";
import type { Question } from "@algorym/shared-types";

export function Questions() {
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [sortBy, setSortBy] = useState("date_desc");
    const [page, setPage] = useState(1);
    const [appliedFilters, setAppliedFilters] = useState({
        search: "",
        difficulty: "",
        sort_by: "date_desc",
        page: 1,
    });

    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

    const { data, isLoading, error } = useQuestions(appliedFilters);
    const deleteQuestion = useDeleteQuestion();

    const questions = data?.questions ?? [];
    const pagination = data?.pagination ?? { page: 1, limit: 21, total: 0, totalPages: 1 };

    const handleSearch = () => {
        setPage(1);
        setAppliedFilters({ search, difficulty, sort_by: sortBy, page: 1 });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleDelete = (id: string) => {
        deleteQuestion.mutate(id, {
            onSuccess: () => toast.success("Question deleted"),
            onError: (err) => {
                const message = err instanceof Error ? err.message : "Failed to delete question";
                toast.error(message);
            },
        });
    };

    const openCreate = () => {
        setFormMode("create");
        setSelectedQuestion(null);
        setFormOpen(true);
    };

    const openView = (q: Question) => {
        setFormMode("view");
        setSelectedQuestion(q);
        setFormOpen(true);
    };

    const openEdit = (q: Question) => {
        setFormMode("edit");
        setSelectedQuestion(q);
        setFormOpen(true);
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
                    Questions
                </h1>
                <Button variant="primary" size="sm" onClick={openCreate}>
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
                    Add Question
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
                        placeholder="Search by name, description, or language..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-10 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-4 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                </div>

                <Dropdown
                    options={[...DIFFICULTY_OPTIONS]}
                    value={difficulty}
                    onChange={setDifficulty}
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
            <div className="flex-1">
                {isLoading ? (
                    <div className="flex h-full min-h-[400px] items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : error ? (
                    <QuestionsError message={error.message} onRetry={handleSearch} />
                ) : questions.length === 0 ? (
                    <QuestionsEmpty
                        hasFilters={!!appliedFilters.search || !!appliedFilters.difficulty}
                    />
                ) : (
                    <QuestionsGrid
                        questions={questions}
                        pagination={pagination}
                        page={page}
                        onPageChange={(p) => {
                            setPage(p);
                            setAppliedFilters((prev) => ({ ...prev, page: p }));
                        }}
                        onView={openView}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        isDeleting={deleteQuestion.isPending}
                    />
                )}
            </div>

            {/* Form Modal */}
            <QuestionFormModal
                open={formOpen}
                mode={formMode}
                question={selectedQuestion}
                onOpenChange={setFormOpen}
            />
        </div>
    );
}
