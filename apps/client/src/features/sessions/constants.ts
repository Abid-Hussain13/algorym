import { DIFFICULTY_BADGES } from "@/lib/constants";

export { DIFFICULTY_BADGES };

export const DURATION_OPTIONS = [
    { value: 30, label: "30 min" },
    { value: 45, label: "45 min" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
    { value: 180, label: "3 hours" },
    { value: 240, label: "4 hours" },
    { value: 300, label: "5 hours" },
];

export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
    const h24 = Math.floor(i / 2);
    const m = (i % 2) * 30;
    const period = h24 < 12 ? "AM" : "PM";
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    const value = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const label = `${h12}:${String(m).padStart(2, "0")} ${period}`;
    return { value, label, period };
});

export const SORT_OPTIONS = [
    { value: "date_desc", label: "Newest First" },
    { value: "date_asc", label: "Oldest First" },
    { value: "status", label: "Status" },
    { value: "rating", label: "Rating" },
] as const;

export const MODE_OPTIONS = [
    { value: "", label: "All Modes" },
    { value: "interview", label: "Interview" },
    { value: "practice", label: "Practice" },
] as const;

export const STATUS_BADGES: Record<string, string> = {
    completed: "bg-success/10 text-success",
    live: "bg-accent-soft text-accent-text",
    scheduled: "bg-info/10 text-info",
    cancelled: "bg-muted/10 text-muted",
    expired: "bg-danger/10 text-danger",
};

export const STATUS_LABELS: Record<string, string> = {
    completed: "Completed",
    live: "Live",
    scheduled: "Scheduled",
    cancelled: "Cancelled",
    expired: "Expired",
};

export const RATING_BADGES: Record<string, string> = {
    strong: "bg-success/10 text-success",
    average: "bg-info/10 text-info",
    weak: "bg-danger/10 text-danger",
};

export const RATING_LABELS: Record<string, string> = {
    strong: "Strong",
    average: "Average",
    weak: "Weak",
};

export const MODE_BADGES: Record<string, string> = {
    interview: "bg-accent-soft text-accent-text",
    practice: "bg-info/10 text-info",
};

export const MODE_LABELS: Record<string, string> = {
    interview: "Interview",
    practice: "Practice",
};
