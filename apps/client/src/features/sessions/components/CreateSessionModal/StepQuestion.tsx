import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";
import { DIFFICULTY_BADGES } from "@/features/sessions/constants";
import { AVAILABLE_LANGUAGES, LANGUAGE_COLORS } from "@/features/questions/constants";

interface Question {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    languages: string[];
}

interface StepQuestionProps {
    questions: Question[];
    filteredQuestions: Question[];
    questionSearch: string;
    onSearchChange: (v: string) => void;
    questionId: string | undefined;
    onQuestionSelect: (id: string | undefined) => void;
    selectedLanguage: string | undefined;
    onLanguageSelect: (lang: string) => void;
    isLoading: boolean;
}

export function StepQuestion({
    questions,
    filteredQuestions,
    questionSearch,
    onSearchChange,
    questionId,
    onQuestionSelect,
    selectedLanguage,
    onLanguageSelect,
    isLoading,
}: StepQuestionProps) {
    const selectedQuestion = questions.find((q) => q.id === questionId);

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
                    value={questionSearch}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
            </div>

            <button
                type="button"
                onClick={() => onQuestionSelect(undefined)}
                className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all text-sm",
                    !questionId
                        ? "border-accent bg-accent-soft ring-1 ring-accent"
                        : "border-border hover:border-border-strong"
                )}
            >
                <div className="size-3 rounded-full border-2 border-border-strong" />
                <div>
                    <p className="font-medium text-fg">No question</p>
                    <p className="text-xs text-muted">Start session without a question</p>
                </div>
            </button>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Spinner size="md" />
                </div>
            ) : filteredQuestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                    {questionSearch ? "No questions match your search" : "No questions available"}
                </div>
            ) : (
                <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                    {filteredQuestions.map((q) => (
                        <button
                            key={q.id}
                            type="button"
                            onClick={() => {
                                onQuestionSelect(q.id);
                                // Auto-select first language when selecting a question
                                if (q.languages.length > 0) {
                                    onLanguageSelect(q.languages[0]);
                                }
                            }}
                            className={cn(
                                "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                                questionId === q.id
                                    ? "border-accent bg-accent-soft ring-1 ring-accent"
                                    : "border-border hover:border-border-strong"
                            )}
                        >
                            <div className={cn(
                                "mt-0.5 size-3 shrink-0 rounded-full border-2 flex items-center justify-center",
                                questionId === q.id ? "border-accent" : "border-border-strong"
                            )}>
                                {questionId === q.id && <div className="size-1.5 rounded-full bg-accent" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-fg truncate">{q.title}</p>
                                    <span className={cn("shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded", DIFFICULTY_BADGES[q.difficulty])}>
                                        {q.difficulty}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs text-muted truncate">{q.description}</p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {q.languages.map((l) => (
                                        <span key={l} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-2 text-muted">{l}</span>
                                    ))}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Language picker — shown when a question is selected */}
            {selectedQuestion && selectedQuestion.languages.length > 0 && (
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
                    <p className="text-xs font-medium text-muted">Select language for this session</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedQuestion.languages.map((lang) => {
                            const langInfo = AVAILABLE_LANGUAGES.find((l) => l.value === lang);
                            return (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => onLanguageSelect(lang)}
                                    className={cn(
                                        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-all border",
                                        selectedLanguage === lang
                                            ? `${LANGUAGE_COLORS[lang]} border-current ring-1 ring-current`
                                            : "border-border bg-surface text-muted hover:border-border-strong"
                                    )}
                                >
                                    {langInfo?.label ?? lang}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
