import db from "../db/pool.js";
import { assertValidUuid } from "../utils/uuid.js";

export interface ParticipantVerification {
    sessionId: string;
    participantId: string;
    userId?: string;
}

export const verifyParticipant = async ({ sessionId, participantId, userId }: ParticipantVerification): Promise<boolean> => {
    assertValidUuid(sessionId, "Session");
    assertValidUuid(participantId, "Participant");
    const result = await db.query<{ user_id: string | null }>(
        `SELECT user_id
         FROM session_participants
         WHERE id = $1 AND session_id = $2`,
        [participantId, sessionId]
    );

    if (result.rowCount === 0) return false;

    const { user_id } = result.rows[0];

    if (user_id === null) return userId === undefined;

    return user_id === userId;
};
