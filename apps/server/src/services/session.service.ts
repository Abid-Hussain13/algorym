import db from "../db/pool.js";
import { Session, SessionStatus } from "@algorym/shared-types";
import { nanoid } from "nanoid";
import AppError from "../utils/AppError.js";
import { CreateSessionInput, GetAllSessionsQuery } from "../utils/validation.js";

interface GetAllSessionsResult {
    sessions: Session[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const createSession = async (userId: string, data: CreateSessionInput): Promise<Session> => {
    const { question_id, mode, role_context, scheduled_at, duration_minutes } = data;
    const access_token = nanoid(12);

    let startTime: Date;
    let status: SessionStatus;
    let startedAt: string | null;

    if (scheduled_at) {
        startTime = new Date(scheduled_at);
        status = "scheduled";
        startedAt = null;
    } else {
        startTime = new Date();
        status = "live";
        startedAt = startTime.toISOString();
    }

    const expiresAt = new Date(startTime.getTime() + duration_minutes * 60000).toISOString();
    const scheduledAtISO = startTime.toISOString();

    try {
        await db.query("BEGIN")
        const queryString = `Insert into sessions(created_by, question_id, mode, access_token, role_context, 
                            duration_minutes, scheduled_at, expires_at, status, started_at)
                            Values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) Returning *;`;
        const { rows } = await db.query(queryString, [userId, question_id || null, mode, access_token,
            role_context || null, duration_minutes, scheduledAtISO, expiresAt, status, startedAt]);

        const session = rows[0];

        const queryString2 = `Insert into session_participants(session_id, user_id, role) Values($1, $2, 'host')`;
        await db.query(queryString2, [session.id, userId]);

        await db.query("COMMIT");
        return session;
    }
    catch (err) {
        await db.query("ROLLBACK");
        console.log("Create Sessoin Error.", err);
        throw new AppError("something went wrong while creating session", 500);
    }
}

export const getAllSessions = async (userId: string, params: GetAllSessionsQuery): Promise<GetAllSessionsResult> => {
    const limit = 20;
    const offset = (params.page - 1) * limit;

    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    conditions.push(`created_by = $${paramIndex}`);
    values.push(userId);
    paramIndex++;

    if (params.status) {
        conditions.push(`status = $${paramIndex}`);
        values.push(params.status);
        paramIndex++;
    }

    const whereClause = conditions.join(" AND ");
    const sortBy = params.sort_by;
    const order = params.order;

    const countQuery = `SELECT COUNT(*) FROM sessions WHERE ${whereClause}`;
    const dataQuery = `SELECT * FROM sessions WHERE ${whereClause} ORDER BY ${sortBy} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const [countResult, dataResult] = await Promise.all([
        db.query(countQuery, values),
        db.query(dataQuery, [...values, limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    return {
        sessions: dataResult.rows,
        pagination: {
            page: params.page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getSessionById = async (userId: string, sessionId: string): Promise<Session> => {
    const queryString = `Select * from sessions where created_by = $1 AND id = $2`;
    const session = await db.query(queryString, [userId, sessionId]);

    if (!session.rows[0]) throw new AppError("Session nout found", 404);
    return session.rows[0];
}

export const updateSession = async (userId: string, sessionId: string, data: CreateSessionInput): Promise<Session> => {
    const existing = await db.query(
        "SELECT * FROM sessions WHERE id = $1 AND created_by = $2",
        [sessionId, userId]
    );
    if (!existing.rows[0]) throw new AppError("Session not found", 404);

    const session = existing.rows[0];
    const scheduledAt = data.scheduled_at ?? session.scheduled_at;
    const durationMinutes = data.duration_minutes ?? session.duration_minutes;
    const expiresAt = new Date(new Date(scheduledAt).getTime() + durationMinutes * 60000).toISOString();

    const { rows } = await db.query(
        `UPDATE sessions
         SET question_id = $1, mode = $2, role_context = $3,
             scheduled_at = $4, duration_minutes = $5, expires_at = $6
         WHERE id = $7 AND created_by = $8
         RETURNING *`,
        [
            data.question_id ?? null,
            data.mode,
            data.role_context ?? null,
            scheduledAt,
            durationMinutes,
            expiresAt,
            sessionId,
            userId,
        ]
    );

    return rows[0];
}

export const deleteSession = async (userId: string, sessionId: string): Promise<void> => {
    const { rowCount } = await db.query(
        "DELETE FROM sessions WHERE id = $1 AND created_by = $2",
        [sessionId, userId]
    );

    if (!rowCount) throw new AppError("Session not found", 404);
}
