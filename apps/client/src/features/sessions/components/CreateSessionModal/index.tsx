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
} from "@/components/ui/dialog";
import { useQuestions } from "@/features/questions";
import { useCreateSession, useScheduleOverlap, useAutoSwitchTime, computeScheduledISO } from "@/features/sessions";
import { useUserPreferences } from "@/features/user";
import { resolveSessionLanguage } from "@/features/sessions/components/QuestionPicker";
import type { CreateSessionBody, Question } from "@algorym/shared-types";
import { StepMode } from "./StepMode";
import { StepQuestion } from "./StepQuestion";
import { StepDurationSchedule } from "./StepDurationSchedule";
import { StepReview } from "./StepReview";
import { StepSuccess } from "./StepSuccess";

const STEP_TITLES = ["Session Mode", "Choose Questions", "Duration & Schedule", "Review & Create"];

interface CreateSessionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
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

    const { data: questionsData, isLoading: questionsLoading } = useQuestions();
    const { data: prefs } = useUserPreferences();
    const { scheduledDates, isTimeSlotBlocked } = useScheduleOverlap();
    const createSession = useCreateSession();

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

    const scheduledISO = computeScheduledISO(scheduledDate, scheduledTime);

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
            question_ids: questionIds,
            language: language || undefined,
            role_context: roleContext || undefined,
            scheduled_at: scheduledISO,
        };

        createSession.mutate(body, {
            onSuccess: () => {
                toast.success("Session created successfully");
                setStep(4);
            },
            onError: (err) => {
                const message = err instanceof Error ? err.message : "Failed to create session";
                toast.error(message);
                handleClose(false);
            },
        });
    }, [mode, duration, questionIds, language, roleContext, scheduledISO, scheduledDate, scheduledTime, createSession, reset, handleClose, isTimeSlotBlocked]);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg p-0 gap-0" showCloseButton={false}>
                {/* Step indicator */}
                <div className="flex items-center gap-1 px-6 pt-5">
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

                <DialogHeader className="px-6 pt-4 pb-0">
                    <DialogTitle className="text-base">{STEP_TITLES[step]}</DialogTitle>
                    <DialogDescription className="text-xs">
                        {step === 0 && "Select the type of session you want to create."}
                        {step === 1 && "Pick one or more questions for this session, in the order you want them."}
                        {step === 2 && "Set session duration and optionally schedule it for later."}
                        {step === 3 && "Review your session details before creating."}
                    </DialogDescription>
                </DialogHeader>

                {/* Step content */}
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(100dvh-12rem)]">
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
                            scheduledDate={scheduledDate}
                            scheduledTime={scheduledTime}
                        />
                    )}

                    {step === 4 && (
                        <StepSuccess
                            mode={mode}
                            accessToken={createSession.data?.session?.access_token}
                        />
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
