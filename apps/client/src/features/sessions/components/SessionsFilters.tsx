import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { SORT_OPTIONS, MODE_OPTIONS } from "../constants";

interface SessionsFiltersProps {
    search: string;
    onSearchChange: (v: string) => void;
    onSearchSubmit: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    mode: string;
    onModeChange: (v: string) => void;
    sortBy: string;
    onSortByChange: (v: string) => void;
}

export function SessionsFilters({
    search,
    onSearchChange,
    onSearchSubmit,
    onKeyDown,
    mode,
    onModeChange,
    sortBy,
    onSortByChange,
}: SessionsFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:flex-1">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="h-9 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-[13px] text-fg sm:h-10 sm:pr-4 sm:text-sm placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
            </div>

            <div className="min-w-0 flex-1 basis-[38%] sm:flex-none sm:basis-auto">
                <Dropdown
                    options={[...MODE_OPTIONS]}
                    value={mode}
                    onChange={onModeChange}
                    className="w-full"
                />
            </div>

            <div className="min-w-0 flex-1 basis-[38%] sm:flex-none sm:basis-auto">
                <Dropdown
                    options={[...SORT_OPTIONS]}
                    value={sortBy}
                    onChange={onSortByChange}
                    className="w-full"
                />
            </div>

            <Button
                variant="primary"
                size="sm"
                className="ml-auto h-9 shrink-0 px-2.5 text-[12px] sm:ml-0 sm:h-10 sm:px-[15px] sm:text-[13px]"
                onClick={onSearchSubmit}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-3.5 sm:size-4"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
                Search
            </Button>
        </div>
    );
}
