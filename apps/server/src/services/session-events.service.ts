import type { EventType, ParticipantRole } from "@algorym/shared-types";
import db from "../db/pool.js";

export interface SessionEventRow {
    id: string;
    event_type: EventType;
    payload: Record<string, unknown>;
    created_at: string;
    actor_id: string | null;
    display_name: string | null;
    role: ParticipantRole | null;
}

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

export const getSessionEvents = async (sessionId: string): Promise<SessionEventRow[]> => {
    const { rows } = await db.query<SessionEventRow>(
        `SELECT e.id, e.event_type, e.payload, e.created_at,
                p.id AS actor_id, p.display_name, p.role
         FROM session_events e
         LEFT JOIN session_participants p ON p.id = e.actor_participant_id
         WHERE e.session_id = $1
         ORDER BY e.created_at ASC`,
        [sessionId]
    );
    return rows;
}
