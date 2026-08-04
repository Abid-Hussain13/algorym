import db from "../db/pool.js";
import { SessionEvaluation } from "@algorym/shared-types";

export type sessionEvaluationParams = Omit<SessionEvaluation, 'id' | 'created_at'>;

export const evaluateUser = async (data: sessionEvaluationParams): Promise<SessionEvaluation> => {
    const { session_id, evaluated_participant_id, evaluator_participant_id, rating, notes } = data;

    const queryString = `Insert into session_evaluations(session_id, evaluator_participant_id, evaluated_participant_id, rating, notes)
                        Values ($1, $2, $3, $4, $5)
                        On Conflict (session_id, evaluated_participant_id)
                        Do Update Set rating = Excluded.rating, notes = Excluded.notes
                        Returning *`;
    const evaluation = await db.query(queryString, [session_id, evaluator_participant_id, evaluated_participant_id, rating, notes ?? ""]);

    return evaluation.rows[0];
}
