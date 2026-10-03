import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sessionsApi } from "@/lib/api";

/**
 * Host-only session actions taken from inside the live room.
 *
 * Separate from `features/sessions/hooks/use-session-mutations` on purpose:
 * those invalidate the dashboard's cache keys (`sessions`, `dashboard`,
 * `scheduledSession`) because they run from the dashboard. These run from the
 * room, so they must invalidate the room's own keys instead — invalidating
 * dashboard queries from here would refetch lists nobody is looking at.
 *
 * Both also broadcast over `/ws` on the server **once Phase 7 lands**. Until
 * then the invalidation below is what keeps the two sides in step, and a
 * candidate picks up a question change on their next 30s poll.
 */
export function useHostActions(sessionId: string) {
    const queryClient = useQueryClient();

    const invalidate = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
            queryClient.invalidateQueries({ queryKey: ["session-room", sessionId] }),
        ]);
    };

    const changeQuestion = useMutation({
        mutationFn: ({ questionId, language }: { questionId: string; language: string }) =>
            sessionsApi.changeQuestion(sessionId, questionId, language),
        onSuccess: invalidate,
        onError: (error) => toast.error(error.message || "Couldn't change the question"),
    });

    const completeSession = useMutation({
        mutationFn: () => sessionsApi.complete(sessionId),
        onSuccess: async () => {
            await invalidate();
            toast.success("Session completed — you can now rate the candidate");
        },
        onError: (error) => toast.error(error.message || "Couldn't complete the session"),
    });

    const cancelSession = useMutation({
        mutationFn: () => sessionsApi.cancel(sessionId),
        onSuccess: async () => {
            await invalidate();
            toast.success("Session cancelled");
        },
        onError: (error) => toast.error(error.message || "Couldn't cancel the session"),
    });

    return { changeQuestion, completeSession, cancelSession };
}
