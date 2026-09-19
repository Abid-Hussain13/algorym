import type { ReportsStats } from '@algorym/shared-types'

interface ReportStatCardsProps {
    stats: ReportsStats
}

const CARDS = [
    {
        label: 'Total Sessions',
        getValue: (s: ReportsStats) => String(s.totalSessions),
        icon: 'M4 17l6-6-6-6M12 19h8',
    },
    {
        label: 'Avg Duration',
        getValue: (s: ReportsStats) => (s.avgDurationMinutes ? `${s.avgDurationMinutes} min` : 'N/A'),
        icon: 'M12 2v10l4.5 4.5',
    },
    {
        label: 'Completion Rate',
        getValue: (s: ReportsStats) => `${s.completionRate}%`,
        icon: 'M20 6 9 17l-5-5',
    },
]

export function ReportStatCards({ stats }: ReportStatCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CARDS.map((card) => (
                <div
                    key={card.label}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-5 shadow-sm transition-colors hover:border-border-strong"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-muted">{card.label}</span>
                            <span className="text-2xl font-semibold tabular-nums text-fg">
                                {card.getValue(stats)}
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
                                <path d={card.icon} />
                            </svg>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
