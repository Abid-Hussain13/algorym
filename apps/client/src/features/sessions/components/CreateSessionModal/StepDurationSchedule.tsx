import { cn } from "@/lib/utils/cn";
import { DURATION_OPTIONS } from "@/features/sessions/constants";
import { CalendarDatePicker } from "./CalendarDatePicker";
import { TimePicker } from "./TimePicker";

interface StepDurationScheduleProps {
    duration: number;
    onDurationChange: (v: number) => void;
    roleContext: string;
    onRoleContextChange: (v: string) => void;
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

            <div>
                <label className="text-xs font-medium text-fg mb-1.5 block">
                    Schedule <span className="text-muted font-normal">(optional)</span>
                </label>
                <p className="text-[11px] text-muted mb-2">Leave empty to start immediately</p>

                <CalendarDatePicker
                    scheduledDates={scheduledDates}
                    selectedDate={scheduledDate}
                    onSelect={onDateSelect}
                />

                {scheduledDate && (
                    <div className="mt-2">
                        <label className="text-[11px] font-medium text-muted mb-1 block">Time</label>
                        <TimePicker
                            value={scheduledTime}
                            onChange={onTimeChange}
                            isToday={isToday}
                            isBlocked={isTimeSlotBlocked}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
