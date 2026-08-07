import db from "../db/pool.js";
import AppError from "../utils/AppError.js";
import { assertValidUuid } from "../utils/uuid.js";
import type { Question } from "@algorym/shared-types";

type CreateQuestionParams = Omit<Question, "id" | "created_at">;

export const createQuestion = async (params: CreateQuestionParams): Promise<Question> => {
    const { owner_id, title, description, languages, difficulty, starter_code } = params;
    const result = await db.query(
        `INSERT INTO questions (owner_id, title, description, languages, difficulty, starter_code)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, owner_id, title, description, languages, difficulty, starter_code, created_at`,
        [owner_id, title, description, languages, difficulty, starter_code]
    );
    return result.rows[0];
};

export const getAllQuestions = async (owner_id: string): Promise<Question[]> => {
    const result = await db.query(
        "SELECT * FROM questions WHERE owner_id = $1 ORDER BY created_at DESC",
        [owner_id]
    );
    return result.rows;
};

export const getQuestionById = async (id: string, owner_id: string): Promise<Question> => {
    assertValidUuid(id, "Question");
    const result = await db.query(
        "SELECT * FROM questions WHERE id = $1 AND owner_id = $2",
        [id, owner_id]
    );
    if (!result.rows[0]) throw new AppError("Question not found", 404);
    return result.rows[0];
};

export const updateQuestion = async (
    id: string,
    owner_id: string,
    params: CreateQuestionParams
): Promise<Question> => {
    assertValidUuid(id, "Question");
    const { title, description, languages, difficulty, starter_code } = params;
    const result = await db.query(
        `UPDATE questions
     SET title = $1, description = $2, languages = $3, difficulty = $4, starter_code = $5
     WHERE id = $6 AND owner_id = $7
     RETURNING id, owner_id, title, description, languages, difficulty, starter_code, created_at`,
        [title, description, languages, difficulty, starter_code, id, owner_id]
    );
    if (!result.rows[0]) throw new AppError("Question not found", 404);
    return result.rows[0];
};

export const deleteQuestion = async (id: string, owner_id: string): Promise<void> => {
    assertValidUuid(id, "Question");
    const result = await db.query(
        "DELETE FROM questions WHERE id = $1 AND owner_id = $2",
        [id, owner_id]
    );
    if (!result.rowCount) throw new AppError("Question not found", 404);
};
