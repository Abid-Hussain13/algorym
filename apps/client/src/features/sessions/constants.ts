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
