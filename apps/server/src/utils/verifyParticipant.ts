import db from "../db/pool.js";

export interface ParticipantVerification {
    sessionId: string;
    participantId: string;
    userId?: string;
}

export const verifyParticipant = async ({ sessionId, participantId, userId }: ParticipantVerification): Promise<boolean> => {
    const result = await db.query<{ user_id: string | null; email: string | null }>(
        `SELECT user_id, email
         FROM session_participants
         WHERE id = $1 AND session_id = $2`,
        [participantId, sessionId]
    );

    if (result.rowCount === 0) return false;

    const { user_id, email } = result.rows[0];

    if (user_id === null) {
        if (userId === undefined) return true;

        // Anonymous row + signed-in caller: link them only when the emails.
        const user = await db.query<{ email: string }>(
            "SELECT email FROM users WHERE id = $1",
            [userId]
        );
        if (!user.rows[0] || !email || user.rows[0].email !== email) return false;

        await db.query(
            "UPDATE session_participants SET user_id = $1 WHERE id = $2 AND user_id IS NULL",
            [userId, participantId]
        );
        return true;
    }

    return user_id === userId;
};
