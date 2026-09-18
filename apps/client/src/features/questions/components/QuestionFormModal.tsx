import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useCreateQuestion, useUpdateQuestion } from "../hooks/use-question-mutations";
import { AVAILABLE_LANGUAGES, DIFFICULTY_OPTIONS, DIFFICULTY_BADGES } from "../constants";
import type { Question, DifficultyLevel } from "@algorym/shared-types";

interface QuestionFormModalProps {
    open: boolean;
    mode: "create" | "edit" | "view";
    question?: Question | null;
    onOpenChange: (open: boolean) => void;
}

const LANG_CHIP_BASE = "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none border";

export function QuestionFormModal({ open, mode, question, onOpenChange }: QuestionFormModalProps) {
    const isReadonly = mode === "view";
    const isEdit = mode === "edit";

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [difficulty, setDifficulty] = useState<DifficultyLevel>("easy");
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [starterCode, setStarterCode] = useState<Record<string, string>>({});
    const [activeLangTab, setActiveLangTab] = useState<string | null>(null);

    const createQuestion = useCreateQuestion();
    const updateQuestion = useUpdateQuestion();

    // Pre-fill form for edit/view
    useEffect(() => {
        if (question && (isEdit || isReadonly)) {
            setTitle(question.title);
            setDescription(question.description);
            setDifficulty(question.difficulty);
            setSelectedLanguages(question.languages);
            setStarterCode(question.starter_code ?? {});
            setActiveLangTab(question.languages[0] ?? null);
        } else if (mode === "create") {
            setTitle("");
            setDescription("");
            setDifficulty("easy");
            setSelectedLanguages([]);
            setStarterCode({});
            setActiveLangTab(null);
        }
    }, [question, mode, isEdit, isReadonly]);

    // Auto-select first language tab when languages change
    useEffect(() => {
        if (selectedLanguages.length > 0 && !selectedLanguages.includes(activeLangTab ?? "")) {
            setActiveLangTab(selectedLanguages[0]);
        } else if (selectedLanguages.length === 0) {
            setActiveLangTab(null);
        }
    }, [selectedLanguages]);

    const toggleLanguage = useCallback((lang: string) => {
        if (isReadonly) return;
        setSelectedLanguages((prev) => {
            if (prev.includes(lang)) {
                // Remove language and its starter code
                setStarterCode((sc) => {
                    const next = { ...sc };
                    delete next[lang];
                    return next;
                });
                return prev.filter((l) => l !== lang);
            }
            return [...prev, lang];
        });
    }, [isReadonly]);

    const updateStarterCode = useCallback((lang: string, code: string) => {
        setStarterCode((prev) => ({ ...prev, [lang]: code }));
    }, []);

    const handleSubmit = () => {
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }
        if (!description.trim()) {
            toast.error("Description is required");
            return;
        }
        if (selectedLanguages.length === 0) {
            toast.error("Select at least one language");
            return;
        }

        // Clean up starter code — only include languages that are selected
        const cleanStarterCode: Record<string, string> = {};
        for (const lang of selectedLanguages) {
            if (starterCode[lang]) {
                cleanStarterCode[lang] = starterCode[lang];
            }
        }

        const body = {
            title: title.trim(),
            description: description.trim(),
            languages: selectedLanguages,
            difficulty,
            starter_code: Object.keys(cleanStarterCode).length > 0 ? cleanStarterCode : undefined,
        };

        if (isEdit && question) {
            updateQuestion.mutate(
                { id: question.id, body },
                {
                    onSuccess: () => {
                        toast.success("Question updated");
                        onOpenChange(false);
                    },
                    onError: (err) => {
                        toast.error(err instanceof Error ? err.message : "Failed to update question");
                    },
                }
            );
        } else {
            createQuestion.mutate(body, {
                onSuccess: () => {
                    toast.success("Question created");
                    onOpenChange(false);
                },
                onError: (err) => {
                    toast.error(err instanceof Error ? err.message : "Failed to create question");
                },
            });
        }
    };

    const isPending = createQuestion.isPending || updateQuestion.isPending;

    const handleClose = (v: boolean) => {
        if (!v && mode === "create") {
            setTitle("");
            setDescription("");
            setDifficulty("easy");
            setSelectedLanguages([]);
            setStarterCode({});
            setActiveLangTab(null);
        }
        onOpenChange(v);
    };

    const langCode = activeLangTab ? (starterCode[activeLangTab] ?? "") : "";

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl p-0 gap-0" showCloseButton={false}>
                <DialogHeader className="px-6 pt-5 pb-0">
                    <DialogTitle className="text-base">
                        {mode === "create" && "Create Question"}
                        {mode === "edit" && "Edit Question"}
                        {mode === "view" && "Question Details"}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[calc(100dvh-10rem)]">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isReadonly}
                            placeholder="e.g. Two Sum"
                            className="h-9 w-full rounded-lg border border-border bg-surface pl-3 pr-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isReadonly}
                            placeholder="Describe the problem..."
                            rows={4}
                            className="w-full rounded-lg border border-border bg-surface pl-3 pr-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                        />
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted">Difficulty</label>
                        <div className="flex gap-2">
                            {(["easy", "medium", "hard"] as const).map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    disabled={isReadonly}
                                    onClick={() => setDifficulty(d)}
                                    className={cn(
                                        "rounded-md px-3 py-1.5 text-xs font-medium transition-all border",
                                        difficulty === d
                                            ? `${DIFFICULTY_BADGES[d]} ring-1 ring-current`
                                            : "border-border bg-surface text-muted hover:border-border-strong",
                                        isReadonly && "cursor-not-allowed opacity-60"
                                    )}
                                >
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Languages */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted">Languages</label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_LANGUAGES.map((lang) => {
                                const isSelected = selectedLanguages.includes(lang.value);
                                return (
                                    <button
                                        key={lang.value}
                                        type="button"
                                        disabled={isReadonly}
                                        onClick={() => toggleLanguage(lang.value)}
                                        className={cn(
                                            LANG_CHIP_BASE,
                                            isSelected
                                                ? "border-accent bg-accent/10 text-accent"
                                                : "border-border bg-surface text-muted hover:border-border-strong",
                                            isReadonly && "cursor-not-allowed opacity-60"
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

                    {/* Starter Code */}
                    {selectedLanguages.length > 0 && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted">
                                Starter Code
                                <span className="ml-1 text-muted/60 font-normal">(optional, per language)</span>
                            </label>
                            {/* Language tabs */}
                            <div className="flex gap-0 border-b border-border">
                                {selectedLanguages.map((lang) => {
                                    const hasCode = !!starterCode[lang];
                                    return (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => setActiveLangTab(lang)}
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
                            {/* Code editor */}
                            <textarea
                                value={langCode}
                                onChange={(e) => activeLangTab && updateStarterCode(activeLangTab, e.target.value)}
                                disabled={isReadonly}
                                placeholder={`// Write ${activeLangTab} starter code here...`}
                                rows={8}
                                spellCheck={false}
                                className="w-full rounded-lg border border-border bg-surface pl-3 pr-3 py-2 font-mono text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 pb-5 pt-3 border-t border-border">
                    <div className="flex items-center justify-between w-full">
                        <div />
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleClose(false)}
                                disabled={isPending}
                            >
                                {isReadonly ? "Close" : "Cancel"}
                            </Button>
                            {!isReadonly && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    loading={isPending}
                                    onClick={handleSubmit}
                                >
                                    {isEdit ? "Save Changes" : "Create Question"}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
