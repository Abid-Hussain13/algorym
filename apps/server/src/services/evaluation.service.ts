import db from "../db/pool.js";
import { SessionEvaluation } from "@algorym/shared-types";

export type sessionEvaluationParams = Omit<SessionEvaluation, 'id' | 'created_at'>;

export const evaluateUser = async (data: sessionEvaluationParams): Promise<SessionEvaluation> => {
    const { session_id, evaluated_participant_id, evaluator_participant_id, rating, notes } = data;

    // Only touch the columns the caller actually sent, so a rating-only submit
    // cannot clobber a draft saved through PATCH /notes (and vice versa).
    const sets: string[] = [];
    if (rating !== undefined) sets.push("rating = $4");
    if (notes !== undefined) sets.push("notes = $5");

    const conflictClause = sets.length
        ? `Do Update Set ${sets.join(", ")}`
        : "Do Nothing";

    const queryString = `Insert into session_evaluations(session_id, evaluator_participant_id, evaluated_participant_id, rating, notes)
                        Values ($1, $2, $3, $4, $5)
                        On Conflict (session_id, evaluated_participant_id)
                        ${conflictClause}
                        Returning *`;
    const evaluation = await db.query(queryString, [
        session_id,
        evaluator_participant_id,
        evaluated_participant_id,
        rating ?? null,
        notes ?? "",
    ]);

    if (evaluation.rows[0]) return evaluation.rows[0];

    const existing = await db.query<SessionEvaluation>(
        `SELECT * FROM session_evaluations WHERE session_id = $1 AND evaluated_participant_id = $2`,
        [session_id, evaluated_participant_id]
    );
    return existing.rows[0];
}

export const saveSessionNotes = async (
    sessionId: string,
    evaluatorParticipantId: string,
    evaluatedParticipantId: string,
    notes: string | null
): Promise<SessionEvaluation> => {
    const queryString = `Insert into session_evaluations(session_id, evaluator_participant_id, evaluated_participant_id, notes)
                        Values ($1, $2, $3, $4)
                        On Conflict (session_id, evaluated_participant_id)
                        Do Update Set notes = Excluded.notes
                        Returning *`;
    const { rows } = await db.query(queryString, [sessionId, evaluatorParticipantId, evaluatedParticipantId, notes ?? ""]);
    return rows[0];
};

export const getSessionEvaluation = async (sessionId: string): Promise<SessionEvaluation | null> => {
    const { rows } = await db.query(
        `SELECT * FROM session_evaluations WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [sessionId]
    );
    return rows[0] ?? null;
};
