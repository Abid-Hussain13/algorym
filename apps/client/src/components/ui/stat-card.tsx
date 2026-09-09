interface StatCardProps {
    label: string;
    value: string;
    icon: string;
    trend: string;
    trendDirection: "up" | "down";
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
        <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-surface-2 p-5 shadow-sm transition-colors hover:border-border-strong">
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted">{label}</span>
                    <span className="text-2xl font-semibold tabular-nums text-fg">
                        {value}
                    </span>
                </div>
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4 text-accent"
                    >
                        <path d={icon} />
                    </svg>
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
                <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium ${
                        trendDirection === "up"
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
        </div>
    );
}
