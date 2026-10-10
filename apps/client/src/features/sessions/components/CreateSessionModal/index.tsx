import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/Dialog";
import { useQuestions } from "@/features/questions";
import { useSessions } from "../../hooks/use-sessions";
import { useCreateSession, useScheduleOverlap, useAutoSwitchTime, computeScheduledISO } from "@/features/sessions";
import { useUserPreferences } from "@/features/user";
import { resolveSessionLanguage } from "@/features/sessions/components/QuestionPicker";
import type { CreateSessionBody, Question } from "@algorym/shared-types";
import { StepMode } from "./StepMode";
import { StepQuestion } from "./StepQuestion";
import { StepDurationSchedule } from "./StepDurationSchedule";
import { StepReview } from "./StepReview";
import { StepSuccess } from "./StepSuccess";
import { FormAlert } from "./FormAlert";
import { ApiError } from "@/lib/api/client";
import { useNavigate } from "react-router-dom";

const STEP_TITLES = ["Session Mode", "Choose Questions", "Duration & Schedule", "Review & Create"];

interface CreateSessionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Turns whatever the server said into one sentence a person can act on.
 *
 * The generic fallback used to be the raw `Error.message`, which for a failed fetch is
 * `Failed to fetch` — technically true and completely useless.
 */
function explainError(err: unknown): string {
    if (err instanceof ApiError) {
        // A validation failure carries per-field messages that beat any generic text.
        if (err.errors?.length) {
            return err.errors.map((e) => e.message).join(". ");
        }
        if (err.status === 0) return "Can't reach the server. Check your connection and try again.";
        if (err.status === 401 || err.status === 403) return "Your session expired. Sign in again to continue.";
        if (err.status === 409) return err.message; // already human, e.g. the live-session conflict
        if (err.status === 422 || err.status === 400) return err.message;
        if (err.status >= 500) return "Something broke on our side. Your details are still here — try again.";
        return err.message;
    }
    return "Couldn't create the session. Nothing was lost — try again.";
}

