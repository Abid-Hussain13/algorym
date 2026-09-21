import cron from "node-cron";
import db from "../db/pool.js";

export function startSessionExpiryCron() {
    cron.schedule("* * * * *", async () => {
        try {
            const { rowCount: liveExpired } = await db.query(
                `UPDATE sessions
                 SET status = 'expired', ended_at = now()
                 WHERE status = 'live'
                   AND expires_at IS NOT NULL
                   AND expires_at < now()`
            );
            if (liveExpired && liveExpired > 0) {
                console.log(`[cron] Expired ${liveExpired} live session(s)`);
            }

            const { rowCount: scheduledStarted } = await db.query(
                `UPDATE sessions
                 SET status = 'live', started_at = now()
                 WHERE status = 'scheduled'
                   AND scheduled_at IS NOT NULL
                   AND scheduled_at <= now()`
            );
            if (scheduledStarted && scheduledStarted > 0) {
                console.log(`[cron] Auto-started ${scheduledStarted} scheduled session(s)`);
            }
        } catch (err) {
            console.error("[cron] Session expiry check failed:", err);
        }
    });

    console.log("[cron] Session expiry checker started (every 60s)");
}
