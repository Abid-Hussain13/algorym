import db from "../db/pool.js";
import { Question } from "@algorym/shared-types";

type createQuestionParams = Omit<Question, 'id' | 'created_at'>;
export const createQuestion = async ({ owner_id, title, description, languages, difficulty, starter_code }: createQuestionParams): Promise<Question> => {
    const queryString = `Insert into questions(owner_id, title, description, languages, difficulty, starter_code) 
                        Values ($1, $2, $3, $4, $5, $6) 
                        Returning id, owner_id, title, description, languages, difficulty, starter_code, created_at`;
    const question = await db.query(queryString, [owner_id, title, description, languages, difficulty, starter_code])

    return question.rows[0];
}
