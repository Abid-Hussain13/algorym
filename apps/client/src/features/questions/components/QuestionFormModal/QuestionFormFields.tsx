import { cn } from "@/lib/utils/cn";
import { AVAILABLE_LANGUAGES, DIFFICULTY_BADGES } from "../../constants";
import type { DifficultyLevel } from "@algorym/shared-types";

const LANG_CHIP_BASE = "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none border";

interface QuestionFormFieldsProps {
    title: string;
    onTitleChange: (v: string) => void;
    description: string;
    onDescriptionChange: (v: string) => void;
    difficulty: DifficultyLevel;
    onDifficultyChange: (v: DifficultyLevel) => void;
    selectedLanguages: string[];
    onToggleLanguage: (lang: string) => void;
    starterCode: Record<string, string>;
    activeLangTab: string | null;
    onActiveLangTabChange: (lang: string) => void;
    onUpdateStarterCode: (lang: string, code: string) => void;
    disabled: boolean;
}

export function QuestionFormFields({
    title,
    onTitleChange,
    description,
    onDescriptionChange,
    difficulty,
    onDifficultyChange,
    selectedLanguages,
    onToggleLanguage,
    starterCode,
    activeLangTab,
    onActiveLangTabChange,
    onUpdateStarterCode,
    disabled,
}: QuestionFormFieldsProps) {
    const langCode = activeLangTab ? (starterCode[activeLangTab] ?? "") : "";

    return (
        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    disabled={disabled}
                    placeholder="e.g. Two Sum"
                    className="h-9 w-full rounded-lg border border-border bg-surface pl-3 pr-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 disabled:cursor-not-allowed"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    disabled={disabled}
                    placeholder="Describe the problem..."
                    rows={6}
                    className="w-full rounded-lg border border-border bg-surface pl-3 pr-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 disabled:cursor-not-allowed resize-y min-h-[120px]"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Difficulty</label>
                <div className="flex gap-2">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                        <button
                            key={d}
                            type="button"
                            disabled={disabled}
                            onClick={() => onDifficultyChange(d)}
                            className={cn(
                                "rounded-md px-3 py-1.5 text-xs font-medium transition-all border",
                                difficulty === d
                                    ? `${DIFFICULTY_BADGES[d]} ring-1 ring-current`
                                    : "border-border bg-surface text-muted hover:border-border-strong",
                                disabled && "cursor-not-allowed opacity-60"
                            )}
                        >
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Languages</label>
                <div className="flex flex-wrap gap-2">
                    {AVAILABLE_LANGUAGES.map((lang) => {
                        const isSelected = selectedLanguages.includes(lang.value);
                        return (
                            <button
                                key={lang.value}
                                type="button"
                                disabled={disabled}
                                onClick={() => onToggleLanguage(lang.value)}
                                className={cn(
                                    LANG_CHIP_BASE,
                                    isSelected
                                        ? "border-accent bg-accent/10 text-accent"
                                        : "border-border bg-surface text-muted hover:border-border-strong",
                                    disabled && "cursor-not-allowed opacity-60"
                                )}
                            >
                                {isSelected && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3 mr-1">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                )}
                                {lang.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedLanguages.length > 0 && (
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted">
                        Starter Code
                        <span className="ml-1 text-muted/60 font-normal">(optional, per language)</span>
                    </label>
                    <div className="flex gap-0 border-b border-border">
                        {selectedLanguages.map((lang) => {
                            const hasCode = !!starterCode[lang];
                            return (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => onActiveLangTabChange(lang)}
                                    className={cn(
                                        "relative px-3 py-2 text-xs font-medium transition-colors",
                                        activeLangTab === lang
                                            ? "text-accent after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent"
                                            : "text-muted hover:text-fg"
                                    )}
                                >
                                    {AVAILABLE_LANGUAGES.find((l) => l.value === lang)?.label ?? lang}
                                    {hasCode && (
                                        <span className="ml-1.5 size-1.5 rounded-full bg-accent inline-block" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <textarea
                        value={langCode}
                        onChange={(e) => activeLangTab && onUpdateStarterCode(activeLangTab, e.target.value)}
                        disabled={disabled}
                        placeholder={`// Write ${activeLangTab} starter code here...`}
                        rows={8}
                        spellCheck={false}
                        className="w-full rounded-lg border border-border bg-surface pl-3 pr-3 py-2 font-mono text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 disabled:cursor-not-allowed resize-y min-h-[200px]"
                    />
                </div>
            )}
        </div>
    );
}
