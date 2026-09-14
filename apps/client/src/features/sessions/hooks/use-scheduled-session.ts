import { sessionsApi } from "@/lib"
import { useQuery } from "@tanstack/react-query"

export function useScheduledSession() {
    return useQuery({
        queryKey: ["scheduledSession"],
        queryFn: () => sessionsApi.scheduledSessions()
    })
}
