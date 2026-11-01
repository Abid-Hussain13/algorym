import type { EventType, SessionStatus } from "@algorym/shared-types";
import db from "../db/pool.js";
import { broadcast } from "../ws/connectionManager.js";
import { logSessionEvent } from "./session-events.service.js";

export type ReconcileSource = "cron" | "request";

interface ReconcileOptions {
    userId?: string;
    sessionId?: string;
    source?: ReconcileSource;
}

interface TransitionRow {
    id: string;
    attended: boolean;
}

interface ReconcileResult {
    completed: number;
    expired: number;
    started: number;
}

const SCHEDULE_END = `COALESCE(s.expires_at, COALESCE(s.scheduled_at, s.created_at) + COALESCE(s.duration_minutes, 30) * interval '1 minute')`;

const scopeClause = (userId?: string, sessionId?: string) => {
    const params: string[] = [];
    let clause = "";

    if (userId) {
        params.push(userId);
        clause += ` AND s.created_by = $${params.length}`;
    }

    if (sessionId) {
        params.push(sessionId);
        clause += ` AND s.id = $${params.length}`;
    }

    return { clause, params };
};

const announce = async (
    rows: { id: string }[],
    status: SessionStatus,
    eventType: EventType,
    source: ReconcileSource
): Promise<void> => {
    for (const row of rows) {
        const session = { id: row.id, status };
        try {
            await logSessionEvent(row.id, null, eventType, { session, source });
        } catch (err) {
            console.error(`[reconcile] Could not log ${eventType} for ${row.id}:`, err);
        }

        try {
            broadcast(row.id, { type: eventType, payload: { session } });
        } catch (err) {
            console.error(`[reconcile] Could not broadcast ${eventType} for ${row.id}:`, err);
        }
    }
};

export const reconcileSessions = async (options: ReconcileOptions = {}): Promise<ReconcileResult> => {
    const { userId, sessionId, source = "cron" } = options;
    const { clause, params } = scopeClause(userId, sessionId);

    const pending = await db.query(
        `SELECT 1
         FROM sessions s
         WHERE (
             (s.status = 'scheduled' AND ${SCHEDULE_END} <= now())
             OR (s.status = 'scheduled' AND s.scheduled_at IS NOT NULL
                 AND s.scheduled_at <= now() AND ${SCHEDULE_END} > now())
             OR (s.status = 'live' AND s.expires_at IS NOT NULL AND s.expires_at < now())
         )${clause}
         LIMIT 1`,
        params
    );

    if (pending.rowCount === 0) {
        return { completed: 0, expired: 0, started: 0 };
    }

    const overdueScheduled = await db.query<TransitionRow>(
        `UPDATE sessions s
         SET status = CASE WHEN EXISTS (
                 SELECT 1 FROM session_participants p
                 WHERE p.session_id = s.id AND p.role = 'guest'
             ) THEN 'completed'::session_status ELSE 'expired'::session_status END,
             ended_at = now()
         WHERE s.status = 'scheduled'
           AND ${SCHEDULE_END} <= now()
           ${clause}
         RETURNING s.id,
                   EXISTS (
                       SELECT 1 FROM session_participants p
                       WHERE p.session_id = s.id AND p.role = 'guest'
                   ) AS attended`,
        params
    );

    const overdueLive = await db.query<TransitionRow>(
        `UPDATE sessions s
         SET status = CASE WHEN EXISTS (
                 SELECT 1 FROM session_participants p
                 WHERE p.session_id = s.id AND p.role = 'guest'
             ) THEN 'completed'::session_status ELSE 'expired'::session_status END,
             ended_at = now()
         WHERE s.status = 'live'
           AND s.expires_at IS NOT NULL
           AND s.expires_at < now()
           ${clause}
         RETURNING s.id,
                   EXISTS (
                       SELECT 1 FROM session_participants p
                       WHERE p.session_id = s.id AND p.role = 'guest'
                   ) AS attended`,
        params
    );

    const started = await db.query<{ id: string }>(
        `WITH due AS (
             SELECT s.id,
                    ROW_NUMBER() OVER (
                        PARTITION BY s.created_by
                        ORDER BY s.scheduled_at ASC, s.created_at ASC
                    ) AS rn
             FROM sessions s
             WHERE s.status = 'scheduled'
               AND s.scheduled_at IS NOT NULL
               AND s.scheduled_at <= now()
               AND ${SCHEDULE_END} > now()
               ${clause}
               AND NOT EXISTS (
                   SELECT 1 FROM sessions live
                   WHERE live.created_by = s.created_by AND live.status = 'live'
               )
         )
         UPDATE sessions s
         SET status = 'live',
             started_at = now(),
             expires_at = ${SCHEDULE_END}
         FROM due
         WHERE s.id = due.id AND due.rn = 1
         RETURNING s.id`,
        params
    );

    const completed = [
        ...overdueScheduled.rows.filter((row) => row.attended),
        ...overdueLive.rows.filter((row) => row.attended),
    ];
    const expired = [
        ...overdueScheduled.rows.filter((row) => !row.attended),
        ...overdueLive.rows.filter((row) => !row.attended),
    ];

    if (completed.length > 0) {
        console.log(`[reconcile] Completed ${completed.length} attended session(s)`);
        await announce(completed, "completed", "session_completed", source);
    }

    if (expired.length > 0) {
        console.log(`[reconcile] Expired ${expired.length} unattended session(s)`);
        await announce(expired, "expired", "session_expired", source);
    }

    if (started.rows.length > 0) {
        console.log(`[reconcile] Auto-started ${started.rows.length} scheduled session(s)`);
        await announce(started.rows, "live", "session_started", source);
    }

    return {
        completed: completed.length,
        expired: expired.length,
        started: started.rows.length,
    };
};
