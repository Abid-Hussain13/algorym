import { cn } from "@/lib/utils/cn";
import { DURATION_OPTIONS } from "@/features/sessions/constants";
import { CalendarDatePicker } from "./CalendarDatePicker";
import { TimePicker } from "./TimePicker";

interface StepDurationScheduleProps {
    duration: number;
    onDurationChange: (v: number) => void;
    roleContext: string;
    onRoleContextChange: (v: string) => void;
    /** Explicit start-now vs schedule-for-later, rather than inferring from an empty date. */
    when: "now" | "later";
    onWhenChange: (when: "now" | "later") => void;
    scheduledDates: Set<string>;
    scheduledDate: Date | undefined;
    onDateSelect: (date: Date | undefined) => void;
    scheduledTime: string;
    onTimeChange: (v: string) => void;
    isToday: boolean;
    isTimeSlotBlocked: (val: string) => boolean;
}

export function StepDurationSchedule({
    duration,
    onDurationChange,
    roleContext,
    onRoleContextChange,
    when,
    onWhenChange,
    scheduledDates,
    scheduledDate,
    onDateSelect,
    scheduledTime,
    onTimeChange,
    isToday,
    isTimeSlotBlocked,
}: StepDurationScheduleProps) {
    return (
        <div className="flex flex-col gap-4 pb-2">
            <div>
                <label className="text-xs font-medium text-fg mb-1.5 block">Duration</label>
                <div className="grid grid-cols-4 gap-1.5">
                    {DURATION_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onDurationChange(opt.value)}
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

            <div>
                <label className="text-xs font-medium text-fg mb-1.5 block">
                    Session Title <span className="text-muted font-normal">(optional)</span>
                </label>
                <input
                    type="text"
                    placeholder="e.g. Frontend Engineer Interview"
                    value={roleContext}
                    onChange={(e) => onRoleContextChange(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
            </div>

            {/*
              Start-now vs schedule is a two-way choice with two buttons, not an
              optional calendar you have to know to scroll to. Booking a slot is
              how an interview is normally arranged, so it gets equal billing with
              pressing go immediately.
            */}
            <div>
                <label className="text-xs font-medium text-fg mb-1.5 block">When</label>
                <div className="grid grid-cols-2 gap-1.5">
                    <button
                        type="button"
                        onClick={() => onWhenChange("now")}
                        className={cn(
                            "rounded-lg border px-3 py-2 text-left transition-all",
                            when === "now"
                                ? "border-accent bg-accent-soft text-fg ring-1 ring-accent"
                                : "border-border text-muted hover:border-border-strong hover:text-fg"
                        )}
                    >
                        <span className="block text-xs font-semibold">Start now</span>
                        <span className="mt-0.5 block text-[11px] text-muted">
                            Room opens immediately
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onWhenChange("later")}
                        className={cn(
                            "rounded-lg border px-3 py-2 text-left transition-all",
                            when === "later"
                                ? "border-accent bg-accent-soft text-fg ring-1 ring-accent"
                                : "border-border text-muted hover:border-border-strong hover:text-fg"
                        )}
                    >
                        <span className="block text-xs font-semibold">Schedule</span>
                        <span className="mt-0.5 block text-[11px] text-muted">
                            Pick a date and time
                        </span>
                    </button>
                </div>
            </div>

            {when === "later" && (
                <div>
                    <label className="text-xs font-medium text-fg mb-1.5 block">
                        Session date <span className="text-muted font-normal">(required)</span>
                    </label>
                    <p className="text-[11px] text-muted mb-2">
                        Dates already booked are crossed out.
                    </p>

                    <CalendarDatePicker
                        scheduledDates={scheduledDates}
                        selectedDate={scheduledDate}
                        onSelect={onDateSelect}
                    />

                    <div className="mt-2">
                        <label className="text-xs font-medium text-fg mb-1 block">
                            Start time <span className="text-muted font-normal">(required)</span>
                        </label>
                        <TimePicker
                            value={scheduledTime}
                            onChange={onTimeChange}
                            isToday={isToday}
                            isBlocked={isTimeSlotBlocked}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
