import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from '@/lib/api';

export function useCancelSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => sessionsApi.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["scheduledSession"] });
        },
    });
}
