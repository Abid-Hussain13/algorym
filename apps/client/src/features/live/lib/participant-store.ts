const STORAGE_PREFIX = "algorym:participant:";

export const participantStorageKey = (sessionId: string) => `${STORAGE_PREFIX}${sessionId}`;

/**
 * The live room needs a participantId for both WebSocket URLs. It is issued once
 * at join time, so it is kept in sessionStorage to survive a refresh or an
 * accidental tab close mid-interview without re-prompting the guest.
 */
export const readParticipantId = (sessionId: string): string | null => {
    try {
        return sessionStorage.getItem(participantStorageKey(sessionId));
    } catch {
        return null;
    }
};

export const writeParticipantId = (sessionId: string, participantId: string): void => {
    try {
        sessionStorage.setItem(participantStorageKey(sessionId), participantId);
    } catch {
        /* private mode or storage disabled — the room still works for this page view */
    }
};

export const clearParticipantId = (sessionId: string): void => {
    try {
        sessionStorage.removeItem(participantStorageKey(sessionId));
    } catch {
        /* ignore */
    }
};
