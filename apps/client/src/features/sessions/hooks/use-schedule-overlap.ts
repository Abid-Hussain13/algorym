import { useMemo, useCallback, useEffect } from "react";
import { format, addMinutes, setHours, setMinutes, startOfDay, isBefore } from "date-fns";
import { useScheduledSession } from "@/features/sessions";
import { TIME_SLOTS } from "@/features/sessions/constants";

export function useScheduleOverlap() {
    const { data: scheduledData } = useScheduledSession();

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

    return { scheduledDates, isTimeSlotBlocked };
}

export function useAutoSwitchTime(
    scheduledDate: Date | undefined,
    duration: number,
    scheduledTime: string,
    setScheduledTime: (v: string) => void,
    isTimeSlotBlocked: (slotValue: string, selectedDuration: number, targetDate: Date | undefined) => boolean,
) {
    useEffect(() => {
        if (scheduledDate && isTimeSlotBlocked(scheduledTime, duration, scheduledDate)) {
            const next = TIME_SLOTS.find(
                (t) => !isTimeSlotBlocked(t.value, duration, scheduledDate)
            );
            if (next) {
                setScheduledTime(next.value);
            }
        }
    }, [duration, scheduledDate, isTimeSlotBlocked, scheduledTime, setScheduledTime]);
}

export function computeScheduledISO(scheduledDate: Date | undefined, scheduledTime: string) {
    if (!scheduledDate) return undefined;
    const [h, m] = scheduledTime.split(":").map(Number);
    let dt = setMinutes(setHours(startOfDay(scheduledDate), h), m);
    if (isBefore(dt, new Date())) dt = addMinutes(new Date(), 10);
    return dt.toISOString();
}
