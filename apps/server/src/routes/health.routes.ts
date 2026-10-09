import { Router, type Request, type Response } from "express";
import db from "../db/pool.js";

const healthRoute = Router();

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
        res.status(503).json({ ok: false, db: "down" });
    }
});

export default healthRoute;
