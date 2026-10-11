import db from "../db/pool.js";
import { Pagination, Question, RoomSession, Session, SessionDetail, SessionListItem, SessionListResponse, SessionQuestionRef, SessionRoom, SessionStatus } from "@algorym/shared-types";
import { nanoid } from "nanoid";
import AppError from "../utils/AppError.js";
import { CreateSessionInput, GetAllSessionsQuery } from "../utils/validation.js";
import { logSessionEvent } from "./session-events.service.js";

export const createSession = async (userId: string, data: CreateSessionInput): Promise<Session> => {
    const { mode, role_context, scheduled_at, duration_minutes, language } = data;
    const questionIds = resolveQuestionIds(data, []);
    const question_id = questionIds[0] ?? null;
    const access_token = nanoid(12);

    let startTime: Date;
    let status: SessionStatus;
    let startedAt: string | null;
        let scheduledAtISO: string | null;

    if (scheduled_at) {
        startTime = new Date(scheduled_at);
        status = "scheduled";
        startedAt = null;
        scheduledAtISO = startTime.toISOString();

        if (startTime.getTime() <= Date.now()) {
            throw new AppError("Pick a time in the future to schedule a session", 400);
        }

        const endCheck = duration_minutes
            ? new Date(startTime.getTime() + duration_minutes * 60000)
            : new Date(startTime.getTime() + 30 * 60000);

        // Overlap against anything still occupying that window: other scheduled
        // sessions *and* the live session, which occupies [started_at, expires_at].
        const overlapCheck = await db.query(
            `SELECT id FROM sessions
             WHERE created_by = $1
               AND (
                    (status = 'scheduled'
                     AND scheduled_at IS NOT NULL
                     AND scheduled_at < $2
                     AND (scheduled_at + COALESCE(duration_minutes, 30) * interval '1 minute') > $3)
                 OR (status = 'live'
                     AND COALESCE(started_at, now()) < $2
                     AND COALESCE(expires_at, now() + interval '30 minutes') > $3)
               )
             LIMIT 1`,
            [userId, endCheck.toISOString(), startTime.toISOString()]
        );

        if (overlapCheck.rows.length > 0) {
            throw new AppError("You already have a session scheduled during this time", 409);
        }
    } else {
                const liveCheck = await db.query(
            "SELECT id FROM sessions WHERE created_by = $1 AND status = 'live' LIMIT 1",
            [userId]
        );

        if (liveCheck.rows.length > 0) {
            throw new AppError(
                "Finish or cancel your current live session before starting another",
                409
            );
        }

        startTime = new Date();
        status = "live";
        startedAt = startTime.toISOString();
        scheduledAtISO = null;
    }

    const expiresAt = duration_minutes ? new Date(startTime.getTime() + duration_minutes * 60000).toISOString() : null;

    try {
        await db.query("BEGIN")
        const queryString = `Insert into sessions(created_by, question_id, mode, access_token, role_context, language,
                            duration_minutes, scheduled_at, expires_at, status, started_at)
                            Values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) Returning *;`;
        const { rows } = await db.query(queryString, [userId, question_id || null, mode, access_token,
            role_context || null, language || null, duration_minutes, scheduledAtISO, expiresAt, status, startedAt]);

        const session = rows[0];

        const userResult = await db.query<{ name: string; email: string }>(
            "SELECT name, email FROM users WHERE id = $1",
            [userId]
        );
        const user = userResult.rows[0];

        const queryString2 = `Insert into session_participants(session_id, user_id, role, email, display_name)
                              Values($1, $2, 'host', $3, $4)`;
        await db.query(queryString2, [session.id, userId, user?.email ?? null, user?.name ?? null]);

        await syncSessionQuestions(session.id, questionIds);

        await db.query("COMMIT");
        return session;
    }
    catch (err) {
        await db.query("ROLLBACK");
        console.error("Create Session Error.", err instanceof Error ? err.message : err);
        throw new AppError("something went wrong while creating session", 500);
    }
}

