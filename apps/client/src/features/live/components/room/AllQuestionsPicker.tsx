import { useState } from "react";
import { DIFFICULTY_BADGES, useQuestions, AVAILABLE_LANGUAGES } from "@/features/questions";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import { isSupportedLanguage } from "../../lib/editor-languages";
import type { Question } from "@algorym/shared-types";

interface AllQuestionsPickerProps {
    currentQuestionId: string | null;
    /** Question ids already in this session, so they can be marked. */
    assignedIds: string[];
    onSelect: (questionId: string, language: string) => void;
}

/**
 * Host-only: pull any question from the library into the live session.
 *
 * Switching question also passes the language, taken from whichever supported
 * language the question actually supports. Reusing the current language when it
 * is valid avoids needlessly re-seeding the room into a different language
 * mid-interview.
 */
export function AllQuestionsPicker({
    currentQuestionId,
    assignedIds,
    onSelect,
}: AllQuestionsPickerProps) {
    const [search, setSearch] = useState("");
    const { data, isLoading } = useQuestions(search ? { search } : undefined);

    const questions: Question[] = data?.questions ?? [];

    const choose = (question: Question) => {
        const languages = question.languages.filter(isSupportedLanguage);
        onSelect(question.id, languages[0] ?? "javascript");
    };

    return (
        <div className="flex h-full flex-col">
            <div className="shrink-0 p-2.5">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search your questions…"
                    aria-label="Search questions"
                    className="w-full rounded border border-border bg-surface-2/40 px-2.5 py-1.5 text-xs text-fg placeholder:text-muted/70"
                />
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2 p-4 text-xs text-muted">
                    <Spinner size="sm" />
                    Loading questions…
                </div>
            ) : questions.length === 0 ? (
                <p className="p-4 text-xs text-muted">
                    {search ? `Nothing matches “${search}”.` : "You have no questions yet."}
                </p>
            ) : (
                <ul className="flex flex-col px-1.5 pb-2">
                    {questions.map((question) => {
                        const isCurrent = question.id === currentQuestionId;
                        const isAssigned = assignedIds.includes(question.id);

                        return (
                            <li key={question.id}>
                                <button
                                    type="button"
                                    onClick={() => choose(question)}
                                    className={cn(
                                        "flex w-full flex-col gap-1.5 rounded px-2 py-2 text-left transition-colors",
                                        isCurrent ? "bg-accent-soft" : "hover:bg-surface-2"
                                    )}
                                >
                                    <span className="flex items-start justify-between gap-2">
                                        <span
                                            className={cn(
                                                "text-xs font-medium leading-snug",
                                                isCurrent ? "text-fg" : "text-fg/90"
                                            )}
                                        >
                                            {question.title}
                                        </span>
                                        {isAssigned && (
                                            <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">
                                                {isCurrent ? "current" : "assigned"}
                                            </span>
                                        )}
                                    </span>

                                    <span className="flex flex-wrap items-center gap-1">
                                        <span
                                            className={cn(
                                                "rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
                                                DIFFICULTY_BADGES[question.difficulty] || "bg-muted/10 text-muted"
                                            )}
                                        >
                                            {question.difficulty}
                                        </span>
                                        {question.languages
                                            .filter(isSupportedLanguage)
                                            .map((language) => (
                                                <span
                                                    key={language}
                                                    className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted"
                                                >
                                                    {AVAILABLE_LANGUAGES.find((l) => l.value === language)?.label ??
                                                        language}
                                                </span>
                                            ))}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
