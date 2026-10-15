import { useQuery } from "@tanstack/react-query";
import type { Question, RoomSession, SessionQuestionRef } from "@algorym/shared-types";
import { sessionsApi } from '@/lib/api';

export interface LiveSessionState {
    session: RoomSession | null;
    question: Question | null;
    /** Every assigned question, so a candidate can see what is coming. . */
    questions: SessionQuestionRef[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

/** The live room's copy of session state: status, language, and the current . */
export function useLiveSession(sessionId: string, participantId: string): LiveSessionState {
    const enabled = Boolean(sessionId && participantId);

    const query = useQuery({
        queryKey: ["session-room", sessionId, participantId],
        queryFn: () => sessionsApi.room(sessionId, participantId),
        enabled,
        // The host drives session state from their dashboard actions; the room
        // should notice without the user having to refocus the tab.
        refetchInterval: enabled ? 30_000 : false,
        retry: false,
    });

    return {
        session: query.data?.session ?? null,
        question: query.data?.question ?? null,
        questions: query.data?.questions ?? [],
        isLoading: query.isLoading,
        error: (query.error as Error | null) ?? null,
        refetch: () => void query.refetch(),
    };
}
