const INVALID = "—";

function toDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateStr: string | null | undefined): string {
    const d = toDate(dateStr);
    if (!d) return INVALID;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(dateStr: string | null | undefined): string {
    const d = toDate(dateStr);
    if (!d) return INVALID;
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDateTime(dateStr: string | null | undefined): string {
    const d = toDate(dateStr);
    if (!d) return INVALID;
    return `${formatDate(d.toISOString())}, ${formatTime(d.toISOString())}`;
}

export function formatDuration(minutes: number | null | undefined): string {
    if (!minutes && minutes !== 0) return INVALID;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} hr ${m} min` : `${h} hr`;
}

export function formatRelativeDuration(
    startedAt: string | null | undefined,
    endedAt: string | null | undefined
): string {
    const start = toDate(startedAt);
    const end = toDate(endedAt);
    if (!start || !end) return INVALID;
    const totalMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    return formatDuration(totalMinutes);
}
