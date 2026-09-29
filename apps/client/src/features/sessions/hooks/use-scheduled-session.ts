import { sessionsApi } from '@/lib/api'
import { useQuery } from "@tanstack/react-query"

export function useScheduledSession() {
    return useQuery({
        queryKey: ["scheduledSession"],
        queryFn: () => sessionsApi.scheduledSessions()
    })
}
