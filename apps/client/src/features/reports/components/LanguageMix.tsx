import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { LanguageDistributionItem } from '@algorym/shared-types'

const LANGUAGE_FILLS: Record<string, string> = {
    javascript: '#f7df1e',
    python: '#3776ab',
    java: '#f89820',
    cpp: '#00599c',
    go: '#00add8',
}

const FALLBACK_COLORS = [
    'var(--color-p-teal)',
    'var(--color-p-sky)',
    'var(--color-p-violet)',
    'var(--color-p-amber)',
    'var(--color-p-rose)',
]

function getFill(lang: string, index: number): string {
    return LANGUAGE_FILLS[lang.toLowerCase()] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: LanguageDistributionItem }> }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
        <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-md">
            <p className="text-xs text-muted capitalize">{d.language}</p>
            <p className="text-sm font-semibold text-fg">
                {d.count} sessions ({Math.round(d.percentage * 100)}%)
            </p>
        </div>
    )
}

interface LanguageMixProps {
    data: LanguageDistributionItem[]
}

export function LanguageMix({ data }: LanguageMixProps) {
    if (!data.length) {
        return (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-fg">Language Mix</h3>
                <div className="flex h-[200px] items-center justify-center">
                    <p className="text-sm text-muted">No language data</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-fg">Language Mix</h3>
            <div className="flex items-center gap-6">
                <div className="h-[180px] w-[180px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="count"
                                nameKey="language"
                                cx="50%"
                                cy="50%"
                                innerRadius={52}
                                outerRadius={80}
                                paddingAngle={3}
                                strokeWidth={0}
                            >
                                {data.map((entry, i) => (
                                    <Cell key={entry.language} fill={getFill(entry.language, i)} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2.5">
                    {data.map((d, i) => (
                        <div key={d.language} className="flex items-center gap-2.5">
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ background: getFill(d.language, i) }}
                            />
                            <span className="text-xs font-medium text-muted capitalize">{d.language}</span>
                            <span className="text-xs font-semibold tabular-nums text-fg">
                                {Math.round(d.percentage * 100)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
