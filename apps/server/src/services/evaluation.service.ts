import db from "../db/pool.js";
import { SessionEvaluation } from "@algorym/shared-types";
import { assertValidUuid } from "../utils/uuid.js";

export type sessionEvaluationParams = Omit<SessionEvaluation, 'id' | 'created_at'>;

export const evaluateUser = async (data: sessionEvaluationParams): Promise<SessionEvaluation> => {
    const { session_id, evaluated_participant_id, evaluator_participant_id, rating, notes } = data;
    assertValidUuid(session_id, "Session");
    assertValidUuid(evaluated_participant_id, "Participant");
    assertValidUuid(evaluator_participant_id, "Participant");

    const queryString = `Insert into session_evaluations(session_id, evaluator_participant_id, evaluated_participant_id, rating, notes)
                        Values ($1, $2, $3, $4, $5)
                        On Conflict (session_id, evaluated_participant_id)
                        Do Update Set rating = Excluded.rating, notes = Excluded.notes
                        Returning *`;
    const evaluation = await db.query(queryString, [session_id, evaluator_participant_id, evaluated_participant_id, rating ?? null, notes ?? ""]);

    return evaluation.rows[0];
}

export const saveSessionNotes = async (
    sessionId: string,
    evaluatorParticipantId: string,
    evaluatedParticipantId: string,
    notes: string | null
): Promise<SessionEvaluation> => {
    assertValidUuid(sessionId, "Session");
    assertValidUuid(evaluatorParticipantId, "Participant");
    assertValidUuid(evaluatedParticipantId, "Participant");
    const queryString = `Insert into session_evaluations(session_id, evaluator_participant_id, evaluated_participant_id, notes)
                        Values ($1, $2, $3, $4)
                        On Conflict (session_id, evaluated_participant_id)
                        Do Update Set notes = Excluded.notes
                        Returning *`;
    const { rows } = await db.query(queryString, [sessionId, evaluatorParticipantId, evaluatedParticipantId, notes ?? ""]);
    return rows[0];
};

export const getSessionEvaluation = async (sessionId: string): Promise<SessionEvaluation | null> => {
    assertValidUuid(sessionId, "Session");
    const { rows } = await db.query(
        `SELECT * FROM session_evaluations WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [sessionId]
    );
    return rows[0] ?? null;
};
