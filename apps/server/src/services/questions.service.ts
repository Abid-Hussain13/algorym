import db from "../db/pool.js";
import AppError from "../utils/AppError.js";
import type { Question, QuestionListResponse } from "@algorym/shared-types";
import { getAllQuestionsQuery } from "../utils/validation.js";

type CreateQuestionParams = Omit<Question, "id" | "created_at">;
type UpdateQuestionParams = Partial<Omit<Question, "id" | "created_at" | "owner_id">>;

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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getQuestionsByIds = async (owner_id: string, idsParam: string): Promise<QuestionListResponse> => {
    const ids = [...new Set(idsParam.split(",").map((id) => id.trim()))]
        .filter((id) => UUID_PATTERN.test(id))
        .slice(0, 50);

    if (ids.length === 0) {
        return { questions: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 0 } };
    }

    const { rows } = await db.query<Question>(
        `SELECT * FROM questions
         WHERE owner_id = $1 AND id = ANY($2::uuid[])
         ORDER BY created_at DESC`,
        [owner_id, ids]
    );

    return {
        questions: rows,
        pagination: { page: 1, limit: rows.length, total: rows.length, totalPages: 1 }
    };
};

export const getAllQuestions = async (owner_id: string, params: getAllQuestionsQuery): Promise<QuestionListResponse> => {
    if (params.ids) {
        return getQuestionsByIds(owner_id, params.ids);
    }

    const limit = 21;
    const offset = (params.page - 1) * limit;

    const conditions: string[] = ["owner_id= $1"];
    const values: (string | number)[] = [owner_id];
    let paramIndex = 2;

    if (params.search) {
        conditions.push(`(
            title ILIKE '%' || $${paramIndex} || '%'
            OR description ILIKE '%' || $${paramIndex} || '%'
            OR EXISTS (SELECT 1 FROM unnest(languages) lang WHERE lang ILIKE '%' || $${paramIndex} || '%')
        )`);
        values.push(params.search);
        paramIndex++;
    }

    if (params.difficulty) {
        conditions.push(`difficulty = $${paramIndex}`);
        values.push(params.difficulty);
        paramIndex++;
    }

    const WhereClause = conditions.join(" AND ");

    let orderClause: string;
    switch (params.sort_by) {
        case 'date_desc':
            orderClause = "created_at DESC";
            break;
        case 'date_asc':
            orderClause = "created_at ASC";
            break;
        case 'title_desc':
            orderClause = "title DESC"
            break;
        case 'title_asc':
            orderClause = "title ASC";
            break;
        default:
            orderClause = "created_at DESC";
            break;
    }

    const countQuery = `Select COUNT(*) from questions WHERE ${WhereClause}`;
    const dataQuery = `Select * from questions WHERE ${WhereClause} ORDER BY ${orderClause} LIMIT $${paramIndex} offset $${paramIndex + 1}`;

    const [countResult, dataResult] = await Promise.all([
        db.query(countQuery, values),
        db.query(dataQuery, [...values, limit, offset])
    ])

    const total = parseInt(countResult.rows[0].count, 10);

    return {
        questions: dataResult.rows,
        pagination: {
            page: params.page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }
};


export const getQuestionById = async (id: string, owner_id: string): Promise<Question> => {
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
    params: UpdateQuestionParams
): Promise<Question> => {
    const fields: string[] = [];
    const values: (string | number | string[] | Record<string, string> | null)[] = [];
    let paramIndex = 1;

    if (params.title !== undefined) {
        fields.push(`title = $${paramIndex++}`);
        values.push(params.title);
    }
    if (params.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(params.description);
    }
    if (params.languages !== undefined) {
        fields.push(`languages = $${paramIndex++}`);
        values.push(params.languages);
    }
    if (params.difficulty !== undefined) {
        fields.push(`difficulty = $${paramIndex++}`);
        values.push(params.difficulty);
    }
    if (params.starter_code !== undefined) {
        fields.push(`starter_code = $${paramIndex++}`);
        values.push(params.starter_code);
    }

    if (fields.length === 0) throw new AppError("No fields to update", 400);

    values.push(id, owner_id);

    const result = await db.query(
        `UPDATE questions
     SET ${fields.join(", ")}
     WHERE id = $${paramIndex++} AND owner_id = $${paramIndex}
     RETURNING id, owner_id, title, description, languages, difficulty, starter_code, created_at`,
        values
    );
    if (!result.rows[0]) throw new AppError("Question not found", 404);
    return result.rows[0];
};

export const deleteQuestion = async (id: string, owner_id: string): Promise<void> => {
    const result = await db.query(
        "DELETE FROM questions WHERE id = $1 AND owner_id = $2",
        [id, owner_id]
    );
    if (!result.rowCount) throw new AppError("Question not found", 404);
};
