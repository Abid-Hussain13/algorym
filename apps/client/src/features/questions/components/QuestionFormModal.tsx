import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useCreateQuestion, useUpdateQuestion, useGenerateQuestion } from "../hooks/use-question-mutations";
import { AVAILABLE_LANGUAGES, DIFFICULTY_BADGES } from "../constants";
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

    const [isGenerating, setIsGenerating] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const createQuestion = useCreateQuestion();
    const updateQuestion = useUpdateQuestion();
    const generateQuestion = useGenerateQuestion();

    const isFormDisabled = isReadonly || isGenerating;
    const isPending = createQuestion.isPending || updateQuestion.isPending;
    const canGenerate = title.trim().length > 0 && selectedLanguages.length > 0 && !isReadonly;

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

    useEffect(() => {
        if (selectedLanguages.length > 0 && !selectedLanguages.includes(activeLangTab ?? "")) {
            setActiveLangTab(selectedLanguages[0]);
        } else if (selectedLanguages.length === 0) {
            setActiveLangTab(null);
        }
    }, [selectedLanguages]);

    const toggleLanguage = useCallback((lang: string) => {
        if (isFormDisabled) return;
        setSelectedLanguages((prev) => {
            if (prev.includes(lang)) {
                setStarterCode((sc) => {
                    const next = { ...sc };
                    delete next[lang];
                    return next;
                });
                return prev.filter((l) => l !== lang);
            }
            return [...prev, lang];
        });
    }, [isFormDisabled]);

    const updateStarterCode = useCallback((lang: string, code: string) => {
        setStarterCode((prev) => ({ ...prev, [lang]: code }));
    }, []);

    const doGenerate = useCallback(() => {
        setIsGenerating(true);
        generateQuestion.mutate(
            { title: title.trim(), languages: selectedLanguages },
            {
                onSuccess: (data) => {
                    setDescription(data.description);
                    setStarterCode((prev) => {
                        const next = { ...prev };
                        for (const lang of selectedLanguages) {
                            if (data.starter_code[lang]) {
                                next[lang] = data.starter_code[lang];
                            }
                        }
                        return next;
                    });
                    setIsGenerating(false);
                    toast.success("Question generated");
                },
                onError: (err) => {
                    setIsGenerating(false);
                    toast.error(err instanceof Error ? err.message : "Failed to generate");
                },
            }
        );
    }, [title, selectedLanguages, generateQuestion]);

    const handleGenerate = useCallback(() => {
        if (!canGenerate || isGenerating) return;
        if (description.trim()) {
            setConfirmOpen(true);
            return;
        }
        doGenerate();
    }, [canGenerate, isGenerating, description, doGenerate]);

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

    const handleClose = (v: boolean) => {
        if (!v && mode === "create") {
            setTitle("");
            setDescription("");
            setDifficulty("easy");
            setSelectedLanguages([]);
            setStarterCode({});
            setActiveLangTab(null);
        }
        setIsGenerating(false);
        onOpenChange(v);
    };

    const langCode = activeLangTab ? (starterCode[activeLangTab] ?? "") : "";

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-2xl p-0 gap-0 flex flex-col max-h-[calc(100dvh-3rem)]" showCloseButton={false}>
                    <DialogHeader className="px-6 pt-5 pb-0 shrink-0">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <DialogTitle className="text-base">
                                    {mode === "create" && "Create Question"}
                                    {mode === "edit" && "Edit Question"}
                                    {mode === "view" && "Question Details"}
                                </DialogTitle>
                                {mode !== "view" && (
                                    <p className="mt-1 text-xs text-muted leading-relaxed">
                                        Provide a title and select languages to auto-generate question info
                                    </p>
                                )}
                            </div>
                            {mode !== "view" && (
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={!canGenerate || isGenerating}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-sm border px-[15px] py-[7px] text-[13px] font-semibold tracking-[0.02em] transition-all duration-1 shrink-0 cursor-pointer",
                                        canGenerate && !isGenerating
                                            ? "bg-accent border-accent text-on-accent shadow-sm hover:bg-accent-hover hover:border-accent-hover active:bg-accent-active active:translate-y-px"
                                            : "bg-accent/50 border-accent/50 text-on-accent/70 cursor-not-allowed"
                                    )}
                                >
                                    {isGenerating ? (
                                        <svg className="size-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                                            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                                            <path d="M20 3v4" />
                                            <path d="M22 5h-4" />
                                        </svg>
                                    )}
                                    Generate
                                </button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isFormDisabled}
                                placeholder="e.g. Two Sum"
                                className="h-9 w-full rounded-lg border border-border bg-surface pl-3 pr-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isFormDisabled}
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
                                        disabled={isFormDisabled}
                                        onClick={() => setDifficulty(d)}
                                        className={cn(
                                            "rounded-md px-3 py-1.5 text-xs font-medium transition-all border",
                                            difficulty === d
                                                ? `${DIFFICULTY_BADGES[d]} ring-1 ring-current`
                                                : "border-border bg-surface text-muted hover:border-border-strong",
                                            isFormDisabled && "cursor-not-allowed opacity-60"
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
                                            disabled={isFormDisabled}
                                            onClick={() => toggleLanguage(lang.value)}
                                            className={cn(
                                                LANG_CHIP_BASE,
                                                isSelected
                                                    ? "border-accent bg-accent/10 text-accent"
                                                    : "border-border bg-surface text-muted hover:border-border-strong",
                                                isFormDisabled && "cursor-not-allowed opacity-60"
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
                                <textarea
                                    value={langCode}
                                    onChange={(e) => activeLangTab && updateStarterCode(activeLangTab, e.target.value)}
                                    disabled={isFormDisabled}
                                    placeholder={`// Write ${activeLangTab} starter code here...`}
                                    rows={8}
                                    spellCheck={false}
                                    className="w-full rounded-lg border border-border bg-surface pl-3 pr-3 py-2 font-mono text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 disabled:cursor-not-allowed resize-y min-h-[200px]"
                                />
                            </div>
                        )}
                    </div>

                    <div className="px-6 pb-5 pt-3 border-t border-border shrink-0">
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                variant={isReadonly ? "primary" : "ghost"}
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
                                    loading={isPending || isGenerating}
                                    disabled={isGenerating}
                                    onClick={handleSubmit}
                                >
                                    {isEdit ? "Save Changes" : "Create Question"}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-md p-0">
                    <DialogHeader className="px-6 pt-6 pb-0">
                        <DialogTitle>Replace Content?</DialogTitle>
                        <DialogDescription>
                            This will overwrite your current description and starter code with AI-generated content.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 px-6 py-5">
                        <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                setConfirmOpen(false);
                                doGenerate();
                            }}
                        >
                            Replace
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