export const getSessionsList = async (userId: string, params: GetAllSessionsQuery): Promise<SessionListResponse> => {
    const limit = 20;
    const offset = (params.page - 1) * limit;

    const conditions: string[] = ["s.created_by = $1"];
    const values: (string | number)[] = [userId];
    let paramIndex = 2;

    if (params.search) {
        // Search matches the session's own context or ANY guest (count and
        // data queries share this clause so pagination totals stay honest).
        conditions.push(`(
            s.role_context ILIKE '%' || $${paramIndex} || '%'
            OR EXISTS (
                SELECT 1 FROM session_participants spx
                WHERE spx.session_id = s.id AND spx.role = 'guest'
                  AND (spx.display_name ILIKE '%' || $${paramIndex} || '%'
                       OR spx.email ILIKE '%' || $${paramIndex} || '%')
            )
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
        WHERE ${whereClause}`;

    const dataQuery = `SELECT
            s.id, s.role_context, s.mode, s.status, s.language, s.created_at,
            g.display_name AS candidate_name,
            g.email AS candidate_email,
            se.rating
        FROM sessions s
        LEFT JOIN LATERAL (
            SELECT id, display_name, email
            FROM session_participants sp
            WHERE sp.session_id = s.id AND sp.role = 'guest'
            ORDER BY sp.joined_at ASC
            LIMIT 1
        ) g ON true
        LEFT JOIN session_evaluations se ON se.session_id = s.id
            AND se.evaluated_participant_id = g.id
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

export const getSessionDetail = async (userId: string, sessionId: string): Promise<SessionDetail> => {
    const { rows } = await db.query(
        `SELECT s.id, s.created_by, s.question_id, s.mode, s.status, s.access_token,
                s.role_context, s.language, s.scheduled_at, s.duration_minutes,
                s.started_at, s.ended_at, s.expires_at, s.created_at,
                g.display_name AS candidate_name,
                g.email AS candidate_email,
                se.rating, se.notes,
                COALESCE((
                    SELECT json_agg(json_build_object(
                               'id', q.id, 'title', q.title, 'position', sq.position
                           ) ORDER BY sq.position, q.title)
                    FROM session_questions sq
                    JOIN questions q ON q.id = sq.question_id
                    WHERE sq.session_id = s.id
                ), '[]'::json) AS questions,
                (SELECT hp.id FROM session_participants hp
                 WHERE hp.session_id = s.id AND hp.role = 'host'
                 ORDER BY hp.joined_at ASC LIMIT 1) AS host_participant_id,
                g.id AS candidate_participant_id,
                (SELECT count(*)::int FROM session_events se
                 WHERE se.session_id = s.id AND se.event_type = 'focus_event'
                   AND se.payload->>'kind' = 'fullscreen_exit') AS candidate_fullscreen_exits,
                (SELECT count(*)::int FROM session_events se
                 WHERE se.session_id = s.id AND se.event_type = 'focus_event'
                   AND se.payload->>'kind' = 'tab_away') AS candidate_tab_aways
         FROM sessions s
         LEFT JOIN LATERAL (
             SELECT id, display_name, email
             FROM session_participants sp
             WHERE sp.session_id = s.id AND sp.role = 'guest'
             ORDER BY sp.joined_at ASC
             LIMIT 1
         ) g ON true
         LEFT JOIN session_evaluations se ON se.session_id = s.id
             AND se.evaluated_participant_id = g.id
         WHERE s.created_by = $1 AND s.id = $2`,
        [userId, sessionId]
    );

    if (!rows[0]) throw new AppError("Session not found", 404);
    return rows[0] as SessionDetail;
}

export const getSessionRoom = async (sessionId: string): Promise<SessionRoom> => {
    const { rows } = await db.query(
        `SELECT id, question_id, mode, status, role_context, language, scheduled_at,
                duration_minutes, started_at, ended_at, expires_at, created_at
         FROM sessions WHERE id = $1`,
        [sessionId]
    );

    if (!rows[0]) throw new AppError("Session not found", 404);

    const session = rows[0] as RoomSession;

    let question: Question | null = null;
    if (session.question_id) {
        const result = await db.query(
            `SELECT id, title, description, languages, difficulty, starter_code
             FROM questions WHERE id = $1`,
            [session.question_id]
        );
        question = (result.rows[0] as Question) ?? null;
    }

    // The full assigned list, not just the current one. A candidate is allowed
    // to see what else is coming so they know the shape of the interview, but
    // only the host may switch — see `AssignedQuestions` readOnly.
    const assigned = await db.query(
        `SELECT q.id, q.title, sq.position
         FROM session_questions sq
         JOIN questions q ON q.id = sq.question_id
         WHERE sq.session_id = $1
         ORDER BY sq.position ASC, q.title ASC`,
        [sessionId]
    );

    return { session, question, questions: assigned.rows as SessionQuestionRef[] };
};

const resolveQuestionIds = (data: Partial<CreateSessionInput>, fallback: string[]): string[] => {
    if (data.question_ids !== undefined) {
        return [...new Set(data.question_ids)].slice(0, 50);
    }
    if (data.question_id !== undefined) {
        return data.question_id ? [data.question_id] : [];
    }
    return fallback;
};

const getSessionQuestionIds = async (sessionId: string): Promise<string[]> => {
    const { rows } = await db.query<{ question_id: string }>(
        `SELECT question_id FROM session_questions
         WHERE session_id = $1
         ORDER BY position ASC, question_id ASC`,
        [sessionId]
    );
    return rows.map((row) => row.question_id);
};

const syncSessionQuestions = async (sessionId: string, questionIds: string[]): Promise<void> => {
    await db.query("DELETE FROM session_questions WHERE session_id = $1", [sessionId]);
    if (questionIds.length === 0) return;

    const values: (string | number)[] = [];
    const tuples = questionIds.map((questionId, index) => {
        values.push(sessionId, questionId, index);
        return `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`;
    });

    await db.query(
        `INSERT INTO session_questions (session_id, question_id, position)
         VALUES ${tuples.join(", ")}
         ON CONFLICT DO NOTHING`,
        values
    );
};

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

    const questionsTouched = data.question_ids !== undefined || data.question_id !== undefined;
    const questionIds = questionsTouched
        ? resolveQuestionIds(data, [])
        : await getSessionQuestionIds(sessionId);
    const questionId = questionIds[0] ?? null;

    const mode = data.mode ?? session.mode;
    const language = data.language ?? session.language;
    const roleContext = data.role_context ?? session.role_context;
    const scheduledAt = data.scheduled_at ?? session.scheduled_at;
    const durationMinutes = data.duration_minutes ?? session.duration_minutes;
    const expiresAt = durationMinutes ? new Date(new Date(scheduledAt).getTime() + durationMinutes * 60000).toISOString() : null;

    const { rows } = await db.query(
        `UPDATE sessions
         SET question_id = $1, mode = $2, role_context = $3, language = $4,
             scheduled_at = $5, duration_minutes = $6, expires_at = $7
         WHERE id = $8 AND created_by = $9
         RETURNING *`,
        [
            questionId,
            mode,
            roleContext,
            language,
            scheduledAt,
            durationMinutes,
            expiresAt,
            sessionId,
            userId,
        ]
    );

    if (questionsTouched) {
        await syncSessionQuestions(sessionId, questionIds);
    }

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

    // Same one-live-session rule as immediate creation. Starting a scheduled
    // session is just as much a second live room as creating one, so it cannot
    // be the loophole that lets a host end up with two.
    const liveCheck = await db.query(
        "SELECT id FROM sessions WHERE created_by = $1 AND status = 'live' AND id <> $2 LIMIT 1",
        [userId, sessionId]
    );
    if (liveCheck.rows.length > 0) {
        throw new AppError(
            "Finish or cancel your current live session before starting another",
            409
        );
    }

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
    if (session.status !== "scheduled" && session.status !== "live") {
        throw new AppError("Only scheduled or live sessions can be cancelled", 400);
    }

    // A session that actually started needs ended_at stamped, so the timeline
    // reflects when it was really abandoned rather than never running.
    const { rows } = await db.query(
        `UPDATE sessions
         SET status = 'cancelled',
             ended_at = CASE WHEN started_at IS NOT NULL THEN now() ELSE ended_at END
         WHERE id = $1 AND created_by = $2
         RETURNING *`,
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

    // Already joined as this user? A guest rejoin is a reload / double-click —
    // hand back the same row. The host has no business in this endpoint at all.
    if (userId) {
        const existingParticipant = await db.query(
            "SELECT * FROM session_participants WHERE session_id = $1 AND user_id = $2",
            [session.id, userId]
        );
        if (existingParticipant.rows[0]) {
            if (existingParticipant.rows[0].role === "host") {
                throw new AppError("You have already joined this session", 400);
            }
            return { session, participant: existingParticipant.rows[0] };
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
    } else if (userId) {
        // Authenticated guest: identity comes from the account, so only
        // consent is asked for — never re-prompted for name or email.
        role = "guest";
        consent = data.consent_to_contact;

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

    // `WHERE` keeps the upsert from ever taking over a row owned by a
    // different signed-in account: if the conflict target row belongs to
    // somebody else, nothing updates and we return that row untouched below
    // (an anonymous rejoin of a linked account), rather than hijacking it.
    const { rows } = await db.query(
        `INSERT INTO session_participants (session_id, user_id, email, display_name, role, consent_to_contact, consent_timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, now())
         ON CONFLICT (session_id, email) DO UPDATE
           SET display_name = EXCLUDED.display_name,
               user_id = COALESCE(session_participants.user_id, EXCLUDED.user_id),
               consent_to_contact = EXCLUDED.consent_to_contact,
               consent_timestamp = now()
           WHERE session_participants.user_id IS NULL
              OR session_participants.user_id = EXCLUDED.user_id
         RETURNING *, (xmax = 0) AS inserted`,
        [session.id, userId || null, email, displayName, role, consent]
    );

    let participant = rows[0];
    if (!participant) {
        const existingRow = await db.query(
            "SELECT *, false AS inserted FROM session_participants WHERE session_id = $1 AND email = $2",
            [session.id, email]
        );
        participant = existingRow.rows[0];
    }

    if (participant?.inserted) {
        await logSessionEvent(session.id, participant.id, "participant_joined", {
            participant: { id: participant.id, display_name: participant.display_name, role: participant.role },
        });
    }

    if (participant) {
        const { inserted: _inserted, ...safeParticipant } = participant;
        participant = safeParticipant;
    }

    return { session, participant };
};

export const changeQuestion = async (userId: string, sessionId: string, questionId: string, language: string): Promise<Session> => {
    const existing = await db.query(
        "SELECT * FROM sessions WHERE id = $1 AND created_by = $2",
        [sessionId, userId]
    );

    const session = existing.rows[0];
    if (!session) throw new AppError("Session not found", 404);
    if (session.status !== "live") throw new AppError("Can only change question in a live session", 400);

    const currentIds = await getSessionQuestionIds(sessionId);
    const questionIds = [questionId, ...currentIds.filter((id) => id !== questionId)];

    const { rows } = await db.query(
        `UPDATE sessions SET question_id = $1, language = $2 WHERE id = $3 AND created_by = $4 RETURNING *`,
        [questionId, language, sessionId, userId]
    );

    await syncSessionQuestions(sessionId, questionIds);

    return rows[0];
};

export const getSessionStatus = async (sessionId: string): Promise<string> => {
    const queryString = `SELECT status from sessions WHERE id = $1`;
    const sessionStatus = await db.query<{ status: string }>(queryString, [sessionId]);
    if (!sessionStatus.rows[0]) throw new AppError("Session not found", 404);
    return sessionStatus.rows[0].status;
}

export const scheduledSessions = async (userId: string) => {
    const queryString = `SELECT scheduled_at, duration_minutes FROM sessions WHERE created_by = $1 AND status = 'scheduled' AND scheduled_at IS NOT NULL`;
    const { rows } = await db.query(queryString, [userId]);
    return rows.map(s => ({ scheduled_at: s.scheduled_at as string, duration_minutes: s.duration_minutes as number | null }));
}
