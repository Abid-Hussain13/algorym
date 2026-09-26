import type { ReportsRange } from '@algorym/shared-types'

export const RANGE_OPTIONS: Array<{ value: ReportsRange; label: string }> = [
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: '90d', label: '90d' },
    { value: 'month', label: 'This month' },
    { value: 'year', label: 'This year' },
]
