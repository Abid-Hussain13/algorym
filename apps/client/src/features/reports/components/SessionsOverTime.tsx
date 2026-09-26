import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SessionsOverTimePoint, ReportsRange } from '@algorym/shared-types'

interface SessionsOverTimeProps {
    data: SessionsOverTimePoint[]
    range: ReportsRange
}

function formatDate(dateStr: string, range: ReportsRange): string {
    const d = new Date(dateStr)
    if (range === '7d') {
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }
    if (range === 'year') {
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-md">
            <p className="text-xs text-muted">{label}</p>
            <p className="text-sm font-semibold text-fg">{payload[0].value} sessions</p>
        </div>
    )
}

export function SessionsOverTime({ data, range }: SessionsOverTimeProps) {
    const chartData = data.map((d) => ({
        ...d,
        label: formatDate(d.date, range),
    }))

    return (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-fg">Interviews Over Time</h3>
            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <defs>
                            <linearGradient id="accentGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="var(--color-accent)"
                            strokeWidth={2}
                            fill="url(#accentGradient)"
                            dot={{ r: 3, fill: 'var(--color-accent)', stroke: 'var(--color-surface-2)', strokeWidth: 2 }}
                            activeDot={{ r: 5, fill: 'var(--color-accent)', stroke: 'var(--color-surface-2)', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
