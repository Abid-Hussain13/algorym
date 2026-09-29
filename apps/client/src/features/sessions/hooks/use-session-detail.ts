import { useQuery } from "@tanstack/react-query";
import { sessionsApi } from '@/lib/api';

export function useSessionDetail(sessionId: string | undefined) {
    return useQuery({
        queryKey: ["session", sessionId],
        queryFn: () => sessionsApi.get(sessionId!),
        enabled: !!sessionId,
    });
}
