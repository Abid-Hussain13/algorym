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
            const expired = await db.query<{ id: string }>(
                `UPDATE sessions
                 SET status = 'expired', ended_at = now()
                 WHERE status = 'live'
                   AND expires_at IS NOT NULL
                   AND expires_at < now()
                 RETURNING id`
            );
            if (expired.rows.length > 0) {
                console.log(`[cron] Expired ${expired.rows.length} live session(s)`);

                // Tell whoever is still in the room. Without this the expiry only
                // exists in the database: people sat in a dead session waiting on
                // a code runner that would now reject every submission.
                for (const session of expired.rows) {
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
