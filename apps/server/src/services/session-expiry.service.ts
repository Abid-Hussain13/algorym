import cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import { reconcileSessions } from "./session-reconcile.service.js";

let expiryTask: ScheduledTask | null = null;

export function stopSessionExpiryCron(): void {
    expiryTask?.stop();
    expiryTask = null;
}

export function startSessionExpiryCron() {
    expiryTask = cron.schedule("* * * * *", async () => {
        try {
            await reconcileSessions({ source: "cron" });
        } catch (err) {
            console.error("[cron] Session expiry check failed:", err);
        }
    });

    console.log("[cron] Session expiry checker started (every 60s)");
}
