import cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import db from "../db/pool.js";
import { broadcast } from "../ws/connectionManager.js";

/**
 * Held so shutdown can stop it. Left running, it would fire once more
 * mid-teardown and open a query on a database pool that is being closed.
 */
let expiryTask: ScheduledTask | null = null;

export function stopSessionExpiryCron(): void {
    expiryTask?.stop();
    expiryTask = null;
}

export function startSessionExpiryCron() {
    expiryTask = cron.schedule("* * * * *", async () => {
        try {
            /**
             * Time is up, but whether that counts as "expired" or "completed"
             * depends entirely on whether anyone was actually there.
             *
             * A session that timed out with a candidate present was worked, and
             * the host has notes and possibly a rating to give it. Marking that
             * `expired` throws the interview into a bucket with "nobody turned
             * up", which is wrong: it hides it from the host's completed list and
             * makes the evaluation form unreachable, because rating is only
             * offered on a completed interview.
             *
             * So: **a guest ever joined → completed. Host alone → expired.**
             * The check is on participants rather than live sockets on purpose —
             * a candidate who closed their tab ten minutes ago still attended.
             */
            const timedOut = await db.query<{ id: string; attended: boolean }>(
                `UPDATE sessions s
                 SET status = CASE WHEN EXISTS (
                       SELECT 1 FROM session_participants p
                       WHERE p.session_id = s.id AND p.role = 'guest'
                     ) THEN 'completed'::session_status ELSE 'expired'::session_status END,
                     ended_at = now()
                 WHERE s.status = 'live'
                   AND s.expires_at IS NOT NULL
                   AND s.expires_at < now()
                 RETURNING s.id,
                           EXISTS (
                               SELECT 1 FROM session_participants p
                               WHERE p.session_id = s.id AND p.role = 'guest'
                           ) AS attended`
            );

            const completed = timedOut.rows.filter((r) => r.attended);
            const expired = timedOut.rows.filter((r) => !r.attended);

            if (completed.length > 0) {
                console.log(`[cron] Completed ${completed.length} attended session(s) on timeout`);
                for (const session of completed) {
                    broadcast(session.id, {
                        type: "session_completed",
                        payload: { session: { id: session.id, status: "completed" } },
                    });
                }
            }

            if (expired.length > 0) {
                console.log(`[cron] Expired ${expired.length} unattended session(s)`);

                // Tell whoever is still in the room. Without this the expiry only
                // exists in the database: people sat in a dead session waiting on
                // a code runner that would now reject every submission.
                for (const session of expired) {
                    broadcast(session.id, {
                        type: "session_expired",
                        payload: { session: { id: session.id, status: "expired" } },
                    });
                }
            }

            const started = await db.query<{ id: string }>(
                `UPDATE sessions
                 SET status = 'live', started_at = now()
                 WHERE status = 'scheduled'
                   AND scheduled_at IS NOT NULL
                   AND scheduled_at <= now()
                 RETURNING id`
            );
            if (started.rows.length > 0) {
                console.log(`[cron] Auto-started ${started.rows.length} scheduled session(s)`);

                for (const session of started.rows) {
                    broadcast(session.id, { type: "session_started", payload: { session: { id: session.id, status: "live" } } });
                }
            }
        } catch (err) {
            console.error("[cron] Session expiry check failed:", err);
        }
    });

    console.log("[cron] Session expiry checker started (every 60s)");
}
