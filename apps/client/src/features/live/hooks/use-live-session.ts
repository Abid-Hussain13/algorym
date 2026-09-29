import { useQuery } from "@tanstack/react-query";
import type { Question, RoomSession } from "@algorym/shared-types";
import { sessionsApi } from '@/lib/api';

export interface LiveSessionState {
    session: RoomSession | null;
    question: Question | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * The live room's copy of session state: status, language, and the current
 * question's full text and starter code.
 *
 * Goes through `GET /api/session/:id/room` rather than the dashboard's
 * `GET /api/session/:id` because that one is owner-scoped and requires a login —
 * an anonymous candidate has neither. `/room` proves membership with the
 * participantId issued at join instead.
 *
 * Separate query key from `["session", id]` on purpose: the host's richer
 * dashboard payload (notes, question list) and the room's participant payload
 * are different shapes and must not overwrite each other in the cache.
 */
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
        isLoading: query.isLoading,
        error: (query.error as Error | null) ?? null,
        refetch: () => void query.refetch(),
    };
}
