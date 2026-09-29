import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'
import type { ReportsRange } from '@algorym/shared-types'

export function useReports(range: ReportsRange = '30d') {
    return useQuery({
        queryKey: ['reports', range],
        queryFn: () => reportsApi.get(range),
    })
}
