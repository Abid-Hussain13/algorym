import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
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
import { sessionsApi, questionsApi } from "@/lib/api/endpoints";
import { useUpdateSession } from "@/features/sessions";
import { DURATION_OPTIONS } from "@/features/sessions/constants";
import { AVAILABLE_LANGUAGES, LANGUAGE_COLORS } from "@/features/questions/constants";
import type { Session, CreateSessionBody } from "@algorym/shared-types";

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

    const { data: questionsData, isLoading: questionsLoading } = useQuery({
        queryKey: ["questions"],
        queryFn: () => questionsApi.list(),
        enabled: open,
    });

    const updateSession = useUpdateSession();
    const session = sessionData?.session;

    const [mode, setMode] = useState<"interview" | "practice">("interview");
    const [roleContext, setRoleContext] = useState("");
    const [duration, setDuration] = useState(60);
    const [questionId, setQuestionId] = useState<string | undefined>();
    const [language, setLanguage] = useState<string>("");
    const [questionSearch, setQuestionSearch] = useState("");

    useEffect(() => {
        if (session && open) {
            setMode(session.mode);
            setRoleContext(session.role_context ?? "");
            setDuration(session.duration_minutes ?? 60);
            setQuestionId(session.question_id ?? undefined);
            setLanguage(session.language ?? "");
        }
    }, [session, open]);

    const questions = questionsData?.questions ?? [];

    const filteredQuestions = useMemo(() => {
        if (!questionSearch.trim()) return questions;
        const q = questionSearch.toLowerCase();
        return questions.filter(
            (item) =>
                item.title.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                item.languages.some((l) => l.toLowerCase().includes(q))
        );
    }, [questions, questionSearch]);

    const selectedQuestion = useMemo(
        () => questions.find((q) => q.id === questionId),
        [questions, questionId]
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
            question_id: questionId,
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
    }, [sessionId, mode, duration, roleContext, questionId, language, updateSession, handleClose]);

    const isScheduled = session?.status === "scheduled";

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

                            {/* Question */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted">Question (optional)</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.3-4.3" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search questions..."
                                        value={questionSearch}
                                        onChange={(e) => setQuestionSearch(e.target.value)}
                                        className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                </div>

                                {/* No question option */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuestionId(undefined);
                                        setLanguage("");
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all text-sm w-full",
                                        !questionId
                                            ? "border-accent bg-accent-soft ring-1 ring-accent"
                                            : "border-border hover:border-border-strong"
                                    )}
                                >
                                    <div className="size-3 rounded-full border-2 border-border-strong" />
                                    <div>
                                        <p className="font-medium text-fg">No question</p>
                                        <p className="text-xs text-muted">Remove question from session</p>
                                    </div>
                                </button>

                                {questionsLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Spinner size="md" />
                                    </div>
                                ) : filteredQuestions.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-muted">
                                        {questionSearch ? "No questions match your search" : "No questions available"}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                                        {filteredQuestions.map((q) => (
                                            <button
                                                key={q.id}
                                                type="button"
                                                onClick={() => {
                                                    setQuestionId(q.id);
                                                    setLanguage(q.languages[0] ?? "");
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all",
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
                                                    <p className="text-sm font-medium text-fg truncate">{q.title}</p>
                                                    <div className="mt-0.5 flex flex-wrap gap-1">
                                                        {q.languages.map((l) => (
                                                            <span key={l} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-2 text-muted">{l}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Language picker */}
                                {selectedQuestion && selectedQuestion.languages.length > 0 && (
                                    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
                                        <p className="text-xs font-medium text-muted">Select language</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedQuestion.languages.map((lang) => {
                                                const langInfo = AVAILABLE_LANGUAGES.find((l) => l.value === lang);
                                                return (
                                                    <button
                                                        key={lang}
                                                        type="button"
                                                        onClick={() => setLanguage(lang)}
                                                        className={cn(
                                                            "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-all border",
                                                            language === lang
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
                        </>
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
                                disabled={updateSession.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                loading={updateSession.isPending}
                                onClick={handleSave}
                                disabled={!isScheduled}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
