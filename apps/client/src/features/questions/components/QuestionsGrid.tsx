import type { Question, Pagination } from "@algorym/shared-types";
import { QuestionCard } from "./QuestionCard";

interface QuestionsGridProps {
    questions: Question[];
    pagination: Pagination;
    page: number;
    onPageChange: (page: number) => void;
    onView: (question: Question) => void;
    onEdit: (question: Question) => void;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}

export function QuestionsGrid({
    questions,
    pagination,
    page,
    onPageChange,
    onView,
    onEdit,
    onDelete,
    isDeleting,
}: QuestionsGridProps) {
    return (
        <div className="flex-1">
            {/* Card grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {questions.map((question) => (
                    <QuestionCard
                        key={question.id}
                        question={question}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isDeleting={isDeleting}
                    />
                ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-5 py-3">
                    <p className="text-xs text-muted">
                        Page {pagination.page} of {pagination.totalPages}{" "}
                        ({pagination.total} questions)
                    </p>
                    <div className="flex items-center gap-0.5">
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.max(1, page - 1))}
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
                                        onClick={() => onPageChange(item)}
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
                                onPageChange(
                                    Math.min(pagination.totalPages, page + 1)
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
        </div>
    );
}
