import type { ReportsRange } from '@algorym/shared-types'
import { cn } from '@/lib/utils/cn'
import { RANGE_OPTIONS } from '../constants'

interface TimeFilterProps {
    value: ReportsRange
    onChange: (range: ReportsRange) => void
}

export function TimeFilter({ value, onChange }: TimeFilterProps) {
    return (
        <div className="flex flex-wrap items-center gap-0.5 rounded-sm border border-border bg-surface p-0.5">
            {RANGE_OPTIONS.map((r) => (
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
