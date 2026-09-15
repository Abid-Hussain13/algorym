import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { DURATION_OPTIONS } from "@/features/sessions/constants";
import { formatTime12 } from "./TimePicker";

interface Question {
    id: string;
    title: string;
    difficulty: string;
}

interface StepReviewProps {
    mode: "interview" | "practice";
    duration: number;
    roleContext: string;
    selectedQuestion: Question | undefined;
    scheduledDate: Date | undefined;
    scheduledTime: string;
}

export function StepReview({
    mode,
    duration,
    roleContext,
    selectedQuestion,
    scheduledDate,
    scheduledTime,
}: StepReviewProps) {
    return (
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
                            <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", "bg-success/10 text-success")}>
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
    );
}
