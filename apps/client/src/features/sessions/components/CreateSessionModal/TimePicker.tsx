import { useState, useRef, useEffect } from "react";
import { setHours, setMinutes, startOfDay, isBefore } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { TIME_SLOTS } from "@/features/sessions/constants";

export function formatTime12(value: string): string {
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

export function TimePicker({ value, onChange, isToday, isBlocked }: TimePickerProps) {
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
