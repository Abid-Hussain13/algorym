import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";
import { DIFFICULTY_BADGES } from "@/features/sessions/constants";
import { AVAILABLE_LANGUAGES, LANGUAGE_COLORS } from "@/features/questions/constants";
import { useQuestions } from "@/features/questions";
import type { Question } from "@algorym/shared-types";

export function resolveSessionLanguage(
    questions: Question[],
    current: string,
    preferred?: string
): string {
    const union = [...new Set(questions.flatMap((q) => q.languages))];
    if (current && union.includes(current)) return current;
    if (preferred && union.includes(preferred)) return preferred;
    return union[0] ?? "";
}

interface QuestionPickerProps {
    questions: Question[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    search: string;
    onSearchChange: (value: string) => void;
    selectedLanguage: string;
    onLanguageSelect: (language: string) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    listMaxHeight?: string;
}

const MoveUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
        <path d="m18 15-6-6-6 6" />
    </svg>
);

const MoveDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const RemoveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
        <path d="M18 6 6 18M6 6l12 12" />
    </svg>
);

export function QuestionPicker({
    questions,
    selectedIds,
    onSelectionChange,
    search,
    onSearchChange,
    selectedLanguage,
    onLanguageSelect,
    isLoading,
    emptyMessage = "No questions available",
    listMaxHeight = "max-h-[180px]",
}: QuestionPickerProps) {
    const missingIds = useMemo(
        () => selectedIds.filter((id) => !questions.some((q) => q.id === id)),
        [selectedIds, questions]
    );

    const { data: resolvedData, isFetching: isResolving } = useQuestions(
        missingIds.length > 0 ? { ids: missingIds.join(",") } : undefined
    );

    const knownQuestions = useMemo(() => {
        const byId = new Map<string, Question>();
        for (const question of questions) byId.set(question.id, question);
        for (const question of resolvedData?.questions ?? []) byId.set(question.id, question);
        return byId;
    }, [questions, resolvedData]);

    const selectedQuestions = useMemo(
        () => selectedIds.map((id) => knownQuestions.get(id)).filter((q): q is Question => !!q),
        [selectedIds, knownQuestions]
    );

    const availableLanguages = useMemo(
        () => [...new Set(selectedQuestions.flatMap((q) => q.languages))],
        [selectedQuestions]
    );

    const filteredQuestions = useMemo(() => {
        if (!search.trim()) return questions;
        const needle = search.toLowerCase();
        return questions.filter(
            (item) =>
                item.title.toLowerCase().includes(needle) ||
                item.description.toLowerCase().includes(needle) ||
                item.languages.some((l) => l.toLowerCase().includes(needle))
        );
    }, [questions, search]);

    const isSelected = (id: string) => selectedIds.includes(id);

    const toggle = (id: string) => {
        onSelectionChange(
            isSelected(id)
                ? selectedIds.filter((existing) => existing !== id)
                : [...selectedIds, id]
        );
    };

    const move = (index: number, delta: number) => {
        const target = index + delta;
        if (target < 0 || target >= selectedIds.length) return;
        const next = [...selectedIds];
        [next[index], next[target]] = [next[target], next[index]];
        onSelectionChange(next);
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                    type="text"
                    placeholder="Search questions..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted">
                        Selected{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
                    </p>
                    {selectedIds.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onSelectionChange([])}
                            className="text-xs font-medium text-muted hover:text-fg transition-colors"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {selectedIds.length === 0 ? (
                    <p className="text-xs text-muted">
                        No question selected — the session will start without one.
                    </p>
                ) : isResolving && selectedQuestions.length < selectedIds.length ? (
                    <div className="flex items-center justify-center py-3">
                        <Spinner size="sm" />
                    </div>
                ) : (
                    <ol className="flex flex-col gap-1.5">
                        {selectedQuestions.map((question, index) => (
                            <li
                                key={question.id}
                                className="flex items-center gap-2 rounded-lg border border-accent bg-accent-soft px-2.5 py-2"
                            >
                                <span className="grid size-4 shrink-0 place-items-center rounded bg-accent text-[10px] font-semibold text-white">
                                    {index + 1}
                                </span>
                                <span className="flex-1 min-w-0 truncate text-sm font-medium text-fg">
                                    {question.title}
                                </span>
                                <span className={cn("shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded", DIFFICULTY_BADGES[question.difficulty])}>
                                    {question.difficulty}
                                </span>
                                <div className="flex shrink-0 items-center gap-0.5">
                                    <button
                                        type="button"
                                        aria-label="Move up"
                                        disabled={index === 0}
                                        onClick={() => move(index, -1)}
                                        className="grid size-6 place-items-center rounded text-muted transition-colors hover:bg-surface hover:text-fg disabled:pointer-events-none disabled:opacity-30"
                                    >
                                        <MoveUpIcon />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Move down"
                                        disabled={index === selectedQuestions.length - 1}
                                        onClick={() => move(index, 1)}
                                        className="grid size-6 place-items-center rounded text-muted transition-colors hover:bg-surface hover:text-fg disabled:pointer-events-none disabled:opacity-30"
                                    >
                                        <MoveDownIcon />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Remove question"
                                        onClick={() => toggle(question.id)}
                                        className="grid size-6 place-items-center rounded text-muted transition-colors hover:bg-surface hover:text-danger"
                                    >
                                        <RemoveIcon />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted">Available</p>
                {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Spinner size="md" />
                    </div>
                ) : filteredQuestions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted">
                        {search ? "No questions match your search" : emptyMessage}
                    </div>
                ) : (
                    <div className={cn("flex flex-col gap-1.5 overflow-y-auto pr-1", listMaxHeight)}>
                        {filteredQuestions.map((question) => {
                            const active = isSelected(question.id);
                            return (
                                <button
                                    key={question.id}
                                    type="button"
                                    onClick={() => toggle(question.id)}
                                    className={cn(
                                        "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                                        active
                                            ? "border-accent bg-accent-soft ring-1 ring-accent"
                                            : "border-border hover:border-border-strong"
                                    )}
                                >
                                    <div className={cn(
                                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2",
                                        active ? "border-accent bg-accent" : "border-border-strong"
                                    )}>
                                        {active && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-2.5 text-white">
                                                <path d="M20 6 9 17l-5-5" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-fg truncate">{question.title}</p>
                                            <span className={cn("shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded", DIFFICULTY_BADGES[question.difficulty])}>
                                                {question.difficulty}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-muted truncate">{question.description}</p>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {question.languages.map((language) => (
                                                <span key={language} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-2 text-muted">
                                                    {language}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {availableLanguages.length > 0 && (
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
                    <p className="text-xs font-medium text-muted">Select language for this session</p>
                    <div className="flex flex-wrap gap-2">
                        {availableLanguages.map((language) => {
                            const languageInfo = AVAILABLE_LANGUAGES.find((l) => l.value === language);
                            return (
                                <button
                                    key={language}
                                    type="button"
                                    onClick={() => onLanguageSelect(language)}
                                    className={cn(
                                        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-all border",
                                        selectedLanguage === language
                                            ? `${LANGUAGE_COLORS[language]} border-current ring-1 ring-current`
                                            : "border-border bg-surface text-muted hover:border-border-strong"
                                    )}
                                >
                                    {languageInfo?.label ?? language}
                                </button>
                            );
                        })}
                    </div>
                    {selectedLanguage && !availableLanguages.includes(selectedLanguage) && (
                        <p className="text-[11px] text-muted">
                            This language is not supported by the selected questions.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
