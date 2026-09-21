import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useCreateQuestion, useUpdateQuestion, useGenerateQuestion } from "../../hooks/use-question-mutations";
import { GenerateButton } from "./GenerateButton";
import { QuestionFormFields } from "./QuestionFormFields";
import { ConfirmReplaceDialog } from "./ConfirmReplaceDialog";
import type { Question, DifficultyLevel } from "@algorym/shared-types";

interface QuestionFormModalProps {
    open: boolean;
    mode: "create" | "edit" | "view";
    question?: Question | null;
    onOpenChange: (open: boolean) => void;
}

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
                                <GenerateButton
                                    canGenerate={canGenerate}
                                    isGenerating={isGenerating}
                                    onClick={handleGenerate}
                                />
                            )}
                        </div>
                    </DialogHeader>

                    <QuestionFormFields
                        title={title}
                        onTitleChange={setTitle}
                        description={description}
                        onDescriptionChange={setDescription}
                        difficulty={difficulty}
                        onDifficultyChange={setDifficulty}
                        selectedLanguages={selectedLanguages}
                        onToggleLanguage={toggleLanguage}
                        starterCode={starterCode}
                        activeLangTab={activeLangTab}
                        onActiveLangTabChange={setActiveLangTab}
                        onUpdateStarterCode={updateStarterCode}
                        disabled={isFormDisabled}
                    />

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

            <ConfirmReplaceDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={doGenerate}
            />
        </>
    );
}
