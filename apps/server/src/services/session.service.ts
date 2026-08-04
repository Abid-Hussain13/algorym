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

    if (!session.rows[0]) throw new AppError("Session not found", 404);
    return session.rows[0];
}

export const updateSession = async (userId: string, sessionId: string, data: Partial<CreateSessionInput>): Promise<Session> => {
    const existing = await db.query(
        "SELECT * FROM sessions WHERE id = $1 AND created_by = $2",
        [sessionId, userId]
    );
    if (!existing.rows[0]) throw new AppError("Session not found", 404);

    const session = existing.rows[0];
    if (session.status !== "scheduled") {
        throw new AppError("Can only update sessions that are scheduled", 400);
    }
    const mode = data.mode ?? session.mode;
    const questionId = data.question_id ?? session.question_id;
    const roleContext = data.role_context ?? session.role_context;
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
            questionId,
            mode,
            roleContext,
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

export const startSession = async (userId: string, sessionId: string): Promise<Session> => {
    const existing = await db.query(
        "SELECT * FROM sessions WHERE id = $1 AND created_by = $2",
        [sessionId, userId]
    );

    const session = existing.rows[0];
    if (!session) throw new AppError("Session not found", 404);
    if (session.status !== "scheduled") throw new AppError("Session is not scheduled", 400);

    const { rows } = await db.query(
        `UPDATE sessions SET status = 'live', started_at = now() WHERE id = $1 AND created_by = $2 RETURNING *`,
        [sessionId, userId]
    );

    return rows[0];
}

export const completeSession = async (userId: string, sessionId: string): Promise<Session> => {
    const existing = await db.query(
        "SELECT * FROM sessions WHERE id = $1 AND created_by = $2",
        [sessionId, userId]
    );

    const session = existing.rows[0];
    if (!session) throw new AppError("Session not found", 404);
    if (session.status !== "live") throw new AppError("Only live sessions can be completed", 400);

    const { rows } = await db.query(
        `UPDATE sessions SET status = 'completed' WHERE id = $1 AND created_by = $2 RETURNING *`,
        [sessionId, userId]
    );

    return rows[0];
};

export const cancelSession = async (userId: string, sessionId: string): Promise<Session> => {
    const existing = await db.query(
        "SELECT * FROM sessions WHERE id = $1 AND created_by = $2",
        [sessionId, userId]
    );

    const session = existing.rows[0];
    if (!session) throw new AppError("Session not found", 404);
    if (session.status !== "scheduled") throw new AppError("Only scheduled sessions can be cancelled", 400);

    const { rows } = await db.query(
        `UPDATE sessions SET status = 'cancelled' WHERE id = $1 AND created_by = $2 RETURNING *`,
        [sessionId, userId]
    );

    return rows[0];
};

interface JoinSessionData {
    access_token: string;
    email?: string;
    display_name?: string;
    consent_to_contact: boolean;
}

export const joinSession = async (data: JoinSessionData, userId?: string): Promise<{ session: Session; participant: any }> => {
    const existing = await db.query(
        "SELECT * FROM sessions WHERE access_token = $1",
        [data.access_token]
    );

    const session = existing.rows[0];
    if (!session) throw new AppError("Session not found", 404);
    if (session.status !== "scheduled" && session.status !== "live") {
        throw new AppError("Session is not open for joining", 400);
    }

    let email = data.email;
    let displayName = data.display_name;

    if (userId) {
        const user = await db.query("SELECT name, email FROM users WHERE id = $1", [userId]);
        if (user.rows[0]) {
            if (!email) email = user.rows[0].email;
            displayName = user.rows[0].name;
        }
    }

    if (!email) throw new AppError("Email is required to join a session", 400);
    if (!displayName) throw new AppError("Name is required to join a session", 400);

    const { rows } = await db.query(
        `INSERT INTO session_participants (session_id, user_id, email, display_name, role, consent_to_contact, consent_timestamp)
         VALUES ($1, $2, $3, $4, 'guest', $5, now()) RETURNING *`,
        [session.id, userId || null, email, displayName || null, data.consent_to_contact]
    );

    return { session, participant: rows[0] };
};

export const changeQuestion = async (userId: string, sessionId: string, questionId: string): Promise<Session> => {
    const existing = await db.query(
        "SELECT * FROM sessions WHERE id = $1 AND created_by = $2",
        [sessionId, userId]
    );

    const session = existing.rows[0];
    if (!session) throw new AppError("Session not found", 404);
    if (session.status !== "live") throw new AppError("Can only change question in a live session", 400);

    const { rows } = await db.query(
        `UPDATE sessions SET question_id = $1 WHERE id = $2 AND created_by = $3 RETURNING *`,
        [questionId, sessionId, userId]
    );

    return rows[0];
};

export const getSessionStatus = async (sessionId: string): Promise<string> => {
    const queryString = `SELECT status from sessions WHERE id = $1`;
    const sessionStatus = await db.query<{ status: string }>(queryString, [sessionId]);
    if (!sessionStatus.rows[0]) throw new AppError("Session not found", 404);
    return sessionStatus.rows[0].status;
}

