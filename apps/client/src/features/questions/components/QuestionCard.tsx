import { Spinner } from "@/components/ui/Spinner";
import { DIFFICULTY_BADGES, DIFFICULTY_LABELS, LANGUAGE_COLORS } from "../constants";
import type { Question } from "@algorym/shared-types";

interface QuestionCardProps {
    question: Question;
    onView: (question: Question) => void;
    onEdit: (question: Question) => void;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}

export function QuestionCard({ question, onView, onEdit, onDelete, isDeleting }: QuestionCardProps) {
    return (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong">
            {/* Title + actions row */}
            <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-fg leading-snug">
                    {question.title}
                </h3>
                <div className="flex shrink-0 items-center">
                    <button
                        type="button"
                        onClick={() => onView(question)}
                        className="grid size-6 place-items-center rounded text-muted transition-colors hover:text-fg"
                        aria-label="View question"
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
                        onClick={() => onEdit(question)}
                        className="size-6 -ml-0.5 grid place-items-center rounded text-muted transition-colors hover:text-fg"
                        aria-label="Edit question"
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
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(question.id)}
                        disabled={isDeleting}
                        className="size-6 -ml-0.5 grid place-items-center rounded text-muted transition-colors hover:text-danger disabled:opacity-50"
                        aria-label="Delete question"
                    >
                        {isDeleting ? (
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

            {/* Description */}
            <p className="line-clamp-2 text-sm leading-relaxed text-muted">
                {question.description}
            </p>

            {/* Tags: difficulty + languages */}
            <div className="flex flex-wrap items-center gap-1.5">
                <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${DIFFICULTY_BADGES[question.difficulty] || ""}`}
                >
                    {DIFFICULTY_LABELS[question.difficulty] || question.difficulty}
                </span>
                {question.languages.map((lang) => (
                    <span
                        key={lang}
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${LANGUAGE_COLORS[lang] || "bg-surface-2 text-muted"}`}
                    >
                        {lang}
                    </span>
                ))}
            </div>
        </div>
    );
}
