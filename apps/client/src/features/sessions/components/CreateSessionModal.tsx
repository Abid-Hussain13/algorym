import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { format, addMinutes, setHours, setMinutes, startOfDay, isBefore } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { useQuestions } from "@/features/questions";
import { useScheduledSession } from "@/features/sessions";
import { useCreateSession } from "@/features/sessions";
import type { CreateSessionBody } from "@algorym/shared-types";

const DURATION_OPTIONS = [
    { value: 30, label: "30 min" },
    { value: 45, label: "45 min" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
    { value: 180, label: "3 hours" },
    { value: 240, label: "4 hours" },
    { value: 300, label: "5 hours" },
];

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
    const h24 = Math.floor(i / 2);
    const m = (i % 2) * 30;
    const period = h24 < 12 ? "AM" : "PM";
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    const value = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const label = `${h12}:${String(m).padStart(2, "0")} ${period}`;
    return { value, label, period };
});

const DIFFICULTY_BADGES: Record<string, string> = {
    easy: "bg-success/10 text-success",
    medium: "bg-info/10 text-info",
    hard: "bg-danger/10 text-danger",
};

interface CreateSessionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateSessionModal({ open, onOpenChange }: CreateSessionModalProps) {
    const [step, setStep] = useState(0);
    const [mode, setMode] = useState<"interview" | "practice">("interview");
    const [questionId, setQuestionId] = useState<string | undefined>();
    const [duration, setDuration] = useState(60);
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
    const [scheduledTime, setScheduledTime] = useState("09:00");
    const [roleContext, setRoleContext] = useState("");
    const [questionSearch, setQuestionSearch] = useState("");

    const { data: questionsData, isLoading: questionsLoading } = useQuestions();
    const { data: scheduledData } = useScheduledSession();
    const createSession = useCreateSession();

    const questions = questionsData?.questions ?? [];
    const scheduledDates = useMemo(() => {
        const raw = scheduledData?.sessions ?? [];
        return new Set(raw.filter((s) => s.scheduled_at).map((s) => format(new Date(s.scheduled_at), "yyyy-MM-dd")));
    }, [scheduledData]);

    const isTimeSlotBlocked = useCallback((slotValue: string, selectedDuration: number, targetDate: Date | undefined) => {
        if (!targetDate) return false;
        const raw = scheduledData?.sessions ?? [];
        const targetDateStr = format(targetDate, "yyyy-MM-dd");
        const [slotH, slotM] = slotValue.split(":").map(Number);
        const slotStart = slotH * 60 + slotM;
        const slotEnd = slotStart + selectedDuration;

        for (const sess of raw) {
            if (!sess.scheduled_at) continue;
            const sessDate = new Date(sess.scheduled_at);
            const sessDateStr = format(sessDate, "yyyy-MM-dd");
            if (sessDateStr !== targetDateStr) continue;

            const sessStart = sessDate.getHours() * 60 + sessDate.getMinutes();
            const sessDur = sess.duration_minutes ?? 30;
            const sessEnd = sessStart + sessDur;

            if (slotStart < sessEnd && sessStart < slotEnd) return true;
        }
        return false;
    }, [scheduledData]);

    useEffect(() => {
        if (scheduledDate && isTimeSlotBlocked(scheduledTime, duration, scheduledDate)) {
            const next = TIME_SLOTS.find(
                (t) => !isTimeSlotBlocked(t.value, duration, scheduledDate)
            );
            if (next) {
                setScheduledTime(next.value);
            }
        }
    }, [duration, scheduledDate, isTimeSlotBlocked]);

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

