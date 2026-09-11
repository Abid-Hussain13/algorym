interface RatingBucket {
    label: string;
    count: number;
}

interface MonthlyEvaluationProps {
    date: string;
    totalCandidates: number;
    buckets: RatingBucket[];
}

function getColorForRange(label: string): { bg: string; text: string; bar: string } {
    const lower = label.toLowerCase();
    if (lower.includes("strong") || lower.includes("excellent") || lower.includes("high")) {
        return { bg: "bg-success/10", text: "text-success", bar: "bg-success" };
    }
    if (lower.includes("average") || lower.includes("good") || lower.includes("medium")) {
        return { bg: "bg-accent-soft", text: "text-accent-text", bar: "bg-accent" };
    }
    if (lower.includes("weak") || lower.includes("low") || lower.includes("poor")) {
        return { bg: "bg-danger/10", text: "text-danger", bar: "bg-danger" };
    }
    return { bg: "bg-border", text: "text-muted", bar: "bg-muted" };
}

export function MonthlyEvaluation({
    date,
    totalCandidates,
    buckets,
}: MonthlyEvaluationProps) {
    const maxCount = Math.max(...buckets.map((b) => b.count), 1);

    return (
        <div className="flex w-full flex-col gap-4 rounded-xl border border-border bg-surface-2 p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-fg">Candidate Ratings</h3>
                <span className="text-xs text-muted">{date}</span>
            </div>

            <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-fg">{totalCandidates}</span>
                <span className="text-xs text-muted">candidates</span>
            </div>

            {totalCandidates === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-8 text-muted">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <p className="text-sm text-muted">No candidates rated yet</p>
                    <p className="text-xs text-muted">Complete a session to rate candidates</p>
                </div>
            ) : (
            <div className="flex flex-col gap-3">
                {buckets.map((bucket) => {
                    const colors = getColorForRange(bucket.label);
                    const pct = (bucket.count / maxCount) * 100;
                    return (
                        <div key={bucket.label} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex size-2 rounded-full ${colors.bar}`} />
                                    <span className="text-xs font-medium text-muted">{bucket.label}</span>
                                </div>
                                <span className={`text-xs font-semibold tabular-nums ${colors.text}`}>
                                    {bucket.count}
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                                <div
                                    className={`h-full rounded-full ${colors.bar}`}
                                    style={{ width: `${pct}%`, transition: "width 0.5s ease" }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            )}
        </div>
    );
}
