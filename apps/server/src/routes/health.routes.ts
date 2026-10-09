import { Router, type Request, type Response } from "express";
import db from "../db/pool.js";

const healthRoute = Router();

/**
 * Liveness and readiness, mounted at `/health` — deliberately at the root and not
 * under `/api`, because that is the path a platform probe expects.
 *
 * **Why two modes.** On a free tier the process is allowed to sleep, so the
 * difference between "the app is up" and "the database is reachable" matters:
 *
 * - `/health` — liveness only. Always 200 while the process is running, with no
 *   query at all. This is what a load balancer or a platform health check should
 *   use, because a transient database blip should not get the service killed and
 *   restarted.
 * - `/health?deep=1` — adds a `SELECT 1`. Slower, but it is also what keeps a
 *   hosted database from being paused for inactivity: providers watch for
 *   queries, and a single tiny statement every few minutes is enough.
 *
 * Keep-alive pings should use the deep form, and **must not** target
 * `/robots.txt` — some platforms answer that path themselves while the service
 * is asleep, so the request succeeds, the check reports healthy, and the service
 * never wakes up.
 */
healthRoute.get("/health", async (_req: Request, res: Response) => {
    const deep = _req.query.deep === "1";

    if (!deep) {
        res.status(200).json({ ok: true, uptime: Math.round(process.uptime()) });
        return;
    }

    const startedAt = Date.now();
    try {
        await db.query("select 1");
        res.status(200).json({
            ok: true,
            db: "up",
            dbLatencyMs: Date.now() - startedAt,
            uptime: Math.round(process.uptime()),
        });
    } catch {
        // 503 rather than 500: this is "reachable but not ready". Note that the
        // platform has still received a request either way, which is what it
        // needs to consider the service active.
        res.status(503).json({ ok: false, db: "down" });
    }
});

export default healthRoute;