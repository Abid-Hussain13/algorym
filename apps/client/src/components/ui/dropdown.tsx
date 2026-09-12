import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface DropdownOption {
    value: string;
    label: string;
}

interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function Dropdown({
    options,
    value,
    onChange,
    placeholder = "Select",
    className,
}: DropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.value === value);
    const display = selected?.label ?? placeholder;

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                close();
            }
        };
        const keyHandler = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        document.addEventListener("mousedown", handler);
        document.addEventListener("keydown", keyHandler);
        return () => {
            document.removeEventListener("mousedown", handler);
            document.removeEventListener("keydown", keyHandler);
        };
    }, [open, close]);

    return (
        <div ref={ref} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-sm text-fg transition-colors hover:border-border-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
                <span className="truncate">{display}</span>
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
                <div className="absolute left-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded-lg border border-border bg-surface shadow-md">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setOpen(false);
                            }}
                            className={cn(
                                "flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2",
                                opt.value === value
                                    ? "bg-accent-soft font-medium text-accent-text"
                                    : "text-fg"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
