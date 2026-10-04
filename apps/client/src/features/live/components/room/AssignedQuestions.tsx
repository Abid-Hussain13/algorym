import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import type { SessionQuestionRef } from "@algorym/shared-types";

interface AssignedQuestionsProps {
    questions: SessionQuestionRef[];
    currentQuestionId: string | null;
    isLoading: boolean;
    isSwitching: boolean;
    onSelect: (questionId: string) => void;
    /**
     * Candidates see the list but cannot act on it. Read-only rather than
     * host-only, because knowing what is coming makes the interview feel
     * deliberate — but switching questions is the host's call, since the room
     * shares one code buffer and the rating depends on everyone being on the
     * same question at the same time.
     */
    readOnly?: boolean;
}

/**
 * The questions assigned to this session, in order.
 *
 * Order matters: `session_questions` stores them positionally, and the host works
 * through the list deliberately. Switching rotates the chosen question to the
 * front server-side, so the order reflects progress.
 */
export function AssignedQuestions({
    questions,
    currentQuestionId,
    isLoading,
    isSwitching,
    onSelect,
    readOnly = false,
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
        return (
            <p className="p-4 text-xs text-muted">
                {readOnly
                    ? "No questions have been assigned to this session."
                    : "No questions assigned. Browse all to add one."}
            </p>
        );
    }

    return (
        <>
            <ul className="flex flex-col p-1.5">
                {questions.map((question, index) => {
                    const isCurrent = question.id === currentQuestionId;

                    return (
                        <li key={question.id}>
                            <button
                                type="button"
                                disabled={isSwitching || readOnly}
                                onClick={() => onSelect(question.id)}
                                className={cn(
                                    "flex w-full items-start gap-2.5 rounded px-2 py-2 text-left transition-colors",
                                    "disabled:cursor-default",
                                    isSwitching && !readOnly && "cursor-wait opacity-60",
                                    isCurrent ? "bg-accent-soft" : "hover:bg-surface-2",
                                    readOnly && !isCurrent && "hover:bg-transparent"
                                )}
                                title={readOnly ? "Only the interviewer can switch questions" : undefined}
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

            {readOnly && (
                <p className="border-t border-border px-3 py-2 text-[11px] leading-relaxed text-muted">
                    {questions.length} {questions.length === 1 ? "question" : "questions"} in this
                    session. Only the interviewer can switch between them.
                </p>
            )}
        </>
    );
}
