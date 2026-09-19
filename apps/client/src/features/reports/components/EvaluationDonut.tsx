import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { EvaluationDistributionItem } from '@algorym/shared-types'

const RATING_CONFIG: Record<string, { fill: string; label: string }> = {
    strong: { fill: 'var(--color-success)', label: 'Strong' },
    average: { fill: 'var(--color-accent)', label: 'Average' },
    weak: { fill: 'var(--color-danger)', label: 'Weak' },
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: EvaluationDistributionItem }> }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    const cfg = RATING_CONFIG[d.rating]
    return (
        <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-md">
            <p className="text-xs text-muted">{cfg?.label ?? d.rating}</p>
            <p className="text-sm font-semibold text-fg">
                {d.count} ({Math.round(d.percentage * 100)}%)
            </p>
        </div>
    )
}

interface EvaluationDonutProps {
    data: EvaluationDistributionItem[]
}

export function EvaluationDonut({ data }: EvaluationDonutProps) {
    if (!data.length) {
        return (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-fg">Evaluation</h3>
                <div className="flex h-[200px] items-center justify-center">
                    <p className="text-sm text-muted">No evaluations yet</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-fg">Evaluation</h3>
            <div className="flex items-center gap-6">
                <div className="h-[180px] w-[180px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="count"
                                nameKey="rating"
                                cx="50%"
                                cy="50%"
                                innerRadius={52}
                                outerRadius={80}
                                paddingAngle={3}
                                strokeWidth={0}
                            >
                                {data.map((entry) => (
                                    <Cell
                                        key={entry.rating}
                                        fill={RATING_CONFIG[entry.rating]?.fill ?? 'var(--color-muted)'}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2.5">
                    {data.map((d) => {
                        const cfg = RATING_CONFIG[d.rating]
                        return (
                            <div key={d.rating} className="flex items-center gap-2.5">
                                <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ background: cfg?.fill ?? 'var(--color-muted)' }}
                                />
                                <span className="text-xs font-medium text-muted">{cfg?.label ?? d.rating}</span>
                                <span className="text-xs font-semibold tabular-nums text-fg">
                                    {Math.round(d.percentage * 100)}%
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
