import { DIFFICULTY_BADGES } from "@/features/questions";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import type { SessionQuestionRef } from "@algorym/shared-types";

interface AssignedQuestionsProps {
    questions: SessionQuestionRef[];
    currentQuestionId: string | null;
    isLoading: boolean;
    isSwitching: boolean;
    onSelect: (questionId: string) => void;
}

/**
 * The questions already assigned to this session, in order.
 *
 * Order matters here: `sessions` stores them positionally, and the host works
 * through the list deliberately. Selecting one calls `PATCH /question`, which
 * also rotates it to the front of that list server-side — so the order you see
 * reflects the order you are working through.
 */
export function AssignedQuestions({
    questions,
    currentQuestionId,
    isLoading,
    isSwitching,
    onSelect,
}: AssignedQuestionsProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 p-4 text-xs text-muted">
                <Spinner size="sm" />
                Loading…
            </div>
        );
    }

    if (questions.length === 0) {
        return <p className="p-4 text-xs text-muted">No questions assigned. Browse all to add one.</p>;
    }

    return (
        <ul className="flex flex-col p-1.5">
            {questions.map((question, index) => {
                const isCurrent = question.id === currentQuestionId;

                return (
                    <li key={question.id}>
                        <button
                            type="button"
                            disabled={isSwitching}
                            onClick={() => onSelect(question.id)}
                            className={cn(
                                "flex w-full items-start gap-2.5 rounded px-2 py-2 text-left transition-colors",
                                "disabled:cursor-wait disabled:opacity-60",
                                isCurrent ? "bg-accent-soft" : "hover:bg-surface-2"
                            )}
                        >
                            <span
                                className={cn(
                                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded text-[10px] font-semibold",
                                    isCurrent ? "bg-accent text-on-accent" : "bg-surface-2 text-muted"
                                )}
                            >
                                {index + 1}
                            </span>

                            <span
                                className={cn(
                                    "min-w-0 flex-1 text-xs leading-snug",
                                    isCurrent ? "font-medium text-fg" : "text-muted"
                                )}
                            >
                                {question.title}
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

/** Small legend so the host can read difficulty without opening each question. */
export function DifficultyLegend({ values }: { values: string[] }) {
    const seen = Array.from(new Set(values));

    if (seen.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
            {seen.map((difficulty) => (
                <span
                    key={difficulty}
                    className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
                        DIFFICULTY_BADGES[difficulty] || "bg-muted/10 text-muted"
                    )}
                >
                    {difficulty}
                </span>
            ))}
        </div>
    );
}
