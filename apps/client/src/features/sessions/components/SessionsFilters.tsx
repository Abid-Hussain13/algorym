import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/dropdown";
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
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
                    className="h-10 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-4 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
            </div>

            <Dropdown
                options={[...MODE_OPTIONS]}
                value={mode}
                onChange={onModeChange}
                className="shrink-0"
            />

            <Dropdown
                options={[...SORT_OPTIONS]}
                value={sortBy}
                onChange={onSortByChange}
                className="shrink-0"
            />

            <Button variant="primary" size="sm" onClick={onSearchSubmit}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
                Search
            </Button>
        </div>
    );
}
