import type { SessionParticipant } from "@algorym/shared-types";
import db from "../db/pool.js";
import AppError from "../utils/AppError.js";

export const getHostParticipant = async (sessionId: string, userId: string): Promise<SessionParticipant> => {
    const queryString = `Select * from session_participants where session_id = $1 AND user_id = $2 AND role = 'host'`;

    const host = await db.query(queryString, [sessionId, userId]);
    if (!host.rows[0]) throw new AppError("Only host can evaluate candidate", 403);
    return host.rows[0];
}

export const getParticipantBySession = async (sessionId: string, participantId: string): Promise<SessionParticipant> => {
    const { rows } = await db.query(`SELECT * FROM session_participants WHERE session_id = $1 AND id = $2`,
        [sessionId, participantId]
    );
    if (!rows[0]) throw new AppError("Candidate is not a participant of this session", 404);
    return rows[0];
};