    const isToday = scheduledDate && format(scheduledDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

    const scheduledISO = useMemo(() => {
        if (!scheduledDate) return undefined;
        const [h, m] = scheduledTime.split(":").map(Number);
        let dt = setMinutes(setHours(startOfDay(scheduledDate), h), m);
        if (isBefore(dt, new Date())) dt = addMinutes(new Date(), 10);
        return dt.toISOString();
    }, [scheduledDate, scheduledTime]);

    const reset = useCallback(() => {
        setStep(0);
        setMode("interview");
        setQuestionId(undefined);
        setDuration(60);
        setScheduledDate(undefined);
        setScheduledTime("09:00");
        setRoleContext("");
        setQuestionSearch("");
    }, []);

    const handleClose = useCallback(
        (v: boolean) => {
            if (!v) reset();
            onOpenChange(v);
        },
        [onOpenChange, reset]
    );

    const handleCreate = useCallback(() => {
        if (scheduledDate && isTimeSlotBlocked(scheduledTime, duration, scheduledDate)) {
            toast.error("This time slot is already booked. Please choose another time.");
            return;
        }

        const body: CreateSessionBody = {
            mode,
            duration_minutes: duration,
            question_id: questionId,
            role_context: roleContext || undefined,
            scheduled_at: scheduledISO,
        };

        createSession.mutate(body, {
            onSuccess: (data) => {
                toast.success("Session created successfully");
                reset();
                handleClose(false);
            },
            onError: (err) => {
                const message = err instanceof Error ? err.message : "Failed to create session";
                toast.error(message);
                handleClose(false);
            },
        });
    }, [mode, duration, questionId, roleContext, scheduledISO, scheduledDate, scheduledTime, createSession, reset, handleClose, isTimeSlotBlocked]);

    const canNext = useMemo(() => {
        if (step === 0) return true;
        if (step === 1) return true;
        if (step === 2) return true;
        return true;
    }, [step]);

    const stepTitles = ["Session Mode", "Choose Question", "Duration & Schedule", "Review & Create"];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg p-0 gap-0" showCloseButton={false}>
                {/* Step indicator */}
                <div className="flex items-center gap-1 px-6 pt-5">
                    {stepTitles.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1 flex-1 rounded-full transition-colors duration-200",
                                i <= step ? "bg-accent" : "bg-border"
                            )}
                        />
                    ))}
                </div>

                <DialogHeader className="px-6 pt-4 pb-0">
                    <DialogTitle className="text-base">{stepTitles[step]}</DialogTitle>
                    <DialogDescription className="text-xs">
                        {step === 0 && "Select the type of session you want to create."}
                        {step === 1 && "Optionally assign a coding question to the session."}
                        {step === 2 && "Set session duration and optionally schedule it for later."}
                        {step === 3 && "Review your session details before creating."}
                    </DialogDescription>
                </DialogHeader>

                {/* Step content */}
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(100dvh-12rem)]">
                    {/* Step 0: Mode */}
                    {step === 0 && (
                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => setMode("interview")}
                                className={cn(
                                    "flex items-start gap-4 rounded-lg border p-4 text-left transition-all",
                                    mode === "interview"
                                        ? "border-accent bg-accent-soft ring-1 ring-accent"
                                        : "border-border hover:border-border-strong hover:bg-surface"
                                )}
                            >
                                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-accent">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-fg">Interview</p>
                                    <p className="mt-0.5 text-xs text-muted leading-relaxed">
                                        Evaluate a candidate with a coding challenge. You can invite participants and track their performance.
                                    </p>
                                </div>
                                {mode === "interview" && (
                                    <div className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-accent flex items-center justify-center">
                                        <div className="size-2 rounded-full bg-accent" />
                                    </div>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setMode("practice")}
                                className={cn(
                                    "flex items-start gap-4 rounded-lg border p-4 text-left transition-all",
                                    mode === "practice"
                                        ? "border-accent bg-accent-soft ring-1 ring-accent"
                                        : "border-border hover:border-border-strong hover:bg-surface"
                                )}
                            >
                                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-info/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-info">
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-fg">Practice</p>
                                    <p className="mt-0.5 text-xs text-muted leading-relaxed">
                                        Solve coding problems on your own. Sharpen your skills with timed sessions.
                                    </p>
                                </div>
                                {mode === "practice" && (
                                    <div className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-accent flex items-center justify-center">
                                        <div className="size-2 rounded-full bg-accent" />
                                    </div>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 1: Question */}
                    {step === 1 && (
                        <div className="flex flex-col gap-3">
                            {/* Search */}
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

                            {/* None option */}
                            <button
                                type="button"
                                onClick={() => setQuestionId(undefined)}
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

                            {/* Question list */}
                            {questionsLoading ? (
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
                                            onClick={() => setQuestionId(q.id)}
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
                        </div>
                    )}

                    {/* Step 2: Duration + Schedule */}
                    {step === 2 && (
                        <div className="flex flex-col gap-4 pb-2">
                            {/* Duration */}
                            <div>
                                <label className="text-xs font-medium text-fg mb-1.5 block">Duration</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {DURATION_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setDuration(opt.value)}
                                            className={cn(
                                                "rounded-lg border px-2 py-2 text-xs font-medium transition-all",
                                                duration === opt.value
                                                    ? "border-accent bg-accent-soft text-accent-text ring-1 ring-accent"
                                                    : "border-border text-muted hover:border-border-strong hover:text-fg"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Role context */}
                            <div>
                                <label className="text-xs font-medium text-fg mb-1.5 block">
                                    Session Title <span className="text-muted font-normal">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Frontend Engineer Interview"
                                    value={roleContext}
                                    onChange={(e) => setRoleContext(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                />
                            </div>

                            {/* Schedule */}
                            <div>
                                <label className="text-xs font-medium text-fg mb-1.5 block">
                                    Schedule <span className="text-muted font-normal">(optional)</span>
                                </label>
                                <p className="text-[11px] text-muted mb-2">Leave empty to start immediately</p>

                                <CalendarDatePicker
                                    scheduledDates={scheduledDates}
                                    selectedDate={scheduledDate}
                                    onSelect={setScheduledDate}
                                />

                                {scheduledDate && (
                                    <div className="mt-2">
                                        <label className="text-[11px] font-medium text-muted mb-1 block">Time</label>
                                        <TimePicker
                                            value={scheduledTime}
                                            onChange={setScheduledTime}
                                            isToday={!!isToday}
                                            isBlocked={(val) => isTimeSlotBlocked(val, duration, scheduledDate)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <div className="flex flex-col gap-3">
                            <div className="rounded-lg border border-border bg-surface p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="grid size-8 place-items-center rounded-lg bg-accent/10">
                                        {mode === "interview" ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-accent">
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-info">
                                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-fg capitalize">{mode}</p>
                                        <p className="text-xs text-muted">Session type</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted">Duration</span>
                                        <span className="font-medium text-fg">{DURATION_OPTIONS.find((d) => d.value === duration)?.label}</span>
                                    </div>
                                    {roleContext && (
                                        <div className="flex justify-between">
                                            <span className="text-muted">Title</span>
                                            <span className="font-medium text-fg truncate ml-4 max-w-[200px]">{roleContext}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted">Question</span>
                                        <span className="font-medium text-fg truncate ml-4 max-w-[200px]">
                                            {selectedQuestion ? selectedQuestion.title : "None"}
                                        </span>
                                    </div>
                                    {selectedQuestion && (
                                        <div className="flex justify-between">
                                            <span className="text-muted">Difficulty</span>
                                            <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", DIFFICULTY_BADGES[selectedQuestion.difficulty])}>
                                                {selectedQuestion.difficulty}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted">Schedule</span>
                                        <span className="font-medium text-fg">
                                            {scheduledDate
                                                ? `${format(scheduledDate, "MMM d, yyyy")} at ${formatTime12(scheduledTime)}`
                                                : "Start now"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="grid size-14 place-items-center rounded-full bg-success/10">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-7 text-success">
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className="text-base font-semibold text-fg">Session Created!</p>
                                <p className="mt-1 text-sm text-muted">
                                    Your {mode} session has been created successfully.
                                </p>
                            </div>
                            {createSession.data?.session?.access_token && (
                                <div className="w-full rounded-lg border border-border bg-surface p-3">
                                    <p className="text-[11px] text-muted mb-1">Share this link with participants</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-xs font-mono text-fg truncate bg-surface-2 rounded px-2 py-1.5">
                                            {createSession.data.session.access_token}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(createSession.data.session.access_token);
                                                toast.success("Copied to clipboard");
                                            }}
                                            className="shrink-0 size-8 grid place-items-center rounded-md border border-border text-muted hover:text-fg transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                                                <rect width="14" height="14" x="8" y="8" rx="2" />
                                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step < 4 && (
                    <DialogFooter className="px-6 pb-5 pt-3 border-t border-border">
                        <div className="flex items-center justify-between w-full">
                            {step > 0 ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setStep((s) => s - 1)}
                                    disabled={createSession.isPending}
                                >
                                    Back
                                </Button>
                            ) : <div />}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleClose(false)}
                                    disabled={createSession.isPending}
                                >
                                    Cancel
                                </Button>
                                {step < 3 ? (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => setStep((s) => s + 1)}
                                        disabled={!canNext}
                                    >
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        loading={createSession.isPending}
                                        onClick={handleCreate}
                                    >
                                        Create Session
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogFooter>
                )}

                {step === 4 && (
                    <DialogFooter className="px-6 pb-5 pt-3 border-t border-border">
                        <div className="flex items-center justify-center w-full">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleClose(false)}
                            >
                                Done
                            </Button>
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}

/* ───── Inline Calendar ───── */

interface CalendarDatePickerProps {
    scheduledDates: Set<string>;
    selectedDate: Date | undefined;
    onSelect: (date: Date | undefined) => void;
}

function CalendarDatePicker({ scheduledDates, selectedDate, onSelect }: CalendarDatePickerProps) {
    const today = startOfDay(new Date());
    const [viewDate, setViewDate] = useState(today);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

    const monthLabel = format(viewDate, "MMMM yyyy");

    const isSelected = (d: Date) =>
        selectedDate && format(d, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");

    const isPast = (d: Date) => isBefore(d, today);

    const hasScheduled = (d: Date) => scheduledDates.has(format(d, "yyyy-MM-dd"));

    return (
        <div className="rounded-lg border border-border bg-surface p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <button
                    type="button"
                    onClick={() => setViewDate(new Date(year, month - 1, 1))}
                    className="size-7 grid place-items-center rounded-md text-muted hover:text-fg transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
                <span className="text-sm font-medium text-fg">{monthLabel}</span>
                <button
                    type="button"
                    onClick={() => setViewDate(new Date(year, month + 1, 1))}
                    className="size-7 grid place-items-center rounded-md text-muted hover:text-fg transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="text-center text-[10px] font-medium text-muted py-1">{d}</div>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-0.5">
                {days.map((d, i) => {
                    if (!d) return <div key={`e-${i}`} />;

                    const disabled = isPast(d);
                    const selected = isSelected(d);
                    const scheduled = hasScheduled(d);
                    const isTodayDate = format(d, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSelect(selected ? undefined : d)}
                            className={cn(
                                "relative size-8 grid place-items-center rounded-md text-xs font-medium transition-all",
                                disabled && "opacity-30 cursor-not-allowed",
                                !disabled && !selected && "hover:bg-surface-2 text-fg",
                                selected && "bg-accent text-on-accent",
                                isTodayDate && !selected && "ring-1 ring-accent text-accent"
                            )}
                        >
                            {d.getDate()}
                            {scheduled && !selected && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-accent" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ───── Time Picker (12h AM/PM) ───── */

function formatTime12(value: string): string {
    const [h, m] = value.split(":").map(Number);
    const period = h < 12 ? "AM" : "PM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

interface TimePickerProps {
    value: string;
    onChange: (v: string) => void;
    isToday: boolean;
    isBlocked: (v: string) => boolean;
}

function TimePicker({ value, onChange, isToday, isBlocked }: TimePickerProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const keyHandler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        document.addEventListener("keydown", keyHandler);
        return () => {
            document.removeEventListener("mousedown", handler);
            document.removeEventListener("keydown", keyHandler);
        };
    }, [open]);

    const amSlots = TIME_SLOTS.filter((t) => t.period === "AM");
    const pmSlots = TIME_SLOTS.filter((t) => t.period === "PM");

    const isDisabled = (val: string) => {
        if (isBlocked(val)) return true;
        if (!isToday) return false;
        const [h, m] = val.split(":").map(Number);
        const slotDate = setMinutes(setHours(startOfDay(new Date()), h), m);
        return isBefore(slotDate, new Date());
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-fg transition-colors hover:border-border-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
                <span>{formatTime12(value)}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn(
                        "size-3.5 shrink-0 text-muted transition-transform duration-150",
                        open && "rotate-180"
                    )}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full max-h-[280px] overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                    <div className="overflow-y-auto max-h-[280px]">
                        <TimeSlotGroup
                            label="AM"
                            slots={amSlots}
                            value={value}
                            isDisabled={isDisabled}
                            isBlocked={isBlocked}
                            onSelect={(v) => { onChange(v); setOpen(false); }}
                        />
                        <TimeSlotGroup
                            label="PM"
                            slots={pmSlots}
                            value={value}
                            isDisabled={isDisabled}
                            isBlocked={isBlocked}
                            onSelect={(v) => { onChange(v); setOpen(false); }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function TimeSlotGroup({
    label,
    slots,
    value,
    isDisabled,
    isBlocked,
    onSelect,
}: {
    label: string;
    slots: typeof TIME_SLOTS;
    value: string;
    isDisabled: (v: string) => boolean;
    isBlocked: (v: string) => boolean;
    onSelect: (v: string) => void;
}) {
    return (
        <div>
            <div className={cn(
                "sticky top-0 z-10 px-3 py-2 border-b",
                label === "AM" ? "bg-surface border-border" : "bg-surface border-border"
            )}>
                <span className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    label === "AM" ? "text-info" : "text-accent-text"
                )}>{label}</span>
            </div>
                        {slots.map((t) => {
                            const disabled = isDisabled(t.value);
                            const selected = t.value === value;
                            const blocked = isBlocked(t.value);
                            return (
                                <button
                                    key={t.value}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onSelect(t.value)}
                                    className={cn(
                                        "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                                        disabled && "opacity-30 cursor-not-allowed",
                                        selected
                                            ? "bg-accent-soft font-medium text-accent-text"
                                            : !disabled && "text-fg hover:bg-surface-2"
                                    )}
                                >
                                    <span>{t.label}</span>
                                    {blocked && !selected && (
                                        <span className="text-[10px] font-medium text-danger">Booked</span>
                                    )}
                                </button>
                );
            })}
        </div>
    );
}
