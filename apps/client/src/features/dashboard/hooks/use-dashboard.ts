import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/endpoints'

export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: () => dashboardApi.getStats(),
    })
}