export function CreateSessionModal({ open, onOpenChange }: CreateSessionModalProps) {
    const [step, setStep] = useState(0);
    const [mode, setMode] = useState<"interview" | "practice">("interview");
    const [questionIds, setQuestionIds] = useState<string[]>([]);
    const [language, setLanguage] = useState<string>("");
    const [duration, setDuration] = useState(60);
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
    const [scheduledTime, setScheduledTime] = useState("09:00");
    const [roleContext, setRoleContext] = useState("");
    const [questionSearch, setQuestionSearch] = useState("");
    /**
     * The one piece of state the user actually needs: why the last attempt failed.
     *
     * Cleared on every successful create, and whenever they change something that could
     * fix it — a stale error sitting next to a form they have since corrected is worse
     * than no message.
     */
    const [problem, setProblem] = useState<string | null>(null);

    const { data: questionsData, isLoading: questionsLoading } = useQuestions();
    const { data: prefs } = useUserPreferences();
    const { scheduledDates, isTimeSlotBlocked } = useScheduleOverlap();
    const createSession = useCreateSession();
    const { data: sessionsData } = useSessions({});
    const navigate = useNavigate();

    /**
     * Start now, or pick a slot. This was previously implicit — an empty date
     * meant "immediate", buried under a calendar labelled *(optional)*, which
     * read as "scheduling is a niche feature" rather than "you choose when this
     * interview happens".
     */
    const [when, setWhen] = useState<"now" | "later">("now");

    /**
     * One live interview at a time. The server enforces this; showing it here
     * as well means the host finds out on the first screen rather than after
     * picking questions, a duration and a date.
     */
    const liveSession = useMemo(
        () => sessionsData?.sessions?.find((s) => s.status === "live") ?? null,
        [sessionsData]
    );

    useAutoSwitchTime(scheduledDate, duration, scheduledTime, setScheduledTime, isTimeSlotBlocked);

    // Set default duration from user preferences when modal opens
    useEffect(() => {
        if (open && prefs?.default_duration_minutes) {
            setDuration(prefs.default_duration_minutes);
        }
    }, [open, prefs?.default_duration_minutes]);

    const questions = questionsData?.questions ?? [];

    const selectedQuestions = useMemo(
        () =>
            questionIds
                .map((id) => questions.find((question) => question.id === id))
                .filter((question): question is Question => !!question),
        [questionIds, questions]
    );

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

    const isToday = scheduledDate && format(scheduledDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

    const scheduledISO =
        when === "later" ? (computeScheduledISO(scheduledDate, scheduledTime) ?? undefined) : undefined;

    const reset = useCallback(() => {
        setStep(0);
        setMode("interview");
        setQuestionIds([]);
        setLanguage("");
        setDuration(60);
        setScheduledDate(undefined);
        setScheduledTime("09:00");
        setRoleContext("");
        setQuestionSearch("");
    }, []);

    const handleClose = useCallback(
        (v: boolean) => {
            // Cleared here rather than in an effect on `open`: the dialog is
            // always closed before it is reopened, so this is the one place the
            // lifecycle actually happens — and a setState-in-effect would just
            // cause a second render pass to achieve the same thing.
            if (!v) {
                reset();
                setProblem(null);
            }
            onOpenChange(v);
        },
        [onOpenChange, reset]
    );

    const handleCreate = useCallback(() => {
        setProblem(null);

        // Every precondition is checked here and reported inline. Previously these
        // returned silently, or toasted and then closed the dialog, so a failed
        // attempt looked identical to a button that did nothing.
        if (liveSession) {
            setProblem(
                "You already have a live session running. Finish or cancel it before starting another — a host cannot run two rooms at once."
            );
            return;
        }

        if (when === "later" && !scheduledDate) {
            setProblem("Pick a date, or switch back to Start now.");
            return;
        }

        if (when === "later" && scheduledDate && isTimeSlotBlocked(scheduledTime, duration, scheduledDate)) {
            setProblem(
                `${format(scheduledDate, "MMM d")} at ${scheduledTime} overlaps another session. Pick a different slot.`
            );
            return;
        }

        if (mode === "interview" && questionIds.length === 0) {
            setProblem("Choose at least one question for this interview.");
            setStep(1);
            return;
        }

        const body: CreateSessionBody = {
            mode,
            duration_minutes: duration,
            question_ids: questionIds,
            language: language || undefined,
            role_context: roleContext || undefined,
            scheduled_at: scheduledISO,
        };

        createSession.mutate(body, {
            onSuccess: () => {
                setProblem(null);
                toast.success("Session created successfully");
                setStep(4);
            },
            onError: (err) => {
                // Deliberately does NOT close the dialog: closing threw away the
                // questions, duration and date the host had already chosen.
                setProblem(explainError(err));
            },
        });
    }, [mode, duration, questionIds, language, roleContext, scheduledISO, scheduledDate, scheduledTime, when, liveSession, createSession, reset, isTimeSlotBlocked, format]);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            {/* flex (not the default grid) so the scroll area can shrink: with a
                tall step + the live-session alert, grid rows refused to compress
                and pushed the footer buttons out of the dialog. */}
            <DialogContent className="sm:max-w-lg p-0 gap-0 flex flex-col" showCloseButton={false}>
                {/* Step indicator */}
                <div className="flex items-center gap-1 px-6 pt-5 shrink-0">
                    {STEP_TITLES.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1 flex-1 rounded-full transition-colors duration-200",
                                i <= step ? "bg-accent" : "bg-border"
                            )}
                        />
                    ))}
                </div>

                <DialogHeader className="px-6 pt-4 pb-0 shrink-0">
                    <DialogTitle className="text-base">{STEP_TITLES[step]}</DialogTitle>
                    <DialogDescription className="text-xs">
                        {step === 0 && "Select the type of session you want to create."}
                        {step === 1 && "Pick one or more questions for this session, in the order you want them."}
                        {step === 2 && "Set session duration and optionally schedule it for later."}
                        {step === 3 && "Review your session details before creating."}
                    </DialogDescription>
                </DialogHeader>

                {/* Step content — flex-1/min-h-0 lets it shrink inside the dialog
                    instead of forcing the footer past the bottom edge. */}
                <div className="px-6 py-4 overflow-y-auto min-h-0 flex-1">
                    {step === 0 && (
                        <StepMode mode={mode} onModeChange={setMode} />
                    )}

                    {step === 1 && (
                        <StepQuestion
                            questions={questions}
                            search={questionSearch}
                            onSearchChange={setQuestionSearch}
                            selectedIds={questionIds}
                            onSelectionChange={handleSelectionChange}
                            selectedLanguage={language}
                            onLanguageSelect={setLanguage}
                            isLoading={questionsLoading}
                        />
                    )}

                    {step === 2 && (
                        <StepDurationSchedule
                            duration={duration}
                            onDurationChange={setDuration}
                            roleContext={roleContext}
                            onRoleContextChange={setRoleContext}
                            scheduledDates={scheduledDates}
                            when={when}
                            onWhenChange={setWhen}
                            scheduledDate={scheduledDate}
                            onDateSelect={setScheduledDate}
                            scheduledTime={scheduledTime}
                            onTimeChange={setScheduledTime}
                            isToday={!!isToday}
                            isTimeSlotBlocked={(val) => isTimeSlotBlocked(val, duration, scheduledDate)}
                        />
                    )}

                    {step === 3 && (
                        <StepReview
                            mode={mode}
                            duration={duration}
                            roleContext={roleContext}
                            selectedQuestions={selectedQuestions}
                            language={language}
                            when={when}
                            scheduledDate={scheduledDate}
                            scheduledTime={scheduledTime}
                        />
                    )}

                    {step === 4 && (
                        <StepSuccess
                            mode={mode}
                            sessionId={createSession.data?.session?.id}
                            accessToken={createSession.data?.session?.access_token}
                        />
                    )}
                </div>

                {/* Sits directly above the footer so it is the last thing read
                    before the button that produced it. */}
                {step < 4 && (problem || createSession.isPending || liveSession) && (
                    <div className="px-6 pb-1 shrink-0">
                        {liveSession && (
                            <FormAlert
                                tone="warning"
                                title="You have a session live right now"
                                action={
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => {
                                            handleClose(false);
                                            navigate(`/live/${liveSession.id}`);
                                        }}
                                    >
                                        Open it
                                    </Button>
                                }
                            >
                                A host can only run one interview at a time. Finish or cancel
                                the live session first.
                            </FormAlert>
                        )}
                        {!liveSession && problem && <FormAlert title={problem} />}
                    </div>
                )}

                {/* Footer */}
                {step < 4 && (
                    <DialogFooter className="px-6 pb-5 pt-3 border-t border-border shrink-0">
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
                    <DialogFooter className="px-6 pb-5 pt-3 border-t border-border shrink-0">
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
