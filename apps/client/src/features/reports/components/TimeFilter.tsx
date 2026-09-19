import type { ReportsRange } from '@algorym/shared-types'
import { cn } from '@/lib/utils/cn'

const RANGES: Array<{ value: ReportsRange; label: string }> = [
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: '90d', label: '90d' },
]

interface TimeFilterProps {
    value: ReportsRange
    onChange: (range: ReportsRange) => void
}

export function TimeFilter({ value, onChange }: TimeFilterProps) {
    return (
        <div className="flex items-center rounded-sm border border-border bg-surface p-0.5">
            {RANGES.map((r) => (
                <button
                    key={r.value}
                    onClick={() => onChange(r.value)}
                    className={cn(
                        'relative px-3.5 py-1.5 text-xs font-semibold tracking-wide rounded-xs transition-all duration-150',
                        value === r.value
                            ? 'bg-accent text-on-accent shadow-sm'
                            : 'text-muted hover:text-fg hover:bg-surface-2'
                    )}
                >
                    {r.label}
                </button>
            ))}
        </div>
    )
}
