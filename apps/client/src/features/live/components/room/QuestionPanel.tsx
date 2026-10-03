import { DIFFICULTY_BADGES, DIFFICULTY_LABELS, LANGUAGE_COLORS } from "@/features/questions";
import { Spinner } from "@/components/ui/Spinner";
import type { Question } from "@algorym/shared-types";

interface QuestionPanelProps {
    question: Question | null;
    language: string | null;
    isLoading: boolean;
}

/**
 * The problem the room is working on.
 *
 * Read-only on purpose: only the host changes the question (from the right
 * rail), so the candidate can never accidentally switch the task out from under
 * themselves.
 */
export function QuestionPanel({ question, language, isLoading }: QuestionPanelProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 p-4 text-xs text-muted">
                <Spinner size="sm" />
                Loading question…
            </div>
        );
    }

    if (!question) {
        return (
            <div className="p-4 text-xs text-muted">
                No question assigned yet.
                {language && <span className="block pt-1 text-muted/80">Language: {language}</span>}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2.5 p-4">
            <div className="flex flex-wrap items-center gap-1.5">
                <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        DIFFICULTY_BADGES[question.difficulty] || "bg-muted/10 text-muted"
                    }`}
                >
                    {DIFFICULTY_LABELS[question.difficulty] || question.difficulty}
                </span>
                {language && (
                    <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            LANGUAGE_COLORS[language] ?? "bg-muted/10 text-muted"
                        }`}
                    >
                        {language}
                    </span>
                )}
            </div>

            <h2 className="font-display text-sm font-semibold leading-snug text-fg">
                {question.title}
            </h2>

            <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted">
                {question.description}
            </p>
        </div>
    );
}
