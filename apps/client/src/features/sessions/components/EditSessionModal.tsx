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
import { useQuery } from "@tanstack/react-query";
import { sessionsApi } from "@/lib/api/endpoints";
import { useQuestions } from "@/features/questions";
import { useUpdateSession, useCancelSession } from "@/features/sessions";
import { useUserPreferences } from "@/features/user";
import { DURATION_OPTIONS } from "@/features/sessions/constants";
import { QuestionPicker, resolveSessionLanguage } from "@/features/sessions/components/QuestionPicker";
import type { CreateSessionBody, Question } from "@algorym/shared-types";

interface EditSessionModalProps {
    open: boolean;
    sessionId: string | null;
    onOpenChange: (open: boolean) => void;
}

export function EditSessionModal({ open, sessionId, onOpenChange }: EditSessionModalProps) {
    const { data: sessionData, isLoading: sessionLoading } = useQuery({
        queryKey: ["session", sessionId],
        queryFn: () => sessionsApi.get(sessionId!),
        enabled: open && !!sessionId,
    });

    const { data: questionsData, isLoading: questionsLoading } = useQuestions();
    const { data: prefs } = useUserPreferences();

    const updateSession = useUpdateSession();
    const cancelSession = useCancelSession();
    const session = sessionData?.session;

    const [mode, setMode] = useState<"interview" | "practice">("interview");
    const [roleContext, setRoleContext] = useState("");
    const [duration, setDuration] = useState(60);
    const [questionIds, setQuestionIds] = useState<string[]>([]);
    const [language, setLanguage] = useState<string>("");
    const [questionSearch, setQuestionSearch] = useState("");
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

    useEffect(() => {
        if (session && open) {
            setMode(session.mode);
            setRoleContext(session.role_context ?? "");
            setDuration(session.duration_minutes ?? 60);
            setQuestionIds(session.questions.map((question) => question.id));
            setLanguage(session.language ?? "");
            setQuestionSearch("");
        }
    }, [session, open]);

    const questions = questionsData?.questions ?? [];

    const handleSelectionChange = useCallback(
        (ids: string[]) => {
            setQuestionIds(ids);
            const picked = ids
                .map((id) => questions.find((question) => question.id === id))
                .filter((question): question is Question => !!question);
            setLanguage((current) => resolveSessionLanguage(picked, current, prefs?.default_language ?? undefined));
        },
        [questions, prefs?.default_language]
    );

    const handleClose = useCallback(
        (v: boolean) => {
            if (!v) {
                setRoleContext("");
                setQuestionSearch("");
            }
            onOpenChange(v);
        },
        [onOpenChange]
    );

    const handleSave = useCallback(() => {
        if (!sessionId) return;

        const body: Partial<CreateSessionBody> = {
            mode,
            duration_minutes: duration,
            role_context: roleContext || undefined,
            question_ids: questionIds,
            language: language || undefined,
        };

        updateSession.mutate(
            { id: sessionId, body },
            {
                onSuccess: () => {
                    toast.success("Session updated");
                    handleClose(false);
                },
                onError: (err) => {
                    toast.error(err instanceof Error ? err.message : "Failed to update session");
                },
            }
        );
    }, [sessionId, mode, duration, roleContext, questionIds, language, updateSession, handleClose]);

    const isScheduled = session?.status === "scheduled";

    const handleCancel = useCallback(() => {
        if (!sessionId) return;
        cancelSession.mutate(sessionId, {
            onSuccess: () => {
                toast.success("Session cancelled");
                setConfirmCancelOpen(false);
                handleClose(false);
            },
            onError: (err) => {
                toast.error(err instanceof Error ? err.message : "Failed to cancel session");
            },
        });
    }, [sessionId, cancelSession, handleClose]);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg p-0 gap-0" showCloseButton={false}>
                <DialogHeader className="px-6 pt-5 pb-0">
                    <DialogTitle className="text-base">Edit Session</DialogTitle>
                </DialogHeader>

                <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[calc(100dvh-10rem)]">
                    {sessionLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : !session ? (
                        <p className="text-sm text-muted text-center py-8">Session not found</p>
                    ) : !isScheduled ? (
                        <p className="text-sm text-muted text-center py-8">
                            Only scheduled sessions can be edited
                        </p>
                    ) : (
                        <>
                            {/* Mode */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted">Mode</label>
                                <div className="flex gap-2">
                                    {(["interview", "practice"] as const).map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setMode(m)}
                                            className={cn(
                                                "flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                                                mode === m
                                                    ? "border-accent bg-accent-soft text-accent ring-1 ring-accent"
                                                    : "border-border bg-surface text-muted hover:border-border-strong"
                                            )}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {m === "interview" ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                        <circle cx="9" cy="7" r="4" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                                    </svg>
                                                )}
                                                {m.charAt(0).toUpperCase() + m.slice(1)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Session Title */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted">Session Title</label>
                                <input
                                    type="text"
                                    value={roleContext}
                                    onChange={(e) => setRoleContext(e.target.value)}
                                    placeholder="e.g. Frontend Interview Round 1"
                                    className="h-9 w-full rounded-lg border border-border bg-surface pl-3 pr-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                />
                            </div>

                            {/* Duration */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted">Duration</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {DURATION_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setDuration(opt.value)}
                                            className={cn(
                                                "rounded-lg border px-2 py-1.5 text-xs font-medium transition-all",
                                                duration === opt.value
                                                    ? "border-accent bg-accent-soft text-accent ring-1 ring-accent"
                                                    : "border-border bg-surface text-muted hover:border-border-strong"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Questions */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted">Questions (optional)</label>
                                <QuestionPicker
                                    questions={questions}
                                    selectedIds={questionIds}
                                    onSelectionChange={handleSelectionChange}
                                    search={questionSearch}
                                    onSearchChange={setQuestionSearch}
                                    selectedLanguage={language}
                                    onLanguageSelect={setLanguage}
                                    isLoading={questionsLoading}
                                    listMaxHeight="max-h-[160px]"
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="px-6 pb-5 pt-3 border-t border-border">
                    <div className="flex items-center justify-between w-full">
                        <div>
                            {isScheduled && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setConfirmCancelOpen(true)}
                                    disabled={updateSession.isPending}
                                    className="border-danger/50 text-danger hover:bg-danger/10 hover:border-danger"
                                >
                                    Cancel Session
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleClose(false)}
                                disabled={updateSession.isPending}
                            >
                                Close
                            </Button>
                            {isScheduled && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    loading={updateSession.isPending}
                                    onClick={handleSave}
                                >
                                    Save Changes
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>

            <Dialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
                <DialogContent className="sm:max-w-md p-0">
                    <DialogHeader className="px-6 pt-6 pb-0">
                        <DialogTitle>Cancel Session?</DialogTitle>
                        <p className="mt-1 text-sm text-muted">
                            This will cancel the scheduled session. This action cannot be undone.
                        </p>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 px-6 py-5">
                        <Button variant="ghost" size="sm" onClick={() => setConfirmCancelOpen(false)}>
                            Keep Session
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            loading={cancelSession.isPending}
                            onClick={handleCancel}
                            className="border-danger/50 text-danger hover:bg-danger/10 hover:border-danger"
                        >
                            Yes, Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
