import { useState } from "react";
import { format, startOfDay, isBefore } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface CalendarDatePickerProps {
    scheduledDates: Set<string>;
    selectedDate: Date | undefined;
    onSelect: (date: Date | undefined) => void;
}

export function CalendarDatePicker({ scheduledDates, selectedDate, onSelect }: CalendarDatePickerProps) {
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

            <div className="grid grid-cols-7 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="text-center text-[10px] font-medium text-muted py-1">{d}</div>
                ))}
            </div>

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
