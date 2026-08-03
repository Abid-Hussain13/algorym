import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as runService from "../services/code-run.service.js";
import db from "../db/pool.js";
import { broadcast } from "../ws/connectionManager.js";
import { verifyParticipant } from "../utils/verifyParticipant.js";
import AppError from "../utils/AppError.js";
import type { AuthPayload } from "../types/index.js";

export const runCode = async (req: Request, res: Response) => {
    const { sessionId, participantId, code, language, stdin } = req.body;

    let userId: string | undefined;

    try {
        const token = req.cookies?.accessToken;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
            userId = decoded.id;
        }
    } catch {
        // token invalid or expired — treat as guest
    }

    const isVerified = await verifyParticipant({ sessionId, participantId, userId });
    if (!isVerified) throw new AppError("You are not a participant of this session", 401);

    const session = await db.query<{ status: string }>(
        "SELECT status FROM sessions WHERE id = $1",
        [sessionId]
    );
    if (!session.rows[0]) throw new AppError("Session not found", 404);
    if (session.rows[0].status !== "live") throw new AppError("Session is not live", 400);

    const result = await runService.runCode({ code, language, stdin });

    broadcast(sessionId, { type: "run_result", payload: result });

    res.json({ success: true, result });
};
