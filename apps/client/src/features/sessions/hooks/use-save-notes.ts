import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "@/lib/api/endpoints";

export function useSaveNotes(sessionId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notes: string) => sessionsApi.saveNotes(sessionId!, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}
