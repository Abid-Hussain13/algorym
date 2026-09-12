import db from "../db/pool.js";
import { Pagination, Session, SessionListItem, SessionListResponse, SessionStatus } from "@algorym/shared-types";
import { nanoid } from "nanoid";
import AppError from "../utils/AppError.js";
import { CreateSessionInput, GetAllSessionsQuery } from "../utils/validation.js";

interface GetAllSessionsResult {
    sessions: (Session & { evaluated: boolean })[];
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

    const expiresAt = duration_minutes ? new Date(startTime.getTime() + duration_minutes * 60000).toISOString() : null;
    const scheduledAtISO = startTime.toISOString();

    try {
        await db.query("BEGIN")
        const queryString = `Insert into sessions(created_by, question_id, mode, access_token, role_context, 
                            duration_minutes, scheduled_at, expires_at, status, started_at)
                            Values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) Returning *;`;
        const { rows } = await db.query(queryString, [userId, question_id || null, mode, access_token,
            role_context || null, duration_minutes, scheduledAtISO, expiresAt, status, startedAt]);

        const session = rows[0];

        const userResult = await db.query<{ name: string; email: string }>(
            "SELECT name, email FROM users WHERE id = $1",
            [userId]
        );
        const user = userResult.rows[0];

        const queryString2 = `Insert into session_participants(session_id, user_id, role, email, display_name)
                              Values($1, $2, 'host', $3, $4)`;
        await db.query(queryString2, [session.id, userId, user?.email ?? null, user?.name ?? null]);

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
    const sortBy = params.sort_by === "date_desc" ? "created_at" : params.sort_by === "date_asc" ? "created_at" : "created_at";
    const order = params.sort_by === "date_asc" ? "ASC" : "DESC";

    const countQuery = `SELECT COUNT(*) FROM sessions WHERE ${whereClause}`;
    const dataQuery = `SELECT s.*, EXISTS(
                        SELECT 1 FROM session_evaluations ev WHERE ev.session_id = s.id
                      ) AS evaluated
                      FROM sessions s
                      WHERE ${whereClause}
                      ORDER BY ${sortBy} ${order}
                      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

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

export const getSessionsList = async (userId: string, params: GetAllSessionsQuery): Promise<SessionListResponse> => {
    const limit = 20;
    const offset = (params.page - 1) * limit;

    const conditions: string[] = ["s.created_by = $1"];
    const values: (string | number)[] = [userId];
    let paramIndex = 2;

    if (params.search) {
        conditions.push(`(
            s.role_context ILIKE '%' || $${paramIndex} || '%'
            OR sp.display_name ILIKE '%' || $${paramIndex} || '%'
            OR sp.email ILIKE '%' || $${paramIndex} || '%'
        )`);
        values.push(params.search);
        paramIndex++;
    }

    if (params.mode) {
        conditions.push(`s.mode = $${paramIndex}`);
        values.push(params.mode);
        paramIndex++;
    }

    if (params.status) {
        conditions.push(`s.status = $${paramIndex}`);
        values.push(params.status);
        paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    let orderClause: string;
    switch (params.sort_by) {
        case "date_asc":
            orderClause = "s.created_at ASC";
            break;
        case "status":
            orderClause = "s.status ASC";
            break;
        case "rating":
            orderClause = `CASE WHEN se.rating = 'strong' THEN 1
                             WHEN se.rating = 'average' THEN 2
                             WHEN se.rating = 'weak' THEN 3
                             ELSE 4 END ASC`;
            break;
        case "date_desc":
        default:
            orderClause = "s.created_at DESC";
            break;
    }

    const countQuery = `SELECT COUNT(*)
        FROM sessions s
        LEFT JOIN session_participants sp ON sp.session_id = s.id AND sp.role = 'guest'
        WHERE ${whereClause}`;

    const dataQuery = `SELECT
            s.id, s.role_context, s.mode, s.status, s.created_at,
            sp.display_name AS candidate_name,
            sp.email AS candidate_email,
            q.languages,
            se.rating
        FROM sessions s
        LEFT JOIN session_participants sp ON sp.session_id = s.id AND sp.role = 'guest'
        LEFT JOIN session_evaluations se ON se.session_id = s.id
            AND se.evaluated_participant_id = sp.id
        LEFT JOIN questions q ON q.id = s.question_id
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

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
    const expiresAt = durationMinutes ? new Date(new Date(scheduledAt).getTime() + durationMinutes * 60000).toISOString() : null;

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
        `UPDATE sessions SET status = 'completed', ended_at = now() WHERE id = $1 AND created_by = $2 RETURNING *`,
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

    // Duplicate-join guard: check if this user already participated
    if (userId) {
        const existingParticipant = await db.query(
            "SELECT id FROM session_participants WHERE session_id = $1 AND user_id = $2",
            [session.id, userId]
        );
        if (existingParticipant.rows[0]) {
            throw new AppError("You have already joined this session", 400);
        }
    }

    // Determine role and fill in fields
    const isHost = userId && session.created_by === userId;

    let email: string;
    let displayName: string;
    let role: "host" | "guest";
    let consent: boolean;

    if (isHost) {
        // Host: pull info from users table, consent is implicit
        role = "host";
        consent = true;

        const user = await db.query("SELECT name, email FROM users WHERE id = $1", [userId]);
        if (!user.rows[0]) throw new AppError("User not found", 404);

        email = user.rows[0].email;
        displayName = user.rows[0].name;
    } else {
        // Guest: require email + display_name from request body
        role = "guest";
        consent = data.consent_to_contact;

        email = data.email ?? "";
        displayName = data.display_name ?? "";

        if (!email) throw new AppError("Email is required to join a session", 400);
        if (!displayName) throw new AppError("Name is required to join a session", 400);
    }

    const { rows } = await db.query(
        `INSERT INTO session_participants (session_id, user_id, email, display_name, role, consent_to_contact, consent_timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING *`,
        [session.id, userId || null, email, displayName, role, consent]
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

