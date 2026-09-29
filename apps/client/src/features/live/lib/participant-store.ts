import type { ParticipantRole } from "@algorym/shared-types";

const STORAGE_PREFIX = "algorym:participant:";

export interface LocalParticipant {
    id: string;
    displayName: string;
    role: ParticipantRole;
}

export const participantStorageKey = (sessionId: string) => `${STORAGE_PREFIX}${sessionId}`;

/**
 * The live room needs a participantId for both WebSocket URLs. It is issued once
 * at join time, so it is kept in sessionStorage to survive a refresh or an
 * accidental tab close mid-interview without re-prompting the guest.
 */
export const readParticipant = (sessionId: string): LocalParticipant | null => {
    try {
        const raw = sessionStorage.getItem(participantStorageKey(sessionId));
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<LocalParticipant>;
        if (!parsed?.id) return null;

        return {
            id: parsed.id,
            displayName: parsed.displayName || "Guest",
            role: parsed.role === "host" ? "host" : "guest",
        };
    } catch {
        return null;
    }
};

export const readParticipantId = (sessionId: string): string | null => readParticipant(sessionId)?.id ?? null;

export const writeParticipant = (sessionId: string, participant: LocalParticipant): void => {
    try {
        sessionStorage.setItem(participantStorageKey(sessionId), JSON.stringify(participant));
    } catch {
        /* private mode or storage disabled — the room still works for this page view */
    }
};

export const clearParticipant = (sessionId: string): void => {
    try {
        sessionStorage.removeItem(participantStorageKey(sessionId));
    } catch {
        /* ignore */
    }
};
