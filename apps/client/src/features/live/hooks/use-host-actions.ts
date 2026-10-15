import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sessionsApi } from "@/lib/api";

/** Host-only session actions taken from inside the live room. . */
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
            toast.success("Session completed. You can now rate the candidate");
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
