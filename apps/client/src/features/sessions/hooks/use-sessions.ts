import { useQuery } from '@tanstack/react-query'
import { sessionsApi } from '@/lib/api/endpoints'
import type { SessionListParams } from '@algorym/shared-types'

export function useSessions(params: SessionListParams) {
    return useQuery({
        queryKey: ['sessions', params],
        queryFn: () => sessionsApi.list(params),
    })
}
