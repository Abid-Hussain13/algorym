interface StatCardProps {
    label: string;
    value: string;
    icon: string;
    trend?: string;
    trendDirection?: "up" | "down";
    comparison?: string;
}

export function StatCard({
    label,
    value,
    icon,
    trend,
    trendDirection,
    comparison = "vs. last month",
}: StatCardProps) {
    return (
        <div className="flex w-full flex-col gap-2 rounded-xl border border-border bg-surface-2 p-3.5 shadow-sm transition-colors hover:border-border-strong sm:gap-3 sm:p-5">
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted sm:text-sm">{label}</span>
                    <span className="text-lg font-semibold tabular-nums text-fg sm:text-2xl">
                        {value}
                    </span>
                </div>
                <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent-soft sm:size-9">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-3.5 text-accent sm:size-4"
                    >
                        <path d={icon} />
                    </svg>
                </div>
            </div>
            {trend && trendDirection && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted sm:gap-2 sm:text-xs">
                    <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium ${trendDirection === "up"
                                ? "bg-success/10 text-success"
                                : "bg-danger/10 text-danger"
                            }`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-3"
                        >
                            {trendDirection === "up" ? (
                                <path d="m18 15-6-6-6 6" />
                            ) : (
                                <path d="m6 9 6 6 6-6" />
                            )}
                        </svg>
                        {trend}
                    </span>
                    {comparison}
                </div>
            )}
        </div>
    );
}
