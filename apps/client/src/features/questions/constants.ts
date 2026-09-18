import { DIFFICULTY_BADGES, DIFFICULTY_LABELS } from "@/lib/constants";

export { DIFFICULTY_BADGES, DIFFICULTY_LABELS };

export const SORT_OPTIONS = [
    { value: "date_desc", label: "Newest First" },
    { value: "date_asc", label: "Oldest First" },
    { value: "title_asc", label: "Title A-Z" },
    { value: "title_desc", label: "Title Z-A" },
] as const;

export const DIFFICULTY_OPTIONS = [
    { value: "", label: "All Difficulties" },
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
] as const;

export const LANGUAGE_COLORS: Record<string, string> = {
    javascript: "bg-[#f7df1e]/10 text-[#b8a000] dark:text-[#f7df1e]",
    python: "bg-[#3776ab]/10 text-[#3776ab] dark:text-[#6fa8dc]",
    java: "bg-[#f89820]/10 text-[#c76d00] dark:text-[#f89820]",
    cpp: "bg-[#00599c]/10 text-[#00599c] dark:text-[#6fa8dc]",
    go: "bg-[#00add8]/10 text-[#007d9c] dark:text-[#00add8]",
};

export const AVAILABLE_LANGUAGES = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "go", label: "Go" },
] as const;
