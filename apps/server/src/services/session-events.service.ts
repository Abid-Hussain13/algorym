import type { EventType } from "@algorym/shared-types";
import db from "../db/pool.js";

export const logSessionEvent = async (
    sessionId: string,
    actorParticipantId: string | null,
    eventType: EventType,
    payload: Record<string, unknown>
): Promise<void> => {
    await db.query(
        `INSERT INTO session_events (session_id, actor_participant_id, event_type, payload)
         VALUES ($1, $2, $3, $4)`,
        [sessionId, actorParticipantId, eventType, JSON.stringify(payload)]
    );
};
