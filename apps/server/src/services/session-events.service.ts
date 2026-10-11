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
): Promise<string> => {
    const { rows } = await db.query<{ id: string }>(
        `INSERT INTO session_events (session_id, actor_participant_id, event_type, payload)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [sessionId, actorParticipantId, eventType, JSON.stringify(payload)]
    );
    return rows[0].id;
};

export const getSessionEvents = async (
    sessionId: string,
    type?: EventType
): Promise<SessionEventRow[]> => {
    const { rows } = await db.query<SessionEventRow>(
        `SELECT e.id, e.event_type, e.payload, e.created_at,
                p.id AS actor_id, p.display_name, p.role
         FROM session_events e
         LEFT JOIN session_participants p ON p.id = e.actor_participant_id
         WHERE e.session_id = $1 AND ($2::text IS NULL OR e.event_type::text = $2)
         ORDER BY e.created_at ASC`,
        [sessionId, type ?? null]
    );
    return rows;
}
